#!/usr/bin/env node
/**
 * Import zip code tax rates from CSV files
 * 
 * Usage: node import_zip_tax_rates.cjs > tax_jurisdictions_import.sql
 * 
 * CSV Format (from TAXRATES_ZIP5_*.csv):
 * State,ZipCode,TaxRegionName,EstimatedCombinedRate,StateRate,EstimatedCountyRate,EstimatedCityRate,EstimatedSpecialRate,RiskLevel
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to CSV directory
const csvDir = path.join(__dirname, '../docs/state_tax_rates');

if (!fs.existsSync(csvDir)) {
    console.error(`Error: Directory not found: ${csvDir}`);
    process.exit(1);
}

console.log('-- ============================================');
console.log('-- ZIP CODE TAX RATES IMPORT');
console.log(`-- Source: ${csvDir}`);
console.log(`-- Generated: ${new Date().toISOString()}`);
console.log('-- ============================================\n');

// Function to parse CSV line (handles quoted fields)
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());

    return values;
}

// Function to escape SQL strings
function escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

// Function to convert to decimal
function toDecimal(value) {
    if (!value || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
}

// Process each CSV file
async function processCSVFile(filePath, stateCode) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let headers = [];
        let lineNum = 0;
        const jurisdictions = [];

        rl.on('line', (line) => {
            lineNum++;

            if (lineNum === 1) {
                // Parse headers
                headers = parseCSVLine(line);
                return;
            }

            // Skip empty lines
            if (!line.trim()) return;

            const values = parseCSVLine(line);
            if (values.length < headers.length) {
                return;
            }

            // Create object from headers and values
            const row = {};
            headers.forEach((header, i) => {
                row[header] = values[i] || '';
            });

            jurisdictions.push(row);
        });

        rl.on('close', () => {
            resolve({ stateCode, jurisdictions });
        });

        rl.on('error', reject);
    });
}

// Main execution
async function main() {
    const files = fs.readdirSync(csvDir)
        .filter(f => f.endsWith('.csv') && f.startsWith('TAXRATES_ZIP5_'))
        .sort();

    if (files.length === 0) {
        console.error('No CSV files found in directory');
        process.exit(1);
    }

    console.log(`-- Found ${files.length} CSV files\n`);
    console.log('-- Starting transaction for atomic import');
    console.log('BEGIN;\n');

    let totalJurisdictions = 0;
    const stateStats = {};

    for (const file of files) {
        // Extract state code from filename (e.g., TAXRATES_ZIP5_CA202512.csv -> CA)
        const match = file.match(/TAXRATES_ZIP5_([A-Z]{2})\d+\.csv/);
        if (!match) {
            console.error(`-- Warning: Could not extract state code from ${file}`);
            continue;
        }
        const stateCode = match[1];
        const filePath = path.join(csvDir, file);

        try {
            const { jurisdictions } = await processCSVFile(filePath, stateCode);

            console.log(`\n-- ${stateCode}: Importing ${jurisdictions.length} zip codes`);

            let stateCount = 0;
            jurisdictions.forEach((row) => {
                const zipCode = row['ZipCode'] || '';
                const city = escapeSql(row['TaxRegionName'] || 'Unknown');
                const combinedRate = toDecimal(row['EstimatedCombinedRate']);

                if (!zipCode || zipCode.length !== 5) {
                    return;
                }

                totalJurisdictions++;
                stateCount++;

                // Insert jurisdiction (just zip code and rate)
                console.log(`INSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate) VALUES ('${zipCode}', '${stateCode}', '${city}', ${combinedRate}) ON CONFLICT (zip_code) DO UPDATE SET total_rate = ${combinedRate}, city = '${city}', state_code = '${stateCode}';`);
            });

            stateStats[stateCode] = stateCount;

        } catch (error) {
            console.error(`-- Error processing ${file}:`, error.message);
        }
    }

    console.log('\n\n-- ============================================');
    console.log(`-- IMPORT COMPLETE`);
    console.log(`-- Total Zip Codes: ${totalJurisdictions}`);
    console.log(`-- States Processed: ${Object.keys(stateStats).length}`);
    console.log('-- ============================================');

    console.log('\n-- Summary by State:');
    Object.keys(stateStats).sort().forEach(state => {
        console.log(`-- ${state}: ${stateStats[state]} zip codes`);
    });

    console.log('\n-- Committing transaction');
    console.log('COMMIT;');
}

main().catch(console.error);

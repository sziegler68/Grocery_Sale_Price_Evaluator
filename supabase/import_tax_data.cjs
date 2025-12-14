#!/usr/bin/env node
/**
 * Convert state tax CSV files to SQL INSERT statements
 * 
 * Usage: node import_tax_data.cjs > tax_data_import.sql
 * 
 * CSV Format Expected (from TAXRATES_ZIP5_*.csv):
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
console.log('-- STATE TAX DATA IMPORT');
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

// State-specific tax rules based on research
// Source: https://www.salestaxinstitute.com/resources/grocery-food-sales-tax
const STATE_TAX_RULES = {
    // States where groceries are generally exempt
    'CA': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: true },
    'NY': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'FL': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'TX': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'PA': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'NJ': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'MA': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'MD': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'VA': { groceriesExempt: false, preparedFoodTaxable: true, crvStates: false }, // Reduced rate
    'NC': { groceriesExempt: false, preparedFoodTaxable: true, crvStates: false }, // Reduced rate
    'GA': { groceriesExempt: false, preparedFoodTaxable: true, crvStates: false },
    'MI': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: true },
    'OH': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'IL': { groceriesExempt: false, preparedFoodTaxable: true, crvStates: false }, // Reduced rate
    'WA': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'AZ': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'CO': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: false },
    'OR': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: true },
    'CT': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: true },
    'ME': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: true },
    'VT': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: true },
    'IA': { groceriesExempt: true, preparedFoodTaxable: true, crvStates: true },
    'HI': { groceriesExempt: false, preparedFoodTaxable: true, crvStates: true },
};

// Default rules for states not explicitly listed
const DEFAULT_RULES = { groceriesExempt: false, preparedFoodTaxable: true, crvStates: false };

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

// Generate tax rules for a jurisdiction
function generateTaxRules(stateCode) {
    const rules = STATE_TAX_RULES[stateCode] || DEFAULT_RULES;
    const crvRate = rules.crvStates ? 0.05 : 0;

    return [
        { category: 'Produce', taxable: !rules.groceriesExempt, crv: 0 },
        { category: 'Meat', taxable: !rules.groceriesExempt, crv: 0 },
        { category: 'Seafood', taxable: !rules.groceriesExempt, crv: 0 },
        { category: 'Dairy', taxable: !rules.groceriesExempt, crv: 0 },
        { category: 'Bakery', taxable: !rules.groceriesExempt, crv: 0 },
        { category: 'Frozen', taxable: !rules.groceriesExempt, crv: 0 },
        { category: 'Pantry', taxable: !rules.groceriesExempt, crv: 0 },
        { category: 'Condiments', taxable: !rules.groceriesExempt, crv: 0 },
        { category: 'Beverages', taxable: true, crv: crvRate },
        { category: 'Snacks', taxable: true, crv: 0 },
        { category: 'Prepared Food', taxable: rules.preparedFoodTaxable, crv: 0 },
        { category: 'Household', taxable: true, crv: 0 },
        { category: 'Personal Care', taxable: true, crv: 0 },
        { category: 'Baby', taxable: true, crv: 0 },
        { category: 'Pet', taxable: true, crv: 0 },
        { category: 'Other', taxable: true, crv: 0 },
    ];
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
    const processedStates = new Set();

    // PHASE 1: Import all zip codes with their tax rates
    console.log('\n-- ============================================');
    console.log('-- PHASE 1: IMPORTING ZIP CODE TAX RATES');
    console.log('-- ============================================\n');

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

            jurisdictions.forEach((row) => {
                const zipCode = row['ZipCode'] || '';
                const city = escapeSql(row['TaxRegionName'] || 'Unknown');
                const combinedRate = toDecimal(row['EstimatedCombinedRate']);

                if (!zipCode || zipCode.length !== 5) {
                    return;
                }

                totalJurisdictions++;

                // Insert jurisdiction (just zip code and rate, no rules yet)
                console.log(`INSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate) VALUES ('${zipCode}', '${stateCode}', '${city}', ${combinedRate}) ON CONFLICT (zip_code) DO UPDATE SET total_rate = ${combinedRate}, city = '${city}', state_code = '${stateCode}';`);
            });

            processedStates.add(stateCode);

        } catch (error) {
            console.error(`-- Error processing ${file}:`, error.message);
        }
    }

    // PHASE 2: Create state-level tax rules (one set per state)
    console.log('\n\n-- ============================================');
    console.log('-- PHASE 2: CREATING STATE-LEVEL TAX RULES');
    console.log('-- ============================================\n');

    for (const stateCode of Array.from(processedStates).sort()) {
        console.log(`\n-- ${stateCode}: Creating tax rules`);

        const rules = generateTaxRules(stateCode);

        rules.forEach(({ category, taxable, crv }) => {
            console.log(`INSERT INTO public.tax_rules (state_code, category, is_taxable, crv_rate) VALUES ('${stateCode}', '${category}', ${taxable}, ${crv}) ON CONFLICT (state_code, category) DO UPDATE SET is_taxable = ${taxable}, crv_rate = ${crv};`);
        });
    }

    console.log('\n\n-- ============================================');
    console.log(`-- IMPORT COMPLETE`);
    console.log(`-- Zip Codes: ${totalJurisdictions}`);
    console.log(`-- States: ${processedStates.size}`);
    console.log(`-- Tax Rules: ${processedStates.size * 16} (16 categories per state)`);
    console.log('-- Committing transaction');
    console.log('-- ============================================');
    console.log('\nCOMMIT;');
}

main().catch(console.error);

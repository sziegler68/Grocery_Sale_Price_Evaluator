#!/usr/bin/env node
/**
 * Convert state tax CSV files to SQL INSERT statements
 * 
 * Usage: node parse_tax_csvs.js [path_to_csv_directory]
 * 
 * CSV Format Expected:
 * Zip Code,City,County,State Tax Rate,Local Tax Rate,Combined Tax Rate,
 * Grocery Taxable,Prepared Food Taxable,Candy Taxable,Soda/Soft Drinks Taxable,CRV/Deposit
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const csvDir = process.argv[2] || path.join(__dirname, '../docs/state_tax_rates');

if (!fs.existsSync(csvDir)) {
    console.error(`Error: Directory not found: ${csvDir}`);
    console.error('Usage: node parse_tax_csvs.js [path_to_csv_directory]');
    process.exit(1);
}

console.log('-- ============================================');
console.log('-- STATE TAX DATA FROM CSV FILES');
console.log(`-- Source: ${csvDir}`);
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

// Function to convert boolean string to SQL boolean
function toBoolean(value) {
    if (!value) return false;
    const v = value.toLowerCase().trim();
    return v === 'true' || v === 'yes' || v === '1' || v === 't' || v === 'y';
}

// Function to convert to decimal
function toDecimal(value) {
    if (!value || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
}

// Function to escape SQL strings
function escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
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
                console.warn(`-- Warning: Line ${lineNum} has ${values.length} values but ${headers.length} headers`);
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
    const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));

    if (files.length === 0) {
        console.error('No CSV files found in directory');
        process.exit(1);
    }

    console.log(`-- Found ${files.length} CSV files\n`);

    for (const file of files) {
        const stateCode = path.basename(file, '.csv');
        const filePath = path.join(csvDir, file);

        try {
            const { jurisdictions } = await processCSVFile(filePath, stateCode);

            console.log(`\n-- ============================================`);
            console.log(`-- ${stateCode} (${jurisdictions.length} jurisdictions)`);
            console.log(`-- ============================================`);

            jurisdictions.forEach((row) => {
                const zipCode = row['Zip Code'] || '';
                const city = escapeSql(row['City'] || 'Unknown');
                const county = escapeSql(row['County'] || '');
                const combinedRate = toDecimal(row['Combined Tax Rate']);

                if (!zipCode) {
                    console.warn(`-- Warning: Skipping row with no zip code`);
                    return;
                }

                // Insert jurisdiction
                console.log(`\nINSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate)`);
                console.log(`VALUES ('${zipCode}', '${stateCode}', '${city}', ${combinedRate})`);
                console.log(`ON CONFLICT (zip_code) DO UPDATE SET total_rate = ${combinedRate}, city = '${city}';`);

                // Insert tax rules
                console.log(`\nDO $$`);
                console.log(`DECLARE`);
                console.log(`  jurisdiction_id UUID;`);
                console.log(`BEGIN`);
                console.log(`  SELECT id INTO jurisdiction_id FROM public.tax_jurisdictions WHERE zip_code = '${zipCode}';`);
                console.log(`  `);
                console.log(`  IF jurisdiction_id IS NOT NULL THEN`);
                console.log(`    -- Delete existing rules for this jurisdiction`);
                console.log(`    DELETE FROM public.tax_rules WHERE jurisdiction_id = jurisdiction_id;`);
                console.log(``);

                // Map CSV columns to categories
                const rules = [
                    {
                        category: 'Groceries',
                        taxable: toBoolean(row['Grocery Taxable']),
                        crv: 0
                    },
                    {
                        category: 'Prepared Food',
                        taxable: toBoolean(row['Prepared Food Taxable']),
                        crv: 0
                    },
                    {
                        category: 'Snacks',
                        taxable: toBoolean(row['Candy Taxable']),
                        crv: 0
                    },
                    {
                        category: 'Beverages',
                        taxable: toBoolean(row['Soda/Soft Drinks Taxable']),
                        crv: toDecimal(row['CRV/Deposit'])
                    }
                ];

                rules.forEach(({ category, taxable, crv }) => {
                    console.log(`    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)`);
                    console.log(`    VALUES (jurisdiction_id, '${category}', ${taxable}, ${crv});`);
                });

                console.log(`  END IF;`);
                console.log(`END $$;`);
            });

        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    }

    console.log('\n\n-- ============================================');
    console.log('-- CONVERSION COMPLETE');
    console.log('-- Run this SQL in Supabase SQL Editor');
    console.log('-- ============================================');
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * Convert state tax data JSON to SQL INSERT statements
 * 
 * Usage: node convert_state_tax_to_sql.js
 * 
 * This script reads state_tax_data.json and generates SQL statements
 * that map state-level tax rules to our database schema.
 * 
 * Note: You'll still need zip code -> state mapping data to populate
 * tax_jurisdictions with specific zip codes.
 */

const fs = require('fs');
const path = require('path');

// Read the state tax data
const stateTaxData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'state_tax_data.json'), 'utf8')
);

// Category mapping from state data to app categories
const categoryMap = {
    'grocery': ['Produce', 'Meat', 'Seafood', 'Dairy', 'Bakery', 'Pantry'],
    'prepared_food': ['Prepared Food'], // You may need to add this category
    'candy': ['Snacks'], // Candy is often in Snacks
    'soda_soft_drinks': ['Beverages'],
    'dietary_supplements': ['Personal Care'], // Or create new category
    'alcohol': ['Beverages'], // Or create 'Alcohol' category
    'non_food': ['Household', 'Personal Care', 'Baby', 'Pet', 'Electronics', 'Other']
};

// CRV rates by state (you'll need to research exact amounts)
const crvRates = {
    'CA': 0.05, // 5¢ for < 24oz, 10¢ for ≥ 24oz (simplified)
    'CT': 0.10,
    'HI': 0.05,
    'IA': 0.05,
    'MA': 0.05,
    'ME': 0.05,
    'MI': 0.10,
    'NY': 0.05,
    'OR': 0.10,
    'VT': 0.05
};

console.log('-- ============================================');
console.log('-- STATE-LEVEL TAX RULES');
console.log('-- Generated from state_tax_data.json');
console.log('-- ============================================\n');

console.log('-- NOTE: This creates state-level rules as a reference.');
console.log('-- You still need zip code data to populate tax_jurisdictions.');
console.log('-- For now, this creates placeholder jurisdictions using state codes.\n');

// Generate SQL for each state
Object.entries(stateTaxData).forEach(([stateCode, stateData]) => {
    console.log(`\n-- ${stateData.state} (${stateCode})`);
    console.log(`-- ${stateData.notes}`);

    // Create a placeholder jurisdiction for the state
    // In reality, you'd have many jurisdictions per state (by zip/city)
    console.log(`INSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate)`);
    console.log(`VALUES ('${stateCode}000', '${stateCode}', '${stateData.state} (State Default)', 0.0000)`);
    console.log(`ON CONFLICT (zip_code) DO NOTHING;`);

    // Generate rules based on state data
    console.log(`\nDO $$`);
    console.log(`DECLARE`);
    console.log(`  jurisdiction_id UUID;`);
    console.log(`BEGIN`);
    console.log(`  SELECT id INTO jurisdiction_id FROM public.tax_jurisdictions WHERE zip_code = '${stateCode}000';`);
    console.log(`  `);
    console.log(`  IF jurisdiction_id IS NOT NULL THEN`);

    // Grocery items
    if (stateData.grocery === false) {
        categoryMap.grocery.forEach(cat => {
            console.log(`    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)`);
            console.log(`    VALUES (jurisdiction_id, '${cat}', FALSE, 0);`);
        });
    } else if (stateData.grocery === true) {
        categoryMap.grocery.forEach(cat => {
            console.log(`    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)`);
            console.log(`    VALUES (jurisdiction_id, '${cat}', TRUE, 0);`);
        });
    }

    // Prepared food
    if (stateData.prepared_food === true) {
        console.log(`    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)`);
        console.log(`    VALUES (jurisdiction_id, 'Prepared Food', TRUE, 0);`);
    }

    // Candy
    if (stateData.candy === true) {
        console.log(`    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)`);
        console.log(`    VALUES (jurisdiction_id, 'Snacks', TRUE, 0);`);
    }

    // Beverages (soda/soft drinks)
    const crvRate = stateData.crv_deposit && crvRates[stateCode] ? crvRates[stateCode] : 0;
    if (stateData.soda_soft_drinks === true) {
        console.log(`    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)`);
        console.log(`    VALUES (jurisdiction_id, 'Beverages', TRUE, ${crvRate});`);
    } else if (stateData.soda_soft_drinks === false && crvRate > 0) {
        console.log(`    INSERT INTO public.tax_rules (jurisdiction_id, category, is_taxable, crv_rate)`);
        console.log(`    VALUES (jurisdiction_id, 'Beverages', FALSE, ${crvRate});`);
    }

    console.log(`  END IF;`);
    console.log(`END $$;`);
});

console.log('\n\n-- ============================================');
console.log('-- NEXT STEPS:');
console.log('-- 1. Get zip code database (e.g., from USPS or commercial provider)');
console.log('-- 2. Get local tax rates by jurisdiction');
console.log('-- 3. Replace placeholder state jurisdictions with real zip codes');
console.log('-- ============================================');

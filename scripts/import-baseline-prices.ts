/**
 * Import CSV baseline prices into Supabase database
 * 
 * Usage: npx tsx scripts/import-baseline-prices.ts
 * 
 * This script imports the california_grocery_baseline.csv file into the database.
 * It maps categories correctly and handles validation.
 */

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import Supabase config
const SUPABASE_URL = 'https://usfvpwurjvnegrxmwilc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZnZwd3VyanZuZWdyeG13aWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTU3OTUsImV4cCI6MjA3NzY3MTc5NX0.likB1To7lUywlwQRGeNPN_p9KREDUJA6GR4CDgKQXCA';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Category mapping from CSV to database
const categoryMap: Record<string, string> = {
  'Condiment': 'Condiments',
  'Beverage': 'Beverages',
  'Snack': 'Snacks',
};

// Valid categories in database
const validCategories = [
  'Meat', 'Seafood', 'Dairy', 'Produce', 'Bakery', 'Frozen', 'Pantry',
  'Condiments', 'Beverages', 'Snacks', 'Household', 'Personal Care',
  'Baby', 'Pet', 'Electronics', 'Other'
];

interface CSVRow {
  item_name: string;
  category: string;
  store_name: string;
  price: string;
  quantity: string;
  unit_type: string;
  unit_price: string;
  date_purchased: string;
  target_price: string;
  notes: string;
}

async function importCSV() {
  console.log('📊 Starting CSV import...\n');

  // Read CSV file
  const csvPath = join(__dirname, '..', 'california_grocery_baseline.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CSVRow[];

  console.log(`Found ${records.length} items to import\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ item: string; error: string }> = [];

  // Process each row
  for (const row of records) {
    try {
      // Map category
      let category = row.category.trim();
      if (categoryMap[category]) {
        category = categoryMap[category];
      }

      // Validate category
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid category: ${category}`);
      }

      // Parse numeric values
      const price = parseFloat(row.price);
      const quantity = parseFloat(row.quantity);
      const unitPrice = parseFloat(row.unit_price);
      // Set target_price to unit_price (average price per unit) since CSV has avg prices
      const targetPrice = unitPrice;

      // Validate numeric values
      if (isNaN(price) || price < 0) {
        throw new Error(`Invalid price: ${row.price}`);
      }
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity: ${row.quantity}`);
      }
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new Error(`Invalid unit_price: ${row.unit_price}`);
      }

      // Parse date
      const datePurchased = row.date_purchased.trim() || new Date().toISOString().split('T')[0];

      // Prepare insert data
      const insertData = {
        item_name: row.item_name.trim(),
        category: category as any,
        store_name: row.store_name.trim(),
        price: price,
        quantity: quantity,
        unit_type: row.unit_type.trim(),
        unit_price: unitPrice,
        date_purchased: datePurchased,
        target_price: targetPrice,
        notes: row.notes?.trim() || null,
        user_id: null, // Baseline data has no user
      };

      // Insert into database
      const { error } = await supabase
        .from('grocery_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      successCount++;
      console.log(`✅ ${row.item_name} (${category}) - $${unitPrice.toFixed(2)}/${row.unit_type}`);
    } catch (error: any) {
      errorCount++;
      const errorMsg = error.message || 'Unknown error';
      errors.push({ item: row.item_name, error: errorMsg });
      console.error(`❌ ${row.item_name}: ${errorMsg}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ item, error }) => {
      console.log(`  - ${item}: ${error}`);
    });
  }

  console.log('\n✨ Import complete!');
}

// Run import
importCSV().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

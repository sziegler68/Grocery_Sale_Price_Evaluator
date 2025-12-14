#!/usr/bin/env python3
"""
Process state tax rate CSV files and generate SQL seed script for Supabase.
This script reads all TAXRATES_ZIP5_*.csv files and creates INSERT statements.
"""

import csv
import os
from pathlib import Path

def process_csv_files(input_dir, output_file):
    """
    Process all CSV files in the input directory and generate SQL output.
    
    Args:
        input_dir: Directory containing TAXRATES_ZIP5_*.csv files
        output_file: Path to output SQL file
    """
    
    # Find all CSV files
    csv_files = sorted(Path(input_dir).glob('TAXRATES_ZIP5_*.csv'))
    
    if not csv_files:
        print(f"No CSV files found in {input_dir}")
        return
    
    print(f"Found {len(csv_files)} CSV files to process")
    
    # Open output file
    with open(output_file, 'w', encoding='utf-8') as sql_file:
        # Write header
        sql_file.write("""-- ============================================
-- COMPREHENSIVE US ZIP CODE TAX RATES
-- Auto-generated from state tax rate CSV files
-- Run this in Supabase SQL Editor
-- ============================================

-- Insert all zip codes with tax rates
INSERT INTO public.tax_jurisdictions (zip_code, state_code, city, total_rate)
VALUES
""")
        
        total_records = 0
        first_record = True
        
        # Process each CSV file
        for csv_file in csv_files:
            print(f"Processing {csv_file.name}...")
            
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    zip_code = row['ZipCode'].strip()
                    state = row['State'].strip()
                    city = row['TaxRegionName'].strip()
                    rate = float(row['EstimatedCombinedRate'])
                    
                    # Skip if rate is 0 or invalid
                    if rate <= 0:
                        continue
                    
                    # Add comma before each record except the first
                    if not first_record:
                        sql_file.write(',\n')
                    else:
                        first_record = False
                    
                    # Escape single quotes in city name
                    city_escaped = city.replace("'", "''")
                    
                    # Write SQL value
                    sql_file.write(f"  ('{zip_code}', '{state}', '{city_escaped}', {rate:.6f})")
                    
                    total_records += 1
        
        # Write footer
        sql_file.write("""
ON CONFLICT (zip_code) DO UPDATE SET
  state_code = EXCLUDED.state_code,
  city = EXCLUDED.city,
  total_rate = EXCLUDED.total_rate,
  updated_at = NOW();

-- Verify the data
SELECT COUNT(*) as total_jurisdictions FROM public.tax_jurisdictions;
SELECT state_code, COUNT(*) as zip_count 
FROM public.tax_jurisdictions 
GROUP BY state_code 
ORDER BY state_code;
""")
    
    print(f"\nProcessing complete!")
    print(f"Total records: {total_records}")
    print(f"Output file: {output_file}")

if __name__ == '__main__':
    # Set paths
    script_dir = Path(__file__).parent
    input_dir = script_dir / 'docs' / 'state_tax_rates'
    output_file = script_dir / 'supabase' / 'seed_all_zip_codes.sql'
    
    # Create output directory if it doesn't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Process files
    process_csv_files(input_dir, output_file)

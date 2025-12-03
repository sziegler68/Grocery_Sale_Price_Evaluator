import supabase from '../api/supabaseClient';
import type { TaxJurisdiction, TaxRule, TaxCalculationResult } from '../types/tax';

export const taxService = {
    /**
     * Fetch tax jurisdiction details by zip code
     */
    async fetchTaxJurisdiction(zipCode: string): Promise<{ jurisdiction: TaxJurisdiction | null, rules: TaxRule[] }> {
        if (!supabase) {
            console.warn('Supabase not configured');
            return { jurisdiction: null, rules: [] };
        }

        try {
            // Fetch jurisdiction
            const { data: jurisdiction, error: jError } = await supabase
                .from('tax_jurisdictions')
                .select('*')
                .eq('zip_code', zipCode)
                .single();

            if (jError || !jurisdiction) {
                console.warn('Tax jurisdiction not found for zip:', zipCode, jError);
                return { jurisdiction: null, rules: [] };
            }

            // Fetch rules for this jurisdiction
            const { data: rules, error: rError } = await supabase
                .from('tax_rules')
                .select('*')
                .eq('jurisdiction_id', jurisdiction.id);

            if (rError) {
                console.error('Error fetching tax rules:', rError);
            }

            return { jurisdiction, rules: rules || [] };
        } catch (error) {
            console.error('Unexpected error in fetchTaxJurisdiction:', error);
            return { jurisdiction: null, rules: [] };
        }
    },

    /**
     * Calculate tax and CRV for an item based on its price, category, and applicable rules
     */
    calculateTax(
        price: number,
        category: string,
        jurisdictionRate: number,
        rules: TaxRule[]
    ): TaxCalculationResult {
        // Find matching rule for the category
        const rule = rules.find(r => r.category.toLowerCase() === category.toLowerCase());

        let isTaxable = true;
        let crvRate = 0;

        if (rule) {
            isTaxable = rule.is_taxable;
            crvRate = rule.crv_rate;
        } else {
            // Fallback: common grocery items are often exempt
            if (['Produce', 'Meat', 'Seafood', 'Dairy', 'Bakery', 'Pantry'].includes(category)) {
                isTaxable = false; // Conservative default for groceries
            }
        }

        const taxAmount = isTaxable ? price * jurisdictionRate : 0;

        return {
            taxAmount,
            crvAmount: crvRate, // CRV is a flat fee per container
            isTaxable,
            rateApplied: isTaxable ? jurisdictionRate : 0
        };
    }
};

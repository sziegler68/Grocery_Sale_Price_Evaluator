export interface TaxJurisdiction {
    id: string;
    zip_code: string;
    state_code: string;
    city: string;
    total_rate: number;
}

export interface TaxRule {
    id: string;
    state_code: string;
    category: string;
    is_taxable: boolean;
    crv_rate: number;
}

export interface TaxCalculationResult {
    taxAmount: number;
    crvAmount: number;
    isTaxable: boolean;
    rateApplied: number;
}

export interface UserWeightOverride {
    id: string;
    user_id: string;
    item_name: string;
    category: string;
    average_weight: number;
    unit: 'pound' | 'ounce';
    created_at: string;
    updated_at: string;
}

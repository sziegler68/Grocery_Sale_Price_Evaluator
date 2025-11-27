import React, { useState } from 'react';
import { X, Check, DollarSign } from 'lucide-react';
import { updateTripBudget } from '../services/tripService';
import { toast } from 'react-toastify';

interface EditBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    currentBudget: number;
    onBudgetUpdated: (newBudget: number) => void;
}

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
    isOpen,
    onClose,
    tripId,
    currentBudget,
    onBudgetUpdated
}) => {
    const [budget, setBudget] = useState<string>(currentBudget.toString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
            setBudget(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newBudget = parseFloat(budget);

        if (isNaN(newBudget) || newBudget < 0) {
            toast.error('Please enter a valid budget');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await updateTripBudget(tripId, newBudget);
            if (result.success) {
                toast.success('Budget updated successfully');
                onBudgetUpdated(newBudget);
                onClose();
            } else {
                toast.error(result.error || 'Failed to update budget');
            }
        } catch (error) {
            console.error('Error updating budget:', error);
            toast.error('An error occurred while updating the budget');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-primary">
                    <h3 className="font-bold text-lg">Edit Budget</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Are you sure? Sticking to your budget helps you save money!
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-secondary">
                            New Budget
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                                <DollarSign className="h-5 w-5" />
                            </span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={budget}
                                onChange={handleBudgetChange}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border bg-input border-input text-xl font-semibold focus:ring-2 focus:ring-brand"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-medium transition-colors bg-secondary hover-bg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !budget}
                            className="flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 bg-brand hover-bg-brand text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span>Saving...</span>
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    <span>Save</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBudgetModal;

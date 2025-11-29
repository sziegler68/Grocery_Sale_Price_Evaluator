import React, { useState } from 'react';
import { User, Percent, ArrowRight } from 'lucide-react';

interface ProfileSetupStepProps {
    onNext: (data: { name: string; taxRate: number }) => void;
}

export const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({ onNext }) => {
    const [name, setName] = useState('');
    const [taxRate, setTaxRate] = useState('8.5'); // Default reasonable tax rate

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onNext({
                name: name.trim(),
                taxRate: parseFloat(taxRate) || 0
            });
        }
    };

    return (
        <div className="max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-primary mb-2">Let's get to know you</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    We'll use this to personalize your experience.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                        What should we call you?
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
                            placeholder="Your Name"
                            required
                            autoFocus
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                        Default Sales Tax Rate (%)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Percent className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="20"
                            value={taxRate}
                            onChange={(e) => setTaxRate(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
                            placeholder="8.5"
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Used to estimate total costs. You can change this later in Settings.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                >
                    Continue
                    <ArrowRight className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
};

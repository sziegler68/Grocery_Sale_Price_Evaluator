import React from 'react';
import { ShoppingCart, TrendingDown, Users } from 'lucide-react';

interface WelcomeStepProps {
    onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
    return (
        <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative">
                <div className="absolute -inset-4 bg-brand/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-full shadow-xl">
                    <ShoppingCart className="h-16 w-16 text-brand" />
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-primary">
                    Welcome to Grocery Evaluator
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                    Your smart companion for collaborative shopping and budget tracking.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
                <div className="p-4 bg-card rounded-xl border border-primary shadow-sm">
                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-primary mb-1">Shared Lists</h3>
                    <p className="text-sm text-secondary">Shop together in real-time with family & friends.</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-primary shadow-sm">
                    <TrendingDown className="h-8 w-8 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-primary mb-1">Budget Tracking</h3>
                    <p className="text-sm text-secondary">Track spending as you shop and stay on budget.</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-primary shadow-sm">
                    <div className="h-8 w-8 mx-auto mb-3 flex items-center justify-center font-bold text-purple-500 text-xl">AI</div>
                    <h3 className="font-semibold text-primary mb-1">Smart Scanning</h3>
                    <p className="text-sm text-secondary">Scan price tags to check deals and unit prices.</p>
                </div>
            </div>

            <button
                onClick={onNext}
                className="w-full max-w-xs px-8 py-4 bg-brand text-white rounded-full font-bold text-lg shadow-lg hover:bg-brand-dark hover:scale-105 transition-all"
            >
                Get Started
            </button>
        </div>
    );
};

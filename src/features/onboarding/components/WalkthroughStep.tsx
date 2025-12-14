import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface WalkthroughStepProps {
    onBack: () => void;
    onFinish: () => void;
}

const FEATURES = [
    {
        title: "Create Shared Lists",
        description: "Create shopping lists and share them with family. Changes sync instantly so everyone stays on the same page.",
        image: "📝" // Placeholder for illustration
    },
    {
        title: "Track Your Budget",
        description: "Set a budget for your trip. As you check off items, see exactly how much you're spending in real-time.",
        image: "💰"
    },
    {
        title: "Scan & Compare",
        description: "Not sure if it's a deal? Scan the price tag to see the true unit price and compare with your target price.",
        image: "📸"
    }
];

export const WalkthroughStep: React.FC<WalkthroughStepProps> = ({ onBack, onFinish }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < FEATURES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onFinish();
        }
    };

    return (
        <div className="max-w-md mx-auto h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8">
                <div className="text-6xl mb-4 animate-bounce">
                    {FEATURES[currentSlide].image}
                </div>

                <h2 className="text-2xl font-bold text-primary">
                    {FEATURES[currentSlide].title}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                    {FEATURES[currentSlide].description}
                </p>

                {/* Dots Indicator */}
                <div className="flex gap-2 mt-8">
                    {FEATURES.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide
                                ? 'w-8 bg-brand'
                                : 'w-2 bg-gray-300 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <div className="flex gap-4 mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={currentSlide === 0 ? onBack : () => setCurrentSlide(currentSlide - 1)}
                    className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="flex-1 py-3 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center gap-2"
                >
                    {currentSlide === FEATURES.length - 1 ? (
                        <>
                            Get Started <Check className="h-5 w-5" />
                        </>
                    ) : (
                        <>
                            Next <ArrowRight className="h-5 w-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ProfileSetupStep } from './ProfileSetupStep';
import { ApiKeyStep } from './ApiKeyStep';
import { WalkthroughStep } from './WalkthroughStep';
import { toast } from 'react-toastify';

interface OnboardingWizardProps {
    onComplete: () => void;
}

type Step = 'welcome' | 'profile' | 'apikey' | 'walkthrough';

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState<Step>('welcome');

    const handleProfileSubmit = (data: { name: string; taxRate: number }) => {
        // Save to local storage
        localStorage.setItem('userProfile', JSON.stringify(data));
        setCurrentStep('apikey');
    };

    const handleApiKeySubmit = (apiKey: string | null) => {
        if (apiKey) {
            localStorage.setItem('geminiApiKey', apiKey);
        }
        setCurrentStep('walkthrough');
    };

    const handleFinish = () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        toast.success("You're all set!");
        onComplete();
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl overflow-hidden min-h-[600px] flex">
                {/* Left Side - Image/Decoration (Hidden on mobile) */}
                <div className="hidden md:flex w-1/3 bg-brand-dark text-white p-8 flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand-dark opacity-90"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2">Grocery Evaluator</h2>
                        <p className="text-blue-100">Smart shopping made simple.</p>
                    </div>

                    {/* Step Indicators */}
                    <div className="relative z-10 space-y-4">
                        <StepIndicator
                            active={currentStep === 'welcome'}
                            completed={currentStep !== 'welcome'}
                            label="Welcome"
                        />
                        <StepIndicator
                            active={currentStep === 'profile'}
                            completed={currentStep === 'apikey' || currentStep === 'walkthrough'}
                            label="Profile"
                        />
                        <StepIndicator
                            active={currentStep === 'apikey'}
                            completed={currentStep === 'walkthrough'}
                            label="AI Setup"
                        />
                        <StepIndicator
                            active={currentStep === 'walkthrough'}
                            completed={false}
                            label="Tour"
                        />
                    </div>

                    <div className="relative z-10 text-sm text-blue-200">
                        © 2024 Grocery Evaluator
                    </div>
                </div>

                {/* Right Side - Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col">
                    {currentStep === 'welcome' && (
                        <WelcomeStep onNext={() => setCurrentStep('profile')} />
                    )}
                    {currentStep === 'profile' && (
                        <ProfileSetupStep onNext={handleProfileSubmit} />
                    )}
                    {currentStep === 'apikey' && (
                        <ApiKeyStep onNext={handleApiKeySubmit} />
                    )}
                    {currentStep === 'walkthrough' && (
                        <WalkthroughStep
                            onBack={() => setCurrentStep('apikey')}
                            onFinish={handleFinish}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const StepIndicator: React.FC<{ active: boolean; completed: boolean; label: string }> = ({ active, completed, label }) => (
    <div className={`flex items-center gap-3 transition-opacity duration-300 ${active || completed ? 'opacity-100' : 'opacity-50'}`}>
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center border-2 
            ${completed ? 'bg-white border-white text-brand' : active ? 'bg-transparent border-white text-white' : 'border-blue-300 text-blue-300'}
        `}>
            {completed ? '✓' : <div className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-blue-300'}`} />}
        </div>
        <span className="font-medium">{label}</span>
    </div>
);

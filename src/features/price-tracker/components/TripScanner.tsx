import { useState } from 'react';
import { toast } from 'react-toastify';
import { Camera } from 'lucide-react';

export function TripScanner() {
    const [isProcessing] = useState(false);

    // Check if API key exists
    const hasApiKey = !!localStorage.getItem('geminiApiKey');

    return (
        <>
            {/* Floating Scan Button */}
            <button
                onClick={() => {
                    if (!hasApiKey) {
                        toast.error('Please add your API key in Settings');
                        return;
                    }
                    toast.info('Scanner coming soon!');
                }}
                disabled={isProcessing}
                className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-6 py-4 bg-brand text-white rounded-full shadow-lg hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
                <Camera className="h-6 w-6" />
                <span>{isProcessing ? 'Scanning...' : 'Scan Item'}</span>
            </button>
        </>
    );
}

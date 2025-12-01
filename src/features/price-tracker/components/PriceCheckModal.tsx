import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, X } from 'lucide-react';

interface PriceCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    darkMode?: boolean;
}

export const PriceCheckModal: React.FC<PriceCheckModalProps> = ({ isOpen, onClose, darkMode = false }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleScanPriceTag = () => {
        onClose();
        navigate('/scan');
    };

    const handleManualSearch = () => {
        onClose();
        navigate('/items');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full p-6 relative`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Title */}
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Price Check
                </h2>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    How would you like to check prices?
                </p>

                {/* Options */}
                <div className="space-y-4">
                    {/* Scan Price Tag */}
                    <button
                        onClick={handleScanPriceTag}
                        className="w-full p-6 bg-brand hover:bg-brand-dark text-white rounded-xl transition-colors flex items-center gap-4 group"
                    >
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <Camera className="h-6 w-6" />
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-semibold text-lg">Scan Price Tag</div>
                            <div className="text-sm text-white/80">Use camera to scan and extract data</div>
                        </div>
                    </button>

                    {/* Manual Search */}
                    <button
                        onClick={handleManualSearch}
                        className={`w-full p-6 ${darkMode
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            } rounded-xl transition-colors flex items-center gap-4 group`}
                    >
                        <div className={`h-12 w-12 rounded-full ${darkMode ? 'bg-zinc-700 group-hover:bg-zinc-600' : 'bg-white group-hover:bg-gray-50'
                            } flex items-center justify-center transition-colors`}>
                            <Search className="h-6 w-6 text-brand" />
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-semibold text-lg">Manual Search</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Search and compare prices manually
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceCheckModal;

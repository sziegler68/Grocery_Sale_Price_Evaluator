import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { extractGroceryListFromImage } from '../../../shared/lib/ai/geminiList';

interface ScanListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanComplete: (text: string) => void;
}

export const ScanListModal: React.FC<ScanListModalProps> = ({
    isOpen,
    onClose,
    onScanComplete,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleScan = async () => {
        if (!selectedFile) return;

        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
            toast.error('Please set your Gemini API key in Settings first');
            return;
        }

        setIsProcessing(true);

        try {
            const text = await extractGroceryListFromImage(selectedFile, apiKey);
            onScanComplete(text);
            onClose();
            // Cleanup
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error: any) {
            console.error('Scan failed:', error);
            toast.error(error.message || 'Failed to scan list');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Scan Grocery List
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {!localStorage.getItem('geminiApiKey') && (
                        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-medium">API Key Required</p>
                                <p className="mt-1">
                                    You need to set your Gemini API key in Settings to use this feature.
                                </p>
                            </div>
                        </div>
                    )}

                    {!selectedFile ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Camera className="w-6 h-6" />
                                <span>Take Photo</span>
                            </button>
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                                </div>
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Upload className="w-6 h-6" />
                                <span>Upload Image</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                <img
                                    src={previewUrl!}
                                    alt="Preview"
                                    className="w-full h-64 object-contain"
                                />
                                <button
                                    onClick={handleClearSelection}
                                    disabled={isProcessing}
                                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleScan}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera className="h-5 w-5" />
                                        <span>Scan List</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

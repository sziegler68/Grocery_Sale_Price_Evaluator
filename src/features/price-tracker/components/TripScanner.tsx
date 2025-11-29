import { useState } from 'react';
import { toast } from 'react-toastify';
import { Camera, X, Check, AlertCircle } from 'lucide-react';
import { CameraCapture } from '../../shopping-trips/components/CameraCapture';
import { extractPriceTagData, type PriceTagData } from '../../../shared/lib/ai/geminiVision';
import { findBestMatch, findAllMatches, type ShoppingListItem, type MatchResult } from '../../../shared/lib/matching/fuzzyMatcher';

interface TripScannerProps {
    shoppingList: ShoppingListItem[];
    onItemScanned: (item: ShoppingListItem, priceData: PriceTagData) => void;
    onCreateNewItem: (priceData: PriceTagData) => void;
}

export function TripScanner({ shoppingList, onItemScanned, onCreateNewItem }: TripScannerProps) {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<{
        priceData: PriceTagData;
        bestMatch: MatchResult | null;
        allMatches: MatchResult[];
    } | null>(null);

    const handleCapture = async (imageBlob: Blob) => {
        setIsCameraOpen(false);
        setIsProcessing(true);
        toast.loading('Scanning price tag...');

        try {
            // Get API key
            const apiKey = localStorage.getItem('geminiApiKey');
            if (!apiKey) {
                toast.dismiss();
                toast.error('Please add your API key in Settings');
                return;
            }

            // Extract data using Gemini Vision
            const priceData = await extractPriceTagData(imageBlob, apiKey);
            toast.dismiss();

            console.log('[TripScanner] Extracted data:', priceData);

            // Check confidence
            if (priceData.confidence < 0.5) {
                toast.warning('Low confidence scan. Please verify data.');
            }

        }
    };

    const handleCancel = () => {
        setScanResult(null);
    };

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
                    setIsCameraOpen(true);
                }}
                disabled={isProcessing}
                className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-6 py-4 bg-brand text-white rounded-full shadow-lg hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                {/* Header */}
                        <div className="p-4 border-b border-primary flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary">Scan Result</h2>
                <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Scanned Data */}
            <div className="p-4 bg-secondary border-b border-primary">
                <h3 className="font-semibold text-primary mb-2">{scanResult.priceData.itemName}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {scanResult.priceData.totalPrice && (
                        <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="ml-2 font-semibold">${scanResult.priceData.totalPrice.toFixed(2)}</span>
                        </div>
                    )}
                    {scanResult.priceData.unitPrice && scanResult.priceData.unitPriceUnit && (
                        <div>
                            <span className="text-gray-500">Unit Price:</span>
                            <span className="ml-2 font-semibold">
                                ${scanResult.priceData.unitPrice.toFixed(3)}/{scanResult.priceData.unitPriceUnit}
                            </span>
                        </div>
                    )}
                    {scanResult.priceData.containerSize && (
                        <div>
                            <span className="text-gray-500">Size:</span>
                            <span className="ml-2">{scanResult.priceData.containerSize}</span>
                        </div>
                    )}
                    {scanResult.priceData.onSale && (
                        <div className="col-span-2">
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded text-xs font-semibold">
                                ON SALE
                            </span>
                            {scanResult.priceData.saleRequirement && (
                                <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                                    {scanResult.priceData.saleRequirement}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    Confidence: {Math.round(scanResult.priceData.confidence * 100)}%
                </div>
            </div>

            {/* Best Match */}
            {scanResult.bestMatch && (
                <div className="p-4 border-b border-primary">
                    <div className="flex items-center gap-2 mb-2">
                        <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        This item is not in your shopping list.
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="p-4 space-y-2">
                <button
                    onClick={handleCreateNew}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                    Create New Item
                </button>
                <button
                    onClick={handleCancel}
                    className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-primary rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                    Cancel
                </button>
            </div>
        </div >
                </div >
            )
}
        </>
    );
}

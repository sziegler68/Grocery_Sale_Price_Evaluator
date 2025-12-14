import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, X } from 'lucide-react';
import { CameraCapture } from '../../shopping-trips/components/CameraCapture';
import { extractPriceTagData, type PriceTagData } from '../../../shared/lib/ai/geminiVision';
import QuickPriceInput from './QuickPriceInput';
import { ingestGroceryItem } from '../services/itemIngestion';
import { toast } from 'react-toastify';

interface PriceCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    darkMode?: boolean;
}

export const PriceCheckModal: React.FC<PriceCheckModalProps> = ({ isOpen, onClose, darkMode = false }) => {
    const navigate = useNavigate();
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [scannedData, setScannedData] = useState<PriceTagData | null>(null);
    const [showPriceInput, setShowPriceInput] = useState(false);

    if (!isOpen && !isCameraOpen && !showPriceInput) return null;

    const handleScanPriceTag = () => {
        setIsCameraOpen(true);
    };

    const handleManualSearch = () => {
        onClose();
        navigate('/items');
    };

    const handleCapture = async (imageBlob: Blob) => {
        toast.info('Scanning price tag...');

        try {
            const apiKey = localStorage.getItem('geminiApiKey') || '';
            const priceData = await extractPriceTagData(imageBlob, apiKey);
            setScannedData(priceData);
            setIsCameraOpen(false);
            setShowPriceInput(true);

            if (priceData.onSale) {
                toast.success(`Great! This item is on sale!`, { autoClose: 5000 });
            }

            const unitPrice = priceData.memberUnitPrice;
            if (unitPrice) {
                toast.info(`Unit price: $${unitPrice.toFixed(2)}/${priceData.unitPriceUnit || 'unit'}`, { autoClose: 5000 });
            }

        } catch (error: any) {
            console.error('Scan error:', error);
            toast.error('Failed to scan price tag. Please try again.');
            setIsCameraOpen(false);
        }
    };

    const handleConfirmItem = async (data: {
        price: number;
        quantity: number;
        taxAmount: number;
        crvAmount: number;
        updateTargetPrice: boolean;
        name?: string;
        unitType?: string;
        onSale: boolean;
    }) => {
        if (!scannedData) return;

        try {
            const result = await ingestGroceryItem({
                itemName: data.name || scannedData.itemName,
                price: data.price,
                quantity: data.quantity,
                unitType: data.unitType || scannedData.unitPriceUnit || 'each',
                storeName: 'Unknown',
                category: 'Other',
                targetPrice: data.updateTargetPrice ? (data.price / data.quantity) : undefined,
                notes: scannedData.saleRequirement || undefined,
                datePurchased: new Date(),
            }, {
                skipDuplicateCheck: false,
                autoMerge: true,
                fuzzyThreshold: 0.85,
            });

            if (result.success) {
                toast.success(`Added "${data.name || scannedData.itemName}" to database!`);
                setShowPriceInput(false);
                setScannedData(null);
                onClose();
            } else if (result.matchFound) {
                toast.info(`Item already exists in database. Price history updated.`);
                setShowPriceInput(false);
                setScannedData(null);
                onClose();
            } else {
                toast.error(result.error || 'Failed to add item');
            }
        } catch (error) {
            console.error('Failed to add item:', error);
            toast.error('Failed to add item to database');
        }
    };

    const handleCloseInput = () => {
        setShowPriceInput(false);
        setScannedData(null);
        onClose();
    };

    const handleCameraClose = () => {
        setIsCameraOpen(false);
        onClose();
    };

    return (
        <>
            {/* Main Modal */}
            {isOpen && !isCameraOpen && !showPriceInput && (
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
            )}

            {/* Camera Modal */}
            {isCameraOpen && (
                <div className="fixed inset-0 bg-black z-50">
                    <CameraCapture
                        isOpen={true}
                        onCapture={handleCapture}
                        onClose={handleCameraClose}
                    />
                </div>
            )}

            {/* Price Input Modal */}
            {showPriceInput && scannedData && (
                <QuickPriceInput
                    isOpen={showPriceInput}
                    onClose={handleCloseInput}
                    onConfirm={handleConfirmItem}
                    itemName={scannedData.itemName}
                    unitType={scannedData.unitPriceUnit}
                    targetPrice={undefined}
                    salesTaxRate={0}
                    initialPrice={scannedData.memberPrice || scannedData.regularPrice}
                    initialOnSale={scannedData.onSale}
                    isEditable={true}
                    scannedData={{
                        regularPrice: scannedData.regularPrice || 0,
                        regularUnitPrice: scannedData.regularUnitPrice,
                        salePrice: scannedData.memberPrice,
                        saleUnitPrice: scannedData.memberUnitPrice,
                        saleRequirement: scannedData.saleRequirement,
                        containerSize: scannedData.containerSize,
                        onSale: scannedData.onSale
                    }}
                />
            )}
        </>
    );
};

export default PriceCheckModal;

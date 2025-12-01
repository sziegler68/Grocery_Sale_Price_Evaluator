import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import Header from '../../../shared/components/Header';
import Footer from '../../../shared/components/Footer';
import { useDarkMode } from '../../../shared/hooks/useDarkMode';
import { CameraCapture } from '../../shopping-trips/components/CameraCapture';
import { extractPriceTagData, type PriceTagData } from '../../../shared/lib/ai/geminiVision';
import QuickPriceInput from '../../price-tracker/components/QuickPriceInput';
import { ingestGroceryItem } from '../../price-tracker/services/itemIngestion';
import { toast } from 'react-toastify';

export const StandaloneScanner: React.FC = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [isCameraOpen, setIsCameraOpen] = useState(true); // Auto-start camera
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedData, setScannedData] = useState<PriceTagData | null>(null);
    const [showPriceInput, setShowPriceInput] = useState(false);

    const handleCapture = async (imageBlob: Blob) => {
        setIsProcessing(true);
        toast.info('Scanning price tag...');

        try {
            const apiKey = localStorage.getItem('geminiApiKey') || '';
            const priceData = await extractPriceTagData(imageBlob, apiKey);
            setScannedData(priceData);
            setIsCameraOpen(false);
            setShowPriceInput(true);

            // Check if it's a good deal (if we have target price data)
            const unitPrice = priceData.memberUnitPrice;

            if (priceData.onSale) {
                toast.success(`Great! This item is on sale!`, { autoClose: 5000 });
            }

            if (unitPrice) {
                toast.info(`Unit price: $${unitPrice.toFixed(2)}/${priceData.unitPriceUnit || 'unit'}`, { autoClose: 5000 });
            }

        } catch (error: any) {
            console.error('Scan error:', error);
            toast.error('Failed to scan price tag. Please try again.');
            setIsCameraOpen(false);
        } finally {
            setIsProcessing(false);
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
            // Map to grocery category (default to 'Other' for now)
            const result = await ingestGroceryItem({
                itemName: data.name || scannedData.itemName,
                price: data.price,
                quantity: data.quantity,
                unitType: data.unitType || scannedData.unitPriceUnit || 'each',
                storeName: 'Unknown', // User can edit later
                category: 'Other', // User can edit later
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
                // Ask if they want to scan another
                setTimeout(() => {
                    if (window.confirm('Scan another item?')) {
                        setIsCameraOpen(true);
                    } else {
                        navigate('/');
                    }
                }, 500);
            } else if (result.matchFound) {
                toast.info(`Item already exists in database. Price history updated.`);
                setShowPriceInput(false);
                setScannedData(null);
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
        // Ask if they want to scan another
        if (window.confirm('Scan another item?')) {
            setIsCameraOpen(true);
        } else {
            navigate('/');
        }
    };

    return (
        <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center space-x-2 text-brand hover:text-brand-dark mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Dashboard</span>
                </button>

                {/* Scanner UI */}
                <div className="bg-card rounded-xl shadow-lg p-6">
                    <h1 className="text-2xl font-bold mb-4">Scan Item</h1>
                    <p className="text-secondary mb-6">
                        Scan a price tag to extract item details and add it to your database.
                    </p>

                    {!isCameraOpen && !isProcessing && (
                        <button
                            onClick={() => setIsCameraOpen(true)}
                            className="w-full py-4 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Camera className="h-5 w-5" />
                            Open Camera
                        </button>
                    )}

                    {isProcessing && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
                            <p className="text-secondary">Processing scan...</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* Camera Modal */}
            {isCameraOpen && (
                <div className="fixed inset-0 bg-black z-50">
                    <CameraCapture
                        isOpen={true}
                        onCapture={handleCapture}
                        onClose={() => setIsCameraOpen(false)}
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
        </div>
    );
};

export default StandaloneScanner;

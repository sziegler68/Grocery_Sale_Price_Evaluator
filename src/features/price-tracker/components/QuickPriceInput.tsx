import React, { useState } from 'react';
import { X, Check, TrendingUp, TrendingDown, Plus, Trash2, Camera } from 'lucide-react';
import { formatPrice, calculateUnitPrice } from '../../../shared/utils/priceUtils';
import { calculateItemTax } from '../../shopping-trips/services/tripService';
import { UNIT_TYPES } from '../../../shared/constants/categories';
import { CameraCapture } from '../../shopping-trips/components/CameraCapture';
import { extractTextFromReceipt } from '../../../shared/lib/ocr/googleVision';
import { parsePriceTag } from '../../../shared/lib/ocr/priceTagParser';
import { toast } from 'react-toastify';

interface QuickPriceInputProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    price: number;
    quantity: number;
    taxAmount: number;  // Calculated sales tax
    crvAmount: number;
    updateTargetPrice: boolean;
    name?: string;
    unitType?: string;
    onSale: boolean;
  }) => void;
  itemName: string;
  unitType?: string;
  targetPrice?: number; // Target price PER UNIT
  salesTaxRate: number;
  category?: string; // For pack logic (meat items)
  // For editing existing cart items
  initialPrice?: number; // Total price
  initialQuantity?: number;
  initialCrv?: number; // Total CRV
  isEditable?: boolean; // Allow editing name/unit
  initialOnSale?: boolean;
}

const QuickPriceInput: React.FC<QuickPriceInputProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  unitType = '',
  targetPrice,
  salesTaxRate,
  category,
  initialPrice,
  initialQuantity,
  initialCrv,
  isEditable = false,
  initialOnSale = false
}) => {
  const [nameDisplay, setNameDisplay] = useState(itemName);
  const [unitDisplay, setUnitDisplay] = useState(unitType);
  const [isEditingName, setIsEditingName] = useState(false);
  const [onSale, setOnSale] = useState(initialOnSale);
  const [priceDisplay, setPriceDisplay] = useState<string>(
    initialPrice ? initialPrice.toFixed(2) : ''
  );
  const [quantity, setQuantity] = useState<string>(
    initialQuantity ? initialQuantity.toString() : '1'
  );
  const [crvEnabled, setCrvEnabled] = useState<boolean>(!!initialCrv && initialCrv > 0);
  const [crvPerContainerDisplay, setCrvPerContainerDisplay] = useState<string>(
    initialCrv && initialCrv > 0 && initialQuantity ? (initialCrv / initialQuantity).toFixed(2) : '0.05'
  );
  const [crvContainerCount, setCrvContainerCount] = useState<string>(
    initialQuantity ? initialQuantity.toString() : '1'
  );
  const [updateTarget, setUpdateTarget] = useState<boolean>(false);

  // Container units/quantity mode
  const [useContainerMode, setUseContainerMode] = useState<boolean>(false);
  const [containerPriceDisplay, setContainerPriceDisplay] = useState<string>('');
  const [unitsPerContainer, setUnitsPerContainer] = useState<string>('1');
  const [containerUnitType, setContainerUnitType] = useState<string>('pack');

  // Pack mode for meat items
  const isMeatItem = category === 'Meat';
  const [usePackMode, setUsePackMode] = useState<boolean>(false);
  const [packs, setPacks] = useState<Array<{ price: string; weight: string }>>([
    { price: '', weight: '' }
  ]);

  // OCR state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState<boolean>(false);
  const [lastScannedText, setLastScannedText] = useState<string>('');
  const [ocrUnitPrice, setOcrUnitPrice] = useState<number | null>(null);

  if (!isOpen) return null;

  // Handle price input - calculator style
  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input === '') {
      setPriceDisplay('');
      return;
    }
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    setPriceDisplay(`${dollars}.${cents.toString().padStart(2, '0')}`);
  };

  // Handle CRV per container input - calculator style
  const handleCrvPerContainerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input === '') {
      setCrvPerContainerDisplay('');
      return;
    }
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    setCrvPerContainerDisplay(`${dollars}.${cents.toString().padStart(2, '0')}`);
  };

  // Update container count when quantity changes
  React.useEffect(() => {
    if (crvEnabled && quantity) {
      setCrvContainerCount(quantity);
    }
  }, [quantity, crvEnabled]);

  // Handle container price input
  const handleContainerPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input === '') {
      setContainerPriceDisplay('');
      return;
    }
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    setContainerPriceDisplay(`${dollars}.${cents.toString().padStart(2, '0')}`);
  };

  // Pack mode handlers
  const addPack = () => {
    setPacks([...packs, { price: '', weight: '' }]);
  };

  const removePack = (index: number) => {
    if (packs.length > 1) {
      setPacks(packs.filter((_, i) => i !== index));
    }
  };

  const updatePack = (index: number, field: 'price' | 'weight', value: string) => {
    const newPacks = [...packs];
    if (field === 'price') {
      const input = value.replace(/\D/g, '');
      if (input === '') {
        newPacks[index].price = '';
      } else {
        const numValue = parseInt(input, 10);
        const dollars = Math.floor(numValue / 100);
        const cents = numValue % 100;
        newPacks[index].price = `${dollars}.${cents.toString().padStart(2, '0')}`;
      }
    } else {
      newPacks[index].weight = value;
    }
    setPacks(newPacks);
  };

  // OCR handler
  const handleCameraCapture = async (imageBlob: Blob) => {
    setIsProcessingOCR(true);
    setLastScannedText(''); // Clear previous
    setOcrUnitPrice(null); // Clear previous OCR unit price
    toast.info('Processing price tag...');

    try {
      // Extract text using OCR (pass Blob directly)
      const ocrResult = await extractTextFromReceipt(imageBlob);
      setLastScannedText(ocrResult.fullText); // Save raw text for debug

      // Parse price tag data
      const priceTagData = parsePriceTag(ocrResult.fullText, ocrResult.confidence);

      // LOG OCR DATA TO LOCALSTORAGE
      const ocrLog = {
        timestamp: new Date().toISOString(),
        itemName: nameDisplay || 'Unknown Item',
        rawOcrText: ocrResult.fullText,
        confidence: ocrResult.confidence,
        parsedData: {
          totalPrice: priceTagData.totalPrice,
          unitPrice: priceTagData.unitPrice,
          weight: priceTagData.weight,
          unit: priceTagData.unit,
          onSale: priceTagData.onSale,
          regularPrice: priceTagData.regularPrice,
          savingsAmount: priceTagData.savingsAmount,
        }
      };

      // Append to existing logs
      const existingLogs = JSON.parse(localStorage.getItem('ocrScanLogs') || '[]');
      existingLogs.push(ocrLog);
      localStorage.setItem('ocrScanLogs', JSON.stringify(existingLogs));
      console.log('[OCR] Logged scan data for:', nameDisplay);

      let dataFound = false;

      // Auto-fill fields with parsed data
      if (priceTagData.totalPrice) {
        setPriceDisplay(priceTagData.totalPrice.toFixed(2));
        dataFound = true;
      }

      // Store unit price from OCR if available
      if (priceTagData.unitPrice) {
        setOcrUnitPrice(priceTagData.unitPrice);
        console.log('[OCR] Unit price from tag:', priceTagData.unitPrice);
      }

      // DON'T auto-fill weight/unit from OCR
      // The "14 oz" on the tag is the container size, not the purchase quantity
      // The user's shopping list item already has the correct unit type
      // if (priceTagData.weight) {
      //   setQuantity(priceTagData.weight.toString());
      // }
      // if (priceTagData.unit) {
      //   setUnitDisplay(priceTagData.unit);
      // }

      if (priceTagData.onSale) {
        setOnSale(true);
      }

      // Show success/warning message
      const confidence = Math.round(priceTagData.confidence * 100);

      if (dataFound) {
        toast.success(`Scanned! Confidence: ${confidence}% (Logged)`);
      } else {
        toast.warning(`Scanned (Conf: ${confidence}%), but no price found. Check "Raw Text" below.`);
      }

    } catch (error: any) {
      console.error('[OCR] Failed to process image:', error);
      toast.error('Failed to scan price tag. Please enter manually.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  // Calculate values based on mode
  let totalPrice = 0;
  let quantityNum = 1;

  if (usePackMode && isMeatItem) {
    // Pack mode: sum all packs
    totalPrice = packs.reduce((sum, pack) => {
      const packPrice = pack.price ? parseFloat(pack.price) : 0;
      return sum + packPrice;
    }, 0);
    quantityNum = packs.reduce((sum, pack) => {
      const packWeight = pack.weight ? parseFloat(pack.weight) : 0;
      return sum + packWeight;
    }, 0);
  } else if (useContainerMode) {
    // Container mode: container price, units per container
    const containerPrice = containerPriceDisplay ? parseFloat(containerPriceDisplay) : 0;
    const unitsPerContainerNum = parseFloat(unitsPerContainer) || 1;
    totalPrice = containerPrice;
    quantityNum = unitsPerContainerNum;
  } else {
    // Normal mode: direct price and quantity
    totalPrice = priceDisplay ? parseFloat(priceDisplay) : 0;
    quantityNum = parseFloat(quantity) || 1;
  }

  const crvPerContainer = crvEnabled && crvPerContainerDisplay ? parseFloat(crvPerContainerDisplay) : 0;
  const containerCount = parseFloat(crvContainerCount) || 1;

  // Calculate unit price (price per item, NOT including CRV)
  // PREFER OCR unit price if available (from price tag), otherwise calculate from total/quantity
  const unitPrice = ocrUnitPrice !== null
    ? ocrUnitPrice
    : (totalPrice > 0 && quantityNum > 0 ? calculateUnitPrice(totalPrice, quantityNum) : 0);

  // Calculate cart addition
  // IMPORTANT: CRV is NOT taxed! It's added AFTER sales tax
  const totalCrv = crvPerContainer * containerCount; // CRV per container × number of containers
  const taxAmount = calculateItemTax(totalPrice, salesTaxRate, category); // Tax ONLY on item price, NOT CRV
  const cartAddition = totalPrice + taxAmount + totalCrv; // Item + Tax + CRV

  // Compare to target
  const priceDifference = targetPrice && unitPrice > 0 ? unitPrice - targetPrice : null;
  const isGoodDeal = priceDifference !== null && priceDifference <= 0;
  const isBadDeal = priceDifference !== null && priceDifference > 0;

  const handleConfirm = () => {
    if (totalPrice > 0 && quantityNum > 0) {
      onConfirm({
        price: totalPrice,
        quantity: quantityNum,
        taxAmount: taxAmount, // Pass calculated tax (single source of truth)
        crvAmount: totalCrv, // Pass total CRV (crvPerContainer × containerCount)
        updateTargetPrice: updateTarget,
        name: nameDisplay,
        unitType: unitDisplay,
        onSale: onSale
      });
      // Reset all fields
      setPriceDisplay('');
      setQuantity('1');
      setContainerPriceDisplay('');
      setUnitsPerContainer('1');
      setContainerUnitType('pack');
      setCrvPerContainerDisplay('');
      setCrvContainerCount('1');
      setCrvEnabled(false);
      setUpdateTarget(false);
      setUseContainerMode(false);
      setUsePackMode(false);
      setPacks([{ price: '', weight: '' }]);
      setOnSale(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl bg-card text-primary">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary">
          <div className="flex-1 mr-4">
            {isEditingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nameDisplay}
                  onChange={(e) => setNameDisplay(e.target.value)}
                  className="w-full px-2 py-1 rounded border bg-input border-input font-bold"
                  placeholder="Item Name"
                  autoFocus
                />
                <select
                  value={unitDisplay || ''}
                  onChange={(e) => setUnitDisplay(e.target.value)}
                  className="w-full px-2 py-1 rounded border bg-input border-input text-sm"
                >
                  <option value="">Select unit</option>
                  {UNIT_TYPES.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h3 className="font-bold truncate">{nameDisplay}</h3>
                {isEditable && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-brand hover:bg-brand-light rounded transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                )}
              </div>
            )}
            {targetPrice && unitType && !isEditingName && (
              <p className="text-xs text-secondary">
                Target: ${formatPrice(targetPrice)}/{unitType}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover-bg rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Pack Mode Toggle (Meat items only) */}
          {isMeatItem && (
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <input
                type="checkbox"
                id="pack-mode-checkbox"
                checked={usePackMode}
                onChange={(e) => {
                  setUsePackMode(e.target.checked);
                  if (!e.target.checked) {
                    setPacks([{ price: '', weight: '' }]);
                  }
                }}
                className="w-5 h-5 rounded border-input text-brand focus:ring-2 focus:ring-brand"
              />
              <label htmlFor="pack-mode-checkbox" className="text-sm font-medium cursor-pointer flex-1">
                Multiple packs (each pack has different weight)
              </label>
            </div>
          )}

          {/* Scan Price Tag Button */}
          {!usePackMode && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                disabled={isProcessingOCR}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="h-5 w-5" />
                <span>{isProcessingOCR ? 'Processing...' : 'Scan Price Tag'}</span>
              </button>

              {/* Debug: Show last scanned text */}
              {lastScannedText && (
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto max-h-20 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold mb-1 text-gray-500">Raw OCR Text:</div>
                  <pre className="whitespace-pre-wrap">{lastScannedText}</pre>
                </div>
              )}

              {/* OCR Log Management */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const logs = localStorage.getItem('ocrScanLogs');
                    if (!logs || logs === '[]') {
                      toast.info('No OCR logs to export');
                      return;
                    }
                    const blob = new Blob([logs], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ocr-logs-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('OCR logs exported!');
                  }}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  📥 Export OCR Logs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all OCR logs? This cannot be undone.')) {
                      localStorage.removeItem('ocrScanLogs');
                      toast.success('OCR logs cleared');
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  🗑️ Clear Logs
                </button>
              </div>
            </div>
          )}

          {/* Pack Mode Inputs */}
          {usePackMode && isMeatItem ? (
            <div className="space-y-3">
              {packs.map((pack, index) => (
                <div key={index} className="p-3 rounded-lg border border-primary bg-secondary">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Pack {index + 1}</span>
                    {packs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePack(index)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-secondary">Price</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pack.price}
                          onChange={(e) => updatePack(index, 'price', e.target.value)}
                          className="w-full pl-6 pr-2 py-2 rounded border bg-input border-input text-sm focus:ring-2 focus:ring-brand"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-secondary">Weight ({unitType || 'lb'})</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={pack.weight}
                        onChange={(e) => updatePack(index, 'weight', e.target.value)}
                        className="w-full px-2 py-2 rounded border bg-input border-input text-sm text-center focus:ring-2 focus:ring-brand"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addPack}
                className="w-full py-2 rounded-lg border border-dashed border-primary hover:bg-secondary transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Pack</span>
              </button>
              {totalPrice > 0 && quantityNum > 0 && (
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    Total: ${totalPrice.toFixed(2)} for {quantityNum.toFixed(2)} {unitType || 'lb'} = ${unitPrice.toFixed(2)}/{unitType || 'lb'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Container Mode Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="container-mode-checkbox"
                  checked={useContainerMode}
                  onChange={(e) => setUseContainerMode(e.target.checked)}
                  className="w-5 h-5 rounded border-input text-brand focus:ring-2 focus:ring-brand"
                />
                <label htmlFor="container-mode-checkbox" className="text-sm font-medium cursor-pointer flex-1">
                  Price is for a container/pack (e.g., 3-pack, case)
                </label>
              </div>

              {useContainerMode ? (
                <>
                  {/* Container Price */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-secondary">
                      Price for Container
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={containerPriceDisplay}
                        onChange={handleContainerPriceInput}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border bg-input border-input text-xl font-semibold focus:ring-2 focus:ring-brand"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Units per Container */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-2 text-secondary">
                        Units per Container
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={unitsPerContainer}
                        onChange={(e) => setUnitsPerContainer(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border bg-input border-input text-center text-lg font-semibold focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2 text-secondary">
                        Container Unit Type
                      </label>
                      <input
                        type="text"
                        value={containerUnitType}
                        onChange={(e) => setContainerUnitType(e.target.value)}
                        placeholder="pack, case, etc"
                        className="w-full px-4 py-3 rounded-lg border bg-input border-input text-center text-lg font-semibold focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  </div>

                  {totalPrice > 0 && quantityNum > 0 && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        ${containerPriceDisplay} per {containerUnitType} ({unitsPerContainer} {unitType || 'units'}) = ${unitPrice.toFixed(2)}/{unitType || 'unit'}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Total Price Input */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-secondary">
                      Total Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={priceDisplay}
                        onChange={handlePriceInput}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border bg-input border-input text-xl font-semibold focus:ring-2 focus:ring-brand"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="block text-xs font-medium mb-2 text-secondary">
                      Quantity{unitType ? ` (${unitType})` : ''}
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border bg-input border-input text-center text-lg font-semibold focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Unit Price Display */}
          {unitPrice > 0 && unitType && (
            <div className={`p-3 rounded-lg ${isGoodDeal
              ? 'bg-green-100 dark:bg-green-900/30'
              : isBadDeal
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-secondary'
              }`}>
              <div className="text-center">
                <div className="text-xs text-secondary mb-1">Unit Price</div>
                <div className={`text-2xl font-bold ${isGoodDeal
                  ? 'text-success'
                  : isBadDeal
                    ? 'text-error'
                    : 'text-primary'
                  }`}>
                  ${formatPrice(unitPrice)}/{unitType}
                </div>
                {priceDifference !== null && (
                  <div className="flex items-center justify-center space-x-1 mt-1 text-sm">
                    {isGoodDeal ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-success" />
                        <span className="text-success">
                          ${formatPrice(Math.abs(priceDifference))} under target
                        </span>
                      </>
                    ) : isBadDeal ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-error" />
                        <span className="text-error">
                          ${formatPrice(priceDifference)} over target
                        </span>
                      </>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-400">At target price</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* On Sale Checkbox */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="on-sale-checkbox"
              checked={onSale}
              onChange={(e) => setOnSale(e.target.checked)}
              className="w-5 h-5 rounded border-input text-brand focus:ring-2 focus:ring-brand"
            />
            <label htmlFor="on-sale-checkbox" className="text-sm font-medium cursor-pointer flex-1 flex items-center">
              <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
              Item is on sale
            </label>
          </div>

          {/* CRV Checkbox */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="crv-checkbox"
              checked={crvEnabled}
              onChange={(e) => {
                setCrvEnabled(e.target.checked);
                if (!e.target.checked) {
                  setCrvPerContainerDisplay('');
                  setCrvContainerCount('1');
                } else {
                  // Default container count to current quantity
                  setCrvContainerCount(quantity || '1');
                }
              }}
              className="w-5 h-5 rounded border-input text-brand focus:ring-2 focus:ring-brand"
            />
            <label htmlFor="crv-checkbox" className="text-sm font-medium cursor-pointer flex-1">
              Item has CRV (California Redemption Value)
            </label>
          </div>

          {/* CRV Inputs */}
          {crvEnabled && (
            <div className="space-y-4 pl-8 border-l-2 border-brand">
              <div>
                <label className="block text-xs font-medium mb-2 text-secondary">
                  CRV per Container
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={crvPerContainerDisplay}
                    onChange={handleCrvPerContainerInput}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand"
                    placeholder="0.05"
                  />
                </div>
                <p className="text-xs text-secondary mt-1">
                  Typically $0.05 for cans/small bottles, $0.10 for large bottles
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 text-secondary">
                  Number of CRV Containers
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={crvContainerCount}
                  onChange={(e) => setCrvContainerCount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border bg-input border-input text-center text-lg font-semibold focus:ring-2 focus:ring-brand"
                />
                <p className="text-xs text-secondary mt-1">
                  Number of individual containers with CRV (defaults to quantity)
                </p>
              </div>

              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                  Total CRV: ${crvPerContainer.toFixed(2)} × {containerCount} = ${totalCrv.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Update Target Price Checkbox */}
          {unitPrice > 0 && targetPrice && unitPrice !== targetPrice && (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="update-target-checkbox"
                checked={updateTarget}
                onChange={(e) => setUpdateTarget(e.target.checked)}
                className="w-5 h-5 rounded border-input text-brand focus:ring-2 focus:ring-brand"
              />
              <label htmlFor="update-target-checkbox" className="text-sm font-medium cursor-pointer flex-1">
                Update target price to ${formatPrice(unitPrice)}/{unitType}
              </label>
            </div>
          )}

          {/* Cart Addition Summary */}
          <div className="p-3 rounded-lg border-2 bg-brand-light border-brand">
            <div className="text-xs font-medium text-secondary mb-2">
              Adding to Cart:
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Item Total:</span>
                <span className="font-semibold">${totalPrice.toFixed(2)}</span>
              </div>
              {totalCrv > 0 && (
                <div className="flex justify-between">
                  <span className="text-secondary">CRV ({containerCount} containers × ${crvPerContainer.toFixed(2)}):</span>
                  <span className="font-semibold">${totalCrv.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({salesTaxRate.toFixed(2)}%):</span>
                <span className="font-semibold">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary font-bold text-base">
                <span>Cart Addition:</span>
                <span className="text-brand">${cartAddition.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2 pb-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium transition-colors bg-secondary hover-bg"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalPrice === 0 || quantityNum === 0}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${totalPrice > 0 && quantityNum > 0
                ? 'bg-brand hover-bg-brand text-white active:scale-95'
                : 'bg-secondary text-tertiary cursor-not-allowed'
                }`}
            >
              <Check className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default QuickPriceInput;

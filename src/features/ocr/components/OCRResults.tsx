/**
 * OCR Results Component
 * 
 * Displays OCR scan results and allows users to review/edit extracted items
 * before confirming ingestion.
 */

import { useState } from 'react';
import { Check, X, AlertTriangle, Edit2, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import type { OCRScanResponse } from '@shared/types/ocr';

interface OCRResultsProps {
  scanResult: OCRScanResponse;
  onClose: () => void;
  onConfirm?: () => void;
}

export function OCRResults({ scanResult, onClose, onConfirm }: OCRResultsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedItems, setEditedItems] = useState(
    scanResult.ingestedItems || []
  );

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number, newName: string, newPrice: number) => {
    const updated = [...editedItems];
    updated[index] = {
      ...updated[index],
      itemName: newName,
      price: newPrice,
    };
    setEditedItems(updated);
    setEditingIndex(null);
    toast.success('Item updated');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleConfirm = () => {
    toast.success('Items confirmed and saved!');
    onConfirm?.();
    onClose();
  };

  if (!scanResult.success) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <X className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Scan Failed</h2>
        </div>
        <p className="text-slate-300 mb-6">
          {scanResult.error?.message || 'Unknown error occurred'}
        </p>
        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  const { ocrResult, ingestedItems, processingTimeMs } = scanResult;
  const flaggedCount = ingestedItems?.filter(i => i.flagged).length || 0;

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            Scan Results
          </h2>
          <p className="text-slate-400 text-sm">
            {ingestedItems?.length || 0} items found • {processingTimeMs}ms
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Store & Date */}
      {ocrResult?.metadata && (
        <div className="bg-slate-900 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Store</div>
              <div className="text-white font-medium">
                {ocrResult.metadata.storeName}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Date</div>
              <div className="text-white font-medium">
                {ocrResult.metadata.date}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Total</div>
              <div className="text-white font-medium">
                ${ocrResult.metadata.total.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Confidence</div>
              <div className="text-white font-medium">
                {(ocrResult.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flagged items warning */}
      {flaggedCount > 0 && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-amber-400 font-semibold mb-1">
              {flaggedCount} item{flaggedCount !== 1 ? 's' : ''} flagged for review
            </div>
            <div className="text-amber-200 text-sm">
              Low confidence or possible duplicates detected. Review before confirming.
            </div>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {editedItems.map((item, index) => (
          <ItemCard
            key={index}
            item={item}
            isEditing={editingIndex === index}
            onEdit={() => handleEditItem(index)}
            onSave={(name, price) => handleSaveEdit(index, name, price)}
            onCancel={handleCancelEdit}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Items</span>
        </button>
      </div>

      {/* Mock note */}
      {scanResult._note && (
        <div className="mt-4 text-xs text-slate-500 text-center">
          {scanResult._note}
        </div>
      )}
    </div>
  );
}

interface ItemCardProps {
  item: {
    itemName: string;
    price: number;
    flagged: boolean;
    flagReason?: string;
  };
  isEditing: boolean;
  onEdit: () => void;
  onSave: (name: string, price: number) => void;
  onCancel: () => void;
}

function ItemCard({ item, isEditing, onEdit, onSave, onCancel }: ItemCardProps) {
  const [editName, setEditName] = useState(item.itemName);
  const [editPrice, setEditPrice] = useState(item.price.toString());

  const handleSave = () => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid price');
      return;
    }
    if (!editName.trim()) {
      toast.error('Item name cannot be empty');
      return;
    }
    onSave(editName.trim(), price);
  };

  if (isEditing) {
    return (
      <div className="bg-slate-700 rounded-lg p-4 border-2 border-violet-500">
        <div className="space-y-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-slate-800 text-white border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-violet-500"
            placeholder="Item name"
          />
          <input
            type="number"
            step="0.01"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            className="w-full bg-slate-800 text-white border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-violet-500"
            placeholder="Price"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-700 rounded-lg p-4 ${item.flagged ? 'border-2 border-amber-600' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-white font-medium mb-1">{item.itemName}</div>
          <div className="text-lg font-bold text-violet-400">
            ${item.price.toFixed(2)}
          </div>
          {item.flagged && item.flagReason && (
            <div className="flex items-center gap-2 mt-2 text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{item.flagReason}</span>
            </div>
          )}
        </div>
        <button
          onClick={onEdit}
          className="text-slate-400 hover:text-white transition-colors p-2"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

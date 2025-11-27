/**
 * Moderation Queue Component
 * 
 * Displays flagged grocery items that need review.
 * Allows moderators to verify or reject flagged items.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { getModerationQueue, verifyItem } from '@features/price-tracker/api/moderation';
import type { GroceryItem } from '@features/price-tracker/types';
import { formatDistanceToNow } from 'date-fns';

export function ModerationQueue() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GroceryItem | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const flaggedItems = await getModerationQueue();
      setItems(flaggedItems);
    } catch (error) {
      console.error('[MODERATION] Failed to load queue:', error);
      toast.error('Failed to load moderation queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyItem = async (itemId: string, approved: boolean) => {
    try {
      await verifyItem(itemId, approved ? 'approved' : 'rejected');
      
      toast.success(approved ? 'Item verified' : 'Item rejected');
      
      // Remove from queue
      setItems(prev => prev.filter(item => item.id !== itemId));
      setSelectedItem(null);
      
    } catch (error) {
      console.error('[MODERATION] Failed to verify item:', error);
      toast.error('Failed to update item');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400">Loading moderation queue...</div>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <ItemDetail
        item={selectedItem}
        onVerify={(approved) => handleVerifyItem(selectedItem.id, approved)}
        onClose={() => setSelectedItem(null)}
      />
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-semibold text-white">Moderation Queue</h2>
        <span className="text-slate-400 text-sm">({items.length} items)</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Check className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-1">All clear!</p>
          <p className="text-sm">No items flagged for review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FlaggedItemCard
              key={item.id}
              item={item}
              onView={() => setSelectedItem(item)}
              onQuickVerify={(approved) => handleVerifyItem(item.id, approved)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FlaggedItemCardProps {
  item: GroceryItem;
  onView: () => void;
  onQuickVerify: (approved: boolean) => void;
}

function FlaggedItemCard({ item, onView, onQuickVerify }: FlaggedItemCardProps) {
  const addedAgo = formatDistanceToNow(new Date(item.datePurchased), {
    addSuffix: true,
  });

  return (
    <div className="bg-slate-700 rounded-lg p-4 border-2 border-amber-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-white font-semibold mb-1">{item.itemName}</div>
          <div className="text-lg font-bold text-violet-400 mb-1">
            ${item.price.toFixed(2)}
          </div>
          <div className="text-slate-400 text-sm mb-2">
            {item.storeName} • {addedAgo}
          </div>
          
          {/* Flag reason */}
          {item.flagged_reason && (
            <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-900/30 rounded px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{item.flagged_reason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onView}
          className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
        <button
          onClick={() => onQuickVerify(true)}
          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"
          title="Verify (approve)"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={() => onQuickVerify(false)}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
          title="Reject"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface ItemDetailProps {
  item: GroceryItem;
  onVerify: (approved: boolean) => void;
  onClose: () => void;
}

function ItemDetail({ item, onVerify, onClose }: ItemDetailProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Review Item</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Queue
        </button>
      </div>

      {/* Item info */}
      <div className="bg-slate-900 rounded-lg p-6 mb-6">
        <div className="text-2xl font-bold text-white mb-2">{item.itemName}</div>
        <div className="text-3xl font-bold text-violet-400 mb-4">
          ${item.price.toFixed(2)}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400 mb-1">Store</div>
            <div className="text-white">{item.storeName}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Category</div>
            <div className="text-white">{item.category}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Quantity</div>
            <div className="text-white">
              {item.quantity} {item.unitType}
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Unit Price</div>
            <div className="text-white">${item.unitPrice.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Date Purchased</div>
            <div className="text-white">
              {new Date(item.datePurchased).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Added</div>
            <div className="text-white">
              {formatDistanceToNow(new Date(item.datePurchased), { addSuffix: true })}
            </div>
          </div>
        </div>

        {item.notes && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Notes</div>
            <div className="text-white">{item.notes}</div>
          </div>
        )}
      </div>

      {/* Flag info */}
      <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-amber-400 font-semibold mb-2">Flagged for Review</div>
            {item.flagged_reason && (
              <div className="text-amber-200 text-sm mb-3">{item.flagged_reason}</div>
            )}
            
            {/* OCR metadata if available */}
            {item.ocr_source && item.ocr_source !== 'manual_entry' && (
              <div className="space-y-1 text-sm">
                <div className="text-amber-300">
                  <strong>OCR Source:</strong> {item.ocr_source}
                </div>
                {item.ocr_confidence !== null && item.ocr_confidence !== undefined && (
                  <div className="text-amber-300">
                    <strong>Confidence:</strong> {(item.ocr_confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onVerify(false)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          <span>Reject Item</span>
        </button>
        <button
          onClick={() => onVerify(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          <span>Verify Item</span>
        </button>
      </div>
    </div>
  );
}

/**
 * OCR History Component
 * 
 * Displays recent OCR scans for audit and review purposes.
 * Allows moderators to review past scans and their results.
 */

import { useState, useEffect } from 'react';
import { History, Eye, Calendar, Store, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getRecentOCRScans } from '@features/price-tracker/api/ocrScans';
import type { OCRScan } from '@shared/types/ocr';
import { formatDistanceToNow } from 'date-fns';

export function OCRHistory() {
  const [scans, setScans] = useState<OCRScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<OCRScan | null>(null);

  useEffect(() => {
    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    try {
      setIsLoading(true);
      const recentScans = await getRecentOCRScans(20);
      setScans(recentScans);
    } catch (error) {
      console.error('[OCR_HISTORY] Failed to load scans:', error);
      toast.error('Failed to load OCR history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewScan = (scan: OCRScan) => {
    setSelectedScan(scan);
  };

  const handleCloseDetail = () => {
    setSelectedScan(null);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400">Loading OCR history...</div>
      </div>
    );
  }

  if (selectedScan) {
    return <OCRScanDetail scan={selectedScan} onClose={handleCloseDetail} />;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-violet-400" />
        <h2 className="text-xl font-semibold text-white">OCR Scan History</h2>
        <span className="text-slate-400 text-sm">({scans.length} scans)</span>
      </div>

      {scans.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No scans yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onView={() => handleViewScan(scan)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ScanCardProps {
  scan: OCRScan;
  onView: () => void;
}

function ScanCard({ scan, onView }: ScanCardProps) {
  const scannedAgo = formatDistanceToNow(new Date(scan.created_at), {
    addSuffix: true,
  });

  const hasLowConfidence = (scan.confidence || 0) < 0.8;

  return (
    <div
      onClick={onView}
      className={`bg-slate-700 hover:bg-slate-600 rounded-lg p-4 cursor-pointer transition-colors ${
        hasLowConfidence ? 'border-2 border-amber-600' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-white font-medium mb-1">
            Scan #{scan.id.slice(0, 8)}
          </div>
          <div className="text-slate-400 text-sm">{scannedAgo}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="text-violet-400 hover:text-violet-300 transition-colors"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{new Date(scan.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Store className="w-4 h-4 text-slate-400" />
          <span className="truncate">Receipt Scan</span>
        </div>
      </div>

      {hasLowConfidence && (
        <div className="flex items-center gap-2 mt-3 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Low confidence: {((scan.confidence || 0) * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}

interface OCRScanDetailProps {
  scan: OCRScan;
  onClose: () => void;
}

function OCRScanDetail({ scan, onClose }: OCRScanDetailProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">
          Scan Details
        </h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Metadata */}
      <div className="bg-slate-900 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400 mb-1">Scan ID</div>
            <div className="text-white font-mono">{scan.id.slice(0, 16)}...</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Source</div>
            <div className="text-white">{scan.ocr_source}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Item ID</div>
            <div className="text-white font-mono text-sm">{scan.grocery_item_id.slice(0, 8)}...</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Scanned</div>
            <div className="text-white">
              {new Date(scan.created_at).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Confidence</div>
            <div className="text-white">
              {((scan.confidence || 0) * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Created</div>
            <div className="text-white">
              {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt image */}
      {scan.receipt_url && (
        <div className="mb-6">
          <div className="text-slate-400 text-sm mb-2">Receipt Image</div>
          <div className="bg-slate-900 rounded-lg p-4">
            <img
              src={scan.receipt_url}
              alt="Receipt"
              className="max-h-96 mx-auto rounded"
            />
          </div>
        </div>
      )}

      {/* Raw text */}
      {scan.raw_text && (
        <div>
          <div className="text-slate-400 text-sm mb-2">Extracted Text</div>
          <div className="bg-slate-900 rounded-lg p-4">
            <pre className="text-white text-xs whitespace-pre-wrap font-mono">
              {scan.raw_text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

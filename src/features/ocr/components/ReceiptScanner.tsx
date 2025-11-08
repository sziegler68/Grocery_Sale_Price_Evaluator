/**
 * Receipt Scanner Component
 * 
 * Allows users to upload receipt images for OCR processing.
 * Supports camera capture and file upload.
 */

import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import type { OCRScanResponse } from '@shared/types/ocr';
import { getSupabaseClient } from '@shared/api/supabaseClient';

interface ReceiptScannerProps {
  onScanComplete: (result: OCRScanResponse) => void;
  listId?: string;
  storeName?: string;
}

export function ReceiptScanner({ onScanComplete, listId, storeName }: ReceiptScannerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
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
    if (!selectedFile) {
      toast.error('Please select a receipt image first');
      return;
    }

    setIsUploading(true);

    try {
      // Get Supabase token for auth
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to scan receipts');
        setIsUploading(false);
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('receiptImage', selectedFile);
      if (listId) {
        formData.append('listId', listId);
      }
      if (storeName) {
        formData.append('storeName', storeName);
      }

      // Call OCR API
      const response = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result: OCRScanResponse = await response.json();

      if (result.success) {
        toast.success(`Scanned ${result.ingestedItems?.length || 0} items from receipt`);
        onScanComplete(result);
        
        // Clear selection
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        toast.error(result.error?.message || 'Failed to scan receipt');
      }

    } catch (error: any) {
      console.error('[OCR] Scan failed:', error);
      toast.error('Failed to scan receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Scan Receipt</h2>

      {!selectedFile ? (
        <div className="space-y-4">
          {/* Camera capture button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-5 h-5" />
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

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-600" />
            <span className="text-slate-400 text-sm">or</span>
            <div className="flex-1 border-t border-slate-600" />
          </div>

          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <p className="text-slate-400 text-sm text-center">
            JPEG, PNG, or WebP • Max 5MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          {previewUrl && (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full rounded-lg max-h-96 object-contain bg-slate-900"
              />
              <button
                onClick={handleClearSelection}
                disabled={isUploading}
                className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="text-sm text-slate-300">
            <strong>{selectedFile.name}</strong>
            <span className="text-slate-400 ml-2">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>

          {/* Scan button */}
          <button
            onClick={handleScan}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Receipt...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>Scan Receipt</span>
              </>
            )}
          </button>

          {!isUploading && (
            <button
              onClick={handleClearSelection}
              className="w-full text-slate-400 hover:text-white transition-colors"
            >
              Choose Different Image
            </button>
          )}
        </div>
      )}
    </div>
  );
}

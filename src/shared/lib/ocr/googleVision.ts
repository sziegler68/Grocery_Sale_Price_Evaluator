/**
 * OCR Text Extraction
 * 
 * This module provides OCR text extraction from receipt images.
 * 
 * PRODUCTION IMPLEMENTATION using Tesseract.js
 * - Actually reads uploaded image buffer
 * - Extracts text using Tesseract OCR engine
 * - Returns real text and confidence scores
 * - Works in development without API keys
 * 
 * For higher accuracy in production, can be swapped with Google Vision API.
 */

import { createWorker } from 'tesseract.js';

export interface OCRTextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

export interface OCRExtractionResult {
  fullText: string;
  confidence: number;
  textBlocks: OCRTextBlock[];
}

/**
 * Preprocess image for better OCR results
 * - Resizes to improve text resolution
 * - Converts to grayscale
 * - Applies binarization (thresholding) to remove background noise
 */
async function preprocessImage(imageSource: Blob | string): Promise<string | Blob> {
  // If it's a URL string, we can't easily preprocess in browser without fetching
  // For now, return as is if string (or handle fetching if needed)
  if (typeof imageSource === 'string') return imageSource;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageSource);
        return;
      }

      // 1. Resize (Upscale if too small, max width 2000px)
      // Target at least 1000px width for good OCR
      let width = img.width;
      let height = img.height;
      const minWidth = 1000;

      if (width < minWidth) {
        const scale = minWidth / width;
        width = minWidth;
        height = height * scale;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Get pixel data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // 3. Grayscale & Binarization (Thresholding)
      // Iterate through every pixel (R, G, B, A)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Standard grayscale formula (luminance)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Thresholding:
        // High contrast threshold to kill yellow background (which is bright in grayscale)
        // Yellow (255, 255, 0) -> Gray ~226. White is 255. Black text is ~0.
        // We want to keep dark text (black) and turn everything else white.
        // Threshold of 160-180 usually works well for black text on light backgrounds.
        const threshold = 160;
        const val = gray < threshold ? 0 : 255;

        data[i] = val;     // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
      }

      // Put processed data back
      ctx.putImageData(imageData, 0, 0);

      // Return as Blob
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('[OCR] Image preprocessed', {
            originalSize: imageSource instanceof Blob ? imageSource.size : 'N/A',
            newSize: blob.size,
            width,
            height
          });
          resolve(blob);
        } else {
          resolve(imageSource);
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      console.error('[OCR] Failed to load image for preprocessing', err);
      resolve(imageSource);
    };

    // Create a URL for the Blob to load it into the Image object
    if (imageSource instanceof Blob) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      // If it's a string (URL), load directly
      img.src = imageSource;
    }
  });
}

/**
 * Extract text from receipt image using Tesseract.js
 * 
 * @param imageSource - Image file (Blob) or URL string
 * @returns Extracted text and confidence scores
 */
export async function extractTextFromReceipt(
  imageSource: Blob | string
): Promise<OCRExtractionResult> {
  console.log('[OCR] Starting Tesseract text extraction', {
    sourceType: typeof imageSource,
    size: imageSource instanceof Blob ? imageSource.size : imageSource.length,
  });

  try {
    // Preprocess image if it's a Blob (browser environment)
    let processedSource = imageSource;
    if (typeof window !== 'undefined' && imageSource instanceof Blob) {
      try {
        processedSource = await preprocessImage(imageSource);
      } catch (err) {
        console.warn('[OCR] Preprocessing failed, using original image', err);
      }
    }

    // Initialize Tesseract worker
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Recognize text from image source
    const { data } = await worker.recognize(processedSource);

    // Terminate worker
    await worker.terminate();

    console.log('[OCR] Tesseract extraction complete', {
      textLength: data.text.length,
      confidence: data.confidence,
    });

    // For simplicity, create one text block per line
    const lines = data.text.split('\n').filter(line => line.trim());
    const textBlocks: OCRTextBlock[] = lines.map(line => ({
      text: line,
      confidence: data.confidence / 100, // Tesseract uses 0-100, normalize to 0-1
    }));

    return {
      fullText: data.text,
      confidence: data.confidence / 100, // Normalize to 0-1
      textBlocks,
    };

  } catch (error: any) {
    console.error('[OCR] Tesseract extraction failed:', error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

/**
 * Google Cloud Vision API Integration (for production)
 * 
 * To use Google Vision instead of Tesseract:
 * 1. Install: npm install @google-cloud/vision
 * 2. Set environment variables:
 *    - GOOGLE_VISION_EMAIL
 *    - GOOGLE_VISION_PRIVATE_KEY
 * 3. Replace extractTextFromReceipt() with this implementation:
 * 
 * import vision from '@google-cloud/vision';
 * 
 * const client = new vision.ImageAnnotatorClient({
 *   credentials: {
 *     client_email: process.env.GOOGLE_VISION_EMAIL,
 *     private_key: process.env.GOOGLE_VISION_PRIVATE_KEY?.replace(/\\n/g, '\n'),
 *   },
 * });
 * 
 * export async function extractTextFromReceipt(
 *   imageBuffer: Buffer
 * ): Promise<OCRExtractionResult> {
 *   const [result] = await client.documentTextDetection({
 *     image: { content: imageBuffer },
 *   });
 *   
 *   const fullText = result.fullTextAnnotation?.text || '';
 *   const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence || 0;
 *   const textAnnotations = result.textAnnotations || [];
 *   
 *   return {
 *     fullText,
 *     confidence,
 *     textBlocks: textAnnotations.map(annotation => ({
 *       text: annotation.description || '',
 *       confidence: annotation.confidence || 0,
 *       boundingBox: annotation.boundingPoly,
 *     })),
 *   };
 * }
 */

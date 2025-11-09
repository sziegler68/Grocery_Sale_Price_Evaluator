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
 * Extract text from receipt image using Tesseract.js
 * 
 * @param imageBuffer - Image file buffer (from uploaded file)
 * @returns Extracted text and confidence scores
 */
export async function extractTextFromReceipt(
  imageBuffer: Buffer
): Promise<OCRExtractionResult> {
  console.log('[OCR] Starting Tesseract text extraction', {
    bufferSize: imageBuffer.length,
  });
  
  try {
    // Initialize Tesseract worker
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    // Recognize text from image buffer
    const { data } = await worker.recognize(imageBuffer);
    
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

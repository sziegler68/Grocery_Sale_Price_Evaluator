/**
 * Price Tag OCR Serverless Function
 * 
 * Vercel serverless function for price tag OCR processing.
 * Flow: Upload image → Extract text → Parse as price tag
 */

import { parsePriceTag } from '@shared/lib/ocr/priceTagParser';
import { extractTextFromReceipt } from '@shared/lib/ocr/googleVision';

/**
 * Parse multipart/form-data without external dependencies
 * (Duplicated from scan.ts for independence)
 */
async function parseMultipartFormData(req: any): Promise<{
    file?: { buffer: Buffer; filename: string; mimetype: string };
    fields: Record<string, string>;
}> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        req.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const contentType = req.headers['content-type'] || '';
            const boundary = contentType.split('boundary=')[1];

            if (!boundary) {
                return resolve({ fields: {} });
            }

            const parts = buffer.toString('binary').split(`--${boundary}`);
            const fields: Record<string, string> = {};
            let file: { buffer: Buffer; filename: string; mimetype: string } | undefined;

            for (const part of parts) {
                if (!part || part === '--\r\n' || part === '--') continue;

                const headerEnd = part.indexOf('\r\n\r\n');
                if (headerEnd === -1) continue;

                const headers = part.substring(0, headerEnd);
                const content = part.substring(headerEnd + 4, part.length - 2);

                const filenameMatch = headers.match(/filename="([^"]+)"/);
                const nameMatch = headers.match(/name="([^"]+)"/);
                const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);

                if (filenameMatch && nameMatch) {
                    file = {
                        buffer: Buffer.from(content, 'binary'),
                        filename: filenameMatch[1],
                        mimetype: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
                    };
                } else if (nameMatch) {
                    fields[nameMatch[1]] = content;
                }
            }

            resolve({ file, fields });
        });

        req.on('error', reject);
    });
}

export default async function handler(
    req: any,
    res: any
) {
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST requests are allowed' },
        });
    }

    const startTime = Date.now();

    try {
        // 1. Parse multipart form data
        console.log('[OCR] Parsing price tag upload...');
        const { file } = await parseMultipartFormData(req);

        if (!file) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_FILE', message: 'No image uploaded' },
            });
        }

        // 2. Extract text
        const ocrExtraction = await extractTextFromReceipt(file.buffer);

        console.log('[OCR] Text extraction complete', {
            textLength: ocrExtraction.fullText.length,
            confidence: ocrExtraction.confidence
        });

        // 3. Parse price tag
        const priceTagData = parsePriceTag(ocrExtraction.fullText, ocrExtraction.confidence);

        console.log('[OCR] Parsed price tag', priceTagData);

        const processingTimeMs = Date.now() - startTime;

        return res.status(200).json({
            success: true,
            processingTimeMs,
            data: priceTagData,
        });

    } catch (error: any) {
        const processingTimeMs = Date.now() - startTime;
        console.error('[OCR] Error processing price tag:', error);

        return res.status(500).json({
            success: false,
            processingTimeMs,
            error: {
                code: 'OCR_FAILED',
                message: error.message || 'Failed to process price tag',
            },
        });
    }
}

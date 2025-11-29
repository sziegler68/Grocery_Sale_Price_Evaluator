# Tesseract OCR Archive

This directory contains the original Tesseract.js OCR implementation that was used for price tag scanning.

## Why Archived?

Tesseract OCR had poor accuracy on price tags:
- Average confidence: 32% (target: 80%+)
- Struggled with colored backgrounds, mixed fonts, and poor lighting
- Raw text was mostly garbled

## Replacement

Switched to **Google Gemini Vision API** for:
- 95%+ accuracy on price tags
- Structured data extraction
- Better handling of various price tag formats

## Files Archived

- `googleVision.ts` - Tesseract integration with image preprocessing
- `priceTagParser.ts` - Parser for Tesseract OCR output
- OCR-related code from `QuickPriceInput.tsx`

## OCR Test Results

See `ocr-test-results.json` for real-world test data from 20 grocery items.

**Date Archived:** 2025-11-28

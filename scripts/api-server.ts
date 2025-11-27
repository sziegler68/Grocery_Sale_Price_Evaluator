
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import handler from '../api/ocr/scan';
import priceTagHandler from '../api/ocr/price-tag';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

// Mock Vercel/Next.js API helpers
app.use((req: any, res: any, next) => {
    // Add .status() if not present (Express has it, but just to be sure)
    if (!res.status) {
        res.status = (statusCode: number) => {
            res.statusCode = statusCode;
            return res;
        };
    }

    // Add .json() if not present (Express has it)
    if (!res.json) {
        res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
        };
    }

    next();
});

// Mount the OCR handler (Receipts)
app.post('/api/ocr/scan', async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error('API Handler Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Mount the Price Tag handler (Single Item)
app.post('/api/ocr/price-tag', async (req, res) => {
    try {
        await priceTagHandler(req, res);
    } catch (error) {
        console.error('API Handler Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`
  🚀 Local API Server running at http://localhost:${PORT}
  👉 OCR Endpoint (Receipts): POST http://localhost:${PORT}/api/ocr/scan
  👉 OCR Endpoint (Price Tags): POST http://localhost:${PORT}/api/ocr/price-tag
  `);
});

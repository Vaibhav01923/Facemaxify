import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createClient } from '@supabase/supabase-js';

// Load env vars from parent directory (.env or .env.local)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const port = 4000;

app.use(cors());

// Capture raw body for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use service role for admin updates
const supabase = createClient(supabaseUrl, supabaseKey);

// Checkout Endpoint (Placeholder for future Dodo implementation if needed)
app.get('/checkout', async (req, res) => {
  res.status(501).json({ error: 'Checkout not implemented in this backend. Use Vercel /api/checkout.' });
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

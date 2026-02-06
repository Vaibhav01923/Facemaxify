import express from 'express';
import cors from 'cors';
import { Polar } from '@polar-sh/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';

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

// Initialize Polar SDK
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || '',
  server: 'sandbox', // Default to sandbox as requested
});

app.get('/', (req, res) => {
  res.send('Backend Server Running');
});

// Webhook Endpoint
app.post('/webhook', async (req, res) => {
  const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'POLAR_WEBHOOK_SECRET is not set' });
  }

  // Get headers
  const svix_id = req.headers['webhook-id'];
  const svix_timestamp = req.headers['webhook-timestamp'];
  const svix_signature = req.headers['webhook-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send('Missing svix headers');
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(req.rawBody, {
      'webhook-id': svix_id,
      'webhook-timestamp': svix_timestamp,
      'webhook-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).send('Webhook verification failed');
  }

  // Handle Event
  const eventType = evt.type;
  console.log(`Received webhook: ${eventType}`);

  if (eventType === 'checkout.created' || eventType === 'order.created') {
    const data = evt.data;
    const email = data.customer_email;

    if (email) {
      console.log(`Updating payment status for: ${email}`);
      const { error } = await supabase
        .from('users')
        .update({ isPaid: true }) // Assuming column name is 'isPaid'
        .eq('email', email);

      if (error) {
        console.error('Supabase update error:', error);
        return res.status(500).send('Database update failed');
      }
      console.log('Database updated successfully');
    }
  }

  res.json({ received: true });
});

// Checkout Endpoint
app.get('/checkout', async (req, res) => {
  try {
    const { 
      products, 
      customerId, 
      customerExternalId,
      customerEmail,
      customerName,
      metadata 
    } = req.query;

    // Parse metadata if provided
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(decodeURIComponent(metadata));
      } catch (e) {
        console.warn('Failed to parse metadata JSON', e);
      }
    }

    const result = await polar.checkouts.create({
      productPriceId: products ? String(products) : undefined,
      successUrl: process.env.POLAR_SUCCESS_URL || 'http://localhost:3000/dashboard',
      customerId: customerId ? String(customerId) : undefined,
      customerExternalId: customerExternalId ? String(customerExternalId) : undefined,
      customerEmail: customerEmail ? String(customerEmail) : undefined,
      customerName: customerName ? String(customerName) : undefined,
      metadata: parsedMetadata,
    });

    // Redirect the user to the checkout URL
    res.redirect(result.url);
  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: 'Failed to initiate checkout', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

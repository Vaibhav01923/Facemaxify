import DodoPayments from 'dodopayments';
import { attributionFromCookieHeader, attributionMetadata } from './_lib/attribution.js';

// Checkout page languages we force for visitors who came through the Spanish / Japanese pages
// (Dodo supports both). Everyone else gets Dodo's default.
const CHECKOUT_LANGUAGE = { es: 'es', ja: 'ja' };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  let mode = process.env.DODO_PAYMENTS_MODE;

  // Auto-detect mode if key follows standard naming convention
  if (apiKey?.startsWith('sk_test_')) {
    mode = 'test_mode';
  } else if (apiKey?.startsWith('sk_live_')) {
    mode = 'live_mode';
  } else if (!mode) {
    mode = 'live_mode'; // Default to Live Mode
  }

  console.log("----- CHECKOUT INIT -----");
  console.log("Mode (Auto-detected):", mode);
  console.log("API Key Exists:", !!apiKey);
  if (apiKey) console.log("Key Length:", apiKey.length);
  if (apiKey) console.log("Key Prefix:", apiKey.substring(0, 8));
  console.log("-------------------------");

  if (!apiKey) {
    console.error("CRITICAL: DODO_PAYMENTS_API_KEY is missing.");
    return res.status(500).json({ error: 'Internal Server Error: Payment configuration missing.' });
  }

  const client = new DodoPayments({
    bearerToken: apiKey.trim(),
    environment: mode,
  });

  try {
    const { 
      products, 
      customerEmail,
      metadata,
      discountCode = 'EARLY40' // Default to EARLY40 coupon
    } = req.query;

    if (!products && !process.env.DODO_PAYMENTS_PRODUCT_ID) {
      console.warn('Missing product ID');
    }

    // Parse metadata if provided
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(decodeURIComponent(metadata));
      } catch (e) {
        console.warn('Failed to parse metadata JSON', e);
      }
    }

    // Where this buyer came from (first page, page they clicked "full report" on, language), read
    // from the first-party cookie services/attribution.ts keeps. It ends up on the payment in Dodo
    // and in the webhook. Metadata passed explicitly in the request wins over it.
    const attribution = attributionFromCookieHeader(req.headers.cookie);
    parsedMetadata = { ...attributionMetadata(attribution), ...parsedMetadata };
    console.log('[checkout] attribution:', JSON.stringify(attribution));

    // Forcefully inject the intended email into metadata so the webhook knows exactly who to upgrade
    if (customerEmail) {
      parsedMetadata.customer_email = String(customerEmail);
    }

    const productId = products || process.env.DODO_PAYMENTS_PRODUCT_ID;

    const sessionParams = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      billing: {
        email: customerEmail || undefined, // Prefill email if available
      },
      customer: {
        email: customerEmail || undefined,
      },
      discount_code: discountCode || undefined, // Apply discount code if provided
      metadata: parsedMetadata,
      return_url: process.env.DODO_PAYMENTS_SUCCESS_URL || 'https://facemaxify.com/dashboard',
    };

    // Create a one-time payment link/session using Checkout Sessions (Recommended)
    let session;
    const forceLanguage = CHECKOUT_LANGUAGE[attribution.lang];
    if (forceLanguage) {
      try {
        session = await client.checkoutSessions.create({
          ...sessionParams,
          customization: { force_language: forceLanguage },
        });
      } catch (languageError) {
        // The language is a nicety, never a reason to lose a sale: fall back to Dodo's default.
        console.warn('Checkout with forced language failed, retrying without it:', languageError.message);
      }
    }
    if (!session) {
      session = await client.checkoutSessions.create(sessionParams);
    }

    // Redirect the user to the checkout URL
    return res.redirect(session.checkout_url);
  } catch (error) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ error: 'Failed to initiate checkout', details: error.message });
  }
}

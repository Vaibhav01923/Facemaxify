import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || '',
  environment: process.env.DODO_PAYMENTS_MODE || 'live_mode', // 'live_mode' or 'test_mode'
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      products, 
      customerEmail,
      metadata 
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

    // Forcefully inject the intended email into metadata so the webhook knows exactly who to upgrade
    if (customerEmail) {
      parsedMetadata.customer_email = String(customerEmail);
    }

    const productId = products || process.env.DODO_PAYMENTS_PRODUCT_ID;

    // Create a one-time payment link/session
    const payment = await client.payments.create({
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
      metadata: parsedMetadata,
      return_url: process.env.DODO_PAYMENTS_SUCCESS_URL || 'https://facemaxify.com/dashboard',
    });

    // Redirect the user to the checkout URL
    return res.redirect(payment.payment_link);
  } catch (error) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ error: 'Failed to initiate checkout', details: error.message });
  }
}

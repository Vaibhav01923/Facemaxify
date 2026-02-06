import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || '',
  server: 'sandbox', // Change to 'production' for live payments
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      products, 
      customerId, 
      customerExternalId,
      customerEmail,
      customerName,
      metadata 
    } = req.query;

    if (!products) {
      // For user friendliness during dev: provide a clearer error or default behavior
      // But strictly, we need a product to buy.
      console.warn('Missing "products" query parameter');
       // Validating strictly in logic, but letting SDK handle it if we want custom errors
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
    // This persists even if the user changes the email in the checkout UI
    if (customerEmail) {
      parsedMetadata.customer_email = String(customerEmail);
    }

    const result = await polar.checkouts.create({
      products: products ? [String(products)] : [],
      successUrl: process.env.POLAR_SUCCESS_URL || 'https://facemaxify.com/dashboard',
      customerId: customerId ? String(customerId) : undefined,
      customerExternalId: customerExternalId ? String(customerExternalId) : undefined,
      customerEmail: customerEmail ? String(customerEmail) : undefined,
      customerName: customerName ? String(customerName) : undefined,
      metadata: parsedMetadata,
    });

    // Redirect the user to the checkout URL
    return res.redirect(result.url);
  } catch (error) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ error: 'Failed to initiate checkout', details: error.message });
  }
}

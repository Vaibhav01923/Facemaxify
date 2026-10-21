import { createClient } from "@supabase/supabase-js";
import { createDodoClient, subscriptionProductId } from "../_lib/dodoClient.js";
import { processDodoEvent } from "../_lib/subscriptionAccess.js";

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const config = {
  api: {
    bodyParser: false, // Disabling body parser to get raw body for signature verification
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const dodo = createDodoClient();
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;

  if (!dodo || !webhookKey) {
    console.error("CRITICAL: DODO_PAYMENTS_API_KEY or DODO_PAYMENTS_WEBHOOK_KEY is missing.");
    return res.status(500).json({ error: "Internal Server Error: Webhook configuration missing." });
  }
  const { client, mode } = dodo;

  // Get raw body
  const rawBody = await getRawBody(req);

  // Verify the signature. The SDK takes the headers and the signing secret as ONE options object:
  // passing the headers on their own skips the check and accepts any request as genuine.
  let event;
  try {
    event = client.webhooks.unwrap(rawBody, { headers: req.headers, key: webhookKey.trim() });
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received webhook: ${event.type} (${mode})`);

  // Footprint access is verified against Dodo on each search. Never grant the main app plan.
  const data = event.data || {};
  if (data.metadata?.source === 'digital-footprint' || data.product_id === 'pdt_0NqF4XmJ4WdvmWyEQJSaY' ||
      data.product_cart?.some(item => item.product_id === 'pdt_0NqF4XmJ4WdvmWyEQJSaY')) return res.json({ received: true });
  if (event.type === 'payment.succeeded' && data.subscription_id) {
    try {
      const subscription = await client.subscriptions.retrieve(data.subscription_id);
      if (subscription.product_id === 'pdt_0NqF4XmJ4WdvmWyEQJSaY') return res.json({ received: true });
    } catch { return res.status(500).send('Subscription verification unavailable'); }
  }

  try {
    const outcome = await processDodoEvent({
      db: supabase,
      event,
      planProductId: subscriptionProductId(),
      retrieveSubscription: (id) => client.subscriptions.retrieve(id),
    });
    console.log(`Webhook ${event.type}: ${outcome}`);
  } catch (err) {
    // 500 makes Dodo send the event again, which is what we want for a database hiccup (or for
    // supabase_subscriptions.sql not being run yet).
    console.error(`Webhook ${event.type} failed:`, err.message);
    return res.status(500).send("Database update failed");
  }

  return res.json({ received: true });
}

// Helper to get raw body
async function getRawBody(req) {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers).toString("utf8");
}

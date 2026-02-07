import { createClient } from "@supabase/supabase-js";
import DodoPayments from "dodopayments";

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

  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  const mode = process.env.DODO_PAYMENTS_MODE || 'live_mode';

  console.log("----- WEBHOOK INIT -----");
  console.log("Mode:", mode);
  console.log("API Key Exists:", !!apiKey);
  console.log("Webhook Key Exists:", !!webhookKey);
  if (webhookKey) console.log("Webhook Key First 4:", webhookKey.substring(0, 4));
  console.log("------------------------");

  if (!apiKey || !webhookKey) {
    console.error("CRITICAL: DODO_PAYMENTS_API_KEY or DODO_PAYMENTS_WEBHOOK_KEY is missing.");
    return res.status(500).json({ error: "Internal Server Error: Webhook configuration missing." });
  }

  const client = new DodoPayments({
    bearerToken: apiKey.trim(),
    environment: mode,
  });

  // Get raw body
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = client.webhooks.unwrap(rawBody, req.headers, webhookKey.trim());
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  const eventType = event.type;
  console.log(`Received webhook: ${eventType}`);

  if (eventType === "payment.succeeded") {
    const data = event.data;
    console.log("Payment Succeeded Data:", JSON.stringify(data));

    // Extract email from metadata (preferred) or customer details
    const email = data.metadata?.customer_email || data.customer?.email || data.billing?.email;

    if (email) {
      console.log(`Updating payment status for: ${email}`);
      const { data: user, error } = await supabase
        .from("users")
        .update({ isPaid: true })
        .eq("email", email)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        return res.status(500).send("Database update failed");
      }

      console.log("Database updated successfully:", user);
    } else {
      console.warn("No email found in payment data");
    }
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

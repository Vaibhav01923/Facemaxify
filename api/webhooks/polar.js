import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";

// Initialize Supabase Client (Vercel Serverless Environment)
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

  const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("POLAR_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Configuration error" });
  }

  // Get the headers
  const svix_id = req.headers["webhook-id"];
  const svix_timestamp = req.headers["webhook-timestamp"];
  const svix_signature = req.headers["webhook-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send("Missing svix headers");
  }

  // Read raw body
  const rawBody = await getRawBody(req);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(rawBody, {
      "webhook-id": svix_id,
      "webhook-timestamp": svix_timestamp,
      "webhook-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).send("Webhook verification failed");
  }

  // Handle Event
  const eventType = evt.type;
  console.log(`Received webhook: ${eventType}`);

  if (eventType === "checkout.created" || eventType === "order.created") {
    const data = evt.data;
    // Try both snake_case (standard webhook) and camelCase (SDK)
    const email = data.customer_email || data.customerEmail;

    console.log("Webhook Data:", JSON.stringify(data)); // Log data for debugging

    if (email) {
      console.log(`Updating payment status for: ${email}`);
      const { data: user, error } = await supabase
        .from("users")
        .update({ isPaid: true }) 
        .eq("email", email)
        .select(); // Select to confirm update

      if (error) {
        console.error("Supabase update error:", error);
        return res.status(500).send("Database update failed");
      }
      
      if (user && user.length > 0) {
        console.log("Database updated successfully:", user);
      } else {
        console.warn(`No user found with email: ${email}`);
      }
    } else {
      console.error("No customer_email found in webhook data");
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
  return Buffer.concat(buffers).toString();
}

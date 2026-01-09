import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

// Vercel Serverless Function
// POST /api/webhooks/clerk

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Missing CLERK_WEBHOOK_SECRET" });
  }

  // Get the headers
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Error occured -- no svix headers" });
  }

  // Get the body
  let payload = req.body;

  // Vercel parses the body automatically, but svix needs the raw string.
  // We need to ensure we can verify the payload.
  // If req.body is already an object, we serialize it back to string.
  // Ideally, we would use raw body buffer, but for JSON webhooks stringify usually works if order is preserved.
  // Note: Vercel functions consume the body.
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Attempt to verify the incoming webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).json({ Error: err.message });
  }

  // Handle the event
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    // Get primary email
    const primaryEmailObj = email_addresses?.find(
      (email) => email.id === evt.data.primary_email_address_id
    );
    const email = primaryEmailObj ? primaryEmailObj.email_address : null;

    if (email) {
      // Connect to Supabase
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
      // NOTE: For higher security backend writes, use SERVICE_ROLE_KEY if RLS blocks Anon.
      // For now, using Anon key assuming policies allow or are public.

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase.from("users").insert({
        id: id,
        email: email,
        first_name: first_name,
        last_name: last_name,
        full_name: `${first_name || ""} ${last_name || ""}`.trim(),
        photo_url: image_url,
      });

      if (error) {
        console.error("Error saving user to Supabase:", error);
        return res.status(500).json({ error: "Error saving user" });
      }

      console.log(`User ${id} saved to Supabase`);
    }
  }

  return res.status(200).json({ success: true });
}

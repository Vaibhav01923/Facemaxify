import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";

// Setup Supabase Client
// Note: In serverless functions, we reuse the connection logic per invocation
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Verify (Inline helper logic)
    const evt = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(
      `Received webhook with ID ${id} and event type of ${eventType}`
    );

    // 2. Handle Event
    if (eventType === "user.created") {
      await handleUserCreated(evt.data);
    } else {
      console.log(`Unhandled event type: ${eventType}`);
    }

    return res
      .status(200)
      .json({ success: true, message: "Webhook processed successfully" });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return res.status(500).json({
      error: "Error processing webhook",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}

// 3. User Handler
async function handleUserCreated(data) {
  try {
    const { id, email_addresses, first_name, last_name, username, image_url } =
      data;

    const primaryEmail = email_addresses?.find(
      (email) => email.id === data.primary_email_address_id
    );
    const email = primaryEmail?.email_address;

    if (!email) {
      console.error("No email found for user:", id);
      return;
    }

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        id: id,
        email: email,
        full_name:
          first_name || last_name
            ? `${first_name || ""} ${last_name || ""}`.trim()
            : username || null,
        first_name: first_name,
        last_name: last_name,
        photo_url: image_url,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`Created user: ${id} with email: ${email}`);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// 4. Verify Webhook Helper (Inlined to avoid bundling issues)
async function verifyWebhook(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env"
    );
  }

  // Get the headers
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error("Error occured -- no svix headers");
  }

  // Get the body
  const payload = req.body;
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
    throw new Error("Error verifying webhook");
  }

  return evt;
}

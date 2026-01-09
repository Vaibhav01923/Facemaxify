import { verifyWebhook } from "../utils/verifyWebhook";
import { createClient } from "@supabase/supabase-js";

// Setup Supabase Client (Simulating Prisma client behavior)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Verify (Matches reference structure)
    const evt = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(
      `Received webhook with ID ${id} and event type of ${eventType}`
    );

    // 2. Handle Event (Matches reference structure)
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
    return res.status(500).json({ error: "Error processing webhook" });
  }
}

// 3. User Handler (Matches reference structure)
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

    // Replace Prisma with Supabase
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        id: id,
        email: email,
        // Match the name logic from reference
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

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function slugify(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

async function uniqueSlug(baseSlug) {
  let slug = baseSlug || "post";
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const expectedSecret = process.env.RANKONGEO_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("RANKONGEO_WEBHOOK_SECRET is not configured");
    return res.status(500).json({ ok: false, error: "Server is not configured for this webhook" });
  }

  const providedSecret = req.headers["x-rankongeo-secret"];
  if (providedSecret !== expectedSecret) {
    return res.status(401).json({ ok: false, error: "Invalid or missing X-RankOnGeo-Secret header" });
  }

  if (!supabase) {
    console.error("Supabase is not configured (missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
    return res.status(500).json({ ok: false, error: "Server is not configured to store posts" });
  }

  const body = req.body || {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";

  if (!title) {
    return res.status(400).json({ ok: false, error: "title is required" });
  }
  if (!content.trim()) {
    return res.status(400).json({ ok: false, error: "content is required" });
  }

  const keyword = typeof body.keyword === "string" ? body.keyword : null;
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === "string") : [];
  const imageUrl = typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;

  try {
    const baseSlug = slugify(title);
    const slug = await uniqueSlug(baseSlug);
    const now = new Date().toISOString();

    const { error } = await supabase.from("blog_posts").insert({
      slug,
      title,
      content,
      description,
      keyword,
      tags,
      image_url: imageUrl,
      status: "published",
      source: typeof body.source === "string" ? body.source : "rankongeo",
      created_at: now,
      published_at: now,
    });

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to publish RankOnGeo post:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to save the post",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}

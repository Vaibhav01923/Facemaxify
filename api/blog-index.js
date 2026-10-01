import { createClient } from "@supabase/supabase-js";
import { renderHtmlWithMeta } from "./_lib/htmlMeta.js";
import { blogIndexMeta } from "./_lib/blogShared.js";
import { loadTemplate, renderIndexPage, withRootContent } from "./_lib/blogRender.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// /blog, rendered at request time with a real <a href> to every published post, so search
// engines can discover posts from the listing without running JS. It used to be a static
// file baked at build time by scripts/prerender.mjs, which could never list posts that the
// RankOnGeo webhook publishes after a deploy.
export default async function handler(req, res) {
  let template;
  try {
    template = await loadTemplate(req);
  } catch (err) {
    console.error("Failed to load index.html template:", err);
    return res.status(500).send("Internal Server Error");
  }

  let html = renderHtmlWithMeta(template, blogIndexMeta);
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const { data: posts, error } = supabase
    ? await supabase
        .from("blog_posts")
        .select("slug, title, description, image_url, tags, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
    : { data: null, error: new Error("Supabase is not configured") };

  if (error || !posts) {
    // Serve the metadata-only page uncached; the app loads the list in the browser.
    console.error("Failed to load posts for /blog:", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(html);
  }

  try {
    html = withRootContent(html, renderIndexPage(posts), { posts });
  } catch (err) {
    console.error("Failed to render /blog:", err);
  }

  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}

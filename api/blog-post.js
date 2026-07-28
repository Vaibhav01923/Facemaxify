import { createClient } from "@supabase/supabase-js";
import { renderHtmlWithMeta } from "./_lib/htmlMeta.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Blog posts are published dynamically (via the RankOnGeo webhook), so they can't get
// build-time static HTML like scripts/prerender.mjs does for the fixed set of tool/landing
// pages. This does the same head-tag injection at request time instead, fetching the
// already-deployed index.html as a template and swapping in the post's real metadata
// before any client JS runs — same fix, different timing.
export default async function handler(req, res) {
  const slug = req.query.slug;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const baseUrl = `${proto}://${host}`;

  let template;
  try {
    const templateRes = await fetch(`${baseUrl}/index.html`);
    template = await templateRes.text();
  } catch (err) {
    console.error("Failed to load index.html template:", err);
    return res.status(500).send("Internal Server Error");
  }

  if (!supabase || !slug) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(404).send(template);
  }

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("slug, title, description, content, keyword, image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch blog post for SSR meta:", error);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!post) {
    return res.status(404).send(template);
  }

  const canonicalUrl = `https://facemaxify.com/blog/${post.slug}`;
  const description =
    post.description ||
    post.content.replace(/[#*`_>[\]()-]/g, "").slice(0, 155).trim() + "…";

  let html = renderHtmlWithMeta(template, {
    title: `${post.title} | Facemaxify Blog`,
    description,
    keywords: post.keyword || undefined,
    canonicalUrl,
    image: post.image_url || undefined,
  });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    image: post.image_url || "https://facemaxify.com/og-image.png",
    author: { "@type": "Organization", name: "Facemaxify" },
    publisher: { "@type": "Organization", name: "Facemaxify" },
    mainEntityOfPage: canonicalUrl,
  };
  const schemaTag = `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>\n  </head>`;
  html = html.replace(/<\/head>/, schemaTag);

  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}

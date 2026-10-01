import { createClient } from "@supabase/supabase-js";
import { renderHtmlWithMeta } from "./_lib/htmlMeta.js";
import { blogPostUrl } from "./_lib/blogShared.js";
import { loadTemplate, renderPostPage, withRootContent } from "./_lib/blogRender.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Blog posts are published dynamically (via the RankOnGeo webhook), so they can't get
// build-time static HTML like scripts/prerender.mjs does for the fixed set of tool/landing
// pages. This renders them at request time instead: the post's real metadata in <head>
// and the full article in the body, so crawlers get the content without running any JS.
export default async function handler(req, res) {
  const slug = req.query.slug;

  let template;
  try {
    template = await loadTemplate(req);
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
    .select("slug, title, content, description, keyword, tags, image_url, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch blog post for SSR:", error);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!post) {
    return res.status(404).send(template);
  }

  const canonicalUrl = blogPostUrl(post.slug);
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
    datePublished: post.published_at || undefined,
    author: { "@type": "Organization", name: "Facemaxify" },
    publisher: { "@type": "Organization", name: "Facemaxify" },
    mainEntityOfPage: canonicalUrl,
  };
  const schemaJson = JSON.stringify(articleSchema).replace(/</g, "\\u003c");
  html = html.replace(/<\/head>/, () => `<script type="application/ld+json">${schemaJson}</script>\n  </head>`);

  try {
    html = withRootContent(html, renderPostPage(post), { post });
  } catch (err) {
    // Still serve the metadata-only page: the app renders the post in the browser.
    console.error("Failed to render blog post body:", err);
  }

  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}

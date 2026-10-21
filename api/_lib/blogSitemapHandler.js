import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Blog posts are added continuously by the RankOnGeo webhook, so they can't live in the
// static public/sitemap.xml (which only covers the fixed set of tool/landing pages built
// at deploy time). This generates a second sitemap on every request instead, referenced
// from robots.txt as an additional Sitemap: line — new posts show up here immediately,
// no rebuild needed.
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  if (!supabase) {
    return res.status(200).send(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    );
  }

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Failed to build blog sitemap:", error);
    return res.status(500).send("Failed to generate sitemap");
  }

  const urlEntries = (posts || []).map((post) => {
    const lastmod = (post.published_at || new Date().toISOString()).slice(0, 10);
    return `  <url>\n    <loc>https://facemaxify.com/blog/${escapeXml(post.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
  });

  // An <urlset> with zero <url> children is technically valid per the sitemap protocol,
  // but Google Search Console flags it as an error ("Missing XML tag: url") rather than
  // just reporting 0 discovered URLs. Self-resolves once the first post is published;
  // this just keeps the markup itself clean either way.
  const xml =
    urlEntries.length > 0
      ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join("\n")}\n</urlset>\n`
      : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>\n`;

  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(xml);
}

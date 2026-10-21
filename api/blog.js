import indexHandler from "./_lib/blogIndexHandler.js";
import postHandler from "./_lib/blogPostHandler.js";
import sitemapHandler from "./_lib/blogSitemapHandler.js";

// One function for /blog, /blog/:slug and /sitemap-blog.xml (see the rewrites in vercel.json),
// because the Vercel Hobby plan allows only 12 serverless functions per deployment.
const handlers = { index: indexHandler, post: postHandler, sitemap: sitemapHandler };

export default function handler(req, res) {
  const route = handlers[req.query.page];
  if (!route) return res.status(404).send("Not found");
  return route(req, res);
}

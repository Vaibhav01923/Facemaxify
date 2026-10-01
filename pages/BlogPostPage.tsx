import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "markdown-to-jsx";
import { Navbar } from "../components/Navbar";
import { SEO } from "../components/SEO";
import { supabase } from "../services/supabase";
import { blogPostTitle, initialBlogData, markdownOptions, postBody } from "../api/_lib/blogShared.js";

interface BlogPost {
  slug: string;
  title: string;
  content: string;
  description: string | null;
  keyword: string | null;
  tags: string[] | null;
  image_url: string | null;
  published_at: string | null;
}

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams();
  // A server-rendered visit arrives with this post embedded by api/blog-post.js, so it can
  // be shown right away; the fetch below still refreshes it.
  const [post, setPost] = useState<BlogPost | null | undefined>(() => {
    const embedded = initialBlogData()?.post as BlogPost | undefined;
    return embedded && embedded.slug === slug ? embedded : undefined;
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    supabase
      .from("blog_posts")
      .select("slug, title, content, description, keyword, tags, image_url, published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          // A failed refresh shouldn't replace a post that is already showing.
          setPost((current) => (current && current.slug === slug ? current : null));
          return;
        }
        setPost(data as BlogPost);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (post === undefined) {
    return (
      <div className="min-h-screen bg-[#050510] text-white flex items-center justify-center">
        <p className="text-slate-500">Loading article…</p>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-6">
          <h1 className="text-3xl font-bold text-white mb-4">Article not found</h1>
          <p className="text-slate-400 mb-8">This post may have been unpublished or moved.</p>
          <Link to="/blog" className="text-amber-400 hover:text-amber-300 underline">
            Back to the blog
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = `https://facemaxify.com/blog/${post.slug}`;
  const description =
    post.description || postBody(post.content).replace(/[#*`_>\-]/g, "").slice(0, 155).trim() + "…";
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description,
      image: post.image_url || "https://facemaxify.com/og-image.png",
      datePublished: post.published_at || undefined,
      author: { "@type": "Organization", name: "Facemaxify" },
      publisher: { "@type": "Organization", name: "Facemaxify" },
      mainEntityOfPage: canonicalUrl,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <SEO
        title={blogPostTitle(post.title)}
        description={description}
        keywords={post.keyword || undefined}
        canonicalUrl={canonicalUrl}
        image={post.image_url || undefined}
        type="article"
        schema={schema}
      />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.10),transparent_28%)]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="px-4 py-14 sm:px-6 lg:px-8">
          <article className="mx-auto max-w-3xl">
            <Link to="/blog" className="text-sm text-slate-500 hover:text-slate-300 mb-6 inline-block">
              ← Back to blog
            </Link>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl mb-6">
              {post.title}
            </h1>

            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="rounded-2xl border border-white/10 w-full mb-10"
              />
            )}

            <div className="prose-invert">
              <Markdown options={markdownOptions}>{postBody(post.content)}</Markdown>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
};

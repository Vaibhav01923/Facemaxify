import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { SEO } from "../components/SEO";
import { supabase } from "../services/supabase";

interface BlogPostSummary {
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  tags: string[] | null;
  published_at: string | null;
}

export const BlogListingPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("blog_posts")
      .select("slug, title, description, image_url, tags, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load blog posts:", error);
          setPosts([]);
          return;
        }
        setPosts(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <SEO
        title="Facemaxify Blog — Facial Analysis, Golden Ratio & Looksmaxxing Guides"
        description="Read the latest articles on facial analysis, golden ratio scoring, facial symmetry, and looksmaxxing from the Facemaxify team."
        keywords="facial analysis blog, looksmaxxing guides, golden ratio articles, facial aesthetics blog"
        canonicalUrl="https://facemaxify.com/blog"
      />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.10),transparent_28%)]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Facemaxify Blog
              </h1>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                Facial analysis, golden ratio, symmetry, and looksmaxxing — explained with real
                measurements instead of vague advice.
              </p>
            </div>

            {posts === null && (
              <div className="text-center text-slate-500 py-20">Loading articles…</div>
            )}

            {posts !== null && posts.length === 0 && (
              <div className="text-center text-slate-500 py-20">
                No articles published yet. Check back soon.
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts?.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-xl shadow-black/20 transition hover:border-white/20"
                >
                  {post.image_url && (
                    <div className="aspect-video overflow-hidden bg-slate-900">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    {post.tags && post.tags.length > 0 && (
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {post.tags[0]}
                      </span>
                    )}
                    <h2 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="text-sm text-slate-400 line-clamp-3">{post.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

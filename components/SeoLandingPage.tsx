import React from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { ArrowRight, BarChart3, Lock, ScanSearch, Sparkles } from "lucide-react";
import { SEO } from "./SEO";
import { Navbar } from "./Navbar";
import { SimpleSeoAnalyzer } from "./tools/SimpleSeoAnalyzer";
import {
  SeoLandingPageConfig,
  seoLandingPages,
} from "../data/seoLandingPages";

interface SeoLandingPageProps {
  page: SeoLandingPageConfig;
}

export const SeoLandingPage: React.FC<SeoLandingPageProps> = ({ page }) => {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const relatedPages = seoLandingPages.filter((entry) => entry.slug !== page.slug);

  const startFullAnalysis = () => {
    if (isSignedIn) {
      window.location.href = "/dashboard/facial-analysis";
      return;
    }

    localStorage.setItem("pendingAction", "dashboard");
    openSignIn();
  };

  const canonicalUrl = `https://facemaxify.com/${page.slug}`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.heroTitle,
      description: page.description,
      url: canonicalUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <>
      <SEO
        title={page.title}
        description={page.description}
        keywords={page.keywords}
        canonicalUrl={canonicalUrl}
        schema={schema}
      />

      <div className="min-h-screen bg-[#050510] text-white">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.10),transparent_28%)]" />
          <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <div className="relative z-10">
          <Navbar />

          <main className="px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-10">
              <section className="grid gap-8 rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/30 lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                    <Sparkles className="h-4 w-4" />
                    {page.heroEyebrow}
                  </div>
                  <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
                    {page.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                    {page.heroDescription}
                  </p>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <button
                      onClick={startFullAnalysis}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                      Run Full Harmony Analysis
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <a
                      href="/tools"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                    >
                      Explore Free Tools
                      <ScanSearch className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                <aside className="rounded-[28px] border border-amber-400/15 bg-gradient-to-br from-amber-300/10 via-slate-900 to-slate-950 p-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                    <Lock className="h-3.5 w-3.5" />
                    Main feature
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-white">
                    Keep the real edge in the core product
                  </h2>
                  <p className="mt-4 leading-7 text-slate-300">
                    These pages are built to rank for broad search terms. The
                    deeper Facemaxify experience stays inside the main analyzer,
                    where users unlock a proprietary 25+ ratio facial harmony
                    report with a score and stronger context.
                  </p>

                  <div className="mt-6 space-y-3 text-sm text-slate-200">
                    <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-3">
                      <BarChart3 className="mt-0.5 h-4 w-4 text-sky-300" />
                      <span>Broad search page outside, deeper scoring logic inside.</span>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-3">
                      <Sparkles className="mt-0.5 h-4 w-4 text-amber-300" />
                      <span>Every subpage funnels users into the full analysis instead of leaking the whole method.</span>
                    </div>
                  </div>
                </aside>
              </section>

              <SimpleSeoAnalyzer
                page={page}
                onOpenFullAnalysis={startFullAnalysis}
              />

              <section className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
                <div className="rounded-[28px] border border-white/8 bg-slate-950/70 p-8">
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">
                    Why this topic matters
                  </h2>
                  <div className="mt-6 space-y-5 text-slate-300">
                    {page.intro.map((paragraph) => (
                      <p key={paragraph} className="leading-8">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-sky-400/12 bg-sky-400/6 p-8">
                  <h2 className="text-2xl font-bold text-white">Key takeaways</h2>
                  <div className="mt-6 space-y-4">
                    {page.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="rounded-2xl border border-white/8 bg-slate-950/60 p-4 text-slate-200"
                      >
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/8 bg-slate-950/70 p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-3">
                  {page.sections.map((section) => (
                    <article key={section.title} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
                      <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                      <div className="mt-4 space-y-4 text-slate-300">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph} className="leading-7">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-emerald-400/15 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 p-8 lg:p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-black text-white sm:text-4xl">
                      Want the real result instead of the teaser?
                    </h2>
                    <p className="mt-3 text-lg leading-8 text-slate-100/90">
                      Use this page for the concept. Use the main analyzer for the
                      full proprietary facial harmony report, 25+ ratio coverage,
                      and the overall score that ties it together.
                    </p>
                  </div>
                  <button
                    onClick={startFullAnalysis}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
                  >
                    Open Main Analyzer
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[28px] border border-white/8 bg-slate-950/70 p-8">
                  <h2 className="text-3xl font-bold text-white">Frequently asked questions</h2>
                  <div className="mt-6 space-y-4">
                    {page.faqs.map((faq) => (
                      <details
                        key={faq.question}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
                      >
                        <summary className="cursor-pointer list-none text-lg font-semibold text-white">
                          {faq.question}
                        </summary>
                        <p className="mt-3 leading-7 text-slate-300">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/8 bg-slate-950/70 p-8">
                  <h2 className="text-3xl font-bold text-white">Related pages</h2>
                  <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                    Use these internal pages to build topic depth, cover more
                    generic searches, and keep routing visitors back into the
                    full Facemaxify analysis flow.
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {relatedPages.map((relatedPage) => (
                      <a
                        key={relatedPage.slug}
                        href={`/${relatedPage.slug}`}
                        className="group rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-sky-400/40 hover:bg-white/[0.05]"
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                          SEO cluster page
                        </div>
                        <h3 className="mt-3 text-xl font-bold text-white transition group-hover:text-sky-300">
                          {relatedPage.heroTitle}
                        </h3>
                        <p className="mt-2 line-clamp-3 leading-7 text-slate-300">
                          {relatedPage.description}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 font-semibold text-sky-300">
                          Read page
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 lg:p-8">
                <div className="mb-5 max-w-3xl">
                  <h2 className="text-3xl font-black text-white sm:text-4xl">
                    For detailed analysis like this
                  </h2>
                  <p className="mt-3 text-lg leading-8 text-slate-300">
                    Visit our main page for the full Facemaxify facial analysis:
                    <a
                      href="https://facemaxify.com/dashboard/facial-analysis"
                      className="ml-2 font-semibold text-sky-300 transition hover:text-sky-200"
                    >
                      https://facemaxify.com/dashboard/facial-analysis
                    </a>
                  </p>
                </div>

                <a
                  href="https://facemaxify.com/dashboard/facial-analysis"
                  className="group block overflow-hidden rounded-[28px] border border-white/8 bg-black/30"
                >
                  <img
                    src="/pagepromo.jpg"
                    alt="Facemaxify detailed facial analysis preview"
                    className="w-full object-cover transition duration-300 group-hover:scale-[1.01]"
                  />
                </a>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

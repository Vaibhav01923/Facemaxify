import React from "react";

// Markdown styling for the tool-page articles (content/tools/*.md). Used both by the
// build-time render and the in-browser fallback in ToolArticle.tsx, so the two produce
// the same markup.
export const articleMarkdownOptions = {
  disableParsingRawHTML: true,
  overrides: {
    h2: { props: { className: "text-2xl sm:text-3xl font-bold text-white mt-12 mb-5 tracking-tight" } },
    h3: { props: { className: "text-lg sm:text-xl font-bold text-white mt-8 mb-3" } },
    p: { props: { className: "text-slate-400 leading-relaxed mb-5" } },
    a: { props: { className: "text-indigo-400 hover:text-indigo-300 underline underline-offset-2" } },
    strong: { props: { className: "text-white font-semibold" } },
    ul: { props: { className: "list-disc pl-6 text-slate-400 mb-5 space-y-2" } },
    ol: { props: { className: "list-decimal pl-6 text-slate-400 mb-5 space-y-2" } },
    li: { props: { className: "leading-relaxed" } },
    table: {
      component: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
        <div className="overflow-x-auto mb-6">
          <table {...props} className="w-full text-sm text-left border-collapse">
            {children}
          </table>
        </div>
      ),
    },
    th: { props: { className: "border-b border-white/10 py-2 pr-4 text-white font-semibold" } },
    td: { props: { className: "border-b border-white/5 py-2 pr-4 text-slate-400 align-top" } },
    blockquote: { props: { className: "border-l-4 border-indigo-500/50 pl-4 text-slate-300 my-6" } },
  },
};

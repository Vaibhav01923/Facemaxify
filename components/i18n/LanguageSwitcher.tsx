import React from "react";
import { useLocation } from "react-router-dom";
import { languageSwitchLinks } from "../../i18n/registry";

// Links to the other language versions of the current page (or to that language's tools hub
// when the page has no translation). Every page's navbar carries it, so each language version
// is reachable by a plain link from every other page — which is also how crawlers find them.
export const LanguageSwitcher: React.FC<{ label?: string; className?: string }> = ({
  label = "Language",
  className = "",
}) => {
  const { pathname } = useLocation();
  // The signed-in app (it shares this navbar) is English-only.
  if (pathname.startsWith("/dashboard")) return null;
  const links = languageSwitchLinks(pathname).filter((link) => !link.current);

  return (
    <div role="group" aria-label={label} className={`flex items-center gap-0.5 text-xs font-medium text-slate-400 ${className}`}>
      {links.map((link) => (
        <a
          key={link.code}
          href={link.href}
          hrefLang={link.hreflang}
          lang={link.htmlLang}
          title={link.label}
          aria-label={link.label}
          className="px-2 py-3 hover:text-white transition-colors"
        >
          <span aria-hidden="true" className="sm:hidden">
            {link.code.toUpperCase()}
          </span>
          <span className="hidden sm:inline">{link.label}</span>
        </a>
      ))}
    </div>
  );
};

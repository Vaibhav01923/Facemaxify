import React, { useCallback, useMemo, useRef, useState } from "react";
import type { PhotoContext } from "../../tools/PhotoAnalyzerShell";
import { UI } from "../../../i18n/strings";
import type { Locale } from "../../../i18n/types";
import { formatNumber } from "../engines/common";
import { AnalysisPhoto } from "./AnalysisPhoto";
import type { Layer } from "./layers";
import { LayerSelectionContext, type LayerSelection } from "./selection";

interface Props {
  context: PhotoContext;
  locale: Locale;
  layers: Layer[];
  // The measurement shown first: omit for the first one, or pass null for all of them at once.
  defaultLayer?: string | null;
  // The result rows. Rows made with <LayerRow> select a measurement on the photo.
  children: React.ReactNode;
}

// The analysed photo, outlined and annotated, next to the rows of the results. Tap (or hover) a row
// and the matching measurement lights up on the face; the rest fade back.
export const AnnotatedResult: React.FC<Props> = ({ context, locale, layers, defaultLayer, children }) => {
  const ui = UI[locale].photo;
  const first = layers.find((layer) => !layer.decor)?.id ?? null;
  const initial = defaultLayer === undefined ? first : defaultLayer;
  const [selected, setSelected] = useState<string | null>(initial);
  const [hover, setHover] = useState<string | null>(null);
  const photoRef = useRef<HTMLDivElement>(null);

  const fmt = useCallback((value: number, digits = 1) => formatNumber(value, locale, digits), [locale]);

  const select = useCallback(
    (id: string) => {
      setSelected((current) => (current === id && initial !== id ? initial : id));
      // On a phone the photo is above the rows: bring it back into view if it has scrolled away.
      try {
        const box = photoRef.current?.getBoundingClientRect();
        if (box && window.matchMedia("(max-width: 767px)").matches && (box.top < 0 || box.bottom > window.innerHeight)) {
          const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          photoRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "nearest" });
        }
      } catch {
        // scrolling is a nicety
      }
    },
    [initial],
  );

  const selection = useMemo<LayerSelection>(
    () => ({
      colors: Object.fromEntries(layers.filter((layer) => !layer.decor).map((layer) => [layer.id, layer.color])),
      selected,
      select,
      preview: setHover,
    }),
    [layers, selected, select],
  );

  const hasPhoto = Boolean(context.image) && context.landmarks.length > 0;
  if (!hasPhoto) return <div className="space-y-5">{children}</div>;

  return (
    <LayerSelectionContext.Provider value={selection}>
      <div className="grid gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-start">
        <div ref={photoRef} className="bg-slate-900/60 border border-white/10 rounded-3xl p-3 sm:p-4 scroll-mt-4">
          <AnalysisPhoto
            image={context.image}
            landmarks={context.landmarks}
            layers={layers}
            activeId={hover ?? selected}
            alt={ui.alt}
            fmt={fmt}
          />
          <p className="mt-3 px-1 text-xs leading-relaxed text-slate-400">{ui.hint}</p>
        </div>
        <div className="space-y-5 min-w-0">{children}</div>
      </div>
    </LayerSelectionContext.Provider>
  );
};

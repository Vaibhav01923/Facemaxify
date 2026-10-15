import React, { createContext, useContext } from "react";

// Which measurement is selected on the annotated photo. The result rows read this to light up and
// to select themselves on tap (or preview on hover); AnnotatedResult provides it.
export interface LayerSelection {
  colors: Record<string, string>;
  selected: string | null;
  select: (id: string) => void;
  preview: (id: string | null) => void;
}

export const LayerSelectionContext = createContext<LayerSelection | null>(null);

// The coloured dot in front of a row's label: the colour of that measurement's lines on the photo.
export const LayerDot: React.FC<{ layer?: string }> = ({ layer }) => {
  const sel = useContext(LayerSelectionContext);
  const color = layer && sel ? sel.colors[layer] : undefined;
  if (!sel || !color) return null;
  const on = sel.selected === layer;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full transition-all ${on ? "h-2.5 w-2.5 ring-2 ring-white/40" : "h-2 w-2"}`}
      style={{ backgroundColor: color }}
    />
  );
};

interface RowProps {
  layer?: string;
  className?: string;
  children: React.ReactNode;
}

// A result row that is tied to a measurement on the photo. Without a photo (or without a layer
// for it) it is a plain block.
export const LayerRow: React.FC<RowProps> = ({ layer, className = "", children }) => {
  const sel = useContext(LayerSelectionContext);
  if (!sel || !layer || !sel.colors[layer]) return <div className={className}>{children}</div>;
  const on = sel.selected === layer;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={on}
      onClick={() => sel.select(layer)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          sel.select(layer);
        }
      }}
      onFocus={() => sel.preview(layer)}
      onBlur={() => sel.preview(null)}
      onPointerEnter={(event) => event.pointerType === "mouse" && sel.preview(layer)}
      onPointerLeave={(event) => event.pointerType === "mouse" && sel.preview(null)}
      className={`${className} cursor-pointer select-none rounded-xl text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400/70 ${
        on ? "bg-white/[0.08] ring-1 ring-white/20" : "hover:bg-white/[0.04]"
      }`}
    >
      {children}
    </div>
  );
};

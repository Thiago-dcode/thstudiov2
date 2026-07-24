"use client";

import { Fragment, type ReactNode } from "react";
import { type ValueItem, ValuesMarquee } from "./values-marquee";

// Renders a description string, styling any {word} segment with the accent color.
// e.g. "with the {intelligence} to grow" → "intelligence" rendered in text-accent.
function renderWithAccents(text: string): ReactNode {
  return text.split(/(\{[^}]+\})/g).map((part, i) => {
    const match = part.match(/^\{([^}]+)\}$/);
    if (!match) return <Fragment key={i}>{part}</Fragment>;
    return (
      <span key={i} className="text-text! font-semibold">
        {match[1]}
      </span>
    );
  });
}

export const ValueCarousel = ({ items }: { items: ValueItem[] }) => {
  return (
    <ValuesMarquee
      items={items}
      itemNode={(item, i) => (
        <div key={i} className="mr-12 flex w-72 shrink-0 flex-col gap-2">
          <h3 className="text-lg! font-medium!">{item.title}</h3>
          <p className="text-sm! text-text-muted">
            {renderWithAccents(item.description)}
          </p>
        </div>
      )}
    />
  );
};

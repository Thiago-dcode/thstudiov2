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

// Titles are styled text, not <h3>: the marquee repeats the whole set 2–3 times to loop, so as
// headings every value appeared several times in the page outline. The classes reproduce the
// global h3 look (brand font, tight leading) that the element used to get for free.
export const ValueCarousel = ({ items }: { items: ValueItem[] }) => {
  return (
    <ValuesMarquee
      items={items}
      itemNode={(item, i) => (
        <div key={i} className="mr-12 flex w-72 shrink-0 flex-col gap-2">
          <p className="font-serif! text-lg! font-medium! leading-tight! tracking-[-0.015em]">
            {item.title}
          </p>
          <p className="text-sm! text-text-muted">
            {renderWithAccents(item.description)}
          </p>
        </div>
      )}
    />
  );
};

"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export type ValueItem = { title: string; description: string };

const SPEED = 30; // pixels per second — keeps motion constant at any width

export const ValuesMarquee = ({
  items,
  itemNode = (item, i) => (
    <div key={i} className="mr-12 flex w-72 shrink-0 flex-col gap-2">
      <h3 className="text-lg! font-medium!">{item.title}</h3>
      <p className="text-sm! text-text-muted">{item.description}</p>
    </div>
  ),
}: {
  items: ValueItem[];
  itemNode?: (item: ValueItem, i: number) => ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const set = setRef.current;
      if (!container || !set) return;
      const sw = set.scrollWidth;
      const cw = container.clientWidth;
      if (!sw) return;
      setSetWidth(sw);
      // Enough copies to always cover the viewport plus one extra set,
      // so there's never empty space before the loop wraps.
      setCopies(Math.max(2, Math.ceil(cw / sw) + 1));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items]);

  if (!items.length) return null;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-(--breakpoint-ultrawide) overflow-hidden"
    >
      {/* soft fade on both edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent" />

      <div
        className="flex w-max animate-values-marquee"
        style={
          {
            "--marquee-shift": `-${setWidth}px`,
            animationDuration: setWidth ? `${setWidth / SPEED}s` : "0s",
          } as React.CSSProperties
        }
      >
        {Array.from({ length: copies }).map((_, c) => (
          <div
            key={c}
            ref={c === 0 ? setRef : undefined}
            className="flex shrink-0"
            aria-hidden={c > 0}
          >
            {items.map(itemNode)}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes values-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(var(--marquee-shift), 0, 0); }
        }
        .animate-values-marquee {
          animation-name: values-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-values-marquee { animation: none; }
        }
      `}</style>
    </div>
  );
};

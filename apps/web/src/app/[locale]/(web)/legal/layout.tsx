import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full flex justify-center px-5 tablet:px-10 py-20 tablet:py-28">
      {/* Wide enough for the editorial opening; the sections keep a narrow reading column. */}
      <article className="max-w-6xl w-full space-y-14 tablet:space-y-16">
        {children}
      </article>
    </div>
  );
}

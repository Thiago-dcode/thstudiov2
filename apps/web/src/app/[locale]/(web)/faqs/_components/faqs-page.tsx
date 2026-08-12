"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { cn } from "@repo/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { type FaqItem, faqAnswerClassName } from "@/lib/components/faqs";

// Keeps anchored sections clear of the sticky web header when navigated to.
const SCROLL_OFFSET = 112;

export function FaqsPage() {
  const t = useTranslations("faqs");
  const items = t.raw("items") as FaqItem[];

  const [openId, setOpenId] = useState<string>("");
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  // Open + highlight the item referenced by the URL hash — supports deep links
  // and the in-answer anchor links (e.g. "#why-ai").
  useEffect(() => {
    const syncFromHash = () => {
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      if (id && items.some((item) => item.id === id)) {
        setOpenId(id);
        setActiveId(id);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [items]);

  // Scroll-spy: highlight the aside link for whichever section is in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -55% 0px`, threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  const handleNavClick = useCallback((id: string) => {
    setOpenId(id);
    setActiveId(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-(--screen-desktop) px-6 py-16 tablet:px-10 tablet:py-24">
      <header className="max-w-2xl space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
          {t("page.hero.label")}
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-text tablet:text-4xl">
          {t("page.hero.title")}
        </h1>
        <p className="text-sm leading-relaxed text-text-muted">
          {t("page.hero.lead")}
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-10 desktop:grid-cols-[240px_1fr] desktop:gap-16">
        <aside className="hidden desktop:block">
          <nav className="sticky top-28 flex flex-col gap-0.5">
            <span className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
              {t("page.navLabel")}
            </span>
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "border-l-2 py-1.5 pl-3 text-sm leading-snug transition-colors",
                  activeId === item.id
                    ? "border-text font-medium text-text"
                    : "border-transparent text-text-muted hover:text-text",
                )}
              >
                {item.question}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <Accordion
            type="single"
            collapsible
            value={openId}
            onValueChange={setOpenId}
            className="w-full"
          >
            {items.map((faq) => (
              <AccordionItem
                key={faq.id}
                id={faq.id}
                value={faq.id}
                className="scroll-mt-28"
              >
                <AccordionTrigger className="py-4 text-left text-base! font-medium tablet:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className={faqAnswerClassName}>
                  {/* biome-ignore lint/security/noDangerouslySetInnerHtml: answers are trusted, authored in our own translation files */}
                  <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 border-t border-border pt-6 text-base tablet:text-lg">
            <span>
              {t.rich("stillHaveQuestions", {
                link: (children) => (
                  <Link
                    href="/support"
                    className="underline underline-offset-4"
                  >
                    {children}
                  </Link>
                ),
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

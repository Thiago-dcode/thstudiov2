import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function FaqsContent() {
  const t = useTranslations("faqs");
  const items = t.raw("items") as { question: string; answer: string }[];

  return (
    <div className="flex flex-col gap-14">
      <h2 className="font-serif text-2xl font-light italic leading-none tracking-tight tablet:text-3xl desktop:text-5xl">
        {t("title")}
      </h2>

      <div className="flex flex-col">
        <Accordion type="single" collapsible className="w-full">
          {items.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-base font-medium tablet:text-xl">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="w-full text-base leading-[1.3] text-text-muted">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="border-t border-border pt-6 text-base tablet:pt-8 tablet:text-lg">
          <span>
            {t.rich("stillHaveQuestions", {
              link: (children) => (
                <Link href="/support" className="underline underline-offset-4">
                  {children}
                </Link>
              ),
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FaqsSection() {
  return (
    <section className="relative mx-auto w-full max-w-(--screen-desktop) px-6 py-20 tablet:px-10 tablet:py-28">
      <FaqsContent />
    </section>
  );
}

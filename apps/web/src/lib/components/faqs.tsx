import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import Link from "next/link";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "What is A11STUDIO?",
    answer:
      "A11STUDIO is a portfolio platform built for visual artists that sits right between a professional website and the ease of social media. You get a polished, custom-looking site — but updating it is as simple as posting a story. No code, no web design skills, just drag, drop, and publish.",
  },
  {
    question: "What is a portfolio?",
    answer:
      "A portfolio is your highlight reel — a curated showcase of your absolute best work within a discipline or style. For example, a \"Wedding Photography\" portfolio would feature the strongest shots across all the weddings you've ever shot. It's what clients see to judge your skill and hire you.",
  },
  {
    question: "What is a collection?",
    answer:
      "A collection is a specific project or event grouped together. For example, \"Mary & John Wedding 2024\" would be a collection containing all the delivered photos from that particular shoot. It's how you organize individual jobs, sessions, or bodies of work.",
  },
  {
    question: "What is the difference between a portfolio and a collection?",
    answer:
      "A portfolio is your best-of — a showcase that spans multiple projects to demonstrate your expertise in a discipline (e.g. \"Wedding Photography\"). A collection is a single project or event (e.g. \"Mary & John Wedding 2024\"). Think of portfolios as what gets you hired and collections as how you organize each job.",
  },
  {
    question: "Why does A11STUDIO use AI?",
    answer:
      "So you can focus on what you do best — creating art. AI handles everything else behind the scenes: it generates SEO-optimized titles, descriptions, and tags for your work, categorizes your media automatically, and writes alt text so search engines and AI assistants can find you. You never need to learn about SEO or marketing — just upload your best pieces and AI makes sure the right audience discovers them.",
  },
  {
    question: "Can I use A11STUDIO for free?",
    answer:
      "Yes! A11STUDIO offers a free tier that lets you create your profile, build portfolios, and start showcasing your work right away. Premium plans unlock additional features like AI-powered tools, more storage, and advanced customization options.",
  },
];

export function FaqsContent() {
  return (
    <div className="flex flex-col gap-14">
      <h2 className="font-serif text-2xl font-light italic leading-none tracking-tight tablet:text-3xl desktop:text-5xl">
        Frequently asked questions
      </h2>

      <div className="flex flex-col">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-base font-medium tablet:text-xl">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-[1.3] text-text-muted tablet:w-3/4 desktop:w-1/2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="border-t border-border pt-6 text-base tablet:pt-8 tablet:text-lg">
          <span>
            Still have questions? We&apos;re here to&nbsp;
            <Link href="/support" className="underline underline-offset-4">
              help
            </Link>
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

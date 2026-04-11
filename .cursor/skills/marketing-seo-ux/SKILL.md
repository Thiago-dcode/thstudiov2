---
name: marketing-seo-ux
description: Guidelines for marketing positioning, SEO optimization, and UI/UX best practices. Use when building landing pages, optimizing for search engines (including AI search), improving user experience, or designing for better conversions.
---

# Marketing, SEO, and UI/UX Best Practices

## Core Philosophy
In 2026, SEO and UX are inseparable. Optimizing for the user is the most effective way to optimize for search engines and AI models. Focus on **perceived performance**, **cognitive ease**, and **task completion**.

## Marketing & Positioning
- **Value Proposition**: Clearly state what problem you solve and for whom within the first 3 seconds (above the fold).
- **Trust Signals**: Use consistent typography, adequate spacing, and high-quality visuals.
- **Social Proof**: Strategically place testimonials, case studies, and partner logos.
- **Call to Action (CTA)**: Use high-contrast, action-oriented buttons (e.g., "Start Free Trial" instead of "Submit").

## SEO & AI Search Optimization
- **Semantic HTML**: Use a single `<h1>` per page. Maintain a logical heading hierarchy (`<h2>` to `<h6>`).
- **Metadata**: Implement robust meta tags (title, description, Open Graph) using modern frameworks (e.g., Next.js Metadata API).
- **AI Crawlability**: Use structured data (Schema.org) to help AI search engines (Google AI Overview, ChatGPT, Perplexity) understand your content.
- **Content Clusters**: Organize content into topic clusters with pillar pages and supporting articles.
- **Performance**: Prioritize Core Web Vitals, specifically LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift).

## UI/UX Best Practices
- **Typography**: 16px–18px base font size, 1.5–1.75 line height for readability.
- **Accessibility (a11y)**: Maintain high color contrast (WCAG AA/AAA). Ensure all interactive elements have labels and keyboard support.
- **Mobile First**: Design for touch interactions first. Ensure buttons are at least 44x44px.
- **Friction Reduction**: Minimize form fields. Avoid intrusive interstitials or layouts that shift unexpectedly (CLS).
- **Behavioral Signals**: Minimize "pogo-sticking" (users leaving immediately) by providing immediate value and clear navigation.

## Implementation Checklist
- [ ] Single `<h1>` with primary keyword.
- [ ] Schema markup implemented for key entities.
- [ ] Open Graph and Twitter cards configured.
- [ ] Contrast ratios checked for accessibility.
- [ ] All images have descriptive `alt` text.
- [ ] Mobile responsive layout verified.
- [ ] Fast perceived loading (skeleton screens, optimized images).

## Examples
- **Good H1**: "Streamline Your Team's Workflow with AI-Powered Task Management"
- **Bad H1**: "Welcome to TaskMaster Pro" (Vague, no keywords)
- **Good CTA**: "Get Started for Free — No Credit Card Required"
- **Bad CTA**: "Click Here"

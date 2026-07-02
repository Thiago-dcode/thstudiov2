export const HERO_SECTION_ID = "home-hero-section";
export const HERO_SECTION_HREF = `/#${HERO_SECTION_ID}`;

export function scrollToHeroSection() {
  document
    .getElementById(HERO_SECTION_ID)
    ?.scrollIntoView({ behavior: "smooth" });
}

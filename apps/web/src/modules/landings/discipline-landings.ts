/**
 * The "for {discipline}" landing pages (`/for/photographers`, …): one page per discipline aimed at
 * creatives searching for a portfolio tool ("portafolio para fotógrafos", "free photography portfolio
 * website"). Adding a discipline is an entry here plus its copy under `forDiscipline.{key}` in every
 * message file; the route, sitemap and footer pick it up from this list.
 *
 * `categorySlug` is the top-level category whose sub-categories are the discipline's specialties and
 * whose portfolios are shown as live examples.
 */
export const DISCIPLINE_LANDINGS = {
  photographers: { categorySlug: "photography" },
} as const;

export type DisciplineLandingKey = keyof typeof DISCIPLINE_LANDINGS;

export const DISCIPLINE_LANDING_KEYS = Object.keys(
  DISCIPLINE_LANDINGS,
) as DisciplineLandingKey[];

export const isDisciplineLandingKey = (
  value: string,
): value is DisciplineLandingKey => Object.hasOwn(DISCIPLINE_LANDINGS, value);

/** Locale-agnostic path of a discipline landing, e.g. `/for/photographers`. */
export const disciplineLandingPath = (key: DisciplineLandingKey) =>
  `/for/${key}`;

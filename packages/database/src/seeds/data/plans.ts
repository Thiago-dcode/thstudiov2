import { EnumType } from '@repo/common-lib/constants/enums';
import { PlanIdentifier } from '@repo/common-lib/constants/plan';
import { CreatePlanInput, CreatePlanTranslationInput } from '@repo/common-lib/schemas/plan';

/**
 * The subscription plans, as the plans seed writes them. Pure data: no DB or Stripe imports, and
 * no `main`, so `db:seed -n` never loads this as a seed.
 *
 * The literal amounts in `prices` are the source of truth (the total billed per period). Nothing
 * derives them; a test asserts that YEARLY is `PAID_YEARLY_MONTHS_CHARGED` monthly payments.
 */

/**
 * Yearly billing charges 10 months and gives 12 ("2 months free"), so the yearly amounts are
 * round numbers. Only the data test reads this.
 */
export const PAID_YEARLY_MONTHS_CHARGED = 10;

export type PlanPriceDefinition = {
  billing_type: EnumType<'BILLING_TYPE'>;
  price: number;
};

export type PlanDefinition = Omit<
  CreatePlanInput,
  'stripe_id' | 'paypal_id' | 'unique_identifier'
> & {
  unique_identifier: PlanIdentifier;
  /** The row's name before the rename, so the seed updates it in place instead of inserting. */
  legacy_name: string;
  prices: PlanPriceDefinition[];
  translations: Omit<CreatePlanTranslationInput, 'plan_id'>[];
};

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    unique_identifier: 'free',
    legacy_name: 'Beginner',
    name: 'Artist',
    short_description: 'Your art deserves its own space.',
    description:
      'Create a beautiful professional portfolio, organize your artwork, and share it with the world. All the essentials to get started, completely free.',
    logo: '/plans/beginner',
    base_price: 0,
    is_active: true,
    is_popular: false,
    is_free: true,
    top_tier: false,
    storage_limit_mb: 10 * 1024, // 10 GB
    max_portfolios: 3,
    max_services: 3,
    max_collections: 3,
    // Projects and clients are not product features: -1 means no cap anywhere.
    max_projects: -1,
    max_clients: -1,
    // AI credits: 1 credit = 1 successful AI request (failed ones are free).
    // The allowance resets every month; it does not carry over.
    // Actual usage is tracked in llm_tokens_usage.
    ai_credits: 20,
    limit_write_storage_per_day: 50,
    allow_media_compression: false,
    prices: [{ billing_type: 'LIFETIME', price: 0 }],
    translations: [
      {
        language_code: 'EN',
        name: 'Artist',
        short_description: 'Your art deserves its own space.',
        description:
          'Create a beautiful professional portfolio, organize your artwork, and share it with the world. All the essentials to get started, completely free.',
      },
      {
        language_code: 'ES',
        name: 'Artista',
        short_description: 'Tu arte merece su propio espacio.',
        description:
          'Crea un portafolio profesional y atractivo, organiza tus obras y compártelas con el mundo. Todo lo esencial para empezar, totalmente gratis.',
      },
      {
        language_code: 'PT',
        name: 'Artista',
        short_description: 'Sua arte merece um espaço só dela.',
        description:
          'Crie um portfólio profissional e bonito, organize suas obras e compartilhe com o mundo. Tudo o que é essencial para começar, totalmente grátis.',
      },
    ],
  },
  {
    unique_identifier: 'plus',
    legacy_name: 'Freelancer',
    name: 'Artist Plus',
    short_description: 'More room for your creativity.',
    description:
      'Give your work room to grow. Create more portfolios, showcase more artwork, and enjoy additional tools that make managing your creative space effortless.',
    logo: '/plans/freelancer',
    base_price: 6,
    is_active: true,
    is_popular: true,
    is_free: false,
    top_tier: false,
    storage_limit_mb: 100 * 1024, // 100 GB
    max_portfolios: 5,
    max_services: 5,
    max_collections: 10,
    max_projects: -1,
    max_clients: -1,
    ai_credits: 200,
    limit_write_storage_per_day: 150,
    allow_media_compression: true,
    prices: [
      { billing_type: 'MONTHLY', price: 6 },
      { billing_type: 'YEARLY', price: 60 },
    ],
    translations: [
      {
        language_code: 'EN',
        name: 'Artist Plus',
        short_description: 'More room for your creativity.',
        description:
          'Give your work room to grow. Create more portfolios, showcase more artwork, and enjoy additional tools that make managing your creative space effortless.',
      },
      {
        language_code: 'ES',
        name: 'Artista Plus',
        short_description: 'Más espacio para tu creatividad.',
        description:
          'Dale a tu trabajo espacio para crecer. Crea más portafolios, muestra más obras y disfruta de herramientas adicionales que hacen que gestionar tu espacio creativo sea muy sencillo.',
      },
      {
        language_code: 'PT',
        name: 'Artista Plus',
        short_description: 'Mais espaço para a sua criatividade.',
        description:
          'Dê espaço para o seu trabalho crescer. Crie mais portfólios, mostre mais obras e aproveite ferramentas extras que deixam a gestão do seu espaço criativo muito mais simples.',
      },
    ],
  },
  {
    unique_identifier: 'pro',
    legacy_name: 'Studio',
    name: 'Studio',
    short_description: 'Everything your creative world needs.',
    description:
      'A complete workspace for artists with bigger projects and growing collections. More space, more flexibility, and powerful tools to support your creative journey.',
    logo: '/plans/professional',
    base_price: 9,
    is_active: true,
    is_popular: false,
    is_free: false,
    top_tier: true,
    storage_limit_mb: 250 * 1024, // 250 GB
    max_portfolios: -1,
    max_services: -1,
    max_collections: -1,
    max_projects: -1,
    max_clients: -1,
    ai_credits: 400,
    limit_write_storage_per_day: 300,
    allow_media_compression: true,
    prices: [
      { billing_type: 'MONTHLY', price: 9 },
      { billing_type: 'YEARLY', price: 90 },
    ],
    translations: [
      {
        language_code: 'EN',
        name: 'Studio',
        short_description: 'Everything your creative world needs.',
        description:
          'A complete workspace for artists with bigger projects and growing collections. More space, more flexibility, and powerful tools to support your creative journey.',
      },
      {
        language_code: 'ES',
        name: 'Estudio',
        short_description: 'Todo lo que tu mundo creativo necesita.',
        description:
          'Un espacio de trabajo completo para artistas con proyectos más grandes y colecciones en crecimiento. Más espacio, más flexibilidad y herramientas potentes para acompañar tu trayectoria creativa.',
      },
      {
        language_code: 'PT',
        name: 'Estúdio',
        short_description: 'Tudo o que o seu mundo criativo precisa.',
        description:
          'Um espaço de trabalho completo para artistas com projetos maiores e coleções em crescimento. Mais espaço, mais flexibilidade e ferramentas poderosas para apoiar a sua jornada criativa.',
      },
    ],
  },
];

export type StripeRecurring = { interval: 'month' } | { interval: 'year' };

/** The Stripe billing interval of a purchasable price. Anything else is never sold through Stripe. */
export function stripeRecurringFor(billingType: EnumType<'BILLING_TYPE'>): StripeRecurring {
  switch (billingType) {
    case 'MONTHLY':
      return { interval: 'month' };
    case 'YEARLY':
      return { interval: 'year' };
    default:
      throw new Error(`No Stripe recurring interval for billing type ${billingType}`);
  }
}

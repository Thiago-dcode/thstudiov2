import { Query } from '../lib/facades';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { LogService } from '@repo/backend-lib/services/log-service';
import { CreatePlanWithDetailsInput } from '@repo/common-lib/schemas/plan';

/**
 * ============================================================================
 * LLM PROVIDER COST DOCUMENTATION
 * ============================================================================
 * 
 * This seed file defines AI credits (requests) for each plan tier.
 * 
 * CREDIT SYSTEM:
 * - AI credits represent monthly request allowances (1 credit = 1 successful request)
 * - Credits RESET MONTHLY for all users (per plan tier)
 * - Users get their plan's credit amount EVERY MONTH (recurring)
 * - Each successful AI request consumes exactly 1 credit (regardless of token count)
 * - Only successful responses (matches_expected_response = true) consume credits
 * - Consumption is calculated by counting requests since `last_ai_credits_reset`
 * 
 * MONTHLY ALLOWANCES (resets every month):
 * - Beginner (Free): 20 requests/month
 * - Freelancer ($9/month): 200 requests/month
 * - Studio ($14/month): 400 requests/month
 * 
 * GPT-5-NANO PRICING:
 * - Input tokens: $0.05 per 1M tokens
 * - Cached tokens: $0.005 per 1M tokens
 * - Output tokens: $0.40 per 1M tokens
 * - Average tokens per request: 3200-3700 tokens (varies by image size/complexity)
 * - Cost per request: ~$0.00016-0.00029 (mostly input tokens with small JSON output)
 * 
 * MONTHLY COST ESTIMATES (assuming 100% usage of monthly allowance):
 * - Beginner (20 requests/month): ~$0.003-0.006/month
 * - Freelancer (200 requests/month): ~$0.03-0.06/month
 * - Studio (400 requests/month): ~$0.06-0.12/month
 * 
 * RESET MECHANISM:
 * - `next_ai_credits_reset`: Date when credits should be reset (set to 1 month from user creation)
 * - `last_ai_credits_reset`: Date of the last reset (used to calculate consumption since last reset)
 * - A scheduled job/cron should check `next_ai_credits_reset` and reset credits monthly:
 *   1. Set `ai_credits_consumed = 0`
 *   2. Update `last_ai_credits_reset = NOW()`
 *   3. Update `next_ai_credits_reset = NOW() + 1 month`
 *   4. Optionally: Add plan's `ai_credits` to user's `ai_credits` if carrying over unused credits
 * 
 * NOTE: Actual costs depend on:
 * - Which OpenAI model is configured (check OPENAI_MODEL in .env)
 * - Actual token usage per request (varies by image size and prompt complexity)
 * - User adoption rate (not all users will use 100% of their monthly credits)
 * - Failed requests don't consume credits (only matches_expected_response = true)
 * 
 * COST MITIGATION:
 * - Free tier is limited to prevent abuse
 * - Monthly reset prevents unlimited accumulation
 * - Only successful responses count toward consumption
 * - Request-based system simplifies tracking (no need to sum tokens)
 * - Monitor actual usage in llm_tokens_usage table to adjust if needed
 * 
 * ============================================================================
 */
export const main = async () => {

  const plans: CreatePlanWithDetailsInput[] = [
    {
      name: 'Beginner',
      short_description: 'Essential tools to start your creative journey',
      description:
        'Start your creative journey with our free plan. Perfect for artists taking their first steps into professional portfolio management with essential tools to showcase your work and connect with clients.',
      logo: '/plans/beginner',
      stripe_id: null,
      base_price: 0,
      is_active: true,
      is_popular: false,
      is_free: true,
      max_media_size: 1024, // 1GB storage in MB (~$0.023/month)
      max_projects: 8,
      max_portfolios: 2,
      max_clients: 4,
      max_services: 2,
      allow_media_compression: false,
      // AI Credits: 20 requests/month (1 credit = 1 successful request)
      // Usage: 20 successful AI requests per month
      // Monthly Cost (if 100% used): ~$0.003-0.006 (GPT-5-nano, 3200-3700 tokens/request)
      // Strategy: Limited to prevent abuse on free tier while allowing basic testing
      ai_credits: 20,
      limit_write_storage_per_day: 50, // 50 write operations per day
      prices: [
        {
          price: 0,
          billing_type: 'MONTHLY',
          plan_id: 0,
          stripe_id: null,
        },
        {
          price: 0,
          billing_type: 'QUARTERLY',
          plan_id: 0,
          stripe_id: null,
        },
        {
          price: 0,
          billing_type: 'YEARLY',
          plan_id: 0,
          stripe_id: null,
        },
        {
          price: 0,
          billing_type: 'LIFETIME',
          plan_id: 0,
          stripe_id: null,
        },
      ],
      translations: [
        {
          name: 'Beginner',
          short_description: 'Essential tools to start your creative journey',
          description: 'Start your creative journey with our free plan. Perfect for artists taking their first steps into professional portfolio management with essential tools to showcase your work and connect with clients.',
          language_code: 'EN',
          plan_id: 0,
        },
        {
          name: 'Iniciante',
          short_description: 'Herramientas esenciales para comenzar tu viaje creativo',
          description: 'Comienza tu viaje creativo con nuestro plan gratuito. Perfecto para artistas que dan sus primeros pasos en la gestión profesional de portafolios con herramientas esenciales para mostrar tu trabajo y conectar con clientes.',
          language_code: 'ES',
          plan_id: 0,
        },
        {
          name: 'Iniciante',
          short_description: 'Ferramentas essenciais para começar sua jornada criativa',
          description: 'Inicie sua jornada criativa com nosso plano gratuito. Perfeito para artistas dando seus primeiros passos no gerenciamento profissional de portfólio com ferramentas essenciais para mostrar seu trabalho e conectar com clientes.',
          language_code: 'PT',
          plan_id: 0,
        },
      ],
    },
    {
      name: 'Freelancer',
      short_description: 'Professional tools to scale your freelance business',
      description: 'Elevate your freelance business with professional-grade tools. Manage more clients, showcase extensive portfolios, and optimize your media with compression. Built for independent artists ready to scale their practice.',
      logo: '/plans/freelancer',
      stripe_id: null,
      base_price: 9,
      is_active: true,
      is_free: false,
      is_popular: true,
      max_media_size: 20240, // 10GB storage in MB (~$0.23/month)
      max_projects: 20,
      max_portfolios: 5,
      max_clients: 10,
      max_services: 5,
      allow_media_compression: true,
      // AI Credits: 200 requests/month (1 credit = 1 successful request)
      // Usage: 200 successful AI requests per month
      // Monthly Cost (if 100% used): ~$0.03-0.06 (GPT-5-nano, 3200-3700 tokens/request)
      // Strategy: Good value for $9/month plan - allows regular professional usage
      // Cost ratio: ~0.03-0.07% of plan price (very sustainable)
      ai_credits: 200,
      limit_write_storage_per_day: 150,
      prices: [
        {
          price: 9,
          billing_type: 'MONTHLY',
          plan_id: 0,
          stripe_id: null,
        },
        {
          price: 22,
          billing_type: 'QUARTERLY',
          plan_id: 0,
          stripe_id: null,
        },
        {
          price: 89,
          billing_type: 'YEARLY',
          plan_id: 0,
          stripe_id: null,
        },
      ],
      translations: [
        {
          name: 'Freelancer',
          short_description: 'Professional tools to scale your freelance business',
          description: 'Elevate your freelance business with professional-grade tools. Manage more clients, showcase extensive portfolios, and optimize your media with compression. Built for independent artists ready to scale their practice.',
          language_code: 'EN',
          plan_id: 0,
        },
        {
          name: 'Freelancer',
          short_description: 'Herramientas profesionales para escalar tu negocio freelance',
          description: 'Eleva tu negocio freelance con herramientas de nivel profesional. Gestiona más clientes, muestra portafolios extensos y optimiza tus medios con compresión. Construido para artistas independientes listos para escalar su práctica.',
          language_code: 'ES',
          plan_id: 0,
        },
        {
          name: 'Freelancer',
          short_description: 'Ferramentas profissionais para escalar seu negócio freelance',
          description: 'Eleve seu negócio freelance com ferramentas de nível profissional. Gerencie mais clientes, mostre portfólios extensos e otimize suas mídias com compressão. Construído para artistas independentes prontos para escalar sua prática.',
          language_code: 'PT',
          plan_id: 0,
        },
      ],
    },
    {
      name: 'Studio',
      short_description: 'Ultimate solution with AI-powered features',
      description: 'The ultimate solution for established artists and creative agencies. Unlock AI-powered features, massive storage, unlimited growth potential, and enterprise-grade tools to manage your creative empire at scale.',
      logo: '/plans/professional',
      stripe_id: null,
      base_price: 14,
      is_active: true,
      is_free: false,
      is_popular: false,
      max_media_size: 51200, // 50GB storage in MB (~$1.15/month)
      max_projects: -1,
      max_portfolios: -1,
      max_clients: -1,
      max_services: -1,
      allow_media_compression: true,
      // AI Credits: 400 requests/month (1 credit = 1 successful request)
      // Usage: 400 successful AI requests per month
      // Monthly Cost (if 100% used): ~$0.06-0.12 (GPT-5-nano, 3200-3700 tokens/request)
      // Strategy: Premium value for $14/month plan - allows heavy professional/agency usage
      // Cost ratio: ~0.04-0.09% of plan price (very sustainable)
      ai_credits: 400,
      limit_write_storage_per_day: 300,
      prices: [
        {
          price: 14,
          billing_type: 'MONTHLY',
          plan_id: 0,
          stripe_id: null,
        },
        {
          price: 34,
          billing_type: 'QUARTERLY',
          plan_id: 0,
          stripe_id: null,
        },
        {
          price: 119,
          billing_type: 'YEARLY',
          plan_id: 0,
          stripe_id: null,
        },
      ],

      translations: [
        {
          name: 'Studio',
          short_description: 'Ultimate solution with AI-powered features and unlimited growth',
          description: 'The ultimate solution for established artists and creative agencies. Unlock AI-powered features, massive storage, unlimited growth potential, and enterprise-grade tools to manage your creative empire at scale.',
          language_code: 'EN',
          plan_id: 0,
        },
        {
          name: 'Estudio',
          short_description: 'Solución definitiva con IA y crecimiento ilimitado',
          description: 'La solución definitiva para artistas establecidos y agencias creativas. Desbloquea características impulsadas por IA, almacenamiento masivo, potencial de crecimiento ilimitado y herramientas de nivel empresarial para gestionar tu imperio creativo a escala.',
          language_code: 'ES',
          plan_id: 0,
        },
        {
          name: 'Estúdio',
          short_description: 'Solução definitiva com IA e crescimento ilimitado',
          description: 'A solução definitiva para artistas estabelecidos e agências criativas. Desbloqueie recursos alimentados por IA, armazenamento massivo, potencial de crescimento ilimitado e ferramentas de nível empresarial para gerenciar seu império criativo em escala.',
          language_code: 'PT',
          plan_id: 0,
        },
      ],
    },
  ];
  await Query.table('plan_translations').delete();
  await Query.table('plans').delete();
  for (const _plan of plans) {
    const { translations, prices, ...plan } = _plan;

    const stripeProduct = await stripe.products.create({
      active: true,
      name: plan.name,
      description: plan.description,
    });
    plan.stripe_id = stripeProduct.id;

    // Insert plan with all data
    const { id } = await Query.table('plans').insertAndGet(
      Object.keys(plan),
      Object.values(plan),
      ['id'],
    );

    for (const price of prices) {
      price.plan_id = id;

      // Calculate price based on billing type
      switch (price.billing_type) {
        case 'MONTHLY':
          price.price = _plan.base_price;
          break;
        case "QUARTERLY":
          price.price = Math.round(_plan.base_price * 2.5 * 0.9);
          break;
        case "YEARLY":
          price.price = Math.round(_plan.base_price * 10 * 0.8);
          break;
        case "LIFETIME":
          price.price = Math.round(_plan.base_price * 12 * 0.6);
          break;
      }

      if (!plan.is_free) {

        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          currency: 'eur',
          unit_amount: price.price * 100,
          recurring: price.billing_type !== 'LIFETIME' ? {
            interval: 'month',
            interval_count: price.billing_type === 'MONTHLY' ? 1 :
              price.billing_type === 'QUARTERLY' ? 3 : 12
          } : undefined,
        });
        price.stripe_id = stripePrice.id;

      }


      // Insert plan price with all data
      await Query.table('plan_prices').insert(
        Object.keys(price),
        Object.values(price),
      );
    }
    for (const translation of translations) {
      translation.plan_id = id;
      await Query.table('plan_translations').insert(
        Object.keys(translation),
        Object.values(translation),
      );
    }
  }

  await LogService.flush();
};

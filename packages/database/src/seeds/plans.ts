import { CreatePlanWithDetailsInput } from 'lib/constants/types/plans';
import { Query } from 'lib/facades';

export const main = async () => {
  const plans: CreatePlanWithDetailsInput[] = [
    {
      name: 'Beginner',
      description:
        'Free plan, ideal for artists that are starting out on the business',
      logo: '/plans/beginner',
      base_price: 0,
      is_active: true,
      is_free: true,
      max_media_size: 1000, // 1GB storage (~$0.023/month)
      max_projects_count: 10,
      max_clients_count: 10,
      max_services_count: 4,
      powered_by_ai: false,
      limit_storage_requests_per_day: 500, // 500 write operations per day
      prices: [
        {
          price: 0,
          billing_type: 'MONTHLY',
          plan_id: 0,
        },
        {
          price: 0,
          billing_type: 'TRIMESTAL',
          plan_id: 0,
        },
        {
          price: 0,
          billing_type: 'YEARLY',
          plan_id: 0,
        },
        {
          price: 0,
          billing_type: 'LIFETIME',
          plan_id: 0,
        },
      ],
      translations: [
        {
          name: 'Beginner',
          description: 'Free plan, included when creating the account',
          language_code: 'EN',
          plan_id: 0,
        },
        {
          name: 'Iniciante',
          description: 'Plan gratuito, ya incluído  al crear la cuenta',
          language_code: 'ES',
          plan_id: 0,
        },
        {
          name: 'Iniciante',
          description: 'Plano gratuito, incluído ao criar a conta',
          language_code: 'PT',
          plan_id: 0,
        },
      ],
    },
    {
      name: 'Freelancer',
      description: 'Pro plan, ideal for freelancers and independent artists',
      logo: '/plans/freelancer',
      base_price: 9,
      is_active: true,
      is_free: false,
      max_media_size: 10000, // 10GB storage (~$0.23/month)
      max_projects_count: 25,
      max_clients_count: 25,
      max_services_count: 15,
      powered_by_ai: false,
      limit_storage_requests_per_day: 1000, // 1,000 write operations per day
      prices: [
        {
          price: 9,
          billing_type: 'MONTHLY',
          plan_id: 0,
        },
        {
          price: 22,
          billing_type: 'TRIMESTAL',
          plan_id: 0,
        },
        {
          price: 89,
          billing_type: 'YEARLY',
          plan_id: 0,
        },
        {
          price: 149,
          billing_type: 'LIFETIME',
          plan_id: 0,
        },
      ],
      translations: [
        {
          name: 'Freelancer',
          description: 'Perfect for independent artists and freelancers',
          language_code: 'EN',
          plan_id: 0,
        },
        {
          name: 'Freelancer',
          description: 'Perfecto para artistas independientes y freelancers',
          language_code: 'ES',
          plan_id: 0,
        },
        {
          name: 'Freelancer',
          description: 'Perfeito para artistas independentes e freelancers',
          language_code: 'PT',
          plan_id: 0,
        },
      ],
    },
    {
      name: 'Professional',
      description: 'Max plan, ideal for established artists and agencies',
      logo: '/plans/professional',
      base_price: 14,
      is_active: true,
      is_free: false,
      max_media_size: 50000, // 50GB storage (~$1.15/month)
      max_projects_count: 100,
      max_clients_count: 100,
      max_services_count: 50,
      powered_by_ai: true,
      limit_storage_requests_per_day: 2000, // 2,000 write operations per day
      prices: [
        {
          price: 14,
          billing_type: 'MONTHLY',
          plan_id: 0,
        },
        {
          price: 34,
          billing_type: 'TRIMESTAL',
          plan_id: 0,
        },
        {
          price: 119,
          billing_type: 'YEARLY',
          plan_id: 0,
        },
        {
          price: 199,
          billing_type: 'LIFETIME',
          plan_id: 0,
        },
      ],

      translations: [
        {
          name: 'Professional',
          description: 'Advanced features for established artists and agencies',
          language_code: 'EN',
          plan_id: 0,
        },
        {
          name: 'Profesional',
          description:
            'Características avanzadas para artistas establecidos y agencias',
          language_code: 'ES',
          plan_id: 0,
        },
        {
          name: 'Profissional',
          description:
            'Recursos avançados para artistas estabelecidos e agências',
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
    const { id } = await Query.table('plans').insertAndGet(
      Object.keys(plan),
      Object.values(plan),
      ['id'],
    );
    for (const price of prices) {
      price.plan_id = id;
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
};

import { Query } from '../lib/facades';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import Logger from '@repo/backend-lib/utils/console';
import { PlanSchema, PlanTranslationSchema } from '@repo/common-lib/schemas/plan';
import { PlanPriceSchema } from '@repo/common-lib/schemas/plan-price';
import { toMinorUnits } from '@repo/common-lib/utils/calculatePrice';
import { dbcliLogger } from '../bin/dbcli-audit';
import { PLAN_DEFINITIONS, PlanDefinition } from './data/plans';
import { planStripeSteps } from './data/plans.stripe';

type MatchedBy = 'unique_identifier' | 'legacy_name' | 'name' | 'inserted';

/**
 * Finds the existing row for a plan: by its stable key, then by its pre-rename name, then by its
 * current name. A name match backfills the key. A name match that already carries a different
 * key is a conflict, never an overwrite.
 */
async function matchPlan(
  definition: PlanDefinition,
): Promise<{ plan: PlanSchema; matched_by: Exclude<MatchedBy, 'inserted'> } | null> {
  const byKey = await Query.table('plans')
    .where('unique_identifier', '=', definition.unique_identifier)
    .first<PlanSchema>();
  if (byKey) return { plan: byKey, matched_by: 'unique_identifier' };

  const byName: [string, 'legacy_name' | 'name'][] = [
    [definition.legacy_name, 'legacy_name'],
    [definition.name, 'name'],
  ];
  for (const [name, matched_by] of byName) {
    const plan = await Query.table('plans').where('name', '=', name).first<PlanSchema>();
    if (!plan) continue;
    if (plan.unique_identifier !== null && plan.unique_identifier !== definition.unique_identifier) {
      throw new Error(
        `Plan ${plan.id} matched "${definition.unique_identifier}" by name but is already "${plan.unique_identifier}"`,
      );
    }
    return { plan, matched_by };
  }
  return null;
}

/**
 * Seeds the plans in `data/plans.ts`. Safe to re-run: a second run creates no plan, price row or
 * Stripe price.
 *
 * `plan_prices` rows are versioned, never rewritten: subscriptions and Stripe webhooks resolve
 * subscribers through a row's `stripe_id`, so a changed amount inserts a new active row and
 * retires the old one (`is_active = false`, Stripe price archived). Rows are never deleted.
 */
export const main = async () => {
  const log = dbcliLogger('plans', 'seed-plans');
  const steps = planStripeSteps(stripe, log);
  let pricesCreated = 0;
  let pricesRetired = 0;
  /** Stripe prices archived in this run, so the heal pass doesn't archive them twice. */
  const archived = new Set<string>();

  log.info('Plans seed started', { plans: PLAN_DEFINITIONS.length });

  const retire = async (
    row: PlanPriceSchema,
    reason: 'amount-changed' | 'billing-type-dropped',
  ) => {
    await Query.table('plan_prices').where('id', '=', row.id).update(['is_active'], [false]);
    pricesRetired++;
    log.info('Plan price retired', {
      plan_id: row.plan_id,
      plan_price_id: row.id,
      billing_type: row.billing_type,
      reason,
      step: 'retire-price',
    });
    if (row.stripe_id) {
      await steps.archiveStripePrice(row.stripe_id);
      archived.add(row.stripe_id);
    }
  };

  for (const definition of PLAN_DEFINITIONS) {
    const { unique_identifier, legacy_name: _legacyName, prices, translations, ...columns } =
      definition;

    // 1. The plan row.
    const match = await matchPlan(definition);
    let planId: number;
    let stripeProductId: string | null;
    if (match) {
      planId = match.plan.id;
      stripeProductId = match.plan.stripe_id;
      const values = { ...columns, unique_identifier };
      await Query.table('plans')
        .where('id', '=', planId)
        .update(Object.keys(values), Object.values(values));
    } else {
      const values = { ...columns, unique_identifier, stripe_id: null };
      const inserted = await Query.table('plans').insertAndGet<{ id: number }>(
        Object.keys(values),
        Object.values(values),
        ['id'],
      );
      planId = inserted.id;
      stripeProductId = null;
    }
    log.info('Plan matched', {
      plan_id: planId,
      unique_identifier,
      matched_by: match?.matched_by ?? 'inserted',
      step: 'match-plan',
    });

    // 2. The Stripe product.
    const productId = await steps.upsertStripeProduct({
      plan_id: planId,
      stripe_product_id: stripeProductId,
      name: columns.name,
      description: columns.description,
    });
    if (productId !== stripeProductId) {
      await Query.table('plans').where('id', '=', planId).update(['stripe_id'], [productId]);
    }

    // 3. Declared prices: keep a row whose amount matches, otherwise insert a new one first and
    // only then retire the old ones.
    for (const declared of prices) {
      const active = await Query.table('plan_prices')
        .where('plan_id', '=', planId)
        .where('billing_type', '=', declared.billing_type)
        .where('is_active', '=', true)
        .orderBy('id', 'DESC')
        .get<PlanPriceSchema[]>();

      const current = active.find(
        (row) => toMinorUnits(row.price) === toMinorUnits(declared.price),
      );

      if (current) {
        // Nothing can be billing through a paid row without a Stripe price, so it's safe to
        // give it one in place.
        if (!columns.is_free && !current.stripe_id) {
          const stripePriceId = await steps.createStripePrice({
            plan_id: planId,
            stripe_product_id: productId,
            unique_identifier,
            billing_type: declared.billing_type,
            amount: declared.price,
          });
          await Query.table('plan_prices')
            .where('id', '=', current.id)
            .update(['stripe_id'], [stripePriceId]);
        } else if (current.stripe_id) {
          // A price created before prices were explicitly VAT-inclusive.
          await steps.ensureInclusiveTax({
            plan_id: planId,
            billing_type: declared.billing_type,
            stripe_price_id: current.stripe_id,
          });
        }
      } else {
        const stripePriceId = columns.is_free
          ? null
          : await steps.createStripePrice({
            plan_id: planId,
            stripe_product_id: productId,
            unique_identifier,
            billing_type: declared.billing_type,
            amount: declared.price,
          });
        const row = {
          plan_id: planId,
          billing_type: declared.billing_type,
          price: declared.price,
          stripe_id: stripePriceId,
          is_active: true,
        };
        const inserted = await Query.table('plan_prices').insertAndGet<{ id: number }>(
          Object.keys(row),
          Object.values(row),
          ['id'],
        );
        pricesCreated++;
        log.info('Plan price created', {
          plan_id: planId,
          plan_price_id: inserted.id,
          billing_type: declared.billing_type,
          step: 'insert-price',
        });
      }

      // At most one active row per billing type: every other one has the old amount.
      for (const row of active) {
        if (row.id !== current?.id) await retire(row, 'amount-changed');
      }
    }

    // 4. Billing types the plan no longer offers.
    const declaredTypes = new Set(prices.map((price) => price.billing_type));
    const allRows = await Query.table('plan_prices')
      .where('plan_id', '=', planId)
      .orderBy('id', 'ASC')
      .get<PlanPriceSchema[]>();
    for (const row of allRows) {
      if (row.is_active && !declaredTypes.has(row.billing_type)) {
        await retire(row, 'billing-type-dropped');
      } else if (!row.is_active && row.stripe_id && !archived.has(row.stripe_id)) {
        // Retired earlier; archive again if still active, so a past archive failure heals on re-run.
        await steps.archiveStripePrice(row.stripe_id, { onlyIfActive: true });
        archived.add(row.stripe_id);
      }
    }

    // 5. Translations.
    for (const translation of translations) {
      const existingTranslation = await Query.table('plan_translations')
        .where('plan_id', '=', planId)
        .where('language_code', '=', translation.language_code)
        .first<PlanTranslationSchema>();

      if (existingTranslation) {
        await Query.table('plan_translations')
          .where('id', '=', existingTranslation.id)
          .update(
            ['name', 'short_description', 'description'],
            [translation.name, translation.short_description, translation.description],
          );
      } else {
        const row = { ...translation, plan_id: planId };
        await Query.table('plan_translations').insert(Object.keys(row), Object.values(row));
      }
    }

    Logger.info(`Plan "${columns.name}" (${unique_identifier}) seeded (id=${planId}).`);
  }

  log.success('Plans seed completed', {
    plans: PLAN_DEFINITIONS.length,
    prices_created: pricesCreated,
    prices_retired: pricesRetired,
  });
};

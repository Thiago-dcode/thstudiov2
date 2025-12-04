import { EnumType } from "../constants/enums";
import { PlanPriceSchema, PlanSchema, PlanTranslationSchema } from "../schemas/plan";

export type BasePlan = Omit<PlanSchema, 'created_at'|'updated_at'>;
export type PlanPrice = Omit<PlanPriceSchema, 'created_at'| 'updated_at'>
export type PlanTranslation = Omit<PlanTranslationSchema,'language_code'> & {
    code:EnumType<'LANGUAGE_CODE'>
} ;
export type FullPlan = BasePlan & {
    prices: PlanPrice[],
    translation?: PlanTranslation
}
export type PlanIndexRequest =  {
is_active?:boolean

}
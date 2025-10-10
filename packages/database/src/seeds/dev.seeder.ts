import { Query } from "../lib/facades";
import bcrypt from 'bcrypt';
import { generateUUID } from "@repo/common-lib/utils/generate-uuid";
import { CreatePlanTransactionInput } from "src/lib/constants/schemas/user-plan-transaction";


export const main = async () => {
if(process.env.NODE_ENV !== 'development'){
    return;
}
await Query.table('users').where('email', '=', 'test@example.com').delete();
const user = {
    name: 'Test',
    surname: 'User',
    username: 'test',
    email: 'test@example.com',
    password: await bcrypt.hash('123456', 10),
    biography: 'Hello world ...',
}
const {id: userId} = await Query.table('users').insertAndGet(Object.keys(user), Object.values(user), ['id']);
const {plan_id, plan_price_id, price} = await Query.table('plans').select(['plans.id as plan_id', 'plan_prices.id as plan_price_id', 'plan_prices.price', 'plan_prices.billing_type']).where('is_free', '=', true).where('is_active', '=', true).where('plan_prices.billing_type', '=', 'LIFETIME').join('id', 'plan_prices', 'plan_id').first();
const planTransaction:CreatePlanTransactionInput = {
    user_id: userId as number,
    transaction_id: await generateUUID(),
    plan_offer_id: null,
    plan_price_id: plan_price_id as number,
    amount: price as number,
    status: 'SUCCESS',
    payment_status: 'SUCCESS',
    payment_method: null,
}
//Every time a plan is assigned to a user, a transaction is needed.
//So a user must have an extra data record 1:1 with a last plan transaction, even if the plan is free.
//If the last_plan_transaction_id is null, the API must create a new transaction related to the free plan.
await Query.table('user_plan_transactions').where('user_id', '=', userId).where('plan_price_id', '=', plan_price_id as number).delete();
const {id: planTransactionId} = await Query.table('user_plan_transactions').insertAndGet(Object.keys(planTransaction), Object.values(planTransaction), ['id']);
await Query.table('user_extra_data').where('user_id', '=', userId).delete();
await Query.table('user_extra_data').insert([
    'user_id',
    'plan_id',
    'last_plan_transaction_id',
], [userId, plan_id, planTransactionId]);
};

import { ENUMS, EnumType } from "@repo/common-lib/constants/enums";
import { Query } from "../lib/facades";

export const main = async () => {

    const enablePaymentMethods:EnumType<'PAYMENT_METHOD'>[] = ['CARD'];
    await Promise.all(ENUMS.PAYMENT_METHOD.map(async(pm)=>{
      const enabled = enablePaymentMethods.some(epm=>epm===pm);

      const existing = await Query.table('payment_methods')
        .where('payment_method', '=', pm)
        .first<{ id: number }>();

      if (existing) {
        await Query.table('payment_methods')
          .where('id', '=', existing.id)
          .update(['enabled'], [enabled]);
      } else {
        await Query.table('payment_methods').insert(['payment_method','enabled'],[pm, enabled]);
      }
    }))

};

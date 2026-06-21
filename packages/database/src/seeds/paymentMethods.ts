import { ENUMS, EnumType } from "@repo/common-lib/constants/enums";
import { Query } from "../lib/facades";

export const main = async () => {

    const enablePaymentMethods:EnumType<'PAYMENT_METHOD'>[] = ['CARD'];
    await Promise.all(ENUMS.PAYMENT_METHOD.map(async(pm)=>{  
         
      await  Query.table('payment_methods').insert(['payment_method','enabled'],[pm, enablePaymentMethods.some(epm=>epm===pm)]);
    }))

};

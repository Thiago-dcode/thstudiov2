import { Injectable } from "@nestjs/common";
import { Query } from "@repo/database/facades";
import Utils from "src/common/services/Utils.service";
import { IndexPaymentMethodRequest } from "./requests/index-payment-method-request.request";

@Injectable()
export class UtilsService {

    constructor(private readonly utils:Utils){}

    public async getPaymentMethods({enabled}: IndexPaymentMethodRequest){
        let query = Query.table('payment_methods').select(['payment_method','enabled']);
         let key = 'payment-methods'
        const isBoolean =typeof enabled ==='boolean'
        if(isBoolean){
            query = query.where('enabled','=',enabled);
            key += '-' + enabled? 'true':'false'
        }
        return await this.utils.cacheRemember(
            key,
            query.get(),
            {
                append_language: false,
                ttl: 1000 * 60 * 60 * 24 // 24 hours
            }
        );
    }
}
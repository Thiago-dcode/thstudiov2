import { Injectable } from "@nestjs/common";
import { Query } from "@repo/database/facades";
import {Helpers} from "src/common/services/helpers.service";
import { IndexPaymentMethodRequest } from "./requests/index-payment-method-request.request";
import { PaymentMethod } from "@repo/common-lib/types/payment-method";
import { EnumType } from "@repo/common-lib/constants/enums";

@Injectable()
export class PaymentMethodsService {

    constructor(private readonly helpers:Helpers){}

    public async getAll({enabled}: IndexPaymentMethodRequest){
        let query = Query.table('payment_methods').select(['id','payment_method','enabled']);
         let key = 'payment-methods'
        const isBoolean =typeof enabled ==='boolean'
        if(isBoolean){
            query = query.where('enabled','=',enabled);
            key += '-' + enabled? 'true':'false'
        }
        return await this.helpers.cacheRemember(
            key,
            query.get<PaymentMethod[]>(),
            {
                append_language: false,
                ttl: 1000 * 60 * 60 * 24 // 24 hours
            }
        );
    }
    public async getOne(paymentMethod:EnumType<'PAYMENT_METHOD'>){

        return await this.helpers.cacheRemember(
            'get-one-payment-method-'+ paymentMethod,
            Query.table('payment_methods').select(['id','payment_method','enabled']).where('payment_method','=',paymentMethod).first<PaymentMethod>(),
            {
                append_language: false,
                ttl: 1000 * 60 * 60 * 24 // 24 hours
            }
        );

    }
}
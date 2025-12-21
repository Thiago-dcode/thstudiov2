import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "src/common/decorators/public.decorator";
import { IndexPaymentMethodRequest } from "./requests/index-payment-method-request.request";
import { PaymentMethodsService } from "./payment-methods.service";


@Controller('utils/payment-methods')
export class UtilsController {

    constructor(private readonly paymentMethodService:PaymentMethodsService) {}

    @Get('')
    @Public()
    public async index(@Query()indexPaymentMethodRequest: IndexPaymentMethodRequest){

       return await this.paymentMethodService.getAll(indexPaymentMethodRequest)
        
    }
}
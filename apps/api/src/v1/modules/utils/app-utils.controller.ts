import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "src/common/decorators/public.decorator";
import { UtilsService } from "./app-utils.service";
import { IndexPaymentMethodRequest } from "./requests/index-payment-method-request.request";


@Controller('utils')
export class UtilsController {

    constructor(private readonly utilsService:UtilsService) {}

    @Get('payment-methods')
    @Public()
    public async getPaymentMethods(@Query()indexPaymentMethodRequest: IndexPaymentMethodRequest){

       return await this.utilsService.getPaymentMethods(indexPaymentMethodRequest)
        
    }
}
import { Module } from "@nestjs/common";
import { UtilsController } from "./payment-methods.controller";
import { PaymentMethodsService } from "./payment-methods.service";

@Module({
    controllers: [UtilsController],
    providers: [PaymentMethodsService],
})
export class UtilsModule {}
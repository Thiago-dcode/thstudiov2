import { Module } from "@nestjs/common";
import { UtilsController } from "./app-utils.controller";
import { UtilsService } from "./app-utils.service";

@Module({
    controllers: [UtilsController],
    providers: [UtilsService],
})
export class UtilsModule {}
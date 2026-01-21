import { Module } from "@nestjs/common";
import { AboutPageController } from "./user-about-page.controller";
import { AboutPageModule } from "../about-page/about-page.module";


@Module({
    controllers:[AboutPageController],
    imports:[AboutPageModule]
})
export class UserAboutPageModule {}
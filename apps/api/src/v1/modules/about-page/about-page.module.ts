import { Module } from "@nestjs/common";
import { AboutPageController } from "./about-page.controller";
import { AboutPageRepositoy } from "./about-page.repository";
import { AboutPageService } from "./about-page.service";


@Module({
    controllers:[AboutPageController],
    providers:[AboutPageRepositoy,AboutPageService],
    exports:[AboutPageService]
})
export class AboutPageModule {}
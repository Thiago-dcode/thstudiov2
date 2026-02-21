import { Module } from "@nestjs/common";
import { AboutPageController } from "./about-page.controller";
import { AboutPageRepositoy } from "./about-page.repository";
import { AboutPageService } from "./about-page.service";
import { UserModule } from "../users/users.module";
import { AiModule } from "../ai/ai.module";


@Module({
    controllers:[AboutPageController],
    providers:[AboutPageRepositoy,AboutPageService],
    exports:[AboutPageService],
    imports:[UserModule, AiModule]
})
export class AboutPageModule {}
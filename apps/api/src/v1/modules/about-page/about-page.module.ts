import { Module } from "@nestjs/common";
import { AboutPageController } from "./about-page.controller";
import { AboutPageRepositoy } from "./about-page.repository";
import { AboutPageService } from "./about-page.service";
import { UserModule } from "../users/users.module";


@Module({
    controllers:[AboutPageController],
    providers:[AboutPageRepositoy,AboutPageService],
    exports:[AboutPageService],
    imports:[UserModule]
})
export class AboutPageModule {}
import { Module } from "@nestjs/common";
import { AboutPageController } from "./about-page.controller";
import { AboutPageRepositoy } from "./about-page.repository";
import { AboutPageService } from "./about-page.service";
import { UserModule } from "../users/users.module";
import { AiModule } from "../ai/ai.module";
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
    controllers:[AboutPageController],
    providers:[
        AboutPageRepositoy,
        AboutPageService,
        {
            provide: LogService,
            useFactory: () => {
                return createApiLogger({
                    channel: 'about-page',
                });
            },
        },
    ],
    exports:[AboutPageService],
    imports:[UserModule, AiModule]
})
export class AboutPageModule {}
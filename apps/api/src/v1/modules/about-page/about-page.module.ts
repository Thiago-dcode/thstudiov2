import { Module } from "@nestjs/common";
import { AboutPageController } from "./about-page.controller";
import { AboutPageRepositoy } from "./about-page.repository";
import { AboutPageService } from "./about-page.service";
import { UserModule } from "../users/users.module";
import { AiModule } from "../ai/ai.module";
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
    controllers:[AboutPageController],
    providers:[
        AboutPageRepositoy,
        AboutPageService,
        {
            provide: LogService,
            useFactory: (requestService: RequestService) => {
                return FactoryLogService.createLogService('file', {
                    channel: 'about-page',
                    id: () => requestService.requestId,
                });
            },
            inject: [RequestService],
        },
    ],
    exports:[AboutPageService],
    imports:[UserModule, AiModule]
})
export class AboutPageModule {}
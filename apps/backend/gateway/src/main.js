"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const utils_1 = require("@repo/backend-lib/utils");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    let port = await (0, utils_1.checkPortOrGetNext)(configService.get('apiGateway.port'));
    app.setGlobalPrefix('api');
    await app.listen(port, () => {
        console.log(`🚀 API GATEWAY is running on port http://localhost:${port}`);
    });
}
void bootstrap();

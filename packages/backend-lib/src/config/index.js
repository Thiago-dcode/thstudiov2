"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envFilePath = void 0;
exports.default = () => ({
    apiGateway: {
        name: process.env.API_GATEWAY_NAME,
        port: process.env.API_GATEWAY_PORT
    },
    mediaService: {
        name: process.env.MEDIA_SERVICE_NAME,
        port: process.env.MEDIA_SERVICE_PORT
    }
});
exports.envFilePath = __dirname + '/../../.env';

export default () => ({
    apiGateway: {
      name: process.env.API_GATEWAY_NAME,
      port: process.env.API_GATEWAY_PORT
    },
    mediaService: {
      name: process.env.MEDIA_SERVICE_NAME,
      port: process.env.MEDIA_SERVICE_PORT
    }
  });

  export const envFilePath = __dirname + '/../../.env';
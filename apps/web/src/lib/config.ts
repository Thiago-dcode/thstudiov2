export const config = {
    encryption_secret: process.env.ENCRYPTION_SECRET ?? 'secret',
    app_url: process.env.APP_URL ?? '',
    api_v1_url: process.env.API_V1_URL ?? '',
    geoapi_url: process.env.GEOAPIFY_URL,
    geoapi_key: process.env.GEOAPIFY_KEY,
    app_name: 'a11studio'
}
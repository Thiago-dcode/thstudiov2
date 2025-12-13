import { config } from "../config";

const deleteCookie = async (cookieName: string) => {
const response = await fetch(`${config.app_url}/api/cookies/${cookieName}`, {
    method: 'DELETE',
});
if(!response.ok){
    throw new Error('Failed to delete cookie');
}
return response.json();
}

const setCookie = async (cookieName: string, value: string, options: {
    maxAge: number
}) => {
    const response = await fetch(`${config.app_url}/api/cookies/${cookieName}`, {
        method: 'POST',
        body: JSON.stringify({ value, maxAge: options.maxAge }),
    });
if(!response.ok){
    throw new Error('Failed to set cookie');
}
return response.json();
}   



export { deleteCookie };
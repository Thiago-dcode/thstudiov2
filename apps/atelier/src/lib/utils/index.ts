import { cookies } from "next/headers";
import { config } from "../config";
import { getConfigValue } from "@repo/common-lib/config/utils";
import { encrypt, decrypt } from "@repo/common-lib/utils/encrypt";

const deleteCookie = async (cookieName: string) => {
const response = await fetch(`${config.app_url}/api/cookies/${cookieName}`, {
    method: 'DELETE',
});
if(!response.ok){
    throw new Error('Failed to delete cookie');
}
return response.json();
}

export const getEncryptedJsonCookie = async <T>(key:string):Promise<T|null> => {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(key)?.value;
    if (!cookieValue) {
        return null;
    }
 try {
    const decrypted= decrypt(cookieValue, getConfigValue('encryption').secret);
    if(!decrypted) return null;
    return JSON.parse(decrypted) as T;
 } catch (error) {
    console.log(error);
    return null;
 }
}
  
export const encryptObj = async <T extends object>(obj:T) => {
  return encrypt(JSON.stringify(obj), getConfigValue('encryption').secret);
}



export { deleteCookie };
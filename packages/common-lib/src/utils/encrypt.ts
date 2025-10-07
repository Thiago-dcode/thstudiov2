import * as CryptoJS from 'crypto-js';



export const encrypt =  (text: string,secret: string) => {
    return  CryptoJS.AES.encrypt(text, secret).toString();
}
export const decrypt =  (text: string,secret: string) => {
      return CryptoJS.AES.decrypt(text, secret).toString(CryptoJS.enc.Utf8);
}


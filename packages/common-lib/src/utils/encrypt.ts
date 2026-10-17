import * as CryptoJS from 'crypto-js';

/**
 * `AES.encrypt(...).toString()` is OpenSSL-formatted: base64 of "Salted__" + salt +
 * ciphertext, which always starts with this prefix. Anything else has no salt, and
 * CryptoJS then derives the key from a random salt, so decrypt is non-deterministic
 * and can return garbage instead of failing.
 */
const OPENSSL_CIPHERTEXT_PREFIX = 'U2FsdGVkX1';

export const encrypt = (text: string, secret: string) => {
    return CryptoJS.AES.encrypt(text, secret).toString();
}

export const decrypt = (text: string, secret: string) => {
    if (!text?.startsWith(OPENSSL_CIPHERTEXT_PREFIX)) return null;
    try {
        return CryptoJS.AES.decrypt(text, secret).toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error(error);
        return null;
    }
}


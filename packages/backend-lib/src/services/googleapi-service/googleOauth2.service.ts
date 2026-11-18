
import { GoogleScope } from '@repo/common-lib/types/auth';
import { Auth, google } from 'googleapis';
import { extractOauth2GoogleScope } from "@repo/common-lib/utils/extract-oauth2-scope";




export class GoogleOauth2Service {


    protected oauth2Client: Auth.OAuth2Client;

    constructor(protected options: Auth.OAuth2ClientOptions) {

        this.oauth2Client = new google.auth.OAuth2({
            ...this.options,
        })

    }

    getRedirectUrl({ scopes, redirectUri, state, codeChallenge }: {
        scopes: GoogleScope[] | GoogleScope,
        redirectUri: string,
        /** Echoed back on the callback, where the caller checks it against its own copy (CSRF). */
        state: string,
        /** PKCE S256 challenge: only whoever holds the matching verifier can redeem the code. */
        codeChallenge: string,
    }) {
        return this.oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            access_type: 'offline',
            scope: scopes,
            redirect_uri: redirectUri,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: Auth.CodeChallengeMethod.S256,
        });
    }

    /**
     * `redirectUri` must be the one the authorization URL was built with, and `codeVerifier` the
     * PKCE verifier behind its challenge, or Google rejects the code.
     */
    async getUserInfo(code: string, redirectUri: string, codeVerifier: string) {
        // A client per call: credentials set on the shared one would leak between concurrent
        // callbacks, and one request could read another user's profile.
        const client = new google.auth.OAuth2({ ...this.options, redirectUri });

        // Step 1: exchange the one-time code for tokens
        const { tokens } = await client.getToken({ code, redirect_uri: redirectUri, codeVerifier });

        // Step 2: attach the tokens to the client (getToken does NOT do this for you)
        client.setCredentials(tokens);

        // Step 3: call the userinfo endpoint (now authenticated)
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const { data } = await oauth2.userinfo.get();

        return {
            profile: data, // id, email, verified_email, name, picture...
            refreshToken: tokens.refresh_token ?? null, // only present on first consent
            accessToken: tokens?.access_token,
            expiresAt: tokens?.expiry_date, // ms timestamp
            scopes: extractOauth2GoogleScope(tokens.scope ?? ''),
            idToken: tokens.id_token,
        };
    }


}
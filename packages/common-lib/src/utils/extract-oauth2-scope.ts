import { GOOGLE_SCOPES } from "../constants/auth";
import type { GoogleScope } from "../types/auth";

const isGoogleScope = (value: string): value is GoogleScope =>
    (GOOGLE_SCOPES as readonly string[]).includes(value);

/**
 * Parses the `scope` value Google returns on the OAuth callback (space-delimited, per RFC 6749)
 * into the scopes we know about. Unknown scopes are dropped, duplicates are removed and the
 * input order is kept. Anything that is not a non-empty string yields `[]`, since the value
 * comes straight from the query string.
 */
export const extractOauth2GoogleScope = (scope: unknown): GoogleScope[] => {
    if (typeof scope !== "string") return [];

    const scopes = new Set<GoogleScope>();
    for (const part of scope.split(/\s+/)) {
        if (isGoogleScope(part)) scopes.add(part);
    }
    return [...scopes];
};

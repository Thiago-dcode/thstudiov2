/**
 * Flags for every cookie the server sets. `secure` keeps a session cookie off plain HTTP even
 * before HSTS has been seen (the first visit); `next dev` runs over http://localhost, so it is
 * only on in production builds. `lax` keeps the cookie off cross-site POSTs and subrequests.
 */
export const SECURE_COOKIE_FLAGS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
} as const;

export const VIEW_ENGINE = 'ejs';

/**
 * Throttler limits for cheap public reads (site assets, featured portfolio, artist index).
 *
 * The global defaults in `AppModule` are sized for writes. These routes are hit once per
 * section on every landing page render, so the defaults throttled real visitors long before
 * they threatened the API. The responses are cached in Redis and fronted by the CDN, so a
 * wider budget costs us close to nothing.
 */
export const PUBLIC_READ_THROTTLE = {
  short: { limit: 50, ttl: 1000 },
  medium: { limit: 100, ttl: 10000 },
  long: { limit: 300, ttl: 60000 },
};

export const VALIDATION_ERROR_STATUS = [
  // 1xx Informational
  100, 101, 102, 103,
  
  // 2xx Success
  200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
  
  // 3xx Redirection
  300, 301, 302, 303, 304, 305, 306, 307, 308,
  
  // 4xx Client Error
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
  
  // 5xx Server Error
  500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511
];
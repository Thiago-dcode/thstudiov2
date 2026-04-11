/**
 * Converts bytes to megabytes.
 * @param bytes - Size in bytes
 * @returns Size in megabytes
 */
export const bytesToMB = (bytes: number): number => {
    return bytes / (1024 * 1024);
}

/**
 * Converts megabytes to bytes.
 * @param mb - Size in megabytes
 * @returns Size in bytes
 */
export const mbToBytes = (mb: number): number => {
    return mb * (1024 * 1024);
}
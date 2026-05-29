/**
 * Picks the first string from a Next.js searchParam value (which can be a
 * single string, an array of strings, or undefined). Returns undefined for
 * empty strings so callers never receive "".
 */
export function firstString(value: string | string[] | undefined): string | undefined {
    if (value === undefined) return undefined
    const s = Array.isArray(value) ? value[0] : value
    return s === "" ? undefined : s
}

/**
 * Trims a string and returns undefined if the result is empty.
 */
export function optionalTrim(s: string | undefined): string | undefined {
    if (s === undefined) return undefined
    const t = s.trim()
    return t === "" ? undefined : t
}

/**
 * Parses a string as an integer. Returns undefined when the input is absent,
 * blank, or not a finite number.
 */
export function parseOptionalInt(s: string | undefined): number | undefined {
    if (s === undefined) return undefined
    const t = s.trim()
    if (t === "") return undefined
    const n = parseInt(t, 10)
    return Number.isFinite(n) ? n : undefined
}

/**
 * Parses a string as a float. Returns undefined when the input is absent,
 * blank, or not a finite number.
 */
export function parseOptionalFloat(s: string | undefined): number | undefined {
    if (s === undefined) return undefined
    const t = s.trim()
    if (t === "") return undefined
    const n = parseFloat(t)
    return Number.isFinite(n) ? n : undefined
}

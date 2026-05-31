
export const cleanObj = <T extends Object>(obj: T, options?: {
    includeNull: boolean,
    deep?: boolean
}) => {

    for (const key in obj) {
        if (obj[key] === undefined || (options?.includeNull && obj[key] === null)) {
            delete obj[key]
        }
    }
    return obj;
}

export const trimValues = <T extends Object>(obj: T, options?: {
    deep?: boolean
}) => {
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'string') {
            (obj as Record<string, unknown>)[key] = value.trim();
        }
        if (options?.deep &&
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            !(value instanceof Date) &&
            !(typeof File !== 'undefined' && value instanceof File) &&
            !(typeof Blob !== 'undefined' && value instanceof Blob)
        ) {
            trimValues(value, options);
        }
    }
    return obj;
}


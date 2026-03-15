
export const cleanObj = (obj:Record<string,any>,options?:{
    includeNull:boolean,
    deep?:boolean
}) =>{

    for (const key in obj) {
        if (obj[key] === undefined || (options?.includeNull && obj[key] ===null)) {
            delete obj[key]
        }
    }
}

export const trimValues = (obj:Record<string,any>,options?:{
    deep?:boolean
}) =>{
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'string') {
            obj[key] = value.trim();
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

}

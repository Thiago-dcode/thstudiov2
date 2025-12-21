export type QueryBuilderValue = string | number | boolean | null | undefined | QueryBuilderValue[];
export type QueryBuilder = {
    [key: string]: QueryBuilderValue | QueryBuilder;
}

export const queryParamBuilder = (resource: string, query?: QueryBuilder) => {
    let sanitizedResource = resource.trim().replace(/[/?]+$/, '');
    const entries = Object.entries(query ?? {});
    if (!entries.length) return sanitizedResource;

    const buildKeyValue = (key: string, value: QueryBuilderValue | QueryBuilder): string => {
        const _key = `${key}=`;
        const typeOfValue = typeof value;
        switch (typeOfValue) {
            case 'string':
            case 'number':
                return `${_key}${value}`;
            case 'boolean':
                return `${_key}${value ? '1' : '0'}`;
            case 'object':
                if (value === null) return ``;
                else if (Array.isArray(value)) return value.map(item => buildKeyValue(`${key}[]`, item)).filter(Boolean).join('&');
                else return '';
            case 'undefined':
            default:
                return ``;
        }
    }
    const queryParams = entries.map(([key, value]) => {

        return buildKeyValue(key, value);

    });
    const separator = sanitizedResource.includes('?') ? '&' : '?';
    return `${sanitizedResource}${separator}${queryParams.filter(Boolean).join('&')}`;
}

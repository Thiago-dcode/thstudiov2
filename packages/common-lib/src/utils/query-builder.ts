export type QueryBuilderValue = string | number | boolean | null | undefined | QueryBuilderValue[];
export type QueryBuilder = {
    [key: string]: QueryBuilderValue | QueryBuilder;
};

export type QueryParamArrayStyle = 'commas' | 'list';

export type QueryParamBuilderSettings = {
    /** How arrays are serialized. Default: `'list'` (`key[]=a&key[]=b`). */
    arrayStyle?: QueryParamArrayStyle;
};

function serializeScalarForCommaList(item: QueryBuilderValue): string | null {
    if (item === null || item === undefined) return null;
    const t = typeof item;
    if (t === 'string' || t === 'number') return String(item);
    if (t === 'boolean') return item ? '1' : '0';
    return null;
}

export const queryParamBuilder = (
    resource: string,
    query?: QueryBuilder,
    settings?: QueryParamBuilderSettings,
) => {
    const arrayStyle: QueryParamArrayStyle = settings?.arrayStyle ?? 'list';

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
                if (Array.isArray(value)) {
                    if (value.length === 0) return '';
                    if (arrayStyle === 'commas') {
                        const rawParts = value
                            .map(serializeScalarForCommaList)
                            .filter((s): s is string => s !== null && s !== '');
                        if (!rawParts.length) return '';
                        return `${key}=${encodeURIComponent(rawParts.join(','))}`;
                    }
                    return value.map((item) => buildKeyValue(`${key}[]`, item)).filter(Boolean).join('&');
                }
                return '';
            case 'undefined':
            default:
                return ``;
        }
    };
    const queryParams = entries.map(([key, value]) => {
        return buildKeyValue(key, value);
    });
    const separator = sanitizedResource.includes('?') ? '&' : '?';
    return `${sanitizedResource}${separator}${queryParams.filter(Boolean).join('&')}`;
};

import { CategorySchema } from "../schemas/category"
import { OffsetPaginationRequest } from "./request"
import { EnumType } from "../constants/enums"


export type CategoryTranslation = {
    id: number,
    name: string,
    code: string
}

/** Full translation row for insert; `code` is persisted as `language_code`. */
export type CategoryTranslationCreatePayload = {
    category_id: number;
    name: string;
    code: EnumType<'LANGUAGE_CODE'>;
};

export type CategoryTranslationUpdatePayload = Omit<
    CategoryTranslationCreatePayload,
    'category_id' | 'code'
>;
export type CategoryIndexRequest = OffsetPaginationRequest & {
    user_id?: number,
    random?: boolean,
    search?: string,
    parent_id?: number,
    /** When set, only categories with these ids are returned (order not guaranteed). */
    categories?: number[],
    /** When set, only categories with these slugs are returned (order not guaranteed). */
    slugs?: string[],
    is_featured?: boolean,
    is_active?: boolean,
    with_thumbnail?: boolean
}

export type CreateCategoryTranslationRow = {
    name: string;
    language_code: EnumType<'LANGUAGE_CODE'>;
};

export type CreateCategoryInput = {
    name: string;
    slug: string;
    tags: string;
    thumbnail: string | null;
    is_featured: boolean;
    is_active: boolean;
    parent_id: number | null;
    translations: CreateCategoryTranslationRow[];
}

export type UpdateCategoryInput = Partial<{
    name: string;
    slug: string;
    tags: string;
    thumbnail: string | null;
    is_featured: boolean;
    is_active: boolean;
    parent_id: number | null;
}>
/** `name` is the label for the current request language: translation if present, else `categories.name`. */
export type CategoryBase = Omit<CategorySchema, 'created_at' | 'updated_at' | 'tags'> & {
    tags: string[],
}

export type CategoryWithParent = Omit<CategoryBase, 'parent_id'> & {
    parent?: CategoryWithParent
}
import { EnumType, TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

export type CategorySchema = {
  id: number;
  tags: string;
  thumbnail?: string | null;
  is_featured: boolean;
  is_active: boolean;
  type: EnumType<'CATEGORY_TYPE'>;
  name: string;
  slug: string;
  parent_id?: number | null;
  created_at: Date;
  updated_at: Date;
};

export type CategorySchemaWithoutTimestamps = Omit<CategorySchema, 'created_at' | 'updated_at'>;

const tablesCategory = [TABLES_ENUM.CATEGORIES] as const;
export type CategorySchemaColumns = TableColumn<typeof tablesCategory, CategorySchemaWithoutTimestamps>;

export type CategoryWithTranslationsSchema =CategorySchema & {
  tr_id?: number;
  tr_name?: string;
  language_code?: string;
  category_id?: number;
};

const tables = [TABLES_ENUM.CATEGORY_TRANSLATIONS,TABLES_ENUM.CATEGORIES] as const;
export type CategoryWithTranslationSchemaColumns = TableColumn<typeof tables, CategoryWithTranslationsSchema>;
export type CategoryWithParentSchema = CategorySchema & {
  parent_id: number;
  parent_name?: string | null;
  parent_thumbnail?: string | null;
  parent_tags?: string | null;
};

const tablesCategoryWithParent = [TABLES_ENUM.CATEGORIES] as const;
export type CategoryWithParentSchemaColumns = TableColumn<typeof tablesCategoryWithParent, CategoryWithParentSchema>;


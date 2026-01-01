import { AboutPageSchema } from "../schemas/about-page";

export type AboutPage = Omit<AboutPageSchema, 'created_at' | 'updated_at'>;

export type CreateAboutPageInput = Omit<AboutPageSchema, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAboutPageInput = Partial<CreateAboutPageInput>;


import * as z from "zod";

export const createAboutPageSchema = z.object({
  title: z
    .string({ message: "Title must be a valid string" })
    .min(5, { message: "Title must be at least 5 characters" })
    .max(255, { message: "Title must be less than 255 characters" })
    .optional(),
  description: z
    .string({ message: "Description is required and must be a valid string" })
    .min(20, { message: "Description must be at least 20 characters" })
    .max(1000, { message: "Description must be less than 1000 characters" }),
  user_id: z
    .number({ message: "User ID is required and must be a valid number" })
    .positive({ message: "User ID must be a positive number" }),
});

export const updateAboutPageSchema = z.object({
  title: z
    .string({ message: "Title must be a valid string" })
    .min(5, { message: "Title must be at least 5 characters" })
    .max(255, { message: "Title must be less than 255 characters" })
    .optional(),
  description: z
    .string({ message: "Description must be a valid string" })
    .min(20, { message: "Description must be at least 20 characters" })
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),
});
  
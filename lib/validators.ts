import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscore allowed");

export const registerSchema = z.object({
  email: z.string().email(),
  username: usernameSchema,
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const postSchema = z.object({
  content: z.string().min(1).max(280),
  image_url: z.string().url().optional().or(z.literal("")),
});

export const profileSchema = z.object({
  bio: z.string().max(160).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  location: z.string().max(100).optional(),
});

import { z } from "zod";

// Validation constants
export const VALIDATION_LIMITS = {
  USERNAME_MIN: 1,
  USERNAME_MAX: 50,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 128,
  TITLE_MAX: 200,
  TEXT_MAX: 10000,
  TODO_TEXT_MAX: 500,
  TODO_ID_MAX: 50,
  TODOS_MAX: 100,
  TAG_MAX: 50,
  TAGS_MAX: 20,
} as const;

// Mood values as a const tuple for type safety
export const MOOD_VALUES = [
  "excellent",
  "good",
  "neutral",
  "bad",
  "terrible",
] as const;
export type MoodType = (typeof MOOD_VALUES)[number];

/**
 * Signup validation schema
 * Uses Zod v4 `error` parameter for custom error messages
 */
export const signupSchema = z.object({
  username: z
    .string({ error: "Username must be a string" })
    .min(VALIDATION_LIMITS.USERNAME_MIN, { error: "Username is required" })
    .max(VALIDATION_LIMITS.USERNAME_MAX, {
      error: `Username must be at most ${VALIDATION_LIMITS.USERNAME_MAX} characters`,
    }),
  password: z
    .string({ error: "Password must be a string" })
    .min(VALIDATION_LIMITS.PASSWORD_MIN, {
      error: `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters long`,
    })
    .max(VALIDATION_LIMITS.PASSWORD_MAX, {
      error: `Password must be at most ${VALIDATION_LIMITS.PASSWORD_MAX} characters`,
    }),
});

/**
 * Signin validation schema
 */
export const signinSchema = z.object({
  username: z
    .string({ error: "Username must be a string" })
    .min(VALIDATION_LIMITS.USERNAME_MIN, { error: "Username is required" })
    .max(VALIDATION_LIMITS.USERNAME_MAX, {
      error: `Username must be at most ${VALIDATION_LIMITS.USERNAME_MAX} characters`,
    }),
  password: z
    .string({ error: "Password must be a string" })
    .min(1, { error: "Password is required" })
    .max(VALIDATION_LIMITS.PASSWORD_MAX, {
      error: `Password must be at most ${VALIDATION_LIMITS.PASSWORD_MAX} characters`,
    }),
});

/**
 * Todo item schema
 */
const todoSchema = z.object({
  id: z
    .string({ error: "Todo ID must be a string" })
    .max(VALIDATION_LIMITS.TODO_ID_MAX, {
      error: `Todo ID must be at most ${VALIDATION_LIMITS.TODO_ID_MAX} characters`,
    }),
  text: z
    .string({ error: "Todo text must be a string" })
    .max(VALIDATION_LIMITS.TODO_TEXT_MAX, {
      error: `Todo text must be at most ${VALIDATION_LIMITS.TODO_TEXT_MAX} characters`,
    }),
  completed: z.boolean().optional(),
});

/**
 * Tag schema
 */
const tagSchema = z
  .string({ error: "Tag must be a string" })
  .min(1, { error: "Tag cannot be empty" })
  .max(VALIDATION_LIMITS.TAG_MAX, {
    error: `Tag must be at most ${VALIDATION_LIMITS.TAG_MAX} characters`,
  });

/**
 * Journal entry validation schema
 * Uses Zod v4 patterns with proper error handling
 */
export const entrySchema = z.object({
  title: z
    .string({ error: "Title must be a string" })
    .max(VALIDATION_LIMITS.TITLE_MAX, {
      error: `Title must be at most ${VALIDATION_LIMITS.TITLE_MAX} characters`,
    })
    .optional(),
  text: z
    .string({ error: "Text must be a string" })
    .max(VALIDATION_LIMITS.TEXT_MAX, {
      error: `Text must be at most ${VALIDATION_LIMITS.TEXT_MAX} characters`,
    })
    .optional(),
  mood: z.enum(MOOD_VALUES, {
    error:
      "Invalid mood value. Must be one of: excellent, good, neutral, bad, terrible",
  }),
  todos: z
    .array(todoSchema, { error: "Todos must be an array" })
    .max(VALIDATION_LIMITS.TODOS_MAX, {
      error: `Maximum ${VALIDATION_LIMITS.TODOS_MAX} todos allowed`,
    })
    .optional(),
  tags: z
    .array(tagSchema, { error: "Tags must be an array" })
    .max(VALIDATION_LIMITS.TAGS_MAX, {
      error: `Maximum ${VALIDATION_LIMITS.TAGS_MAX} tags allowed`,
    })
    .optional(),
});

// Export inferred types for use in application
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type EntryInput = z.infer<typeof entrySchema>;
export type TodoInput = z.infer<typeof todoSchema>;

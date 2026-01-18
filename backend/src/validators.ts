import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const signinSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const entrySchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  mood: z.enum(["excellent", "good", "neutral", "bad", "terrible"], {
    errorMap: () => ({ message: "Invalid mood value" }),
  }),
  todos: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        completed: z.boolean().optional(),
      })
    )
    .optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
});

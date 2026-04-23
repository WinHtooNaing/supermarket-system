import * as z from "zod";

const loginSchema = z.object({
  user_id: z
    .string()
    .nonempty("User ID is required.")
    .min(5, "User ID must be at least 5 characters.")
    .max(20, "User ID must be at most 20 characters."),
  password: z
    .string()
    .nonempty("Password is required.")
    .min(6, "Password must be at least 6 characters.")
    .max(50, "Password must be at most 50 characters."),
});

export default loginSchema;

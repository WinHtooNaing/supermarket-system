"use server";

import loginSchema from "@/types/login-schema";
import {
  authenticateUser,
  getDefaultRedirectPath,
  setAuthCookies,
} from "@/lib/auth";

export type LoginActionResult = {
  errors?: {
    user_id?: string[];
    password?: string[];
  };
  message?: string;
  success?: string;
  redirectTo?: string;
};

export async function loginAction(input: {
  user_id: string;
  password: string;
}): Promise<LoginActionResult> {
  const validatedFields = loginSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const user = await authenticateUser(
    validatedFields.data.user_id,
    validatedFields.data.password
  );

  if (!user) {
    return {
      message: "Invalid user ID or password.",
    };
  }

  await setAuthCookies(user);

  return {
    success: "Login successful.",
    redirectTo: getDefaultRedirectPath(user.role),
  };
}

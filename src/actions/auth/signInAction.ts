"use server";

import { updateUserTimestamp, updateRetries, dbGetUserByField } from "@/utils/supabase";
import { ActionResponseSignIn, Auth, DbUser } from "@/types";
import { wait } from "@/utils/helpers";
import { activationCodePattern, AuthSchema } from "@/utils/zod";
import z from "zod/v4";
import bcrypt from "bcrypt";
import { createAuthSession } from "@/utils/auth";

export async function signInAction(
  prevState: ActionResponseSignIn | null,
  formData: FormData
): Promise<ActionResponseSignIn> {
  // Form inputs validation ----------------------------------------
  await wait(1);
  const rawData: Auth = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validatedData = AuthSchema.safeParse(rawData);

  if (!validatedData.success) {
    const rawFieldErrors = z.flattenError(validatedData.error).fieldErrors;

    const fieldErrors: Record<string, string[]> = Object.fromEntries(
      Object.entries(rawFieldErrors).map(([k, v]) => [k, v ?? []])
    );

    return {
      success: false,
      message: "Please fix the errors in the form",
      errors: fieldErrors,
      inputs: rawData,
    };
  }

  // User auth validation ----------------------------------------

  // 1. Check if user exists
  try {
    const userData: DbUser | null = await dbGetUserByField("email", validatedData.data.email);

    // if user does not exist
    if (!userData) {
      return {
        success: false,
        message: "User not found",
        errors: {},
        inputs: validatedData.data,
      };
    }

    // If user with the submitted email exists

    // Progresive protection of the form submission
    // by following the number of user attempts in one day
    // and by adding a pause in reference to no of user attempts

    // Reset user retries if 24 hours have passed since last attempt
    if (userData.updated_at < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      userData.retries = 0;
      await updateUserTimestamp(validatedData.data.email);
    }

    // Update user retries
    await updateRetries(validatedData.data.email, userData.retries);

    // Check if user retries limit is reached
    const maxRetries = Number(process.env.NEXT_PUBLIC_AUTH_MAX_RETRIES ?? 5);

    if (userData.retries >= maxRetries) {
      return {
        success: false,
        message: "User retries limit reached. Please contact support for assistance.",
        errors: {},
        inputs: validatedData.data,
      };
    }

    // make the pause based on the number of retries
    await wait(userData.retries);

    // Check if the user with the submitted password exists
    const passwordMatch = await bcrypt.compare(validatedData.data.password, userData.password);
    if (!passwordMatch) {
      return {
        success: false,
        message: "Invalid password",
        errors: {},
        inputs: validatedData.data,
      };
    }

    // Check if user is inactive
    if (userData.status === "inactive") {
      return {
        success: false,
        message: "User is inactive. Please contact support for assistance.",
        errors: {},
        inputs: validatedData.data,
      };
    }

    // Check if the user is in the process of the registration
    if (userData.status?.match(activationCodePattern)) {
      return {
        success: false,
        message: "Please finish the registration process by verifying your email address.",
        errors: {},
        inputs: validatedData.data,
      };
    }

    // User submitted a valid credentials:

    // Set auth session cookie with user id valid for 1 day
    await createAuthSession(userData.id);

    // Reset user retries
    await updateRetries(validatedData.data.email, 0);

    return {
      success: true,
      message: "User signed in successfully",
      errors: {},
      inputs: validatedData.data,
    };
  } catch (error) {
    console.error("Error signing in:", error);
    return {
      success: false,
      message: "Error signing in, please try again later or contact support",
      errors: {},
      inputs: validatedData.data,
    };
  }
}

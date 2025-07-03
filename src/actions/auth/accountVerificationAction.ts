"use server";

import { dbGetUserByField, updateUserStatus } from "@/utils/supabase";
import { ActionResponseAccountVerification, DbUser, AccountVerificationFormData } from "@/types";
import { AccountVerificationSchema } from "@/utils/zod";
import z from "zod/v4";
import { destroyAuthSession, getAuth } from "@/utils/auth";
import { checkUserRetryLimit } from "@/utils/helpers";

export async function accountVerificationAction(
  prevState: ActionResponseAccountVerification | null,
  formData: FormData
): Promise<ActionResponseAccountVerification> {
  // Form inputs validation ----------------------------------------
  const rawData: AccountVerificationFormData = {
    activationCode: formData.get("activationCode") as string,
  };

  const validatedData = AccountVerificationSchema.safeParse(rawData);

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

  // Get auth (payload) from "auth" session cookie
  const authPayload = await getAuth();

  if (!authPayload) {
    return {
      success: false,
      message: "Your current session has expired. Please repeat the process.",
      errors: {},
      inputs: undefined,
    };
  }

  // Check if user with the auth id exists in the database
  const userData: DbUser | null = await dbGetUserByField("id", authPayload.id);
  if (!userData) {
    await destroyAuthSession();
    return {
      success: false,
      message: "Your current session is expired. Please repeat the process.",
      errors: {},
      inputs: undefined,
    };
  }

  // If user with the authId exists -----------------------------

  // Check if user has reached retry limit and apply progressive delay
  const isRetryLimitReached = await checkUserRetryLimit(userData, authPayload.email);

  if (isRetryLimitReached) {
    // destroyAuthSession(); this is redundant
    return {
      success: false,
      message: "Activation attempts limit reached. Please contact support for assistance.",
      errors: {},
      inputs: validatedData.data,
    };
  }

  // Check if user is inactive
  if (userData.status === "inactive") {
    destroyAuthSession();
    return {
      success: false,
      message: "User is inactive. Please contact support for assistance.",
      errors: {},
      inputs: validatedData.data,
    };
  }

  // If user with the authId exists and is active, check if the activation code is correct
  if (userData.status !== validatedData.data.activationCode) {
    return {
      success: false,
      message: "Wrong activation code provided, please try again",
      errors: {},
      inputs: validatedData.data,
    };
  }

  // If user with the authId submitted the right activation code check if it expired (withing 1h)
  if (userData.updated_at < new Date(Date.now() - 60 * 60 * 1000)) {
    await destroyAuthSession();
    return {
      success: false,
      message: "Activation code expired. Please try again.",
      errors: {},
      inputs: validatedData.data,
    };
  }

  // If user with the authEmail submitted the right activation code and it is not expired, activate the user
  // Reset user retries
  const { updateRetries } = await import("@/utils/supabase");
  await updateRetries(authPayload.email, 0);

  // Update user status
  await updateUserStatus(authPayload.id, "active");

  // Return success response
  return {
    success: true,
    message: "User activated successfully",
    errors: {},
    inputs: validatedData.data,
  };
}

"use server";

import { updateUserTimestamp, updateRetries, dbGetUserByField, updateUserStatus } from "@/utils/supabase";
import { ActionResponseAccountVerification, DbUser, AccountVerificationFormData } from "@/types";
import { AccountVerificationSchema } from "@/utils/zod";
import z from "zod/v4";
import { destroyAuthSession, getAuth } from "@/utils/auth";

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

  // Progresive protection of the form submission
  // by following the number of user attempts in one day
  // and by adding a pause in reference to no of user attempts

  // Reset user retries if 24 hours have passed since last attempt
  if (userData.updated_at < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    userData.retries = 0;
    await updateUserTimestamp(authPayload.id);
  }

  // Update user retries
  await updateRetries(authPayload.email, userData.retries);

  // Check if user retries limit is reached
  const maxRetries = Number(process.env.NEXT_PUBLIC_AUTH_MAX_RETRIES ?? 5);

  if (userData.retries >= maxRetries) {
    await destroyAuthSession();
    return {
      success: false,
      message: "Activation attempts limit reached. Please contact support for assistance.",
      errors: {},
      inputs: validatedData.data,
    };
  }

  // Check if user is inactive
  if (userData.status === "inactive") {
    await destroyAuthSession();
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

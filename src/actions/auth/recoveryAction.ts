"use server";

import { dbGetUserByField, updateUserStatus, updateRetries, updatePassword } from "@/utils/supabase";
import {
  ActionResponseRecovery,
  DbUser,
  RecoveryRequestFormData,
  RecoveryValidateFormData,
  RecoveryResetFormData,
} from "@/types";
import { checkUserRetryLimit, generateActivationCode } from "@/utils/helpers";
import { RecoveryRequestSchema, RecoveryValidateSchema, RecoveryResetSchema, getFormattedErrors } from "@/utils/zod";
import { createRecoverySession, destroyRecoverySession, getRecoveryAuth, recoveryCookie } from "@/utils/auth";
import { sendEmail } from "@/utils/mailer";

export async function recoveryAction(
  prevState: ActionResponseRecovery | null,
  formData: FormData
): Promise<ActionResponseRecovery> {
  // Form inputs validation ----------------------------------------
  const rawData: RecoveryRequestFormData | RecoveryValidateFormData | RecoveryResetFormData = {
    email: formData.get("email") as string,
    validate: formData.get("validate") as string,
    password1: formData.get("password1") as string,
    password2: formData.get("password2") as string,
    phase: formData.get("phase") as "request" | "validate" | "reset" | "finish",
  };

  switch (rawData.phase) {
    case "request": {
      const validatedData = RecoveryRequestSchema.safeParse(rawData);
      if (!validatedData.success) {
        return {
          success: false,
          message: "Please fix the errors in the form",
          errors: getFormattedErrors(validatedData.error),
          phase: "request",
          inputs: rawData,
        };
      }

      try {
        const userData: DbUser | null = await dbGetUserByField("email", validatedData.data.email);

        if (!userData) {
          return {
            success: false,
            message: "User with the submitted email not found",
            errors: {},
            phase: "request",
            inputs: rawData,
          };
        }

        const isRetryLimitReached = await checkUserRetryLimit(userData, validatedData.data.email);

        if (isRetryLimitReached) {
          return {
            success: false,
            message: "User retries limit reached. Please contact support for assistance.",
            errors: {},
            phase: "request",
            inputs: rawData,
          };
        }

        if (userData.status === "inactive") {
          return {
            success: false,
            message: "User is inactive. Please contact support for assistance.",
            errors: {},
            phase: "request",
            inputs: rawData,
          };
        }

        const activationCode = generateActivationCode();
        await updateUserStatus(userData.id, activationCode);

        const emailSendResult = await sendEmail({
          to: validatedData.data.email,
          subject: "Password Reset Request for Booking Ready",
          text: `A request to reset your Booking Ready password was received.\n\nYour password recovery code is: ${activationCode}\n\nIf you did not request a password reset, you can safely ignore this email.`,
          html: `<p>A request to reset your <strong>Booking Ready</strong> password was received.</p>
            <p style="font-size:1.2em;"><b>Your password recovery code:</b> <span style="font-size:1.5em; letter-spacing:2px;">${activationCode}</span></p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>`,
        });

        if (!emailSendResult.success) {
          return {
            success: false,
            message: "Error sending email verification, please try again later or contact support",
            errors: {},
            phase: "request",
            inputs: rawData,
          };
        }

        await createRecoverySession(userData.id);

        return {
          success: true,
          message: "User provided valid email address",
          errors: {},
          phase: "validate",
          inputs: validatedData.data,
        };
      } catch (error) {
        console.error("Error validating user:", error);
        return {
          success: false,
          message: "Error validating user, please try again later or contact support",
          errors: {},
          phase: "request",
          inputs: rawData,
        };
      }

      break;
    }

    case "validate": {
      const validatedData = RecoveryValidateSchema.safeParse(rawData);
      if (!validatedData.success) {
        return {
          success: false,
          message: "Please fix the errors in the form",
          errors: getFormattedErrors(validatedData.error),
          phase: "validate",
          inputs: rawData,
        };
      }

      const recoveryPayload = await getRecoveryAuth();

      if (!recoveryPayload) {
        return {
          success: false,
          message: "Your current session has expired. Please repeat the process.",
          errors: {},
          phase: "request",
        };
      }

      const userData: DbUser | null = await dbGetUserByField("id", recoveryPayload.id);
      if (!userData) {
        await destroyRecoverySession();
        return {
          success: false,
          message: "Your current session is expired. Please repeat the process.",
          errors: {},
          phase: "request",
        };
      }

      if (userData.status !== validatedData.data.validate) {
        return {
          success: false,
          message: "Wrong activation code provided, please try again",
          errors: {},
          phase: "validate",
          inputs: rawData,
        };
      }

      if (new Date(userData.updated_at) < new Date(Date.now() - recoveryCookie.duration)) {
        await destroyRecoverySession();
        return {
          success: false,
          message: "Activation code expired. Please try password recovery again.",
          errors: {},
          phase: "request",
        };
      }

      return {
        success: true,
        message: "User provided valid activation code",
        errors: {},
        phase: "reset",
        inputs: validatedData.data,
      };
    }

    case "reset": {
      const validatedData = RecoveryResetSchema.safeParse(rawData);
      if (!validatedData.success) {
        return {
          success: false,
          message: "Please fix the errors in the form",
          errors: getFormattedErrors(validatedData.error),
          phase: "reset",
          inputs: rawData,
        };
      }

      const recoveryPayload = await getRecoveryAuth();

      if (!recoveryPayload) {
        return {
          success: false,
          message: "Your current session has expired. Please repeat the process.",
          errors: {},
          phase: "request",
        };
      }

      const userData: DbUser | null = await dbGetUserByField("id", recoveryPayload.id);
      if (!userData) {
        await destroyRecoverySession();
        return {
          success: false,
          message: "Your current session is expired. Please repeat the process.",
          errors: {},
          phase: "request",
        };
      }

      await updatePassword(recoveryPayload.id, validatedData.data.password1);
      await updateUserStatus(recoveryPayload.id, "active");
      await updateRetries(userData.email, 0);
      await destroyRecoverySession();

      return {
        success: true,
        message: "User provided valid new password",
        errors: {},
        phase: "finish",
        inputs: validatedData.data,
      };
    }
  }

  // Catch-all: handle unexpected or missing phase
  return {
    success: false,
    message: "Unexpected error occurred. Please try again later or contact support.",
    errors: {},
    phase: "request",
    inputs: rawData,
  };
}

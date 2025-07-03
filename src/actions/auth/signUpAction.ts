"use server";

import { dbInsertUser, dbGetUserByField, updateUserStatus } from "@/utils/supabase";
import {
  ActionResponseSignUp,
  DbUser,
  SignUpMainFormData,
  SignUpPhase,
  SignUpSetupFormData,
  SignUpValidateFormData,
} from "@/types";
import { parseAirbnbUrl, generateActivationCode, checkUserRetryLimit } from "@/utils/helpers";
import { activationCodePattern, getFormattedErrors, SignUpMainSchema, SignUpValidateSchema } from "@/utils/zod";
import { sendEmail } from "@/utils/mailer";
import { createAuthSession, createSignUpSession, destroySignUpSession, getSignUpAuth } from "@/utils/auth";
import { extractListingAction } from "../extractListingAction";

export async function signUpAction(
  prevState: ActionResponseSignUp | null,
  formData: FormData
): Promise<ActionResponseSignUp> {
  // Form inputs validation ----------------------------------------
  const rawData: SignUpMainFormData | SignUpValidateFormData | SignUpSetupFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    airbnbUrl: formData.get("airbnbUrl") as string,
    terms: formData.get("terms") as "on",
    phase: formData.get("phase") as SignUpPhase,
    validationCode: formData.get("validationCode") as string,
  };

  console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Sign Up process initialized");

  switch (rawData.phase) {
    case "signup": {
      console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Sign Up process phase: process signup form");
      const validatedData = SignUpMainSchema.safeParse(rawData);
      if (!validatedData.success) {
        return {
          success: false,
          message: "Please fix the errors in the form",
          errors: getFormattedErrors(validatedData.error),
          phase: "signup",
          inputs: rawData,
        };
      }

      // Parse the airbnbUrl to get the follwing example data:
      // { url: 'https://www.airbnb.com/rooms/123456', id: '123456', type: 'room', tld: 'com' }
      const parsedUrl = parseAirbnbUrl(validatedData.data.airbnbUrl);

      // User auth validation ----------------------------------------

      // 1. Check if user already exists
      try {
        const userData: DbUser | null = await dbGetUserByField("email", validatedData.data.email);

        // If user exists
        if (userData) {
          // Check if user has reached retry limit and apply progressive delay
          const isRetryLimitReached = await checkUserRetryLimit(userData, validatedData.data.email);

          if (isRetryLimitReached) {
            return {
              success: false,
              message: "User retries limit reached. Please contact support for assistance.",
              errors: {},
              phase: "signup",
              inputs: validatedData.data,
            };
          }

          // Check if user is inactive
          if (userData.status === "inactive") {
            return {
              success: false,
              message: "User is inactive. Please contact support for assistance.",
              errors: {},
              phase: "signup",
              inputs: validatedData.data,
            };
          }

          // If user exists and is active
          if (userData.status === "active") {
            let message = "";
            // If active user with same email submitted the same listing id - suggest logging in
            if (userData.id === parsedUrl.id) {
              message = "User already exists with same listing id. You may log in instead.";
            } else {
              message = "If you wish to add a new listing, you can do it from your dashboard, after logging in.";
            }

            return {
              success: false,
              message,
              errors: {},
              phase: "signup",
              inputs: validatedData.data,
            };
          }

          // If user exists and the status field contains the activation code pattern
          // It indicates that that user haven't finished previously initiated registration process
          if (userData.status?.match(activationCodePattern)) {
            return {
              success: true,
              message: "Please finish the registration process by verifying your email address.",
              errors: {},
              phase: "validate",
              inputs: validatedData.data,
            };
          }
        }

        // If user with the submitted email does not exist in the database -------------------------------------------------------

        // Check if there is a user with the same listing id
        if (parsedUrl.id) {
          const userWithSameListingId = await dbGetUserByField("id", parsedUrl.id);
          if (userWithSameListingId) {
            return {
              success: false,
              message: "User with same listing id already exists. You may log in instead.",
              errors: {},
              phase: "signup",
              inputs: validatedData.data,
            };
          }
        }

        // User submitted a new valid email and listing id:
        // 1. generate the activation code
        const activationCode = generateActivationCode();

        // 2. create a new user in the database
        try {
          const insertedUser: DbUser | null = await dbInsertUser(validatedData.data, parsedUrl, activationCode);

          if (!insertedUser) {
            return {
              success: false,
              message: "Error creating user account, please try again later or contact support",
              errors: {},
              phase: "signup",
              inputs: validatedData.data,
            };
          }

          // Send email verification
          const emailSendResult = await sendEmail({
            to: validatedData.data.email,
            subject: "Verify your Booking Ready account",
            text: `Welcome to Booking Ready!\n\nTo complete your registration, please verify your email address.\n\nYour activation code is: ${activationCode}\n\nPlease enter this code in the verification form on our website to activate your account.\n\nIf you did not create an account, you can safely ignore this email.`,
            html: `<p>Welcome to <strong>Booking Ready</strong>!</p>
            <p>To complete your registration, please verify your email address.</p>
            <p style="font-size:1.2em;"><b>Your activation code:</b> <span style="font-size:1.5em; letter-spacing:2px;">${activationCode}</span></p>
            <p>Enter this code in the verification form on our website to activate your account.</p>
            <p style="color:#888; font-size:0.9em;">If you did not create an account, you can safely ignore this email.</p>`,
          });

          if (!emailSendResult.success) {
            return {
              success: false,
              message: "Error sending email verification, please try again later or contact support",
              errors: {},
              phase: "signup",
              inputs: validatedData.data,
            };
          }

          // Set auth session cookie with user id valid for 1 day
          await createSignUpSession(insertedUser.id);

          // Reset user retries
          const { updateRetries } = await import("@/utils/supabase");
          await updateRetries(validatedData.data.email, 0);

          // Usser account created succesfully and email verification sent
          return {
            success: true,
            message: "User created successfully",
            errors: {},
            phase: "validate",
            inputs: validatedData.data,
          };
        } catch (error) {
          console.error("SignUpAction Error creating user:", error);
          return {
            success: false,
            message: "Error creating user account 2, please try again later or contact support",
            errors: {},
            phase: "signup",
            inputs: validatedData.data,
          };
        }
      } catch (error) {
        console.error("SignUpAction Error fetching user data from database:", error);
        return {
          success: false,
          message: "Error processing the form, please try again later or contact support",
          errors: {},
          phase: "signup",
          inputs: validatedData.data,
        };
      }

      break;
    }

    case "validate": {
      console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Sign Up process phase: validate email");
      const validatedData = SignUpValidateSchema.safeParse(rawData);

      if (!validatedData.success) {
        return {
          success: false,
          message: "Please fix the errors in the form",
          errors: getFormattedErrors(validatedData.error),
          phase: "validate",
          inputs: rawData,
        };
      }

      // User auth validation ----------------------------------------

      // Get sign_up (payload) from "signUp" session cookie
      const authPayload = await getSignUpAuth();

      if (!authPayload) {
        return {
          success: false,
          message: "Your current session has expired. Please repeat the process.",
          errors: {},
          phase: "validate",
          inputs: undefined,
        };
      }

      // Check if user with the sign_up id exists in the database
      const userData: DbUser | null = await dbGetUserByField("id", authPayload.id);
      if (!userData) {
        await destroySignUpSession();
        return {
          success: false,
          message: "Your current session is expired. Please repeat the process.",
          errors: {},
          phase: "validate",
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
          phase: "validate",
          inputs: validatedData.data,
        };
      }

      // Check if user is inactive
      if (userData.status === "inactive") {
        await destroySignUpSession();
        return {
          success: false,
          message: "User is inactive. Please contact support for assistance.",
          errors: {},
          phase: "validate",
          inputs: validatedData.data,
        };
      }

      // If user with the sign_up ID exists and is active, check if the activation code is correct
      if (userData.status !== validatedData.data.validationCode) {
        return {
          success: false,
          message: "Wrong activation code provided, please try again",
          errors: {},
          phase: "validate",
          inputs: validatedData.data,
        };
      }

      // If user with the sign_up ID submitted the right activation code check if it expired (withing 1h)
      if (userData.updated_at < new Date(Date.now() - 60 * 60 * 1000)) {
        await destroySignUpSession();
        return {
          success: false,
          message: "Activation code expired. Please try again.",
          errors: {},
          phase: "validate",
          inputs: validatedData.data,
        };
      }

      // If user with the authEmail submitted the right activation code and it is not expired:
      // Return success response
      return {
        success: true,
        message: "User activated successfully",
        errors: {},
        phase: "setup",
        inputs: validatedData.data,
      };

      break;
    }

    case "setup": {
      console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Sign Up process phase: initiate property listing extraction");
      const signUpAuth = await getSignUpAuth();
      if (!signUpAuth) {
        return {
          success: false,
          message: "Your current session has expired. Please repeat the process.",
          errors: {},
          phase: "setup",
          inputs: undefined,
        };
      }
      const extractListingData = await extractListingAction(signUpAuth.id);

      if (!extractListingData.success) {
        return {
          success: false,
          message: extractListingData.message,
          errors: {},
          phase: "setup",
          inputs: undefined,
        };
      }

      // Reset user retries
      const { updateRetries } = await import("@/utils/supabase");
      await updateRetries(signUpAuth.email, 0);

      // Update user status
      await updateUserStatus(signUpAuth.id, "active");

      // Sign in user
      await createAuthSession(signUpAuth.id);

      // Destroy sign_up session
      await destroySignUpSession();

      console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Sign up process completed successfully");

      // Sign up process completed successfully
      return {
        success: true,
        message: "Setup complete",
        errors: {},
        phase: "finish",
        inputs: undefined,
      };

      break;
    }
  }

  // Catch-all: handle unexpected or missing phase
  return {
    success: false,
    message: "Unexpected error occurred. Please try again later or contact support.",
    errors: {},
    phase: "signup",
    inputs: rawData,
  };
}

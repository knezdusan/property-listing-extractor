"use server";

import { updateUserTimestamp, updateRetries, dbInsertUser, dbGetUserByField } from "@/utils/supabase";
import { ActionResponseSignUp, DbUser, SignUpFormData } from "@/types";
import { wait, parseAirbnbUrl, generateActivationCode } from "@/utils/helpers";
import { activationCodePattern, SignUpSchema } from "@/utils/zod";
import z from "zod/v4";
import { sendEmail } from "@/utils/mailer";
import { createAuthSession } from "@/utils/auth";

export async function signUpAction(
  prevState: ActionResponseSignUp | null,
  formData: FormData
): Promise<ActionResponseSignUp> {
  // Form inputs validation ----------------------------------------
  await wait(1);

  const rawData: SignUpFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    airbnbUrl: formData.get("airbnbUrl") as string,
    terms: formData.get("terms") as "on",
  };

  const validatedData = SignUpSchema.safeParse(rawData);

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

  // Parse the airbnbUrl to get the follwing example data:
  // { url: 'https://www.airbnb.com/rooms/123456', id: '123456', type: 'room', tld: 'com' }
  const parsedUrl = parseAirbnbUrl(validatedData.data.airbnbUrl);

  // User auth validation ----------------------------------------

  // 1. Check if user already exists
  try {
    const userData: DbUser | null = await dbGetUserByField("email", validatedData.data.email);

    // If user exists
    if (userData) {
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
      await wait(userData.retries * 1000);

      // Check if user is inactive
      if (userData.status === "inactive") {
        return {
          success: false,
          message: "User is inactive. Please contact support for assistance.",
          errors: {},
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
          inputs: validatedData.data,
        };
      }

      // Set auth session cookie with user id valid for 1 day
      await createAuthSession(insertedUser.id);

      // Reset user retries
      await updateRetries(validatedData.data.email, 0);

      // Usser account created succesfully and email verification sent
      return {
        success: true,
        message: "User created successfully",
        errors: {},
        inputs: validatedData.data,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        message: "Error creating user account 2, please try again later or contact support",
        errors: {},
        inputs: validatedData.data,
      };
    }
  } catch (error) {
    console.error("Error fetching user data from database:", error);
    return {
      success: false,
      message: "Error processing the form, please try again later or contact support",
      errors: {},
      inputs: validatedData.data,
    };
  }
}

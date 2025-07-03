import { z } from "zod/v4";

// Validation patterns
export const passwordPattern = /^(?=.*[!@#$%^&*()_+\-=])[A-Za-z0-9!@#$%^&*()_+\-=]{8,20}$/;
export const airbnbUrlPattern =
  /^https?:\/\/(www\.)?airbnb\.[a-z]{2,6}(\/rooms\/[0-9]{6,25}|\/h\/[a-z0-9\-]{3,100})(\?.*)?$/;
export const activationCodePattern = /^[a-z0-9!@#$%^&*]{10}$/;

export const airbnbUrlIdPattern = /^(?:[0-9]{6,25}|[a-z0-9\-]{3,100})$/; // covers both room and host (slug based) type of id
export const airbnbUrlIdPatternNumeric = /^[0-9]{6,25}$/;
export const airbnbUrlIdPatternSlug = /^[a-z0-9\-]{3,100}$/;

export const AuthSchema = z.object({
  email: z
    .email({
      pattern: z.regexes.unicodeEmail,
      error: "Please enter a valid email address (e.g., user@domain.com)",
    })
    .trim(),
  password: z
    .string()
    .trim()
    .min(8, { error: "Password must be at least 8 characters long" })
    .max(20, { error: "Password cannot exceed 20 characters" })
    .regex(passwordPattern, {
      error: "Password must include at least one special character (e.g., !@#$%^&*()_+-=)",
    }),
});

// Sign Up -----------------------------

export const SignUpMainSchema = AuthSchema.extend({
  phase: z.literal("signup"),
  airbnbUrl: z
    .url({ error: "Please enter a valid URL" })
    .trim()
    .transform((url) => {
      // Normalize non-.com URLs to airbnb.com
      try {
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.toLowerCase().endsWith("airbnb.com")) {
          return url.replace(parsedUrl.hostname, "airbnb.com");
        }
        return url;
      } catch {
        return url; // Return original if invalid (will fail regex)
      }
    })
    .refine((url) => airbnbUrlPattern.test(url), {
      error: "Valid Airbnb listing URL (e.g., https://www.airbnb.com/rooms/123456) must contain property ID",
    }),
  terms: z
    .union([z.literal("on"), z.null()])
    .refine((val) => val === "on", { message: "You must agree to the terms and privacy policy" }),
});

export const SignUpValidateSchema = z.object({
  phase: z.literal("validate"),
  validationCode: z
    .string()
    .trim()
    .min(10, { error: "Activation code must be at least 10 characters long" })
    .regex(activationCodePattern, {
      error: "Activation code must be 10 characters long and contain only letters, numbers, and special characters",
    }),
});

export const SignUpSetupSchema = z.object({
  phase: z.literal("setup"),
});

// Password Recovery ---------------------

export const RecoveryRequestSchema = z.object({
  phase: z.literal("request"),
  email: z
    .email({
      pattern: z.regexes.unicodeEmail,
      error: "Please enter a valid email address (e.g., user@domain.com)",
    })
    .trim(),
});
export const RecoveryValidateSchema = z.object({
  phase: z.literal("validate"),
  validate: z
    .string()
    .trim()
    .min(10, { error: "Validation code must be at least 10 characters long" })
    .regex(activationCodePattern, {
      error: "Validation code must be 10 characters long and contain only letters, numbers, and special characters",
    }),
});
export const RecoveryResetSchema = z
  .object({
    phase: z.literal("reset"),
    password1: z
      .string()
      .trim()
      .min(8, { error: "Password must be at least 8 characters long" })
      .max(20, { error: "Password cannot exceed 20 characters" })
      .regex(passwordPattern, {
        error: "Password must include at least one special character (e.g., !@#$%^&*()_+-=)",
      }),
    password2: z
      .string()
      .trim()
      .min(8, { error: "Confirm password must be at least 8 characters long" })
      .max(20, { error: "Confirm password cannot exceed 20 characters" })
      .regex(passwordPattern, {
        error: "Confirm password must include at least one special character (e.g., !@#$%^&*()_+-=)",
      }),
  })
  .refine((data) => data.password1 === data.password2, {
    message: "Passwords must match",
    path: ["password2"],
  });

// Account Verification ---------------------

export const AccountVerificationSchema = z.object({
  activationCode: z
    .string()
    .trim()
    .min(10, { error: "Activation code must be at least 10 characters long" })
    .regex(activationCodePattern, {
      error: "Activation code must be 10 characters long and contain only letters, numbers, and special characters",
    }),
});

// Extract Listing ---------------------

export const airbnbUrlIdSchema = z.string().trim().regex(airbnbUrlIdPattern, {
  error: "Valid Airbnb listing URL (e.g., https://www.airbnb.com/rooms/123456) must contain property ID",
});

// --------------- Utility functions -----------------------------------------------------------

/**
 * Formats Zod errors into a more user-friendly format.
 * @param error The Zod error to format.
 * @returns An object containing the formatted errors.
 * example:
 * {
 *  email: ["Email is required"],
 *  password: ["Password must be at least 8 characters long"]
 * }
 */
export function getFormattedErrors(error: z.ZodError) {
  // Use the recommended approach from Zod docs
  const fieldErrors: Record<string, string[]> = {};

  // Process each issue and organize by path
  for (const issue of error.issues) {
    const path = issue.path[0]?.toString();
    if (path) {
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }
  }

  return fieldErrors;
}

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

export const SignUpSchema = AuthSchema.extend({
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

export const AccountVerificationSchema = z.object({
  activationCode: z
    .string()
    .trim()
    .min(10, { error: "Activation code must be at least 10 characters long" })
    .regex(activationCodePattern, {
      error: "Activation code must be 10 characters long and contain only letters, numbers, and special characters",
    }),
});

export const airbnbUrlIdSchema = z.string().trim().regex(airbnbUrlIdPattern, {
  error: "Valid Airbnb listing URL (e.g., https://www.airbnb.com/rooms/123456) must contain property ID",
});

import { createClient } from "@supabase/supabase-js";
import { DbUser } from "@/types";
import bcrypt from "bcrypt";
import { unstable_cache, revalidateTag } from "next/cache";

// Initialize Supabase client
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Initialize Supabase client for server-side admin operations
export const supabaseServer = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/** --------------- Supabase Helpers Functions --------------- */

/**
 * Retrieves user data from Supabase by field
 * @param field The field of the user to retrieve
 * @param value The value of the field to retrieve
 * @returns The first user found with the given field and value, or null if not found
 */
export const dbGetUserByField = unstable_cache(
  async (field: string, value: string): Promise<DbUser | null> => {
    const { data, error } = await supabaseServer.from("users").select("*").eq(field, value).maybeSingle();

    if (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }

    return data as DbUser | null;
  },
  // Generates a unique key for the cache
  ["user-by-field"],
  {
    // Revalidate the cache using a tag.
    tags: ["users"],
    revalidate: 3600, // Optional: revalidate every hour as a fallback
  }
);

/**
 * Insert a new user into the User database table
 * @param validatedData The validated data of the user to insert
 * @param parsedUrl The parsed url of the users Airbnb listing to insert
 * @returns The inserted user data, or null if an error occurred
 */
export async function dbInsertUser(
  validatedData: { email: string; password: string },
  parsedUrl: { id: string; type: string; tld: string; url: string },
  activationCode: string
): Promise<DbUser | null> {
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  const { data, error } = await supabaseServer
    .from("users")
    .insert({
      id: parsedUrl.id,
      email: validatedData.email,
      password: hashedPassword,
      main_url: parsedUrl.url,
      status: activationCode,
      retries: 0, // Reset retries on new user
    })
    .select()
    .maybeSingle(); // Add .select() to return the inserted data

  if (error) {
    console.error("Error inserting user data:", error);
    return null;
  }

  // Return the inserted user data (will be an array)
  return data as DbUser | null;
}

/**
 * Updates the updated_at timestamp for a user in Supabase
 * @param userId The id of the user to update
 * @returns The updated user data, or null if an error occurred
 */
export async function updateUserTimestamp(userId: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .update({ updated_at: new Date() }) // Set updated_at to the current timestamp
    .eq("id", userId); // Specify the user id to update

  if (error) {
    console.error("Error updating timestamp:", error);
    return null;
  }

  // Invalidate the cache for all users after an update
  revalidateTag("users");

  return data as DbUser | null;
}

/**
 * Updates the retries count for a user in Supabase
 * @param email The email of the user to update
 * @param currentRetries The current number of retries
 * @returns The updated user data, or null if an error occurred
 */
export async function updateRetries(email: string, currentRetries: number) {
  const { data, error } = await supabaseServer
    .from("users")
    .update({ retries: currentRetries + 1 }) // Set retries to current retries + 1
    .eq("email", email); // Use email as the lookup field

  if (error) {
    console.error("Error updating retries:", error);
    return null;
  }

  // Invalidate the cache for all users after an update
  revalidateTag("users");

  return data as DbUser | null;
}

/**
 * Updates the status of a user in Supabase
 * @param userId The id of the user to update
 * @returns The updated user data, or null if an error occurred
 */
export async function updateUserStatus(userId: string, status: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .update({ status: status }) // Set status to the new status
    .eq("id", userId); // Specify the user id to update

  if (error) {
    console.error("Error updating status:", error);
    return null;
  }

  // Invalidate the cache for all users after an update
  revalidateTag("users");

  return data as DbUser | null;
}

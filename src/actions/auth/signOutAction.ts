"use server";

import { destroyAuthSession } from "@/utils/auth";

export async function signOutAction(email: string) {
  try {
    // Destroy the auth session cookie
    await destroyAuthSession();

    // Reset user retries
    const { updateRetries } = await import("@/utils/supabase");
    await updateRetries(email, 0);
    
    // Return a success response that the client can use
    return { success: true };
  } catch (error) {
    console.error("Error during sign out:", error);
    return { success: false };
  }
}

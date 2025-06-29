import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { AuthPayload, User } from "@/types";
import { cookies } from "next/headers";
import { dbGetUserByField } from "./supabase";
import { revalidateTag } from "next/cache";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: AuthPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // 1 day
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    // Check if session is empty or undefined
    if (!session || session.trim() === "") {
      return null;
    }
    
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    // Only log the error type, not the full stack trace in production
    console.log("Failed to verify session:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

export const authCookie = {
  name: "auth",
  options: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  },
  duration: 24 * 60 * 60 * 1000,
};

export async function createAuthSession(userId: string) {
  const expiresAt = new Date(Date.now() + authCookie.duration); // 1 day
  const payload = await encrypt({ userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(authCookie.name, payload, { ...authCookie.options, expires: expiresAt });
}

export async function getAuth(): Promise<User | null> {
  const cookieStore = await cookies();
  const auth = cookieStore.get(authCookie.name);
  const payload = auth ? await decrypt(auth.value) : null;

  // Type guard: ensure payload has the required properties
  if (
    payload &&
    typeof payload === "object" &&
    typeof (payload as AuthPayload).userId === "string" &&
    (payload as AuthPayload).expiresAt
  ) {
    const authPayload = payload as AuthPayload;

    // Check if session has expired
    if (authPayload.expiresAt < new Date()) {
      return null;
    }

    // Check if user exists
    const dbUser = await dbGetUserByField("id", authPayload.userId);
    if (!dbUser) {
      return null;
    }

    // During account verification, we need to allow users with verification codes
    // Only return null if status is explicitly 'inactive'
    if (dbUser.status === "inactive") {
      return null;
    }

    const { id, email } = dbUser;
    return { id, email };
  }
  return null;
}

export async function destroyAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookie.name);

  // revalidate the cache for all users
  revalidateTag("users");
}

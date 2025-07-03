import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { CookieConfig, User } from "@/types";
import { dbGetUserByField } from "./supabase";
import { revalidateTag } from "next/cache";

// --- JWT & Encryption Setup ---
const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET is not set");
}
const key = new TextEncoder().encode(secretKey);

async function encrypt(payload: Record<string, unknown>, expiresIn: string | number) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(key);
}

async function decrypt(input: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ["HS256"] });
    return payload;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

function createCookieConfig(name: string, duration: number): CookieConfig {
  return {
    name,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    duration,
  };
}

export const signUpCookie = createCookieConfig("sign_up", 60 * 60 * 1000); // 1 hour
export const authCookie = createCookieConfig("auth", 24 * 60 * 60 * 1000); // 24 hours
export const recoveryCookie = createCookieConfig("recovery_auth", 60 * 60 * 1000); // 1 hour

// --- Generic Session Helpers ---
type SessionPayload = {
  userId: string;
  expiresAt: Date;
  [key: string]: unknown; // Allow other properties
};

async function _createSession(userId: string, cookieConfig: CookieConfig) {
  const expiresAt = new Date(Date.now() + cookieConfig.duration);
  const payload = await encrypt({ userId, expiresAt }, `${cookieConfig.duration / 1000}s`);

  const cookieStore = await cookies();
  cookieStore.set(cookieConfig.name, payload, { ...cookieConfig.options, expires: expiresAt });
}

async function _getSessionPayload(cookieName: string): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName);
  const payload = sessionCookie ? await decrypt(sessionCookie.value) : null;

  if (payload && typeof payload === "object" && typeof payload.userId === "string" && typeof payload.exp === "number") {
    return {
      userId: payload.userId,
      expiresAt: new Date(payload.exp * 1000),
    };
  }
  return null;
}

async function _destroySession(cookieName: string, revalidate?: string) {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
  if (revalidate) {
    revalidateTag(revalidate);
  }
}

// --- SignUp Session Management ---
export async function createSignUpSession(userId: string) {
  await _createSession(userId, signUpCookie);
}

export async function getSignUpAuth(): Promise<User | null> {
  const payload = await _getSessionPayload(signUpCookie.name);

  if (!payload) return null;

  const dbUser = await dbGetUserByField("id", payload.userId);
  if (!dbUser) {
    return null;
  }

  // Allow users with either 'active' status or an activation code status
  // The activation code pattern is checked in the signUpAction.ts
  return { id: dbUser.id, email: dbUser.email };
}

export async function destroySignUpSession() {
  await _destroySession(signUpCookie.name);
}

// --- Auth Session Management ---
export async function createAuthSession(userId: string) {
  await _createSession(userId, authCookie);
}

export async function getAuth(): Promise<User | null> {
  const payload = await _getSessionPayload(authCookie.name);

  if (!payload) return null;

  const dbUser = await dbGetUserByField("id", payload.userId);
  if (!dbUser || dbUser.status !== "active") {
    return null;
  }

  return { id: dbUser.id, email: dbUser.email };
}

export async function destroyAuthSession() {
  await _destroySession(authCookie.name, "users");
}

// --- Recovery Session Management ---
export async function createRecoverySession(userId: string) {
  await _createSession(userId, recoveryCookie);
}

export async function getRecoveryAuth(): Promise<{ id: string } | null> {
  const payload = await _getSessionPayload(recoveryCookie.name);

  if (!payload) return null;

  const dbUser = await dbGetUserByField("id", payload.userId);
  if (!dbUser) {
    return null;
  }

  return { id: dbUser.id };
}

export async function destroyRecoverySession() {
  await _destroySession(recoveryCookie.name);
}

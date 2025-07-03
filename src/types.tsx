import { z } from "zod/v4";
import { AuthSchema, SignUpMainSchema, AccountVerificationSchema } from "./utils/zod";

export type AppModal = {
  appModalComponentName: string | null;
  setAppModalComponentName: (modal: string | null) => void;
};

export type AppContext = {
  auth: User | null;
  appModal: AppModal;
};

export type CookieConfig = {
  name: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    path: string;
  };
  duration: number; // in milliseconds
};

export type Auth = z.infer<typeof AuthSchema>;
export type SignUpFormData = z.infer<typeof SignUpMainSchema>;
export type AccountVerificationFormData = z.infer<typeof AccountVerificationSchema>;

export type DbUser = {
  id: string;
  email: string;
  password: string;
  main_url: string;
  status: string;
  retries: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
};

export type User = Pick<DbUser, "id" | "email">;

export type ActionResponse = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export type ActionResponseSignIn = ActionResponse & {
  inputs?: Auth;
};

// Sign Up -----------------------------

export type SignUpPhase = "signup" | "validate" | "setup" | "finish";

export type SignUpMainFormData = {
  email: string;
  password: string;
  airbnbUrl: string;
  terms: string | null;
  phase: SignUpPhase;
};

export type SignUpValidateFormData = {
  validationCode: string;
  phase: SignUpPhase;
};

export type SignUpSetupFormData = {
  phase: SignUpPhase;
};

export type ActionResponseSignUp = ActionResponse & {
  phase: SignUpPhase;
  inputs?: SignUpMainFormData | SignUpValidateFormData | SignUpSetupFormData;
};

// Password Recovery --------------------

export type RecoveryPhase = "request" | "validate" | "reset" | "finish";

export type RecoveryRequestFormData = {
  email: string;
  phase: RecoveryPhase;
};

export type RecoveryValidateFormData = {
  validate: string;
  phase: RecoveryPhase;
};

export type RecoveryResetFormData = {
  password1: string;
  password2: string;
  phase: RecoveryPhase;
};

export type ActionResponseRecovery = ActionResponse & {
  phase: RecoveryPhase;
  inputs?: RecoveryRequestFormData | RecoveryValidateFormData | RecoveryResetFormData;
};

// Email -------------------------------

export type EmailData = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailSendResult = {
  success: boolean;
  message?: string;
};

// Account Verification -------------------------------

export type ActionResponseAccountVerification = ActionResponse & {
  inputs?: AccountVerificationFormData;
};

export type AuthPayload = {
  userId: string;
  expiresAt: Date;
};

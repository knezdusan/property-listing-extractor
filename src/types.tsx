import { z } from "zod/v4";
import { AuthSchema, SignUpSchema, AccountVerificationSchema } from "./utils/zod";

export type AppModal = {
  appModalComponentName: string | null;
  setAppModalComponentName: (modal: string | null) => void;
};

export type AppContext = {
  auth: User | null;
  appModal: AppModal;
};

export type Auth = z.infer<typeof AuthSchema>;
export type SignUpFormData = z.infer<typeof SignUpSchema>;
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

export type ActionResponseSignUp = ActionResponse & {
  inputs?: SignUpFormData;
};

export type ActionResponseAccountVerification = ActionResponse & {
  inputs?: AccountVerificationFormData;
};

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

export type AuthPayload = {
  userId: string;
  expiresAt: Date;
};

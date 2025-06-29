"use client";

import { useAppContext } from "../contexts/AppContext";
import { MdLogout, MdPerson, MdPersonAdd } from "react-icons/md";
import { signOutAction } from "@/actions/auth/signOutAction";
import { useRouter } from "next/navigation";

type NavAuthProps = {
  className?: string;
};

export default function NavAuth({ className }: NavAuthProps) {
  const appState = useAppContext();
  const { setAppModalComponentName } = appState.appModal;
  const router = useRouter();

  const handleSignOut = async () => {
    const email = appState.auth?.email;
    if (!email) return;

    const result = await signOutAction(email);

    if (result.success) {
      // Navigate to home page and force a full refresh
      router.push("/");
      // Force a full page refresh to clear any client-side state
      window.location.href = "/";
    }
  };

  return appState.auth ? (
    // User is LOGGED IN, show Sign Out
    <div className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSignOut();
        }}
      >
        <button
          type="submit"
          className={className}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "inherit",
            textDecoration: "underline",
          }}
        >
          <MdLogout /> Sign Out
        </button>
      </form>
    </div>
  ) : (
    // User is LOGGED OUT, show Sign In / Sign Up
    <div className={className}>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setAppModalComponentName("FormSignIn");
        }}
      >
        <MdPerson /> {"  "}Sign In
      </a>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setAppModalComponentName("FormSignUp");
        }}
      >
        <MdPersonAdd /> {"  "} Sign Up
      </a>
    </div>
  );
}

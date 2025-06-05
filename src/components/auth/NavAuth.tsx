"use client";

import { useAppContext } from "../contexts/AppContext";

type NavAuthProps = {
  className?: string;
};

export default function NavAuth({ className }: NavAuthProps) {
  const appState = useAppContext();
  const { setAppModalComponentName } = appState.appModal;

  return (
    <>
      <div className={className}>
        <a href="#" className="nav-auth__sign-in" onClick={() => setAppModalComponentName("FormSignIn")}>
          Sign In
        </a>
        <a href="#" className="nav-auth__sign-up" onClick={() => setAppModalComponentName("FormSignUp")}>
          Sign Up
        </a>
      </div>
    </>
  );
}

"use client";

import { useAppContext } from "../contexts/AppContext";

export default function AuthLaunchButton() {
  const appState = useAppContext();
  const { setAppModalComponentName } = appState.appModal;

  return (
    <button
      className="btn btn-large btn-transparent"
      style={{ margin: "5rem auto", display: "block", padding: "1rem 5rem" }}
      onClick={() => {
        setAppModalComponentName("FormSignUp");
      }}
    >
      Launch Sign Up Modal
    </button>
  );
}

"use client";

import { useAppContext } from "../contexts/AppContext";
import { MdPerson, MdPersonAdd } from "react-icons/md";

type NavAuthProps = {
  className?: string;
};

export default function NavAuth({ className }: NavAuthProps) {
  const appState = useAppContext();
  const { setAppModalComponentName } = appState.appModal;

  return (
    <>
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
    </>
  );
}

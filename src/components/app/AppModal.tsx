"use client";

import { useRef, useEffect } from "react";
import { useAppContext } from "@/components/contexts/AppContext";
import dynamic from "next/dynamic";

// Define allowed modal component names as a type
type AppModalComponentName = "FormSignIn" | "FormSignUp";

// Lazy load all modal components with type safety
const modalComponents: Record<AppModalComponentName, React.ComponentType> = {
  FormSignIn: dynamic(() => import("@/components/auth/FormSignIn"), { loading: () => <p>Loading...</p> }),
  FormSignUp: dynamic(() => import("@/components/auth/FormSignUp"), { loading: () => <p>Loading...</p> }),
  // Add more modals here as needed
};

export default function AppModal() {
  const appModal = useRef<HTMLDialogElement | null>(null);
  const appState = useAppContext();
  const { appModalComponentName, setAppModalComponentName } = appState.appModal;

  useEffect(() => {
    if (!appModalComponentName) return;
    appModal.current?.showModal();
  }, [appModalComponentName]);

  const closeModal = () => {
    appModal.current?.close();
    setAppModalComponentName(null);
  };

  // Check if the requested component exists in our modalComponents object
  const ModalComponent =
    appModalComponentName && appModalComponentName in modalComponents
      ? modalComponents[appModalComponentName as AppModalComponentName]
      : null;

  return (
    <dialog ref={appModal} className="app-modal" aria-modal="true" aria-labelledby="modal-title">
      {ModalComponent ? (
        <div className="modal-content">
          <button type="button" className="modal-close" onClick={closeModal} aria-label="Close">
            &times;
          </button>
          <ModalComponent />
        </div>
      ) : null}
    </dialog>
  );
}

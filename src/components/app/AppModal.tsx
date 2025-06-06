"use client";

import { useRef, useEffect, useCallback } from "react";
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

  // Trap focus inside modal
  const trapFocus = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Tab" && appModal.current) {
        // Get all focusable elements inside the modal
        const focusableElements = appModal.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        // Convert NodeList to Array for easier handling
        const focusableArray = Array.from(focusableElements);
        // If no focusable elements, do nothing
        if (focusableArray.length === 0) return;

        const firstElement = focusableArray[0] as HTMLElement;
        const lastElement = focusableArray[focusableArray.length - 1] as HTMLElement;

        const tabForwards = !e.shiftKey && document.activeElement === lastElement;
        const tabBackwards = e.shiftKey && document.activeElement === firstElement;

        if (tabForwards) {
          e.preventDefault();
          firstElement.focus();
        } else if (tabBackwards) {
          e.preventDefault();
          lastElement.focus();
        }
      }
    },
    [appModal]
  );

  // Open Modal and Attach trapFocus function to dialog on keydown
  const openModal = useCallback(() => {
    appModal.current?.showModal();
    appModal.current?.addEventListener("keydown", trapFocus);
  }, [appModal, trapFocus]);

  const closeModal = useCallback(() => {
    appModal.current?.close();
    setAppModalComponentName(null);
    document.body.style.overflow = "auto";
    appModal.current?.removeEventListener("keydown", trapFocus);
  }, [setAppModalComponentName, trapFocus]);

  useEffect(() => {
    if (!appModalComponentName) return;
    const modalElement = appModal.current;
    openModal();
    document.body.style.overflow = "hidden";
    modalElement?.addEventListener("close", closeModal);
    return () => {
      modalElement?.removeEventListener("close", closeModal);
    };
  }, [appModalComponentName, closeModal, openModal]);

  // Check if the requested component exists in our modalComponents object
  const ModalComponent =
    appModalComponentName && appModalComponentName in modalComponents
      ? modalComponents[appModalComponentName as AppModalComponentName]
      : null;

  return (
    <dialog ref={appModal} className="app-modal" aria-modal="true" aria-labelledby="modal-title">
      <article className="app-modal-content">
        <button type="button" className="modal-close" onClick={closeModal} aria-label="Close modal">
          <span className="sr-only">Close modal</span>
          &times;
        </button>
        {ModalComponent ? <ModalComponent /> : null}
      </article>
    </dialog>
  );
}

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useAppContext } from "@/components/contexts/AppContext";
import dynamic from "next/dynamic";
import { MdClose, MdErrorOutline } from "react-icons/md";
import IconTooltip from "../ui/IconTooltip";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ErrorBoundary from "../ui/ErrorBoundary";

// Define allowed modal component names as a type
type AppModalComponentName = "FormSignIn" | "FormSignUp" | "FormAccountVerification" | "Intro";

// Lazy load all modal components with type safety
const modalComponents: Record<AppModalComponentName, React.ComponentType> = {
  FormSignIn: dynamic(() => import("@/components/auth/FormSignIn"), { ssr: false }),
  FormSignUp: dynamic(() => import("@/components/auth/FormSignUp"), { ssr: false }),
  FormAccountVerification: dynamic(() => import("@/components/auth/FormAccountVerification"), { ssr: false }),
  Intro: dynamic(() => import("@/components/auth/Intro"), { ssr: false }),
  // Add more modals here as needed
};

export default function AppModal() {
  const appModal = useRef<HTMLDialogElement | null>(null);
  const appState = useAppContext();
  const { appModalComponentName, setAppModalComponentName } = appState.appModal;
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Use the custom focus trap hook
  const trapFocus = useFocusTrap(appModal);

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
    if (!appModalComponentName) {
      setIsContentLoaded(false);
      setIsModalVisible(false);
      return;
    }

    // Reset states when modal component changes
    setIsContentLoaded(false);
    setIsModalVisible(false);

    // Use a short timeout to allow React to process state changes
    const loadingTimer = setTimeout(() => {
      setIsContentLoaded(true);
    }, 100);

    return () => clearTimeout(loadingTimer);
  }, [appModalComponentName]);

  // Effect to handle modal visibility after content is loaded
  useEffect(() => {
    if (!appModalComponentName || !isContentLoaded) return;

    const modalElement = appModal.current;

    // Short timeout is to allow the modal to be fully rendered before opening it
    const visibilityTimer = setTimeout(() => {
      setIsModalVisible(true);
      openModal();
      document.body.style.overflow = "hidden";
    }, 50);

    modalElement?.addEventListener("close", closeModal);

    return () => {
      clearTimeout(visibilityTimer);
      modalElement?.removeEventListener("close", closeModal);
    };
  }, [appModalComponentName, isContentLoaded, closeModal, openModal]);

  // Check if the requested component exists in our modalComponents object
  const ModalComponent =
    appModalComponentName && appModalComponentName in modalComponents
      ? modalComponents[appModalComponentName as AppModalComponentName]
      : null;

  // Error handler for the modal content
  const handleModalError = useCallback((error: Error) => {
    console.error("Modal component error:", error);
    // You could also log this to an error tracking service
  }, []);

  // Fallback UI for when a modal component fails to load
  const errorFallback = (
    <div className="modal-error">
      <MdErrorOutline size={32} />
      <h3>Something went wrong</h3>
      <p>We couldn&apos;t load this content. Please try again later.</p>
      <button onClick={closeModal} className="btn btn-primary">
        Close
      </button>
    </div>
  );

  // Preload the component but don't show the modal yet
  const modalContent = (
    <>
      {appModalComponentName && isContentLoaded && (
        <div className="app-modal-content">
          <ErrorBoundary fallback={errorFallback} onError={handleModalError}>
            {ModalComponent ? <ModalComponent /> : null}
          </ErrorBoundary>
        </div>
      )}
      {isModalVisible && (
        <IconTooltip onClick={closeModal} tooltip="Close form">
          <MdClose />
        </IconTooltip>
      )}
    </>
  );

  return (
    <dialog
      ref={appModal}
      className={`modal app-modal ${isModalVisible ? "visible" : "hidden"}`}
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {modalContent}
    </dialog>
  );
}

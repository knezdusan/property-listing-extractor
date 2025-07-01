"use client";

import { useActionState, useEffect, useRef } from "react";
import { useAppContext } from "@/components/contexts/AppContext";
import { extractListingAction } from "@/actions/extractListingAction";

const initialState = {
  success: false,
  message: "",
};

export default function Intro() {
  const [state, formAction, isPending] = useActionState(extractListingAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const hasRedirected = useRef(false);
  const hasSubmitted = useRef(false);
  const { setAppModalComponentName } = useAppContext().appModal;

  // Submit form once on mount
  useEffect(() => {
    if (!hasSubmitted.current && formRef.current) {
      hasSubmitted.current = true;
      formRef.current.requestSubmit();
    }
  }, []);

  // Handle redirect when server action completes successfully
  useEffect(() => {
    if (state.success && !hasRedirected.current) {
      hasRedirected.current = true;

      // Prevent any further form submissions
      hasSubmitted.current = true;

      // Close modal first
      setAppModalComponentName(null);

      // Then navigate to dashboard with a delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    }
  }, [state.success, setAppModalComponentName]);

  return (
    <div>
      <h1>Intro</h1>
      <form ref={formRef} action={formAction} {...(isPending && { inert: true })} className="hidden">
        <input type="hidden" name="autoSubmit" value="true" />
      </form>

      {isPending && <p>Processing...</p>}
      {state.message && <p>{state.message}</p>}
      {state.success && <p>Success! Redirecting to dashboard...</p>}
    </div>
  );
}

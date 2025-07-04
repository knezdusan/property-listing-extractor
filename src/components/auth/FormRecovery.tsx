import { useActionState, useState, useEffect } from "react";
import { ActionResponseRecovery } from "@/types";
import FormNotification from "../ui/FormNotification";
import FormSpinner from "../ui/FormSpinner";
import { useAppContext } from "../contexts/AppContext";
import { recoveryAction } from "@/actions/auth/recoveryAction";

const initialState: ActionResponseRecovery = {
  success: false,
  phase: "request", // request | validate | reset | finish
  message: "",
  errors: {},
  inputs: {
    email: "",
    phase: "request",
  },
};

export default function FormRecovery() {
  const [state, formAction, isPending] = useActionState(recoveryAction, initialState);
  const [retryCount, setRetryCount] = useState(0);
  const { appModal } = useAppContext();
  const { setAppModalComponentName } = appModal;

  // Handle phase transitions and successful completion
  useEffect(() => {
    if (state.success) {
      // Redirect to sign in modal after the final "finish" phase
      if (state.phase === "finish") {
        setAppModalComponentName("FormSignIn");
      }
      // Other phases just update the form state - no redirect needed
    }
  }, [state.success, state.phase, setAppModalComponentName]);

  return (
    <div className="form-container">
      <form className="form-auth form-auth-recovery" action={formAction} {...(isPending && { inert: true })}>
      <h2>Password Reset</h2>
      <div className="form-group auth-progress">
        <div className="auth-phase-box request">
          <div className={`auth-phase ${state.phase === "request" ? "phse-active" : ""}`}>1</div>
          <div>Request</div>
        </div>
        <div className="auth-phase-box validate">
          <div className={`auth-phase ${state.phase === "validate" ? "phse-active" : ""}`}>2</div>
          <div>Validate</div>
        </div>
        <div className="auth-phase-box reset">
          <div className={`auth-phase ${state.phase === "reset" ? "phse-active" : ""}`}>3</div>
          <div>Reset</div>
        </div>
      </div>

      {state.phase === "request" && (
        <>
          <p>Enter your email address to reset your password.</p>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your.email@example.com"
              defaultValue={
                state.phase === "request" && state.inputs && "email" in state.inputs ? state.inputs.email : ""
              }
              required
              pattern="^[^@]+@[^@]+\.[^@]+$"
              title="Please enter a valid email address"
              autoComplete="email"
              autoFocus
            />
            {state.errors?.email && <p className="input-error">{state.errors.email[0]}</p>}
          </div>
        </>
      )}

      {state.phase === "validate" && (
        <>
          <p>Enter the validation code sent to your email address.</p>
          <div className="form-group">
            <label htmlFor="validate">Validate</label>
            <input
              type="text"
              id="validate"
              name="validate"
              placeholder="**********"
              defaultValue={
                state.phase === "validate" && state.inputs && "validate" in state.inputs ? state.inputs.validate : ""
              }
              required
              pattern="^[a-z0-9!@#$%^&*]{10}$"
              title="Please enter a valid validation code"
              autoFocus
            />
            {state.errors?.validate && <p className="input-error">{state.errors.validate[0]}</p>}
          </div>
        </>
      )}

      {state.phase === "reset" && (
        <>
          <p>Enter your new password.</p>
          <div className="form-group">
            <label htmlFor="password1">Password</label>
            <input
              type="password"
              id="password1"
              name="password1"
              placeholder="8-20 characters including special"
              defaultValue={
                state.phase === "reset" && state.inputs && "password1" in state.inputs ? state.inputs.password1 : ""
              }
              required
              minLength={8}
              maxLength={20}
              pattern="^(?=.*[!@#$%^&*\(\)_+\-\=])[A-Za-z0-9!@#$%^&*\(\)_+\-\=]{8,20}$"
              title="Password must be 8-20 characters long and include at least one special character (e.g., !@#$%^&*()_+-=)"
              autoComplete="new-password"
            />
            {state.errors?.password1 && <p className="input-error">{state.errors.password1[0]}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
            <input
              type="password"
              id="password2"
              name="password2"
              placeholder="8-20 characters including special"
              defaultValue={
                state.phase === "reset" && state.inputs && "password2" in state.inputs ? state.inputs.password2 : ""
              }
              required
              minLength={8}
              maxLength={20}
              pattern="^(?=.*[!@#$%^&*\(\)_+\-\=])[A-Za-z0-9!@#$%^&*\(\)_+\-\=]{8,20}$"
              title="Password must be 8-20 characters long and include at least one special character (e.g., !@#$%^&*()_+-=)"
              autoComplete="new-password"
            />
            {state.errors?.password2 && <p className="input-error">{state.errors.password2[0]}</p>}
          </div>
        </>
      )}

      {state?.message && !state.success && <FormNotification status="error">{state.message}</FormNotification>}

      <input type="hidden" name="phase" value={state.phase} />

      {retryCount < 10 && (
        <button
          disabled={isPending}
          className="btn btn-auth btn-auth-sign-up btn-transparent"
          type="submit"
          onClick={() => setRetryCount(retryCount + 1)}
        >
          {isPending ? "Submitting..." : "Submit"}
        </button>
      )}

      <div className="form-group form-footer">
        Remember your password?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            appModal.setAppModalComponentName("FormSignIn");
          }}
        >
          Login here
        </a>
      </div>
      </form>
      {isPending && <FormSpinner />}
    </div>
  );
}

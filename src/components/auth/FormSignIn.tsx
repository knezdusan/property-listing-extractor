import { useActionState, useState, useEffect } from "react";
import { signInAction } from "@/actions/auth/signInAction";
import { ActionResponseSignIn } from "@/types";
import FormNotification from "../ui/FormNotification";
import { useAppContext } from "../../contexts/AppContext";
import { useRouter } from "next/navigation";
import FormSpinner from "../ui/FormSpinner";

const initialState: ActionResponseSignIn = {
  success: false,
  message: "",
  errors: {},
  inputs: {
    email: "",
    password: "",
  },
};

export default function FormSignIn() {
  const { appModal } = useAppContext();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const [retryCount, setRetryCount] = useState(0);

  // If the login form is submitted successfully, redirect user to the dashboard
  useEffect(() => {
    if (state.success) {
      // Only close the modal and redirect on successful login
      appModal.setAppModalComponentName(null);
      router.push("/dashboard");
    }
  }, [state.success, router, appModal]);

  return (
    <div className="form-container">
      <form className="form-auth form-auth-sign-in" action={formAction} {...(isPending && { inert: true })}>
        <h2>Login</h2>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your.email@example.com"
            defaultValue={state.inputs?.email}
            required
            pattern="^[^@]+@[^@]+\.[^@]+$"
            title="Please enter a valid email address"
            autoComplete="email"
            autoFocus
          />
          {state.errors?.email && <p className="input-error">{state.errors.email[0]}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="8-20 characters including special"
            defaultValue={state.inputs?.password}
            required
            minLength={8}
            maxLength={20}
            pattern="^(?=.*[!@#$%^&*\(\)_+\-\=])[A-Za-z0-9!@#$%^&*\(\)_+\-\=]{8,20}$"
            title="Password must be 8-20 characters long and include at least one special character (e.g., !@#$%^&*()_+-=)"
            autoComplete="new-password"
          />
          <div className="form-group form-footer">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                appModal.setAppModalComponentName("FormRecovery");
              }}
            >
              Forgot password?
            </a>
          </div>
          {state.errors?.password && <p className="input-error">{state.errors.password[0]}</p>}
        </div>

        {state?.message && !state.success && <FormNotification status="error">{state.message}</FormNotification>}

        {retryCount < 5 && (
          <button
            disabled={isPending}
            className="btn btn-auth btn-auth-sign-up btn-transparent"
            type="submit"
            onClick={() => setRetryCount(retryCount + 1)}
          >
            {isPending ? "Signing In..." : "Sign In"}
          </button>
        )}

        <div className="form-group form-footer">
          Don&apos;t have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              appModal.setAppModalComponentName("FormSignUp");
            }}
          >
            Sign up
          </a>
        </div>
      </form>
      {isPending && <FormSpinner />}
    </div>
  );
}

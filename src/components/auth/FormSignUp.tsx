import { useEffect, useActionState, useState } from "react";
import { signUpAction } from "@/actions/auth/signUpAction";
import { ActionResponseSignUp } from "@/types";
import FormNotification from "../ui/FormNotification";
import { useAppContext } from "../contexts/AppContext";

const initialState: ActionResponseSignUp = {
  success: false,
  message: "",
  errors: {},
  inputs: {
    email: "",
    password: "",
    airbnbUrl: "",
    terms: null,
  },
};

export default function FormSignUp() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const [retryCount, setRetryCount] = useState(0);
  const { appModal } = useAppContext();
  const { setAppModalComponentName } = appModal;

  // If the form is submitted successfully, open the account verification modal
  useEffect(() => {
    if (state.success) {
      setAppModalComponentName("FormAccountVerification");
    }
  }, [state.success, setAppModalComponentName]);

  return (
    <form className="frm-auth frm-auth-sign-up" action={formAction} {...(isPending && { inert: true })}>
      <h2>Build Your Custom Airbnb Property Website</h2>
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
        {state.errors?.password && <p className="input-error">{state.errors.password[0]}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="airbnbUrl">Airbnb Property Listing URL</label>
        <input
          type="url"
          id="airbnbUrl"
          name="airbnbUrl"
          placeholder="https://www.airbnb.com/rooms/your-listing-id"
          defaultValue={state.inputs?.airbnbUrl}
          required
          pattern="https?:\/\/(www\.)?airbnb\.[a-z]{2,6}(\/rooms\/[0-9]{6,25}|\/h\/[a-z0-9\-]{3,100})(\?.*)?"
          title="Valid Airbnb listing URL (e.g., https://www.airbnb.com/rooms/123456) must contain property ID"
        />
        {state.errors?.airbnbUrl && <p className="input-error">{state.errors.airbnbUrl[0]}</p>}
      </div>

      <div className="form-group">
        <div className="form-checkbox">
          <input type="checkbox" id="terms" name="terms" defaultChecked={state.inputs?.terms === "on"} required />
          <label htmlFor="terms">
            <small>
              I own this property and consent to using my Airbnb listing data, per the <a href="/terms">Terms</a> and{" "}
              <a href="/privacy">Privacy Policy</a>
            </small>
          </label>
        </div>
        {state.errors?.terms && <p className="input-error">{state.errors.terms[0]}</p>}
      </div>

      {state?.message && !state.success && <FormNotification status="error">{state.message}</FormNotification>}

      {(!state?.message || state.message === "Please fix the errors in the form" || retryCount < 5) && (
        <button
          disabled={isPending}
          className="btn btn-auth btn-auth-sign-up btn-transparent"
          type="submit"
          onClick={() => setRetryCount(retryCount + 1)}
        >
          {isPending ? "Signing Up..." : "Sign Up"}
        </button>
      )}

      <div className="form-group form-footer">
        Already have an account?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setAppModalComponentName("FormSignIn");
          }}
        >
          Login Here
        </a>
      </div>
    </form>
  );
}

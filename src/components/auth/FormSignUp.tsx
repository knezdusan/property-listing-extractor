import { useEffect, useActionState, useState, useRef } from "react";
import { signUpAction } from "@/actions/auth/signUpAction";
import { ActionResponseSignUp } from "@/types";
import FormNotification from "../ui/FormNotification";
import FormSpinner from "../ui/FormSpinner";
import { useAppContext } from "../contexts/AppContext";

const initialState: ActionResponseSignUp = {
  phase: "signup",
  success: false,
  message: "",
  errors: {},
  inputs: {
    email: "",
    password: "",
    airbnbUrl: "",
    terms: null,
    phase: "signup", // signup | validate | setup | finish
  },
};

export default function FormSignUp() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const [retryCount, setRetryCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const { appModal } = useAppContext();
  const { setAppModalComponentName } = appModal;

  // Submit form automaticaly if the phse="setup"
  useEffect(() => {
    if (state.phase === "setup" && formRef.current) {
      formRef.current.requestSubmit();
    }
  }, [state.phase]);

  // Handle phase transitions and successful completion
  useEffect(() => {
    if (state.success) {
      // Only redirect to dashboard after the final "finish" phase
      if (state.phase === "finish") {
        // Close modal first
        setAppModalComponentName(null);

        // Then navigate to dashboard with a delay
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
      }
      // Other phases just update the form state - no redirect needed
    }
  }, [state.success, state.phase, setAppModalComponentName]);

  let buttonText = [];
  switch (state.phase) {
    case "signup":
      buttonText = ["Sign Up", "Signing Up..."];
      break;
    case "validate":
      buttonText = ["Validate", "Validating..."];
      break;
    case "setup":
      buttonText = ["Setup", "Setting Up..."];
      break;
    case "finish":
      buttonText = ["Finish", "Finishing..."];
      break;
    default:
      buttonText = ["Sign Up", "Signing Up..."];
      break;
  }

  return (
    <div className="form-container">
      <form className="form-auth form-auth-sign-up" ref={formRef} action={formAction} {...(isPending && { inert: true })}>
      <h2>Build Your Custom Airbnb Property Website</h2>

      <div className="form-group auth-progress">
        <div className="auth-phase-box request">
          <div className={`auth-phase ${state.phase === "signup" ? "phse-active" : ""}`}>1</div>
          <div>Signup</div>
        </div>
        <div className="auth-phase-box validate">
          <div className={`auth-phase ${state.phase === "validate" ? "phse-active" : ""}`}>2</div>
          <div>Validate</div>
        </div>
        <div className="auth-phase-box reset">
          <div className={`auth-phase ${state.phase === "setup" ? "phse-active" : ""}`}>3</div>
          <div>Setup</div>
        </div>
      </div>

      {state.phase === "signup" && (
        <>
          <p>Setup your account</p>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your.email@example.com"
              defaultValue={
                state.phase === "signup" && state.inputs && "email" in state.inputs ? state.inputs.email : ""
              }
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
              defaultValue={
                state.phase === "signup" && state.inputs && "password" in state.inputs ? state.inputs.password : ""
              }
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
              defaultValue={
                state.phase === "signup" && state.inputs && "airbnbUrl" in state.inputs ? state.inputs.airbnbUrl : ""
              }
              required
              pattern="https?:\/\/(www\.)?airbnb\.[a-z]{2,6}(\/rooms\/[0-9]{6,25}|\/h\/[a-z0-9\-]{3,100})(\?.*)?"
              title="Valid Airbnb listing URL (e.g., https://www.airbnb.com/rooms/123456) must contain property ID"
            />
            {state.errors?.airbnbUrl && <p className="input-error">{state.errors.airbnbUrl[0]}</p>}
          </div>

          <div className="form-group">
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                defaultChecked={
                  state.phase === "signup" && state.inputs && "terms" in state.inputs
                    ? state.inputs.terms === "on"
                    : false
                }
                required
              />
              <label htmlFor="terms">
                <small>
                  I own this property and consent to using my Airbnb listing data, per the <a href="/terms">Terms</a>{" "}
                  and <a href="/privacy">Privacy Policy</a>
                </small>
              </label>
            </div>
            {state.errors?.terms && <p className="input-error">{state.errors.terms[0]}</p>}
          </div>
        </>
      )}

      {state.phase === "validate" && (
        <div className="form-auth-content-validate">
          <p className="form-instructions">
            We’ve sent a verification code to your email.
            <br />
            Please enter the code below to activate your account.
          </p>
          <div className="form-group">
            <label htmlFor="activationCode">Activation Code</label>
            <input
              type="text"
              id="activationCode"
              name="validationCode"
              placeholder="**********"
              defaultValue={
                state.phase === "validate" && state.inputs && "validationCode" in state.inputs
                  ? (state.inputs as { validationCode: string }).validationCode
                  : ""
              }
              required
              pattern="^[a-z0-9!@#$%^&*]{10}$"
              title="Please enter a valid activation code"
              autoFocus
            />
            {state.errors?.validationCode && <p className="input-error">{state.errors.validationCode[0]}</p>}
          </div>
        </div>
      )}

      {state.phase === "setup" && (
        <div className="form-auth-content-setup">
          <p>Sit back and enjoy while your custom web site is being built for you.</p>
          <input type="hidden" name="autoSubmit" value="true" />
        </div>
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
          {isPending ? buttonText[1] : buttonText[0]}
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
      {isPending && <FormSpinner />}
    </div>
  );
}

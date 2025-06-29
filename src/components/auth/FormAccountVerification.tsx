import { useActionState, useEffect, useState } from "react";
import { ActionResponseAccountVerification } from "@/types";
import FormNotification from "../ui/FormNotification";
import { accountVerificationAction } from "@/actions/auth/accountVerificationAction";
import { useAppContext } from "../contexts/AppContext";

const initialState: ActionResponseAccountVerification = {
  success: false,
  message: "",
  errors: {},
  inputs: {
    activationCode: "",
  },
};

export default function FormAccountVerification() {
  const [state, formAction, isPending] = useActionState(accountVerificationAction, initialState);
  const [retryCount, setRetryCount] = useState(0);
  const appState = useAppContext();
  const { setAppModalComponentName } = appState.appModal;

  // If the form is submitted successfully, open the intro modal
  useEffect(() => {
    if (state.success) {
      setAppModalComponentName("Intro");
    }
  }, [state.success, setAppModalComponentName]);

  return (
    <form className="frm-auth frm-auth-account-verification" action={formAction} {...(isPending && { inert: true })}>
      <h2>Verify Your Account</h2>
      <div className="form-instructions">
        We’ve sent a verification code to your email.
        <br />
        Please enter the code below to activate your account.
      </div>
      <div className="form-group">
        <label htmlFor="activationCode">Activation Code</label>
        <input
          type="text"
          id="activationCode"
          name="activationCode"
          placeholder="**********"
          defaultValue={state.inputs?.activationCode}
          required
          pattern="^[a-z0-9!@#$%^&*]{10}$"
          title="Please enter a valid activation code"
          autoFocus
        />
        {state.errors?.activationCode && <p className="input-error">{state.errors.activationCode[0]}</p>}
      </div>

      {state?.message && !state.success && <FormNotification status="error">{state.message}</FormNotification>}

      {!state.message || state.message === "Wrong activation code provided, please try again" || retryCount < 5 ? (
        <button
          disabled={isPending}
          className="btn btn-auth btn-auth-account-verification btn-transparent"
          type="submit"
          onClick={() => setRetryCount(retryCount + 1)}
        >
          {isPending ? "Verifying account..." : "Verify account"}
        </button>
      ) : null}

      <div className="form-group form-footer">
        * If you don&apos;t receive your activation code in next few minutes,
        <br />
        please check your spam folder or try again later.
      </div>
    </form>
  );
}

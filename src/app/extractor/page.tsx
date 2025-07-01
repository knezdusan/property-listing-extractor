"use client";

import styles from "./page.module.css";
import { useActionState } from "react";
import { extractListingAction } from "@/actions/extractListingAction";

export default function Extractor() {
  const [state, formAction, isPending] = useActionState(extractListingAction, { success: false, message: "" });

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Welcome to Airbnb Listing Extractor</h1>
        <form className={styles.form} action={formAction}>
          <input type="text" className={styles.url} placeholder="Enter AirBnb listing URL" name="url" />
          <button className={styles.extract} type="submit" disabled={isPending}>
            {isPending ? "Extracting..." : "Extract"}
          </button>

          {isPending && <p>Extracting listing data...</p>}

          {state && <p>{state.message}</p>}
        </form>
      </main>
    </div>
  );
}

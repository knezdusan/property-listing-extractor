"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { AppContext, User } from "@/types";

const AppContext = createContext<AppContext | null>(null);

export const AppContextProvider = ({ auth, children }: { auth: User | null; children: ReactNode }) => {
  const [appModalComponentName, setAppModalComponentName] = useState<string | null>(null);

  const appState = {
    auth,
    appModal: {
      appModalComponentName,
      setAppModalComponentName,
    },
  };

  return <AppContext.Provider value={appState}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const appState = useContext(AppContext);
  if (!appState) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return appState;
};

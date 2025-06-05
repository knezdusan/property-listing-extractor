"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { AppContext } from "@/types";

const AppContext = createContext<AppContext | null>(null);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [appModalComponentName, setAppModalComponentName] = useState<string | null>(null);

  const appState = {
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

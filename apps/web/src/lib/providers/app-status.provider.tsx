"use client";

import { createContext, type ReactNode, useContext } from "react";

type AppStatusContextType = {
  isRegisterClose: boolean;
};

const AppStatusContext = createContext<AppStatusContextType | null>(null);

export const useAppStatus = () => {
  const context = useContext(AppStatusContext);
  if (!context) {
    throw new Error("useAppStatus must be used within an AppStatusProvider");
  }
  return context;
};

export const AppStatusProvider = ({
  children,
  isRegisterClose,
}: {
  children: ReactNode;
  isRegisterClose: boolean;
}) => {
  return (
    <AppStatusContext.Provider value={{ isRegisterClose }}>
      {children}
    </AppStatusContext.Provider>
  );
};

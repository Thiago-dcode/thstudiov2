"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type OnboardingOverlaysContextType = {
  /** An onboarding dialog (finish setup, benefit) is on screen. */
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
};

const OnboardingOverlaysContext = createContext<OnboardingOverlaysContextType>({
  dialogOpen: false,
  setDialogOpen: () => {},
});

/**
 * Lets the atelier's onboarding surfaces take turns: while a dialog is open the floating setup
 * guide steps aside, so the user never faces a modal with a checklist stacked on top of it.
 */
export const OnboardingOverlaysProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const value = useMemo(() => ({ dialogOpen, setDialogOpen }), [dialogOpen]);
  return (
    <OnboardingOverlaysContext.Provider value={value}>
      {children}
    </OnboardingOverlaysContext.Provider>
  );
};

export const useOnboardingOverlays = () =>
  useContext(OnboardingOverlaysContext);

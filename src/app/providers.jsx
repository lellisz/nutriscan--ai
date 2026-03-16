import React from "react";
import { AuthProvider } from "../features/auth/context/AuthContext";
import { ToastProvider } from "../components/feedback/ToastProvider";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}

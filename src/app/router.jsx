import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

// Lazy load pages
const SignInPage = React.lazy(() => import("../features/auth/pages/SignInPage"));
const SignUpPage = React.lazy(() => import("../features/auth/pages/SignUpPage"));
const OnboardingPage = React.lazy(() => import("../features/onboarding/pages/OnboardingPage"));
const DashboardPage = React.lazy(() => import("../features/dashboard/pages/DashboardPage"));
const ScanPage = React.lazy(() => import("../features/scan/pages/ScanPage"));
const HistoryPage = React.lazy(() => import("../features/history/pages/HistoryPage"));

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<React.Suspense fallback={<div>Carregando...</div>}><SignInPage /></React.Suspense>} />
        <Route path="/signup" element={<React.Suspense fallback={<div>Carregando...</div>}><SignUpPage /></React.Suspense>} />

        {/* Protected routes */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <OnboardingPage />
              </React.Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <DashboardPage />
              </React.Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <ScanPage />
              </React.Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <HistoryPage />
              </React.Suspense>
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

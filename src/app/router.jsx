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
const ProfilePage = React.lazy(() => import("../features/profile/pages/ProfilePage"));
const InsightsPage = React.lazy(() => import("../features/insights/pages/InsightsPage"));
const CoachChatPageSimple = React.lazy(() => import("../features/coach/pages/CoachChatPageSimple"));
const PaywallWelcomePage = React.lazy(() => import("../features/subscription/pages/PaywallWelcomePage"));
const SubscriptionPage = React.lazy(() => import("../features/subscription/pages/SubscriptionPage"));

function SuspenseWrapper({ children }) {
  return (
    <React.Suspense
      fallback={
        <div className="ns-page flex-center" style={{ minHeight: "60vh" }}>
          <div className="ns-spinner ns-spinner-lg" />
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="ns-page flex-center" style={{ minHeight: "60vh" }}>
        <div className="ns-spinner ns-spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/signin" element={<SuspenseWrapper><SignInPage /></SuspenseWrapper>} />
      <Route path="/signup" element={<SuspenseWrapper><SignUpPage /></SuspenseWrapper>} />

      {/* Protected routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute><SuspenseWrapper><OnboardingPage /></SuspenseWrapper></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><SuspenseWrapper><DashboardPage /></SuspenseWrapper></ProtectedRoute>
      } />
      <Route path="/scan" element={
        <ProtectedRoute><SuspenseWrapper><ScanPage /></SuspenseWrapper></ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute><SuspenseWrapper><HistoryPage /></SuspenseWrapper></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><SuspenseWrapper><ProfilePage /></SuspenseWrapper></ProtectedRoute>
      } />
      <Route path="/insights" element={
        <ProtectedRoute><SuspenseWrapper><InsightsPage /></SuspenseWrapper></ProtectedRoute>
      } />
      <Route path="/coach" element={
        <ProtectedRoute><SuspenseWrapper><CoachChatPageSimple /></SuspenseWrapper></ProtectedRoute>
      } />
      <Route path="/subscription" element={
        <ProtectedRoute><SuspenseWrapper><SubscriptionPage /></SuspenseWrapper></ProtectedRoute>
      } />
      <Route path="/paywall-welcome" element={
        <ProtectedRoute><SuspenseWrapper><PaywallWelcomePage /></SuspenseWrapper></ProtectedRoute>
      } />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function Router({ children }) {
  return (
    <BrowserRouter>
      <AppRoutes />
      {children}
    </BrowserRouter>
  );
}

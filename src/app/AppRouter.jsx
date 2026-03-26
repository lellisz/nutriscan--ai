import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AppShell from './AppShell';
import { AppProviders } from './providers';
import { useAuth } from '../features/auth/hooks/useAuth';

// Lazy-loaded pages
const DashboardPage    = React.lazy(() => import('../features/dashboard/pages/DashboardPage'));
const HistoryPage      = React.lazy(() => import('../features/history/pages/HistoryPage'));
const InsightsPage     = React.lazy(() => import('../features/insights/pages/InsightsPage'));
const ProfilePage      = React.lazy(() => import('../features/profile/pages/ProfilePage'));
const EditProfilePage  = React.lazy(() => import('../features/profile/pages/EditProfilePage'));
const EditGoalsPage    = React.lazy(() => import('../features/profile/pages/EditGoalsPage'));
const CoachChatPage    = React.lazy(() => import('../features/coach/pages/CoachChatPage'));
const ScanPage         = React.lazy(() => import('../features/scan/pages/ScanPage'));
const OnboardingPage   = React.lazy(() => import('../features/onboarding/pages/OnboardingPage'));
const SubscriptionPage = React.lazy(() => import('../features/subscription/pages/SubscriptionPage'));
const PaywallWelcomePage = React.lazy(() => import('../features/subscription/pages/PaywallWelcomePage'));
const SignInPage        = React.lazy(() => import('../features/auth/pages/SignInPage'));
const SignUpPage        = React.lazy(() => import('../features/auth/pages/SignUpPage'));

function PageLoader() {
  return (
    <div className="ns-page flex-center" style={{ minHeight: '100dvh' }}>
      <div className="ns-spinner ns-spinner-lg" />
    </div>
  );
}

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return children;
}

function AppWithNav() {
  const navigate = useNavigate();
  return (
    <AuthGuard>
      <AppShell onScanPress={() => navigate('/scan')}>
        <Routes>
          <Route path="/"            element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"   element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
          <Route path="/history"     element={<SuspenseWrapper><HistoryPage /></SuspenseWrapper>} />
          <Route path="/insights"    element={<SuspenseWrapper><InsightsPage /></SuspenseWrapper>} />
          <Route path="/coach"       element={<SuspenseWrapper><CoachChatPage /></SuspenseWrapper>} />
          <Route path="/profile"       element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />
          <Route path="/profile/edit"  element={<SuspenseWrapper><EditProfilePage /></SuspenseWrapper>} />
          <Route path="/profile/goals" element={<SuspenseWrapper><EditGoalsPage /></SuspenseWrapper>} />
          <Route path="/scan"        element={<SuspenseWrapper><ScanPage /></SuspenseWrapper>} />
          <Route path="/onboarding"  element={<SuspenseWrapper><OnboardingPage /></SuspenseWrapper>} />
          <Route path="/subscription" element={<SuspenseWrapper><SubscriptionPage /></SuspenseWrapper>} />
          <Route path="/paywall-welcome" element={<SuspenseWrapper><PaywallWelcomePage /></SuspenseWrapper>} />
          <Route path="*"            element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </AuthGuard>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route path="/signin" element={<SuspenseWrapper><SignInPage /></SuspenseWrapper>} />
          <Route path="/signup" element={<SuspenseWrapper><SignUpPage /></SuspenseWrapper>} />
          <Route path="/*"      element={<AppWithNav />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
}

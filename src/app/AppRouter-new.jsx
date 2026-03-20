import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import AppShell from './AppShell-new';
import { AppProviders } from './providers';
import ErrorBoundary from '../components/feedback/ErrorBoundary';
import SplashScreen from '../components/SplashScreen';
import { useAuth } from '../features/auth/hooks/useAuth';

// Lazy load pages
const SignInPage = React.lazy(() => import('../features/auth/pages/SignInPage'));
const SignUpPage = React.lazy(() => import('../features/auth/pages/SignUpPage'));
const OnboardingPage = React.lazy(() => import('../features/onboarding/pages/OnboardingPage'));
const DashboardPage = React.lazy(() => import('../features/dashboard/pages/DashboardPage-new'));
const HistoryPage = React.lazy(() => import('../features/history/pages/HistoryPage-new'));
const InsightsPage = React.lazy(() => import('../features/insights/pages/InsightsPage'));
const ProfilePage = React.lazy(() => import('../features/profile/pages/ProfilePage-new'));
const ScanPage = React.lazy(() => import('../features/scan/pages/ScanPage'));
const CoachChatPage = React.lazy(() => import('../features/coach/pages/CoachChatPage'));
const PaywallWelcomePage = React.lazy(() => import('../features/subscription/pages/PaywallWelcomePage'));
const SubscriptionPage = React.lazy(() => import('../features/subscription/pages/SubscriptionPage'));

function SuspenseWrapper({ children }) {
  return (
    <React.Suspense
      fallback={
        <div className="ns-page flex-center" style={{ minHeight: "60vh" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 32, height: 32, border: '2px solid #2c2c2e',
              borderTop: '2px solid #ebebf0', borderRadius: '50%',
              animation: 'ns-rotate 1s linear infinite'
            }} />
          </div>
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#000'
      }}>
        <div style={{
          width: 32, height: 32, border: '2px solid #2c2c2e',
          borderTop: '2px solid #ebebf0', borderRadius: '50%',
          animation: 'ns-rotate 1s linear infinite'
        }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

function AppRoutes() {
  const handleScan = () => {
    // Navigate to scan page
    window.location.href = '/scan';
  };

  return (
    <AppShell onScanPress={handleScan}>
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
        <Route path="/insights" element={
          <ProtectedRoute><SuspenseWrapper><InsightsPage /></SuspenseWrapper></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><SuspenseWrapper><ProfilePage /></SuspenseWrapper></ProtectedRoute>
        } />
        <Route path="/coach" element={
          <ProtectedRoute><SuspenseWrapper><CoachChatPage /></SuspenseWrapper></ProtectedRoute>
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
    </AppShell>
  );
}

export default function AppRouter() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
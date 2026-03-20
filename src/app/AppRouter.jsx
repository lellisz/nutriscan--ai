import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AppShell from './AppShell';
import { AppProviders } from './providers';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HistoryPage   from '../features/history/pages/HistoryPage';
import ProgressPage  from '../features/progress/pages/ProgressPage';
import ProfilePage   from '../features/profile/pages/ProfilePage';
import CoachPage     from '../features/coach/pages/CoachPage';
import ScanPage      from '../features/scan/pages/ScanPage';

function AppWithNav() {
  const navigate = useNavigate();
  return (
    <AppShell onScanPress={() => navigate('/scan')}>
      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/history"   element={<HistoryPage />} />
        <Route path="/progress"  element={<ProgressPage />} />
        <Route path="/coach"     element={<CoachPage />} />
        <Route path="/profile"   element={<ProfilePage />} />
        <Route path="/scan"      element={<ScanPage />} />
      </Routes>
    </AppShell>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppWithNav />
      </AppProviders>
    </BrowserRouter>
  );
}
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

// Layouts
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobCreateEditPage } from './pages/JobCreateEditPage';
import { ScreeningPage } from './pages/ScreeningPage';
import { ResumeUploadPage } from './pages/ResumeUploadPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { CandidateDetailPage } from './pages/CandidateDetailPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { PipelinePage } from './pages/PipelinePage';
import { TalentPoolPage } from './pages/TalentPoolPage';
import { InterviewsPage } from './pages/InterviewsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';

// Settings
import { ProfileSettingsPage } from './pages/settings/ProfileSettingsPage';
import { TeamSettingsPage } from './pages/settings/TeamSettingsPage';
import { ScoringSettingsPage } from './pages/settings/ScoringSettingsPage';
import { PrivacySettingsPage } from './pages/settings/PrivacySettingsPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Authenticated Core SaaS Routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Jobs */}
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/new" element={<JobCreateEditPage />} />
              <Route path="/jobs/:jobId" element={<JobDetailPage />} />
              <Route path="/jobs/:jobId/edit" element={<JobCreateEditPage />} />

              {/* Screening & Upload */}
              <Route path="/screening" element={<ScreeningPage />} />
              <Route path="/screening/upload" element={<ResumeUploadPage />} />

              {/* Candidates & Profiles */}
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/candidates/:candidateId" element={<CandidateDetailPage />} />

              {/* Comparison & Pipeline */}
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />

              {/* Talent Pool & Sourcing */}
              <Route path="/talent-pool" element={<TalentPoolPage />} />

              {/* Interviews & Reports */}
              <Route path="/interviews" element={<InterviewsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Settings */}
              <Route path="/settings/profile" element={<ProfileSettingsPage />} />
              <Route path="/settings/team" element={<TeamSettingsPage />} />
              <Route path="/settings/scoring" element={<ScoringSettingsPage />} />
              <Route path="/settings/privacy" element={<PrivacySettingsPage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

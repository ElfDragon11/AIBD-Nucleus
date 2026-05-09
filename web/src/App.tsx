import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminAuthGate } from '@/components/AdminAuthGate'
import { LandingPage } from '@/features/intake/LandingPage'
import { AdminImportPage } from '@/pages/AdminImportPage'
import { AdminLeadDetailPage } from '@/pages/AdminLeadDetailPage'
import { AdminLeadsPage } from '@/pages/AdminLeadsPage'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminMatchDetailPage } from '@/pages/AdminMatchDetailPage'
import { AdminMatchesPage } from '@/pages/AdminMatchesPage'
import { AdminOpportunitiesPage } from '@/pages/AdminOpportunitiesPage'
import { AdminOverviewPage } from '@/pages/AdminOverviewPage'
import { AdminPeoplePage } from '@/pages/AdminPeoplePage'
import { AdminPersonDetailPage } from '@/pages/AdminPersonDetailPage'
import { AdminSettingsPage } from '@/pages/AdminSettingsPage'
import { AdminSignupPage } from '@/pages/AdminSignupPage'
import { IntakeFlowPage } from '@/pages/IntakeFlowPage'
import { IntakeStartPage } from '@/pages/IntakeStartPage'
import { IntroductionRequestsPage } from '@/pages/IntroductionRequestsPage'
import { RecommendationRevealPage } from '@/pages/RecommendationRevealPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/intake" element={<IntakeStartPage />} />
        <Route path="/intake/:leadId" element={<IntakeFlowPage />} />
        <Route path="/recommendations/:leadId" element={<RecommendationRevealPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/signup" element={<AdminSignupPage />} />
        <Route element={<AdminAuthGate />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="people" element={<AdminPeoplePage />} />
            <Route path="people/:personId" element={<AdminPersonDetailPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="leads/:leadId" element={<AdminLeadDetailPage />} />
            <Route path="opportunities" element={<AdminOpportunitiesPage />} />
            <Route path="matches/:matchId" element={<AdminMatchDetailPage />} />
            <Route path="matches" element={<AdminMatchesPage />} />
            <Route
              path="introduction-requests"
              element={<IntroductionRequestsPage />}
            />
            <Route path="import" element={<AdminImportPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

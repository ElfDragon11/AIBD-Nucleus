import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AdminAuthGate } from '@/components/AdminAuthGate'
import { LandingPage } from '@/features/intake/LandingPage'
import { AdminHomePage } from '@/pages/AdminHomePage'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminSignupPage } from '@/pages/AdminSignupPage'
import { IntakeFlowPage } from '@/pages/IntakeFlowPage'
import { IntakeStartPage } from '@/pages/IntakeStartPage'
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
          <Route path="admin" element={<AdminHomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

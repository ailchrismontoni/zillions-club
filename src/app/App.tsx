import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { ProtectedAppLayout } from '@/components/auth/ProtectedAppLayout'
import { HomePage } from '@/pages/HomePage'
import { SignUpPage } from '@/pages/SignUpPage'
import { SignInPage } from '@/pages/SignInPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { RefBookPage } from '@/pages/RefBookPage'
import { AgentProfilePage } from '@/pages/AgentProfilePage'
import { TeamsPage } from '@/pages/TeamsPage'
import { TeamNumbersPage } from '@/pages/TeamNumbersPage'
import { MyNumbersPage } from '@/pages/MyNumbersPage'
import { InvitesPage } from '@/pages/InvitesPage'
import { HierarchyPage } from '@/pages/HierarchyPage'
import { AdminsPage } from '@/pages/AdminsPage'
import { AnnouncementsPage } from '@/pages/AnnouncementsPage'
import { StatsPage } from '@/pages/StatsPage'
import { ChatPage } from '@/pages/ChatPage'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { PLACEHOLDER_PAGES } from '@/pages/placeholders'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected app */}
        <Route element={<ProtectedAppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ref-book" element={<RefBookPage />} />
          <Route path="/agents/:agentId" element={<AgentProfilePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/team-numbers" element={<RequirePermission permission="view_team_numbers"><TeamNumbersPage /></RequirePermission>} />
          <Route path="/my-numbers" element={<MyNumbersPage />} />
          <Route path="/invites" element={<InvitesPage />} />
          <Route path="/hierarchy" element={<RequirePermission permission="view_hierarchy"><HierarchyPage /></RequirePermission>} />
          <Route path="/admins" element={<RequirePermission permission="view_all_users"><AdminsPage /></RequirePermission>} />
          <Route path="/announcements" element={<RequirePermission permission="view_announcements"><AnnouncementsPage /></RequirePermission>} />
          <Route path="/stats" element={<RequirePermission permission="view_own_stats"><StatsPage /></RequirePermission>} />
          <Route path="/chat" element={<ChatPage />} />
          {PLACEHOLDER_PAGES.map((p) => (
            <Route
              key={p.path}
              path={p.path}
              element={<PlaceholderPage title={p.title} description={p.description} icon={p.icon} />}
            />
          ))}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </ToastProvider>
  )
}

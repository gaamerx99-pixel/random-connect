import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { WaitingPage } from './pages/WaitingPage'
import { ProfilePage } from './pages/ProfilePage'
import { EditProfilePage } from './pages/EditProfilePage'
import { FriendsPage } from './pages/FriendsPage'
import { AuthPage } from './pages/AuthPage'
import AdminPage from './pages/AdminPage'
import { TermsPage } from './pages/legal/TermsPage'
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { CommunityGuidelinesPage } from './pages/legal/CommunityGuidelinesPage'
import { SafetyPage } from './pages/legal/SafetyPage'
import { CookiePolicyPage } from './pages/legal/CookiePolicyPage'
import { ContactPage } from './pages/legal/ContactPage'

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<AuthPage initialMode="sign-in" />} path="/sign-in" />
        <Route element={<AuthPage initialMode="sign-up" />} path="/sign-up" />

        {/* Public Legal, Safety & Compliance Routes */}
        <Route element={<TermsPage />} path="/terms" />
        <Route element={<PrivacyPage />} path="/privacy" />
        <Route element={<CommunityGuidelinesPage />} path="/community-guidelines" />
        <Route element={<SafetyPage />} path="/safety" />
        <Route element={<CookiePolicyPage />} path="/cookies" />
        <Route element={<ContactPage />} path="/contact" />

        <Route
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
          path="/dashboard"
        />

        <Route
          element={
            <ProtectedRoute>
              <WaitingPage />
            </ProtectedRoute>
          }
          path="/waiting"
        />

        <Route
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
          path="/profile"
        />

        <Route
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
          path="/profile/edit"
        />

        <Route
          element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          }
          path="/friends"
        />

        <Route
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
          path="/admin"
        />
      </Routes>
    </AppLayout>
  )
}

export default App
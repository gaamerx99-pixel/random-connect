import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { WaitingPage } from './pages/WaitingPage'

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<WaitingPage />} path="/waiting" />
      </Routes>
    </AppLayout>
  )
}

export default App

import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { WaitingPage } from './pages/WaitingPage'

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<WaitingPage />} path="/waiting" />
      </Routes>
    </AppLayout>
  )
}

export default App

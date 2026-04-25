import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage      from './pages/LoginPage'
import ListPage       from './pages/ListPage'
import DetailPage     from './pages/DetailPage'
import FormPage       from './pages/FormPage'
import DashboardPage  from './pages/DashboardPage'
import AnalyticsPage  from './pages/AnalyticsPage'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <Routes>

        {/* public route — redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/" replace />
              : <LoginPage />
          }
        />

        {/* protected routes */}
        <Route path="/" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        }/>
        <Route path="/risks" element={
          <ProtectedRoute><ListPage /></ProtectedRoute>
        }/>
        <Route path="/risks/new" element={
          <ProtectedRoute><FormPage /></ProtectedRoute>
        }/>
        <Route path="/risks/:id" element={
          <ProtectedRoute><DetailPage /></ProtectedRoute>
        }/>
        <Route path="/risks/:id/edit" element={
          <ProtectedRoute><FormPage /></ProtectedRoute>
        }/>
        <Route path="/analytics" element={
          <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
        }/>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
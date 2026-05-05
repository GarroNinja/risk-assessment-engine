import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ErrorBoundary    from './components/ErrorBoundary'
import ProtectedRoute   from './components/ProtectedRoute'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import ListPage         from './pages/ListPage'
import DetailPage       from './pages/DetailPage'
import FormPage         from './pages/FormPage'
import DashboardPage    from './pages/DashboardPage'
import AnalyticsPage    from './pages/AnalyticsPage'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <Routes>

        {/* public routes */}
        <Route path="/login" element={
          <ErrorBoundary>
            {isAuthenticated
              ? <Navigate to="/" replace />
              : <LoginPage />}
          </ErrorBoundary>
        }/>

        <Route path="/register" element={
          <ErrorBoundary>
            {isAuthenticated
              ? <Navigate to="/" replace />
              : <RegisterPage />}
          </ErrorBoundary>
        }/>

        {/* protected routes */}
        <Route path="/" element={
          <ErrorBoundary>
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          </ErrorBoundary>
        }/>

        <Route path="/risks" element={
          <ErrorBoundary>
            <ProtectedRoute>
              <ListPage />
            </ProtectedRoute>
          </ErrorBoundary>
        }/>

        {/* /risks/new MUST be before /risks/:id */}
        <Route path="/risks/new" element={
          <ErrorBoundary>
            <ProtectedRoute>
              <FormPage />
            </ProtectedRoute>
          </ErrorBoundary>
        }/>

        <Route path="/risks/:id" element={
          <ErrorBoundary>
            <ProtectedRoute>
              <DetailPage />
            </ProtectedRoute>
          </ErrorBoundary>
        }/>

        <Route path="/risks/:id/edit" element={
          <ErrorBoundary>
            <ProtectedRoute>
              <FormPage />
            </ProtectedRoute>
          </ErrorBoundary>
        }/>

        <Route path="/analytics" element={
          <ErrorBoundary>
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          </ErrorBoundary>
        }/>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App

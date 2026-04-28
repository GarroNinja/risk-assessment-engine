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
           <DashboardPage />
          </ErrorBoundary>
        }/>

        <Route path="/risks" element={
          <ErrorBoundary>
           <ListPage />
          </ErrorBoundary>
        }/>

        {/* /risks/new MUST be before /risks/:id */}
        <Route path="/risks/new" element={
          <ErrorBoundary>
            <FormPage />
          </ErrorBoundary>
        }/>

        <Route path="/risks/:id" element={
          <ErrorBoundary>
            <DetailPage />
          </ErrorBoundary>
        }/>

        <Route path="/risks/:id/edit" element={
          <ErrorBoundary>
            <FormPage />
          </ErrorBoundary>
        }/>

        <Route path="/analytics" element={
          <ErrorBoundary>
            <AnalyticsPage />
          </ErrorBoundary>
        }/>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
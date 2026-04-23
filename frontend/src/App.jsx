import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ListPage from './pages/ListPage'
import DetailPage from './pages/DetailPage'
import FormPage from './pages/FormPage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        }/>
        <Route path="/risks" element={
          <ProtectedRoute><ListPage /></ProtectedRoute>
        }/>
        <Route path="/risks/:id" element={
          <ProtectedRoute><DetailPage /></ProtectedRoute>
        }/>
        <Route path="/risks/new" element={
          <ProtectedRoute><FormPage /></ProtectedRoute>
        }/>
        <Route path="/risks/:id/edit" element={
          <ProtectedRoute><FormPage /></ProtectedRoute>
        }/>
        <Route path="/analytics" element={
          <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
        }/>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
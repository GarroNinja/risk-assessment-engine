import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()

  // not logged in — save where they were trying to go
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // logged in but wrong role
  if (requiredRole && role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center
                      justify-center font-sans">
        <div className="text-center p-8">
          <h2 className="text-xl font-medium text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            You do not have permission to view this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white text-sm rounded
                       hover:opacity-90 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return children
}
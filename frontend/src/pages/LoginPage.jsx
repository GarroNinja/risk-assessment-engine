import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/authService'

// ── validation ────────────────────────────────────────────────────────────────
function validate(form) {
  const errors = {}
  if (!form.email.trim())
    errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Please enter a valid email address.'
  if (!form.password)
    errors.password = 'Password is required.'
  else if (form.password.length < 6)
    errors.password = 'Password must be at least 6 characters.'
  return errors
}

// ── input field — defined OUTSIDE to prevent focus loss ───────────────────────
function InputField({ label, name, type, value, onChange, onBlur,
                      placeholder, error, touched }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={name === 'email' ? 'email' : 'current-password'}
        className={`w-full px-3 py-2.5 border rounded text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary
                    transition
                    ${touched && error
                      ? 'border-red-400 bg-red-50 focus:ring-red-400'
                      : 'border-gray-300 bg-white'}`}
      />
      {touched && error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const navigate      = useNavigate()
  const { login: storeToken } = useAuth()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // ── handlers ──────────────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (touched[name]) {
      const newErrors = validate(updated)
      setErrors(prev => ({
        ...prev,
        [name]: newErrors[name] ?? undefined,
      }))
    }
  }

  function handleBlur(e) {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const newErrors = validate(form)
    setErrors(prev => ({
      ...prev,
      [name]: newErrors[name] ?? undefined,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // mark all touched
    setTouched({ email: true, password: true })
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    setLoginError(null)

    try {
      const res = await login(form.email, form.password)

      // ── extract JWT from response ──────────────────────────────────────────
      // handles: { token: '...' } or { jwt: '...' } or { accessToken: '...' }
      const token = res.data?.token
                 ?? res.data?.jwt
                 ?? res.data?.accessToken
                 ?? res.data

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from server.')
      }

      // store token in AuthContext + localStorage
      storeToken(token)

      // redirect to dashboard
      navigate('/', { replace: true })

    } catch (err) {
      console.error('Login error:', err.response)
      const msg =
        err.response?.status === 401
          ? 'Invalid email or password. Please try again.'
          : err.response?.status === 403
          ? 'Your account has been disabled. Contact your administrator.'
          : err.response?.status === 404
          ? 'Auth endpoint not found. Please check the backend is running.'
          : err.message === 'Network Error'
          ? 'Cannot reach the server. Make sure the backend is running on port 8080.'
          : err.response?.data?.message
          ?? err.response?.data?.error
          ?? 'Login failed. Please try again.'
      setLoginError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col
                    items-center justify-center px-4">

      {/* ── Logo / brand header ── */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14
                        bg-primary rounded-xl mb-4 shadow">
          <svg className="w-8 h-8 text-white" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              strokeWidth={1.8}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0
                 0112 2.944a11.955 11.955 0 01-8.618
                 3.04A12.02 12.02 0 003 9c0 5.591
                 3.824 10.29 9 11.622 5.176-1.332
                 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Risk Assessment Engine
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to your account to continue
        </p>
      </div>

      {/* ── Login card ── */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm
                      border border-gray-200 p-8">

        {/* login error banner */}
        {loginError && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200
                          text-red-700 rounded text-sm flex items-start gap-2">
            <span className="mt-0.5">⚠</span>
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">

            {/* Email */}
            <InputField
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="you@example.com"
              error={errors.email}
              touched={touched.email}
            />

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Password
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full px-3 py-2.5 pr-10 border rounded text-sm
                              focus:outline-none focus:ring-2 focus:ring-primary
                              transition
                              ${touched.password && errors.password
                                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                                : 'border-gray-300 bg-white'}`}
                />
                {/* show/hide password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 text-xs"
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white text-sm
                         font-medium rounded hover:opacity-90
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition flex items-center justify-center gap-2
                         mt-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none"
                  viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12"
                    r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </div>
        </form>

        {/* divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* demo credentials hint */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-xs font-semibold text-primary mb-2">
            Demo Credentials
          </p>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-500">Admin:</span>
              <span className="font-mono">admin@risk.com / admin123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Manager:</span>
              <span className="font-mono">manager@risk.com / manager123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Viewer:</span>
              <span className="font-mono">viewer@risk.com / viewer123</span>
            </div>
          </div>
        </div>

      </div>

      {/* footer */}
      <p className="mt-6 text-xs text-gray-400">
         Risk Assessment Engine 
      </p>

    </div>
  )
}
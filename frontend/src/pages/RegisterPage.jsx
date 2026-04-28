import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/authService'

// icons — defined OUTSIDE to prevent remount 
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-8 h-8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

const EyeIcon = ({ open }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8
             a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8
             a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

//  validation — defined OUTSIDE 
function validate({ username, email, password, confirmPassword }) {
  const errors = {}

  if (!username.trim())
    errors.username = 'Username is required'
  else if (username.trim().length < 3)
    errors.username = 'At least 3 characters required'
  else if (username.trim().length > 50)
    errors.username = 'Maximum 50 characters'

  if (!email.trim())
    errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Enter a valid email address'

  if (!password)
    errors.password = 'Password is required'
  else if (password.length < 6)
    errors.password = 'At least 6 characters required'
  else if (password.length > 100)
    errors.password = 'Maximum 100 characters'

  if (!confirmPassword)
    errors.confirmPassword = 'Please confirm your password'
  else if (password !== confirmPassword)
    errors.confirmPassword = 'Passwords do not match'

  return errors
}

//  input field — defined OUTSIDE to prevent focus loss 
function InputField({
  label, name, type, value, onChange, onBlur,
  placeholder, error, touched, disabled,
  rightElement,
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-slate-700">
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={
            name === 'email'           ? 'email'
            : name === 'username'      ? 'username'
            : name === 'password'      ? 'new-password'
            : name === 'confirmPassword' ? 'new-password'
            : 'off'
          }
          className={`w-full px-4 py-3 rounded-xl border text-sm
                      text-slate-900 placeholder-slate-400 outline-none
                      transition-all duration-150
                      focus:ring-2 focus:border-transparent
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${rightElement ? 'pr-11' : ''}
                      ${touched && error
                        ? 'border-red-400 bg-red-50 focus:ring-red-400'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                          + ' focus:ring-blue-500'}`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {touched && error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24"
            fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
              10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
  })
  const [errors, setErrors]         = useState({})
  const [touched, setTouched]       = useState({})
  const [loading, setLoading]       = useState(false)
  const [apiError, setApiError]     = useState('')
  const [success, setSuccess]       = useState(false)
  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  //  handlers 
  function handleChange(e) {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (apiError) setApiError('')
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

    // mark all fields touched
    setTouched({
      username: true, email: true,
      password: true, confirmPassword: true,
    })

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    setApiError('')

    try {
      await registerUser({
        username: form.username.trim(),
        email:    form.email.trim(),
        password: form.password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      const status = err?.response?.status
      const msg    = err?.response?.data?.message ?? ''

      if (status === 409 || msg.toLowerCase().includes('exist')) {
        setApiError('Username or email already exists. Please try different credentials.')
      } else if (status === 400) {
        setApiError('Invalid registration details. Please check all fields.')
      } else if (status >= 500) {
        setApiError('Server error. Please try again in a moment.')
      } else if (err.message === 'Network Error') {
        setApiError('Cannot reach the server. Make sure the backend is running on port 8080.')
      } else {
        setApiError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between
                   p-12 relative overflow-hidden"
        style={{ backgroundColor: '#1B4F8A' }}
      >
        {/* background circles */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="absolute border-2 border-white rounded-full"
              style={{
                width:     `${(i + 1) * 180}px`,
                height:    `${(i + 1) * 180}px`,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        {/* logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl
                          flex items-center justify-center text-white">
            <ShieldIcon />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">
              RiskGuard
            </p>
            <p className="text-blue-200 text-xs">Assessment Engine</p>
          </div>
        </div>

        {/* center copy */}
        <div className="relative text-center">
          <div className="w-24 h-24 bg-white bg-opacity-15 rounded-3xl
                          flex items-center justify-center mx-auto mb-8
                          text-white">
            <ShieldIcon />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Join the<br />platform.
          </h1>
          <p className="text-blue-200 text-base max-w-xs mx-auto
                        leading-relaxed">
            Create your account and start managing risks with
            AI-powered intelligence.
          </p>
        </div>

        {/* bottom stats */}
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { label: 'Risks Tracked', value: '2.4k+' },
            { label: 'AI Analyses',   value: '18k+'  },
            { label: 'Uptime',        value: '99.9%' },
          ].map(({ label, value }) => (
            <div key={label}
              className="text-center bg-white bg-opacity-10 rounded-xl p-4">
              <p className="text-white text-2xl font-bold">{value}</p>
              <p className="text-blue-200 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center
                      bg-slate-50 p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center
                            justify-center text-white"
              style={{ backgroundColor: '#1B4F8A' }}>
              <ShieldIcon />
            </div>
            <span className="font-bold text-slate-800 text-lg">
              RiskGuard
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm
                          border border-slate-200 p-8">

            {/* heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Create account
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Fill in your details to get started
              </p>
            </div>

            {/* success banner */}
            {success && (
              <div className="mb-5 flex items-center gap-3 bg-green-50
                              border border-green-200 text-green-700
                              rounded-xl px-4 py-3 text-sm">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24"
                  fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19
                    21 7l-1.41-1.41L9 16.17z"/>
                </svg>
                <div>
                  <p className="font-semibold">Account created successfully!</p>
                  <p className="text-xs mt-0.5">
                    Redirecting to login page...
                  </p>
                </div>
              </div>
            )}

            {/* api error banner */}
            {apiError && (
              <div className="mb-5 flex items-start gap-3 bg-red-50
                              border border-red-200 text-red-700
                              rounded-xl px-4 py-3 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0"
                  viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
                    10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            {/* form */}
            <form onSubmit={handleSubmit} noValidate
              className="space-y-4">

              {/* Username */}
              <InputField
                label="Username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Choose a username"
                error={errors.username}
                touched={touched.username}
                disabled={loading || success}
              />

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
                disabled={loading || success}
              />

              {/* Password */}
              <InputField
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="At least 6 characters"
                error={errors.password}
                touched={touched.password}
                disabled={loading || success}
                rightElement={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="text-slate-400 hover:text-slate-600
                               transition-colors"
                    aria-label={showPassword
                      ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                }
              />

              {/* Confirm Password */}
              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Repeat your password"
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                disabled={loading || success}
                rightElement={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="text-slate-400 hover:text-slate-600
                               transition-colors"
                    aria-label={showConfirmPassword
                      ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                }
              />

              {/* role info */}
              <div className="flex items-center gap-3 px-4 py-3
                              bg-blue-50 border border-blue-100
                              rounded-xl text-xs text-blue-700">
                <svg className="w-4 h-4 shrink-0" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18
                       0 9 9 0 0118 0z" />
                </svg>
                <span>
                  New accounts are created with{' '}
                  <strong>VIEWER</strong> role by default.
                  An admin can upgrade your role after registration.
                </span>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3 px-4 rounded-xl text-white
                           text-sm font-semibold flex items-center
                           justify-center gap-2 transition-all duration-150
                           active:scale-[0.98] disabled:opacity-70
                           disabled:cursor-not-allowed disabled:scale-100
                           hover:brightness-110 focus:outline-none
                           focus:ring-2 focus:ring-offset-2
                           focus:ring-blue-500 mt-2"
                style={{ backgroundColor: '#1B4F8A' }}
              >
                {loading ? (
                  <>
                    <SpinnerIcon />
                    Creating account...
                  </>
                ) : success ? (
                  'Account Created!'
                ) : (
                  'Create Account'
                )}
              </button>

            </form>

            {/* link to login */}
            <div className="mt-6 pt-6 border-t border-slate-100
                            text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                  style={{ color: '#1B4F8A' }}
                >
                  Sign In
                </Link>
              </p>
            </div>

          </div>

          {/* footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            Risk Assessment Engine 
          </p>

        </div>
      </div>
    </div>
  )
}
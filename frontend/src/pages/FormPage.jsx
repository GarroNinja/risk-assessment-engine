import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createRisk, getRiskById, updateRisk } from '../services/riskService'

// ── Field component OUTSIDE FormPage — prevents remount on every keystroke ──
function Field({ label, name, required, children, touched, errors }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {touched[name] && errors[name] && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {errors[name]}
        </p>
      )}
    </div>
  )
}

// ── field definitions ────────────────────────────────────────────────────────
const SEVERITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW']
const STATUS_OPTIONS   = ['OPEN', 'MITIGATED', 'CLOSED']
const CATEGORY_OPTIONS = [
  'Operational', 'Financial', 'Strategic',
  'Compliance', 'Reputational', 'Technical', 'Other',
]

// ── empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title:          '',
  description:    '',
  category:       '',
  severity:       '',
  status:         '',
  score:          '',
  owner:          '',
  mitigationPlan: '',
  dueDate:        '',
}

// ── validation ───────────────────────────────────────────────────────────────
function validate(form) {
  const errors = {}

  if (!form.title.trim())
    errors.title = 'Title is required.'
  else if (form.title.trim().length < 5)
    errors.title = 'Title must be at least 5 characters.'
  else if (form.title.trim().length > 200)
    errors.title = 'Title must be under 200 characters.'

  if (!form.description.trim())
    errors.description = 'Description is required.'
  else if (form.description.trim().length < 10)
    errors.description = 'Description must be at least 10 characters.'

  if (!form.category)
    errors.category = 'Please select a category.'

  if (!form.severity)
    errors.severity = 'Please select a severity level.'

  if (!form.status)
    errors.status = 'Please select a status.'

  if (form.score === '' || form.score === null)
    errors.score = 'Risk score is required.'
  else if (isNaN(form.score) || Number(form.score) < 0 || Number(form.score) > 100)
    errors.score = 'Score must be a number between 0 and 100.'

  if (!form.owner.trim())
    errors.owner = 'Owner is required.'

  if (form.dueDate && new Date(form.dueDate) < new Date(new Date().toDateString()))
    errors.dueDate = 'Due date cannot be in the past.'

  return errors
}

// ════════════════════════════════════════════════════════════════════════════
export default function FormPage() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = Boolean(id)

  const [form, setForm]               = useState(EMPTY_FORM)
  const [errors, setErrors]           = useState({})
  const [touched, setTouched]         = useState({})
  const [loading, setLoading]         = useState(false)
  const [fetching, setFetching]       = useState(isEdit)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ── load existing record when editing ────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return
    setFetching(true)
    getRiskById(id)
      .then(res => {
        const d = res.data
        setForm({
          title:          d.title          ?? '',
          description:    d.description    ?? '',
          category:       d.category       ?? '',
          severity:       d.severity       ?? '',
          status:         d.status         ?? '',
          score:          d.score          ?? '',
          owner:          d.owner          ?? '',
          mitigationPlan: d.mitigationPlan ?? '',
          dueDate:        d.dueDate ? d.dueDate.split('T')[0] : '',
        })
      })
      .catch(() => setSubmitError('Failed to load risk. Please go back and try again.'))
      .finally(() => setFetching(false))
  }, [id, isEdit])

  // ── change handler ────────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (touched[name]) {
      const newErrors = validate(updated)
      setErrors(prev => ({ ...prev, [name]: newErrors[name] ?? undefined }))
    }
  }

  // ── blur handler ──────────────────────────────────────────────────────────
  function handleBlur(e) {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const newErrors = validate(form)
    setErrors(prev => ({ ...prev, [name]: newErrors[name] ?? undefined }))
  }

  // ── submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()

    const allTouched = Object.keys(EMPTY_FORM).reduce(
      (acc, k) => ({ ...acc, [k]: true }), {}
    )
    setTouched(allTouched)

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    setSubmitError(null)

    const payload = {
      ...form,
      score:   Number(form.score),
      dueDate: form.dueDate || null,
    }

    try {
      if (isEdit) {
        await updateRisk(id, payload)
      } else {
        await createRisk(payload)
      }
      setSubmitSuccess(true)
      setTimeout(() => navigate('/risks'), 1200)
    } catch (err) {
      console.error('Submit error full details:', err.response)
      const msg = err.response?.data?.message
               ?? err.response?.data?.error
               ?? err.response?.data
               ?? (err.response?.status === 403 ? 'Access denied — check your login token.'
               : err.response?.status === 401 ? 'Session expired — please log in again.'
               : err.response?.status === 400 ? 'Invalid data — check all fields and try again.'
               : err.response?.status === 404 ? 'API endpoint not found — backend may not be running.'
               : err.message === 'Network Error' ? 'Cannot reach the server — is the backend running on port 8080?'
               : 'Something went wrong. Please try again.')
      setSubmitError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── score colour ──────────────────────────────────────────────────────────
  function scoreColour(v) {
    if (v >= 75) return 'text-red-600'
    if (v >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  // ── input className ───────────────────────────────────────────────────────
  function inputClass(name) {
    const base = `w-full px-3 py-2 border rounded text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary transition`
    const err  = touched[name] && errors[name]
    return `${base} ${err
      ? 'border-red-400 bg-red-50 focus:ring-red-400'
      : 'border-gray-300 bg-white'}`
  }

  // ── fetching skeleton ─────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-2xl px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-primary text-white px-6 py-4 flex items-center
                      justify-between shadow">
        <h1 className="text-lg font-medium tracking-wide">
          Risk Assessment Engine
        </h1>
        <div className="flex gap-4 text-sm">
          <button onClick={() => navigate('/')}
            className="hover:underline">Dashboard</button>
          <button onClick={() => navigate('/risks')}
            className="hover:underline">Risks</button>
          <button onClick={() => navigate('/analytics')}
            className="hover:underline">Analytics</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => navigate('/risks')}
            className="hover:text-primary hover:underline">
            Risk Register
          </button>
          <span>/</span>
          <span className="text-gray-800 font-medium">
            {isEdit ? 'Edit Risk' : 'New Risk'}
          </span>
        </div>

        {/* ── Form card ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">

          {/* heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-gray-800">
              {isEdit ? 'Edit Risk' : 'Create New Risk'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEdit
                ? 'Update the details below and save changes.'
                : 'Fill in all required fields to register a new risk.'}
            </p>
          </div>

          {/* success banner */}
          {submitSuccess && (
            <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200
                            text-green-700 rounded text-sm flex items-center gap-2">
              <span>✓</span>
              <span>
                Risk {isEdit ? 'updated' : 'created'} successfully! Redirecting...
              </span>
            </div>
          )}

          {/* error banner */}
          {submitError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200
                            text-red-700 rounded text-sm flex items-center gap-2">
              <span>⚠</span>
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-6">

              {/* ── Section 1: Basic Info ── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase
                               tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Basic Information
                </h3>
                <div className="space-y-4">

                  <Field label="Risk Title" name="title" required
                    touched={touched} errors={errors}>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. Unauthorised access to customer database"
                      maxLength={200}
                      className={inputClass('title')}
                    />
                    <p className="text-xs text-gray-400 text-right">
                      {form.title.length}/200
                    </p>
                  </Field>

                  <Field label="Description" name="description" required
                    touched={touched} errors={errors}>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Describe the risk in detail — what could go wrong and why it matters."
                      rows={4}
                      className={inputClass('description')}
                    />
                  </Field>

                </div>
              </div>

              {/* ── Section 2: Classification ── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase
                               tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Classification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  <Field label="Category" name="category" required
                    touched={touched} errors={errors}>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass('category')}
                    >
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Severity" name="severity" required
                    touched={touched} errors={errors}>
                    <select
                      name="severity"
                      value={form.severity}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass('severity')}
                    >
                      <option value="">Select severity</option>
                      {SEVERITY_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Status" name="status" required
                    touched={touched} errors={errors}>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass('status')}
                    >
                      <option value="">Select status</option>
                      {STATUS_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </Field>

                </div>
              </div>

              {/* ── Section 3: Score & Owner ── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase
                               tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Score & Ownership
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <Field label="Risk Score (0–100)" name="score" required
                    touched={touched} errors={errors}>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="score"
                        value={form.score}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="0 – 100"
                        min={0}
                        max={100}
                        className={`${inputClass('score')} flex-1`}
                      />
                      {form.score !== '' && !isNaN(form.score) && (
                        <span className={`text-lg font-semibold min-w-[2.5rem]
                          text-center ${scoreColour(Number(form.score))}`}>
                          {form.score}
                        </span>
                      )}
                    </div>
                    {form.score !== '' && !isNaN(form.score) && (
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300
                            ${Number(form.score) >= 75 ? 'bg-red-500'
                            : Number(form.score) >= 40 ? 'bg-yellow-400'
                            : 'bg-green-500'}`}
                          style={{ width: `${Math.min(form.score, 100)}%` }}
                        />
                      </div>
                    )}
                  </Field>

                  <Field label="Owner" name="owner" required
                    touched={touched} errors={errors}>
                    <input
                      type="text"
                      name="owner"
                      value={form.owner}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. John Smith / Security Team"
                      className={inputClass('owner')}
                    />
                  </Field>

                </div>
              </div>

              {/* ── Section 4: Mitigation ── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase
                               tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Mitigation
                </h3>
                <div className="space-y-4">

                  <Field label="Mitigation Plan" name="mitigationPlan"
                    touched={touched} errors={errors}>
                    <textarea
                      name="mitigationPlan"
                      value={form.mitigationPlan}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Describe the steps being taken to reduce or eliminate this risk."
                      rows={3}
                      className={inputClass('mitigationPlan')}
                    />
                  </Field>

                  <Field label="Due Date" name="dueDate"
                    touched={touched} errors={errors}>
                    <input
                      type="date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${inputClass('dueDate')} max-w-xs`}
                    />
                  </Field>

                </div>
              </div>

              {/* ── error count summary ── */}
              {Object.keys(errors).filter(k => errors[k]).length > 0 &&
               Object.keys(touched).length > 0 && (
                <div className="px-4 py-3 bg-red-50 border border-red-200
                                text-red-700 rounded text-sm">
                  Please fix {Object.keys(errors).filter(k => errors[k]).length} error
                  {Object.keys(errors).filter(k => errors[k]).length > 1 ? 's' : ''} before submitting.
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2
                              border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading || submitSuccess}
                  className="flex-1 sm:flex-none px-8 py-2.5 bg-primary text-white
                             text-sm font-medium rounded hover:opacity-90
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4" fill="none"
                      viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  )}
                  {loading
                    ? (isEdit ? 'Saving...' : 'Creating...')
                    : (isEdit ? 'Save Changes' : 'Submit Risk')}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/risks')}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-8 py-2.5 border border-gray-300
                             text-gray-700 text-sm rounded hover:bg-gray-50
                             disabled:opacity-50 transition"
                >
                  Cancel
                </button>

                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm(EMPTY_FORM)
                      setErrors({})
                      setTouched({})
                      setSubmitError(null)
                    }}
                    disabled={loading}
                    className="px-4 py-2.5 text-sm text-gray-400
                               hover:text-gray-600 transition"
                  >
                    Reset
                  </button>
                )}
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
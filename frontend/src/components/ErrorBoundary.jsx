import { Component } from 'react'

//  illustrations — defined OUTSIDE 
function ErrorIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
      <circle cx="100" cy="80" r="50" fill="#FEF2F2"
        stroke="#FECACA" strokeWidth="1.5"/>
      <path d="M100 55v32" stroke="#FCA5A5" strokeWidth="4"
        strokeLinecap="round"/>
      <circle cx="100" cy="102" r="4" fill="#FCA5A5"/>
      <path d="M75 130 Q100 145 125 130" stroke="#E5E7EB"
        strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError:     false,
      error:        null,
      errorInfo:    null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center
                      justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200
                        shadow-sm p-10 max-w-md w-full text-center">

          <div className="flex justify-center mb-4">
            <ErrorIllustration />
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            An unexpected error occurred in this section of the application.
            Try refreshing or going back to the previous page.
          </p>

          {/* error detail — dev mode */}
         {/* F-035 fix — only show error details in development */}
     {import.meta.env.DEV && this.state.error && (
      <div className="mb-6 text-left bg-red-50 border border-red-100
                  rounded-xl px-4 py-3">
       <p className="text-xs font-semibold text-red-600 mb-1">
         Error Details (dev only)
       </p>
        <p className="text-xs text-red-500 font-mono break-all">
        {this.state.error.toString()}
        </p>
       </div>
       )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.handleReset()}
              className="px-5 py-2.5 bg-primary text-white text-sm
                         font-medium rounded-xl hover:opacity-90 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-5 py-2.5 border border-gray-200 text-gray-600
                         text-sm font-medium rounded-xl hover:bg-gray-50
                         transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-5 py-2.5 border border-gray-200 text-gray-600
                         text-sm font-medium rounded-xl hover:bg-gray-50
                         transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }
}
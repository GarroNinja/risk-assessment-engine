// ── SVG illustrations — defined OUTSIDE ──────────────────────────────────────
function NoDataIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-48 h-36" fill="none">
      <rect x="30" y="40" width="140" height="100" rx="12"
        fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5"/>
      <rect x="50" y="60" width="60" height="8" rx="4" fill="#D1D5DB"/>
      <rect x="50" y="76" width="100" height="6" rx="3" fill="#E5E7EB"/>
      <rect x="50" y="90" width="80" height="6" rx="3" fill="#E5E7EB"/>
      <rect x="50" y="104" width="90" height="6" rx="3" fill="#E5E7EB"/>
      <circle cx="150" cy="50" r="22" fill="#EFF6FF" stroke="#BFDBFE"
        strokeWidth="1.5"/>
      <path d="M141 50h18M150 41v18" stroke="#93C5FD" strokeWidth="2"
        strokeLinecap="round"/>
    </svg>
  )
}

function NoSearchIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-48 h-36" fill="none">
      <circle cx="90" cy="75" r="42" fill="#F3F4F6"
        stroke="#E5E7EB" strokeWidth="1.5"/>
      <circle cx="90" cy="75" r="28" fill="#EFF6FF"
        stroke="#BFDBFE" strokeWidth="1.5"/>
      <line x1="122" y1="107" x2="150" y2="135" stroke="#D1D5DB"
        strokeWidth="6" strokeLinecap="round"/>
      <path d="M82 68h16M90 60v16" stroke="#93C5FD" strokeWidth="2.5"
        strokeLinecap="round"/>
    </svg>
  )
}

function NoResultsIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-48 h-36" fill="none">
      <rect x="40" y="30" width="120" height="110" rx="12"
        fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5"/>
      <rect x="60" y="55" width="80" height="8" rx="4" fill="#E5E7EB"/>
      <rect x="60" y="72" width="60" height="6" rx="3" fill="#F3F4F6"
        stroke="#E5E7EB" strokeWidth="1"/>
      <rect x="60" y="88" width="70" height="6" rx="3" fill="#F3F4F6"
        stroke="#E5E7EB" strokeWidth="1"/>
      <circle cx="148" cy="44" r="16" fill="#FEF2F2"
        stroke="#FECACA" strokeWidth="1.5"/>
      <path d="M143 39l10 10M153 39l-10 10" stroke="#FCA5A5"
        strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function NoAccessIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-48 h-36" fill="none">
      <rect x="60" y="70" width="80" height="65" rx="10"
        fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5"/>
      <path d="M80 70V55a20 20 0 0140 0v15" stroke="#D1D5DB"
        strokeWidth="3" strokeLinecap="round"/>
      <circle cx="100" cy="98" r="10" fill="#FEF2F2"
        stroke="#FECACA" strokeWidth="1.5"/>
      <line x1="100" y1="104" x2="100" y2="116" stroke="#FCA5A5"
        strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function ErrorIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-48 h-36" fill="none">
      <circle cx="100" cy="80" r="50" fill="#FEF2F2"
        stroke="#FECACA" strokeWidth="1.5"/>
      <path d="M100 55v35" stroke="#FCA5A5" strokeWidth="4"
        strokeLinecap="round"/>
      <circle cx="100" cy="103" r="4" fill="#FCA5A5"/>
    </svg>
  )
}

//  main component 
export default function EmptyState({
  type      = 'nodata',
  title,
  message,
  action,
}) {
  const configs = {
    nodata: {
      illustration: <NoDataIllustration />,
      defaultTitle:   'No records found',
      defaultMessage: 'There are no items to display yet.',
    },
    search: {
      illustration: <NoSearchIllustration />,
      defaultTitle:   'No results found',
      defaultMessage: 'Try adjusting your search or clearing filters.',
    },
    noresults: {
      illustration: <NoResultsIllustration />,
      defaultTitle:   'No matches',
      defaultMessage: 'No items match your current filters.',
    },
    error: {
      illustration: <ErrorIllustration />,
      defaultTitle:   'Something went wrong',
      defaultMessage: 'An error occurred. Please try again.',
    },
    noaccess: {
      illustration: <NoAccessIllustration />,
      defaultTitle:   'Access denied',
      defaultMessage: 'You do not have permission to view this.',
    },
  }

  const config = configs[type] ?? configs.nodata

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8
                    text-center">
      <div className="mb-4 opacity-90">
        {config.illustration}
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">
        {title ?? config.defaultTitle}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-5">
        {message ?? config.defaultMessage}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}
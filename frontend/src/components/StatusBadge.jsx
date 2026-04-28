const STYLES = {
  OPEN:      'bg-blue-100 text-blue-700 border border-blue-200',
  MITIGATED: 'bg-orange-100 text-orange-700 border border-orange-200',
  CLOSED:    'bg-gray-100 text-gray-600 border border-gray-200',
  HIGH:      'bg-red-100 text-red-700 border border-red-200',
  MEDIUM:    'bg-yellow-100 text-yellow-700 border border-yellow-200',
  LOW:       'bg-green-100 text-green-700 border border-green-200',
}

export default function StatusBadge({ value }) {
  if (!value) return <span className="text-gray-400 text-sm">—</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg
                      text-xs font-semibold whitespace-nowrap
                      ${STYLES[value] ?? 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  )
}
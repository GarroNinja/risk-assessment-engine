const colours = {
  HIGH:     'bg-red-100 text-red-800',
  MEDIUM:   'bg-yellow-100 text-yellow-800',
  LOW:      'bg-green-100 text-green-800',
  OPEN:     'bg-blue-100 text-blue-800',
  CLOSED:   'bg-gray-100 text-gray-700',
  MITIGATED:'bg-purple-100 text-purple-800',
}

function StatusBadge({ value }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colours[value] ?? 'bg-gray-100 text-gray-700'}`}>
      {value}
    </span>
  )
}

export default StatusBadge
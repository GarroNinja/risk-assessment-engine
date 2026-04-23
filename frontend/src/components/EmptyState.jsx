function EmptyState({ message = 'No records found' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M7 17H5a2 2 0 01-2-2V7a2
             2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
      </svg>
      <p className="text-lg">{message}</p>
    </div>
  )
}

export default EmptyState
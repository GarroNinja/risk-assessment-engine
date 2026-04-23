function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center gap-2 justify-end mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="px-3 py-1 border rounded text-sm disabled:opacity-40"
      >
        Prev
      </button>
      <span className="text-sm text-gray-600">
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page + 1 >= totalPages}
        className="px-3 py-1 border rounded text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
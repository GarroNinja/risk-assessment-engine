//  defined OUTSIDE to prevent remount 
function SkeletonBox({ className }) {
  return (
    <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
  )
}

function SkeletonText({ width = 'w-full', height = 'h-4' }) {
  return (
    <div className={`${width} ${height} bg-gray-200 rounded-lg
                     animate-pulse`} />
  )
}

//  table row skeleton 
function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-50">
      <td className="px-4 py-3"><SkeletonText width="w-8"  height="h-3" /></td>
      <td className="px-4 py-3"><SkeletonText width="w-40" height="h-4" /></td>
      <td className="px-4 py-3"><SkeletonText width="w-24" height="h-4" /></td>
      <td className="px-4 py-3"><SkeletonText width="w-16" height="h-6" /></td>
      <td className="px-4 py-3"><SkeletonText width="w-20" height="h-6" /></td>
      <td className="px-4 py-3"><SkeletonText width="w-12" height="h-4" /></td>
      <td className="px-4 py-3"><SkeletonText width="w-24" height="h-4" /></td>
      <td className="px-4 py-3"><SkeletonText width="w-20" height="h-4" /></td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <SkeletonText width="w-12" height="h-7" />
          <SkeletonText width="w-12" height="h-7" />
        </div>
      </td>
    </tr>
  )
}

//  card skeleton 
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6
                    animate-pulse space-y-3">
      <SkeletonText width="w-24" height="h-3" />
      <SkeletonText width="w-16" height="h-8" />
      <SkeletonText width="w-32" height="h-3" />
    </div>
  )
}

//  form skeleton 
function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <SkeletonText width="w-24" height="h-3" />
        <SkeletonText width="w-full" height="h-11" />
      </div>
      <div className="space-y-3">
        <SkeletonText width="w-28" height="h-3" />
        <SkeletonText width="w-full" height="h-24" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="space-y-2">
            <SkeletonText width="w-20" height="h-3" />
            <SkeletonText width="w-full" height="h-11" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(i => (
          <div key={i} className="space-y-2">
            <SkeletonText width="w-20" height="h-3" />
            <SkeletonText width="w-full" height="h-11" />
          </div>
        ))}
      </div>
    </div>
  )
}

//  detail page skeleton
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6
                      space-y-4">
        <div className="flex gap-2">
          <SkeletonText width="w-20" height="h-6" />
          <SkeletonText width="w-16" height="h-6" />
          <SkeletonText width="w-24" height="h-6" />
        </div>
        <SkeletonText width="w-2/3" height="h-8" />
        <SkeletonText width="w-48" height="h-3" />
      </div>
      {/* body */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6
                          space-y-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="grid grid-cols-3 gap-4 py-2
                                      border-b border-gray-50">
                <SkeletonText width="w-20" height="h-3" />
                <div className="col-span-2">
                  <SkeletonText width="w-full" height="h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6
                          flex flex-col items-center gap-4">
            <SkeletonBox className="w-24 h-24 rounded-full" />
            <SkeletonText width="w-24" height="h-4" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6
                          space-y-3">
            {[1,2,3,4].map(i => (
              <SkeletonText key={i} width="w-full" height="h-10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

//  dashboard skeleton 
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SkeletonText width="w-40" height="h-5" />
        <div className="mt-4 h-64 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

//  main export 
export default function LoadingSkeleton({ type = 'table', rows = 8 }) {
  if (type === 'card')     return <CardSkeleton />
  if (type === 'form')     return <FormSkeleton />
  if (type === 'detail')   return <DetailSkeleton />
  if (type === 'dashboard') return <DashboardSkeleton />

  // default — table rows
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </>
  )
}

export { CardSkeleton, FormSkeleton, DetailSkeleton,
         DashboardSkeleton, SkeletonBox, SkeletonText }
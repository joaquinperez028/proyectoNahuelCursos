export default function Loading() {
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="text-center mb-10">
          <div className="h-10 bg-[var(--neutral-700)] rounded w-1/2 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-[var(--neutral-700)] rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
        
        {/* Category dropdown skeleton */}
        <div className="mb-6">
          <div className="h-10 bg-[var(--neutral-700)] rounded w-64 animate-pulse"></div>
        </div>
        
        {/* Results indicator skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 bg-[var(--neutral-700)] rounded w-48 animate-pulse"></div>
        </div>
        
        {/* Course cards grid skeleton */}
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] animate-pulse">
              {/* Image skeleton */}
              <div className="aspect-video bg-[var(--neutral-700)]"></div>
              
              {/* Content skeleton */}
              <div className="p-6">
                {/* Title */}
                <div className="h-6 bg-[var(--neutral-700)] rounded mb-2"></div>
                
                {/* Description */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-[var(--neutral-700)] rounded"></div>
                  <div className="h-4 bg-[var(--neutral-700)] rounded w-3/4"></div>
                </div>
                
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-[var(--neutral-700)] rounded"></div>
                  ))}
                  <div className="h-4 bg-[var(--neutral-700)] rounded w-20 ml-2"></div>
                </div>
                
                {/* Instructor */}
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-[var(--neutral-700)] rounded-full mr-2"></div>
                  <div className="h-4 bg-[var(--neutral-700)] rounded w-24"></div>
                </div>
              </div>
              
              {/* Button skeleton */}
              <div className="p-6 pt-0">
                <div className="h-10 bg-[var(--neutral-700)] rounded"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination skeleton */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="h-10 bg-[var(--neutral-700)] rounded w-20 animate-pulse"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-10 bg-[var(--neutral-700)] rounded animate-pulse"></div>
            ))}
            <div className="h-10 bg-[var(--neutral-700)] rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 
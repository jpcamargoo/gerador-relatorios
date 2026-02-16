"use client";

export function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border bg-card p-5 card-glow">
            <div className="skeleton h-8 w-16 rounded-lg mb-2" />
            <div className="skeleton h-3 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="rounded-2xl border bg-card overflow-hidden card-glow">
        <div className="flex border-b px-2 pt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-3.5">
              <div className="skeleton h-4 w-20 rounded-md" />
            </div>
          ))}
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48 rounded-md" />
                  <div className="skeleton h-3 w-full rounded-md" />
                  <div className="skeleton h-3 w-3/4 rounded-md" />
                </div>
                <div className="skeleton h-5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

interface ScreenSkeletonLoaderProps {
  /** Optional title to display while loading */
  title?: string;
  /** Layout style: 'workspace' (table + metrics), 'form' (clinical inputs), or 'minimal' */
  variant?: 'workspace' | 'form' | 'minimal';
}

export function ScreenSkeletonLoader({
  title,
  variant = 'workspace',
}: ScreenSkeletonLoaderProps) {
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* 1. Header & Actions Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="space-y-2">
          {/* Breadcrumb pill */}
          <div className="h-4 w-28 rounded-md bg-slate-100 skeleton-shimmer" />
          {/* Main Title */}
          {title ? (
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>{title}</span>
              <span className="inline-block h-2 w-2 rounded-full bg-purple-500 animate-ping" />
            </h1>
          ) : (
            <div className="h-7 w-52 rounded-xl bg-slate-200 skeleton-shimmer" />
          )}
          {/* Subtitle */}
          <div className="h-3.5 w-72 rounded-md bg-slate-100 skeleton-shimmer" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-24 rounded-xl bg-slate-100 skeleton-shimmer" />
          <div className="h-9 w-32 rounded-xl bg-purple-100 skeleton-shimmer" />
        </div>
      </div>

      {/* 2. Top Metric / Status KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { color: 'border-purple-100 bg-purple-50/40', accent: 'bg-purple-200' },
          { color: 'border-emerald-100 bg-emerald-50/40', accent: 'bg-emerald-200' },
          { color: 'border-blue-100 bg-blue-50/40', accent: 'bg-blue-200' },
          { color: 'border-amber-100 bg-amber-50/40', accent: 'bg-amber-200' },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border ${item.color} p-4 shadow-2xs space-y-2.5 bg-white`}
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-slate-100 skeleton-shimmer" />
              <div className={`h-8 w-8 rounded-xl ${item.accent} skeleton-shimmer`} />
            </div>
            <div className="h-7 w-16 rounded-md bg-slate-200 skeleton-shimmer" />
            <div className="h-2.5 w-24 rounded bg-slate-100 skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* 3. Main Workspace Area */}
      {variant === 'form' ? (
        /* Form Variant Skeleton */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div className="h-5 w-40 rounded-lg bg-slate-200 skeleton-shimmer border-b pb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-slate-100 skeleton-shimmer" />
                <div className="h-10 w-full rounded-xl bg-slate-50 skeleton-shimmer border border-slate-200/60" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <div className="h-10 w-24 rounded-xl bg-slate-100 skeleton-shimmer" />
            <div className="h-10 w-32 rounded-xl bg-purple-200 skeleton-shimmer" />
          </div>
        </div>
      ) : (
        /* Workspace / Table Variant Skeleton */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          {/* Table Tools (Search + Filters + Refresh) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-10 w-64 rounded-xl bg-slate-100 skeleton-shimmer border border-slate-200/60" />
              <div className="h-10 w-28 rounded-xl bg-slate-100 skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 rounded-xl bg-slate-100 skeleton-shimmer" />
              <div className="h-9 w-20 rounded-xl bg-slate-100 skeleton-shimmer" />
            </div>
          </div>

          {/* Table Header Row */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-12 gap-3 bg-slate-50/80 px-4 py-3 border-b border-slate-200">
              <div className="col-span-2 h-3.5 w-16 rounded bg-slate-200 skeleton-shimmer" />
              <div className="col-span-3 h-3.5 w-28 rounded bg-slate-200 skeleton-shimmer" />
              <div className="col-span-2 h-3.5 w-20 rounded bg-slate-200 skeleton-shimmer" />
              <div className="col-span-2 h-3.5 w-18 rounded bg-slate-200 skeleton-shimmer" />
              <div className="col-span-2 h-3.5 w-24 rounded bg-slate-200 skeleton-shimmer" />
              <div className="col-span-1 h-3.5 w-12 rounded bg-slate-200 skeleton-shimmer text-right" />
            </div>

            {/* Table Rows (varying widths for natural clinical feel) */}
            <div className="divide-y divide-slate-100">
              {[
                { w1: 'w-20', w2: 'w-36', w3: 'w-16', w4: 'w-24', w5: 'w-20' },
                { w1: 'w-24', w2: 'w-40', w3: 'w-20', w4: 'w-20', w5: 'w-24' },
                { w1: 'w-16', w2: 'w-32', w3: 'w-24', w4: 'w-28', w5: 'w-16' },
                { w1: 'w-20', w2: 'w-44', w3: 'w-16', w4: 'w-20', w5: 'w-20' },
                { w1: 'w-28', w2: 'w-36', w3: 'w-20', w4: 'w-24', w5: 'w-28' },
                { w1: 'w-16', w2: 'w-28', w3: 'w-16', w4: 'w-16', w5: 'w-16' },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center gap-3 px-4 py-3.5 hover:bg-slate-50/50 transition"
                >
                  <div className="col-span-2">
                    <div className={`h-5 ${row.w1} rounded-md bg-purple-100/70 skeleton-shimmer`} />
                  </div>
                  <div className="col-span-3">
                    <div className={`h-4 ${row.w2} rounded bg-slate-200 skeleton-shimmer`} />
                  </div>
                  <div className="col-span-2">
                    <div className={`h-4 ${row.w3} rounded bg-slate-100 skeleton-shimmer`} />
                  </div>
                  <div className="col-span-2">
                    <div className={`h-4 ${row.w4} rounded bg-slate-100 skeleton-shimmer`} />
                  </div>
                  <div className="col-span-2">
                    <div className={`h-5 ${row.w5} rounded-full bg-emerald-100/80 skeleton-shimmer`} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <div className="h-6 w-12 rounded-lg bg-slate-100 skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="h-3 w-40 rounded bg-slate-100 skeleton-shimmer" />
            <div className="flex gap-1.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100 skeleton-shimmer" />
              <div className="h-8 w-8 rounded-lg bg-purple-100 skeleton-shimmer" />
              <div className="h-8 w-8 rounded-lg bg-slate-100 skeleton-shimmer" />
            </div>
          </div>
        </div>
      )}

      {/* Floating Subtle Status Toast */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs font-semibold text-slate-400">
        <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
        <span>Loading clinical records & modules…</span>
      </div>
    </div>
  );
}

export default ScreenSkeletonLoader;

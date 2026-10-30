/** Placeholder shapes shown while a page streams in over a slow connection. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="skeleton h-10 w-56" />
      <div className="skeleton h-14 w-full rounded-full" />
      <div className="flex gap-2">
        {[80, 120, 110, 100].map((w) => (
          <div key={w} className="skeleton h-10 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="card flex gap-3.5 p-4">
            <div className="skeleton size-11 flex-none rounded-2xl" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="skeleton h-3.5 w-24" />
              <div className="skeleton h-5 w-4/5" />
              <div className="skeleton h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-9 w-11/12" />
      <div className="skeleton h-9 w-2/3" />
      <div className="flex gap-2">
        {[90, 90, 90].map((w, i) => (
          <div key={i} className="skeleton h-10 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="skeleton h-28 w-full rounded-[1.25rem]" />
      <div className="card flex flex-col gap-2.5 p-5">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
      </div>
    </div>
  );
}

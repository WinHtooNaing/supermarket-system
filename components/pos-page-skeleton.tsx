import { Skeleton } from "@/components/ui/skeleton";

type PosPageSkeletonProps = {
  hasFilters?: boolean;
  hasTable?: boolean;
};

export function PosPageSkeleton({
  hasFilters = true,
  hasTable = true,
}: PosPageSkeletonProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      {hasFilters && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-10 sm:col-span-2" />
          <Skeleton className="h-10" />
        </div>
      )}

      {hasTable && (
        <div className="rounded-xl border bg-card p-4">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}

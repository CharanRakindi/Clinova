import { cn } from '../utils/cn';

export const SkeletonLine = ({ className }) => (
  <div className={cn("animate-pulse bg-slate-200 rounded", className)} />
);

export const SkeletonCard = ({ className }) => (
  <div className={cn("card p-6 flex flex-col gap-4", className)}>
    <div className="flex justify-between items-center">
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="h-8 w-8 rounded-full" />
    </div>
    <div>
      <SkeletonLine className="h-8 w-16 mb-2" />
      <SkeletonLine className="h-3 w-1/4" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="w-full">
    <div className="border-b border-slate-200 pb-4 mb-4 flex gap-4">
      <SkeletonLine className="h-4 w-1/4" />
      <SkeletonLine className="h-4 w-1/4" />
      <SkeletonLine className="h-4 w-1/4" />
      <SkeletonLine className="h-4 w-1/4" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 mb-4">
        <SkeletonLine className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-1/3" />
          <SkeletonLine className="h-3 w-1/4" />
        </div>
        <SkeletonLine className="h-6 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

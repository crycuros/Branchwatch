import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`rounded-md bg-neutral-200/50 dark:bg-neutral-800/50 animate-pulse ${className}`}
    />
  );
};

export const BranchListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header filter placeholder */}
      <div className="flex justify-between items-center">
        <Skeleton className="w-28 h-6 rounded-lg" />
        <Skeleton className="w-48 h-8 rounded-xl" />
      </div>

      {/* Table rows placeholder */}
      <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/40 divide-y divide-neutral-100 dark:divide-neutral-800/60 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center px-4 py-3.5 gap-4"
          >
            <div className="col-span-5 flex items-center gap-3">
              <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
              <Skeleton className="w-32 h-4 rounded-md" />
            </div>
            <div className="col-span-4 hidden sm:block">
              <Skeleton className="w-48 h-3.5 rounded-md" />
            </div>
            <div className="col-span-1 text-center">
              <Skeleton className="w-6 h-3.5 rounded-md mx-auto" />
            </div>
            <div className="col-span-2 flex justify-end">
              <Skeleton className="w-14 h-3.5 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CommitTimelineSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <Skeleton className="w-32 h-4 rounded-md" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/30 flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="w-3/4 h-4 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="w-24 h-3 rounded-md" />
                <Skeleton className="w-16 h-3 rounded-md" />
              </div>
            </div>
            <Skeleton className="w-14 h-5 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { BranchStatusType } from '@/lib/types';

interface BadgeProps {
  status: BranchStatusType;
  showText?: boolean;
}

export const BranchStatusBadge: React.FC<BadgeProps> = ({ status, showText = true }) => {
  const statusConfig = {
    active: {
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      text: 'text-neutral-700 dark:text-neutral-300',
      label: 'Active',
    },
    quiet: {
      dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
      text: 'text-neutral-700 dark:text-neutral-300',
      label: 'Quiet',
    },
    stale: {
      dot: 'bg-neutral-400 dark:bg-neutral-600',
      text: 'text-neutral-500 dark:text-neutral-400',
      label: 'Stale',
    },
  };

  const config = statusConfig[status] || statusConfig.quiet;

  return (
    <div className="inline-flex items-center gap-2 select-none">
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {showText && (
        <span className={`text-xs font-medium tracking-tight ${config.text}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

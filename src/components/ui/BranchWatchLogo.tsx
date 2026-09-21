import React from 'react';

interface BranchWatchLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

/**
 * BranchWatch Official Brand Icon
 * Exact vector replication of the BranchWatch logo:
 * - Top-left hollow node connected via vertical trunk to base eye
 * - Almond eye at bottom-left with hollow pupil
 * - Smooth swooping U-curve branching from right corner of eye up to top-right hollow node
 */
export const BranchWatchLogo: React.FC<BranchWatchLogoProps> = ({
  size = 24,
  className = '',
  strokeWidth = 2,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Top Left Node */}
      <circle cx="5.5" cy="6" r="2.8" />

      {/* Top Right Node */}
      <circle cx="18.5" cy="6" r="2.8" />

      {/* Vertical Trunk Line from Left Node down to Top of Eye */}
      <line x1="5.5" y1="8.8" x2="5.5" y2="15.8" />

      {/* Base Almond Eye */}
      <path d="M1.5 18.5C3 15.8 8 15.8 9.5 18.5C8 21.2 3 21.2 1.5 18.5Z" />

      {/* Hollow Pupil inside Eye */}
      <circle cx="5.5" cy="18.5" r="1.1" />

      {/* Swooping U-Curve from Eye Right Corner up to Right Node */}
      <path d="M9.5 18.5C11.5 21.2 15 21 16.8 16C17.8 13.2 18.5 11 18.5 8.8" />
    </svg>
  );
};

export default BranchWatchLogo;

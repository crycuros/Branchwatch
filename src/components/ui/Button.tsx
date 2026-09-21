import React from 'react';
import { Loader2, Check } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isSuccess?: boolean;
  loadingText?: string;
  successText?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  isSuccess = false,
  loadingText,
  successText,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out active:duration-75 active:scale-[0.975] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm active:shadow-none',
    secondary:
      'bg-neutral-100 text-neutral-900 hover:bg-neutral-200/80 dark:bg-neutral-800/80 dark:text-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60',
    outline:
      'border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900',
    ghost:
      'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
          <span>{loadingText || children}</span>
        </>
      ) : isSuccess ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500 animate-badge-pop flex-shrink-0" />
          <span>{successText || children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

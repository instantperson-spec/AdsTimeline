'use client';

import React from 'react';

type Variant = 'default' | 'emerald' | 'cyan' | 'rose' | 'indigo';

const variantClass: Record<Variant, string> = {
  default: 'text-zinc-300 hover:text-white hover:bg-zinc-700',
  emerald: 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/50',
  cyan: 'text-cyan-400/90 hover:text-cyan-300 hover:bg-cyan-950/40',
  rose: 'text-zinc-400 hover:text-rose-300 hover:bg-rose-950/50',
  indigo: 'text-indigo-300/90 hover:text-indigo-200 hover:bg-indigo-950/40',
};

interface MatrixIconButtonProps {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: Variant;
  size?: 'md' | 'sm';
  children: React.ReactNode;
  className?: string;
}

/** Icon control with hover/focus tooltip for Edit panel break matrix. */
export function MatrixIconButton({
  label,
  onClick,
  disabled,
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: MatrixIconButtonProps) {
  const sizeClass =
    size === 'sm'
      ? 'p-0.5 rounded-md bg-transparent border-0 hover:bg-zinc-800 hover:border-zinc-700'
      : 'p-1.5 rounded-lg bg-zinc-800/90 border border-transparent hover:border-zinc-600';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`relative group/icon transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-transparent ${sizeClass} ${variantClass[variant]} ${className}`}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-30 px-2 py-1 rounded-md bg-zinc-950 border border-zinc-600 text-[10px] font-medium text-zinc-100 whitespace-nowrap opacity-0 scale-95 group-hover/icon:opacity-100 group-hover/icon:scale-100 group-focus-visible/icon:opacity-100 group-focus-visible/icon:scale-100 transition-all shadow-lg"
      >
        {label}
      </span>
    </button>
  );
}

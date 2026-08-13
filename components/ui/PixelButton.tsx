'use client';

import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
}

const VARIANTS: Record<string, string> = {
  primary: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-700',
  danger: 'bg-pink-600 hover:bg-pink-500 text-white border-pink-800',
  ghost: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-600',
};

export function PixelButton({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      className={`border-b-4 px-4 py-2 text-xs font-bold uppercase tracking-wider transition active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

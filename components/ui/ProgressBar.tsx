'use client';

interface Props {
  value: number;
  max: number;
  colorClass?: string;
  label?: string;
  showNumbers?: boolean;
}

export function ProgressBar({ value, max, colorClass = 'bg-emerald-400', label, showNumbers }: Props) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="w-full">
      {label && <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-400">{label}</div>}
      <div className="relative h-3 w-full overflow-hidden rounded-sm border border-zinc-700 bg-zinc-900">
        <div className={`h-full ${colorClass} transition-all duration-500 ease-out`} style={{ width: `${pct}%` }} />
      </div>
      {showNumbers && (
        <div className="mt-0.5 text-right text-[10px] text-zinc-500">
          {Math.max(0, Math.round(value))}/{max}
        </div>
      )}
    </div>
  );
}

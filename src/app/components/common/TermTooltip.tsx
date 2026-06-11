import { Info } from 'lucide-react';
import { ASTROLOGY_TERMS, AstrologyTermId } from '../../utils/astrologyTerms';

interface TermTooltipProps {
  term: AstrologyTermId;
  label?: string;
}

export function TermTooltip({ term, label }: TermTooltipProps) {
  const info = ASTROLOGY_TERMS[term];

  return (
    <span className="relative inline-flex items-center gap-1 group align-middle">
      {label && <span>{label}</span>}
      <Info className="w-4 h-4 opacity-60" aria-label={info.title} />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-border bg-background p-3 text-xs leading-relaxed shadow-xl group-hover:block">
        <strong className="block mb-1">{info.title}</strong>
        {info.short}
      </span>
    </span>
  );
}

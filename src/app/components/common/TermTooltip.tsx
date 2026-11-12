import { Info } from 'lucide-react';
import { ASTROLOGY_TERMS, type AstrologyTermId } from '../../utils/astrologyTerms';

interface TermTooltipProps {
  term: AstrologyTermId;
  label?: string;
}

export function TermTooltip({ term, label }: TermTooltipProps) {
  const info = ASTROLOGY_TERMS[term];

  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-1 rounded-sm text-inherit outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
        aria-label={`Пояснение: ${info.title}`}
        aria-describedby={`term-help-${term}`}
        title={`Пояснение: ${info.title}`}
        onClick={(event) => event.stopPropagation()}
      >
        {label && <span>{label}</span>}
        <Info className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
      </button>
      <span
        id={`term-help-${term}`}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-72 -translate-x-1/2 rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground shadow-xl group-hover:block group-focus-within:block"
      >
        <strong className="mb-1 block">{info.title}</strong>
        {info.short}
      </span>
    </span>
  );
}

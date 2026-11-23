import type { ReactNode } from 'react';

const DOT = {
  sun: 'bg-sun',
  pink: 'bg-pink',
  mint: 'bg-mint',
  indigo: 'bg-oxide',
  tangerine: 'bg-tangerine',
} as const;

export function SectionHead({
  eyebrow,
  title,
  note,
  action,
  tone = 'sun',
}: {
  eyebrow?: string;
  title: string;
  note?: string;
  action?: ReactNode;
  tone?: keyof typeof DOT;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <span className="eyebrow">
            <span className={`h-2 w-2 rounded-full ${DOT[tone]}`} />
            {eyebrow}
          </span>
        ) : null}
        <h2 className="h2 mt-3">{title}</h2>
        {note ? <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">{note}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

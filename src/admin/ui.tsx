import { useState, type ReactNode } from 'react';

export function PageHead({ title, note, actions }: { title: string; note?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
      <div>
        <h1 className="text-xl font-bold tracking-[-0.02em]">{title}</h1>
        {note ? <p className="mt-1 max-w-2xl text-[0.78rem] leading-relaxed text-ink-3">{note}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="border border-rule bg-white/50 px-4 py-3">
      <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">{label}</p>
      <p className={`mt-1.5 font-mono text-[1.35rem] leading-none tabular-nums tracking-tight ${accent ? 'text-oxide' : ''}`}>
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-[0.68rem] leading-snug text-ink-3">{sub}</p> : null}
    </div>
  );
}

export function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="border-l-2 border-shut pl-2 text-[0.75rem] text-shut">{message}</p>;
}

export function OkLine({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="border-l-2 border-open pl-2 text-[0.75rem] text-open">{message}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-[0.8rem] text-ink-3">{children}</p>;
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return <p className="py-6 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink-3">{label}…</p>;
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function run(fn: () => Promise<string | boolean | void>) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const message = await fn();
      if (typeof message === 'string') setOk(message);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not save.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, ok, run, setError, setOk };
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-10">
      <div className="w-full max-w-lg border border-ink bg-paper">
        <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em]">{title}</p>
          <button type="button" onClick={onClose} className="font-mono text-xs text-ink-3 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export const MODE_LABEL: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  credit: 'Khata',
};

export const STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  credit: 'On khata',
  returned: 'Returned',
  hold: 'Held',
};

export function statusClass(status: string): string {
  if (status === 'returned') return 'text-shut';
  if (status === 'credit') return 'text-oxide';
  return 'text-open';
}

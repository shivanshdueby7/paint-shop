import { useEffect, useState } from 'react';
import { shopStatus } from '../lib/hours';

export function OpenStatus({ showDetail = false, onDark = false }: { showDetail?: boolean; onDark?: boolean }) {
  const [status, setStatus] = useState(() => shopStatus());
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    setStatus(shopStatus());
    const timer = window.setInterval(() => setStatus(shopStatus()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setPulse(false), 2400);
    return () => window.clearTimeout(t);
  }, []);

  const tone = onDark
    ? 'border-white/15 bg-white/10 text-paper'
    : status.open
      ? 'border-open/20 bg-open/10 text-open'
      : 'border-shut/20 bg-shut/10 text-shut';

  return (
    <div>
      <p
        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] ${tone}`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${status.open ? 'bg-open' : 'bg-shut'} ${
              pulse ? 'animate-ping opacity-60' : ''
            }`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${status.open ? 'bg-open' : 'bg-shut'}`} />
        </span>
        {status.headline}
      </p>
      {showDetail && status.detail ? <p className="mt-2 text-xs leading-relaxed text-ink-3">{status.detail}</p> : null}
    </div>
  );
}

import { useState } from 'react';
import { apiSend, useApi } from '../lib/api';
import { num, when } from '../lib/format';
import { Empty, ErrorLine, Loading, PageHead, useAction } from './ui';
import type { EnquiryRow } from './types';

const KIND_LABEL: Record<string, string> = {
  quote: 'Quote request',
  shade_list: 'Shade list',
  calculator: 'Calculator estimate',
  contact: 'Counter enquiry',
};

const FILTERS = [
  { key: 'new', label: 'New' },
  { key: 'handled', label: 'Handled' },
  { key: '', label: 'All' },
] as const;

export default function Enquiries() {
  const [filter, setFilter] = useState<string>('new');
  const { data, loading, error, reload } = useApi<{ enquiries: EnquiryRow[] }>(
    `/api/admin/enquiries${filter ? `?status=${filter}` : ''}`,
  );
  const rows = data?.enquiries ?? [];

  return (
    <div className="space-y-4">
      <PageHead
        title="Enquiries"
        note="Everything sent from the website — quote requests, shade lists, calculator estimates and photo uploads from the visit page."
        actions={
          <>
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`btn btn-sm ${filter === f.key ? 'btn-solid' : 'btn-quiet'}`}
              >
                {f.label}
              </button>
            ))}
          </>
        }
      />

      {loading && !data ? <Loading label="Opening the enquiry book" /> : null}
      {error ? <p className="border-l-2 border-shut pl-2 text-[0.78rem] text-shut">{error}</p> : null}

      <div className="space-y-2">
        {rows.map((e) => (
          <EnquiryCard key={e.id} enquiry={e} onDone={reload} />
        ))}
      </div>

      {data && !rows.length && !loading ? (
        <Empty>{filter === 'new' ? 'No new enquiries. Everything is answered.' : 'Nothing in this list.'}</Empty>
      ) : null}
    </div>
  );
}

function EnquiryCard({ enquiry, onDone }: { enquiry: EnquiryRow; onDone: () => void }) {
  const action = useAction();
  const [open, setOpen] = useState(enquiry.status === 'new');

  const mark = async (status: 'new' | 'handled') => {
    await action.run(async () => {
      await apiSend(`/api/admin/enquiries/${enquiry.id}`, 'PATCH', { status });
      onDone();
      return true;
    });
  };

  const tel = `tel:${enquiry.phone.replace(/[^\d+]/g, '')}`;
  const wa = `https://wa.me/91${enquiry.phone.replace(/\D/g, '').slice(-10)}`;

  return (
    <article className={`border bg-white/40 ${enquiry.status === 'new' ? 'border-ink' : 'border-rule'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="text-[0.85rem] font-medium">{enquiry.name}</span>
            <span className="font-mono text-[0.62rem] text-ink-3">{enquiry.phone}</span>
            <span className="tag">{KIND_LABEL[enquiry.kind] ?? enquiry.kind}</span>
            {enquiry.status === 'new' ? <span className="tag border-oxide text-oxide">new</span> : null}
          </span>
          <span className="mt-0.5 block truncate text-[0.75rem] text-ink-2">{enquiry.message || '—'}</span>
        </span>
        <span className="shrink-0 text-right font-mono text-[0.58rem] text-ink-3">{when(enquiry.createdAt)}</span>
      </button>

      {open ? (
        <div className="border-t border-rule px-3 py-2">
          <p className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-ink-2">{enquiry.message || 'No message written.'}</p>
          <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.6rem] text-ink-3">
            {enquiry.shadeCodes ? (
              <div>
                <dt className="inline uppercase tracking-[0.1em]">Shades: </dt>
                <dd className="inline text-ink-2">{enquiry.shadeCodes}</dd>
              </div>
            ) : null}
            {enquiry.areaSqft ? (
              <div>
                <dt className="inline uppercase tracking-[0.1em]">Area: </dt>
                <dd className="inline text-ink-2">{num(enquiry.areaSqft)} sq ft</dd>
              </div>
            ) : null}
            {enquiry.hasPhoto ? (
              <div>
                <dt className="inline uppercase tracking-[0.1em]">Photo: </dt>
                <dd className="inline">
                  <a href={`/api/admin/enquiries/${enquiry.id}/photo`} target="_blank" rel="noreferrer" className="text-oxide underline">
                    open attached photo ↗
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a href={tel} className="btn btn-sm btn-quiet">
              Call
            </a>
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-sm btn-quiet">
              WhatsApp
            </a>
            {enquiry.status === 'new' ? (
              <button type="button" onClick={() => mark('handled')} disabled={action.busy} className="btn btn-sm btn-solid">
                Mark handled
              </button>
            ) : (
              <button type="button" onClick={() => mark('new')} disabled={action.busy} className="btn btn-sm btn-quiet">
                Put back in new
              </button>
            )}
            <ErrorLine message={action.error} />
          </div>
          {enquiry.handledAt ? <p className="mt-1.5 font-mono text-[0.58rem] text-ink-3">Handled {when(enquiry.handledAt)}</p> : null}
        </div>
      ) : null}
    </article>
  );
}

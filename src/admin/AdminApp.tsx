import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useApi } from '../lib/api';
import { site } from '../site.config';
import type { Me } from './types';
import Dashboard from './Dashboard';
import Counter from './Counter';
import Sales from './Sales';
import SaleDetail from './SaleDetail';
import Khata from './Khata';
import CustomerDetail from './CustomerDetail';
import Catalogue from './Catalogue';
import Stock from './Stock';
import Enquiries from './Enquiries';

const tabs = [
  { to: '/admin', label: 'Counter', end: true },
  { to: '/admin/new-bill', label: 'New bill' },
  { to: '/admin/sales', label: 'Sales' },
  { to: '/admin/khata', label: 'Khata' },
  { to: '/admin/catalogue', label: 'Catalogue' },
  { to: '/admin/stock', label: 'Stock' },
  { to: '/admin/enquiries', label: 'Enquiries' },
];

function SignOut() {
  return (
    <form method="post" action="/auth/freebuff/signout">
      <button type="submit" className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3 hover:text-ink">
        Sign out
      </button>
    </form>
  );
}

function SignInCard({ message }: { message?: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md border border-ink bg-paper">
        <div className="border-b border-rule px-5 py-3">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink-3">{site.fullName}</p>
          <p className="mt-1 text-lg font-bold tracking-[-0.02em]">Counter login</p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p className="text-[0.82rem] leading-relaxed text-ink-2">
            This side of the site is for the shop only — billing, khata, stock and the catalogue. Sign in with the
            account the shop is registered under.
          </p>
          <a href="/auth/freebuff/signin?returnTo=%2Fadmin" className="btn btn-solid w-full">
            Sign in with Freebuff
          </a>
          {message ? <p className="border-l-2 border-shut pl-2 text-[0.75rem] text-shut">{message}</p> : null}
          <p className="text-[0.7rem] leading-relaxed text-ink-3">
            The first account to sign in becomes the owner of this panel. After that, only that account gets in.
          </p>
          <a href="/" className="block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3 hover:text-ink">
            ← Back to the public site
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { data, loading, error } = useApi<Me>('/api/admin/me');

  if (loading && !data) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-3">Opening the counter…</p>
      </div>
    );
  }

  if (!data?.user) return <SignInCard message={error} />;

  if (!data.isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 py-16">
        <div className="w-full max-w-md border border-ink bg-paper">
          <div className="border-b border-rule px-5 py-3">
            <p className="text-lg font-bold tracking-[-0.02em]">Not the shop account</p>
          </div>
          <div className="space-y-4 px-5 py-5">
            <p className="text-[0.82rem] leading-relaxed text-ink-2">
              You are signed in as <span className="font-medium text-ink">{data.user.email ?? data.user.name ?? 'this account'}</span>,
              which is not the owner of this counter panel.
            </p>
            {data.ownerEmail ? (
              <p className="text-[0.78rem] text-ink-3">
                The panel belongs to <span className="font-mono">{data.ownerEmail}</span>.
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 pt-1">
              <a href="/" className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3 hover:text-ink">
                ← Public site
              </a>
              <SignOut />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="no-print sticky top-0 z-40 border-b border-rule bg-paper/95">
        <div className="shell flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-ink font-mono text-[0.7rem]">RG</span>
            <div>
              <p className="text-[0.9rem] font-bold leading-none tracking-[-0.02em]">Counter</p>
              <p className="mt-0.5 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink-3">
                {data.ownerEmail ?? data.user.email ?? 'Owner'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3 hover:text-ink">
              View site ↗
            </a>
            <SignOut />
          </div>
        </div>
        <nav className="shell -mx-1 overflow-x-auto">
          <ul className="flex whitespace-nowrap">
            {tabs.map((t) => (
              <li key={t.to}>
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `block border-b-2 px-2.5 py-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] ${
                      isActive ? 'border-oxide text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                    }`
                  }
                >
                  {t.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="shell py-5">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="new-bill" element={<Counter />} />
          <Route path="counter" element={<Navigate to="/admin/new-bill" replace />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales/:id" element={<SaleDetail />} />
          <Route path="khata" element={<Khata />} />
          <Route path="khata/:id" element={<CustomerDetail />} />
          <Route path="catalogue" element={<Catalogue />} />
          <Route path="stock" element={<Stock />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}

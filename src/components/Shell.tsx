import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { nav, site, telLink, whatsappLink } from '../site.config';
import { OpenStatus } from './OpenStatus';
import { hoursSummary } from '../lib/hours';
import { LocalBusinessLd } from './LocalBusinessLd';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const mark = ['#2E3A8C', '#FFC53D', '#F45D7E', '#25A57F'];

export default function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <LocalBusinessLd />

      <div className="hidden bg-ink text-paper sm:block">
        <div className="shell flex items-center justify-between gap-6 py-2">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-paper/70">
            Teliyarganj · Prayagraj 211004
          </p>
          <div className="flex items-center gap-5">
            <p className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-paper/50 md:block">
              GSTIN {site.gstin}
            </p>
            <OpenStatus onDark />
            <a href={telLink} className="font-mono text-[0.7rem] text-paper transition-colors hover:text-sun">
              {site.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-rule/70 bg-paper/90 backdrop-blur-xl">
        <div className="shell">
          <div className="flex items-center justify-between gap-4 py-3">
            <Link to="/" className="group flex items-center gap-3" aria-label={`${site.fullName} — home`}>
              <span className="grid h-11 w-11 shrink-0 grid-cols-2 gap-0.5 rounded-2xl border-2 border-ink bg-ink p-1 shadow-hard-sm transition-transform duration-300 ease-out group-hover:rotate-6">
                {mark.map((c) => (
                  <span key={c} className="rounded-[0.3rem]" style={{ backgroundColor: c }} />
                ))}
              </span>
              <span>
                <span className="block font-display text-[1.55rem] font-extrabold leading-none tracking-[-0.02em] sm:text-[1.7rem]">
                  {site.name}
                </span>
                <span className="mt-0.5 block text-[0.55rem] font-bold uppercase tracking-[0.18em] text-ink-3">
                  Paint &amp; Hardware · est. {site.since}
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <a
                href={whatsappLink('Namaste, I want to ask about paint.')}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-quiet hidden sm:inline-flex"
              >
                WhatsApp
              </a>
              <a href={telLink} className="btn btn-sm btn-solid whitespace-nowrap">
                Call<span className="hidden sm:inline">&nbsp;the counter</span>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-rule/60 py-1.5">
            <nav className="no-scrollbar -mx-1 flex-1 overflow-x-auto">
              <ul className="flex items-center gap-1 whitespace-nowrap">
                {nav.map((item, i) => (
                  <li key={item.to} className={`shrink-0 ${i > 2 ? 'hidden sm:block' : ''}`}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          'block rounded-full px-3 py-2 text-[0.76rem] font-bold transition-colors duration-150',
                          isActive ? 'bg-oxide text-white' : 'text-ink-2 hover:bg-white hover:text-ink',
                        ].join(' ')
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="hidden shrink-0 lg:block">
              <OpenStatus />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20">
        <div className="shell">
          <div className="relative overflow-hidden rounded-[2rem] bg-oxide px-6 py-10 text-white sm:px-10 sm:py-12">
            <div aria-hidden="true" className="blob absolute -right-16 -top-24 h-64 w-64 bg-pink/40 blur-2xl" />
            <div aria-hidden="true" className="blob-2 absolute -bottom-28 left-8 h-64 w-64 bg-sun/30 blur-3xl" />
            <div className="relative grid gap-7 lg:grid-cols-[1.2fr_auto] lg:items-end">
              <div>
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-white/60">Come to the counter</p>
                <p className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  Bring the wall, or a photo of it.
                </p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                  We will read the painter&apos;s list, work out the packs, sit the shade under the daylight lamp and make
                  the bill — GST invoice on request, khata for contractors.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a href={telLink} className="btn btn-sun">
                  Call {site.phoneDisplay}
                </a>
                <a
                  href={whatsappLink('Namaste, I want to ask about paint.')}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-quiet"
                >
                  WhatsApp
                </a>
                <a href={site.address.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-quiet">
                  Directions
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-y border-rule bg-paper-2/55">
          <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-display text-lg font-bold leading-none">{site.fullName}</p>
              <address className="mt-3 not-italic text-sm leading-relaxed text-ink-2">
                {site.address.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <p className="mt-3 font-mono text-xs text-ink-2">
                <a href={telLink} className="link-u">
                  {site.phoneDisplay}
                </a>
              </p>
              <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-3">GSTIN {site.gstin}</p>
            </div>

            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">Counter hours</p>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {site.hours.map((h) => (
                    <tr key={h.label} className="border-b border-rule/70 last:border-0">
                      <td className="py-1.5 pr-3 align-top text-ink-2">{h.short}</td>
                      <td className="py-1.5 text-right font-mono text-xs text-ink-2">
                        {h.windows.map(([a, b]) => (
                          <span key={a} className="block">
                            {a} – {b}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[0.7rem] leading-relaxed text-ink-3">{hoursSummary()} on normal days.</p>
            </div>

            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">Pages</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                {nav.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-oxide">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/admin" className="text-ink-3 transition-colors hover:text-oxide">
                    Counter login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">Around the shop</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                {site.landmarks.map((l) => (
                  <li key={l} className="flex gap-2">
                    <span className="text-oxide">·</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <a
                href={site.address.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ink underline decoration-2 decoration-rule-strong underline-offset-4 transition-colors hover:text-oxide hover:decoration-oxide"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>

        <div className="border-b border-rule">
          <div className="shell flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[0.7rem] leading-relaxed text-ink-3">
              Colours on screen are approximate — every chip is a painted surface, but every screen is set differently.
              Check the physical shade card at the counter before we open a tin. Rates are counter rates including GST and
              can change with the company price list.
            </p>
            <p className="shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-3">
              {site.since}–{new Date().getFullYear()} · Prayagraj
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

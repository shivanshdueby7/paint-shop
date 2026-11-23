import { EnquiryForm } from '../components/EnquiryForm';
import { OpenStatus } from '../components/OpenStatus';
import { Reveal } from '../components/Reveal';
import { useTitle } from '../lib/useTitle';
import { faqs, site, telLink, whatsappLink } from '../site.config';
import { isToday } from '../lib/hours';

export default function Visit() {
  useTitle(
    'Visit the shop — Rang Ghar Paint & Hardware, Teliyarganj, Prayagraj',
    'Shop address, counter hours with today highlighted, directions, delivery area and the questions the counter answers every day.',
  );

  return (
    <div className="shell pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-mint" />
            Visit
          </span>
          <h1 className="h1 mt-3 max-w-[16ch]">Come to the counter</h1>
        </div>
        <div className="max-w-sm">
          <OpenStatus showDetail />
        </div>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <Reveal>
            <div className="card p-5 sm:p-6">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-3">The address</p>
              <address className="mt-2 not-italic">
                <p className="font-display text-xl font-bold leading-snug">
                  {site.address.lines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </p>
              </address>
              <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-2">
                Blue shutter, shade card taped to the glass, next to the lock-and-hardware shop. Two-wheelers park in
                front; cars go on the side lane by the transformer.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a href={site.address.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-solid">
                  Google Maps directions
                </a>
                <a href={telLink} className="btn btn-sm btn-quiet">
                  {site.phoneDisplay}
                </a>
                <a
                  href={whatsappLink('Namaste, is the shop open right now?')}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-quiet"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={70}>
            <div className="card mt-5 p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">Counter hours</h2>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {site.hours.map((h) => (
                    <tr key={h.label} className={`border-b border-rule/60 last:border-0 ${isToday(h) ? 'bg-sun/12' : ''}`}>
                      <td className="py-2.5 pr-3">
                        <span className={isToday(h) ? 'font-bold' : 'text-ink-2'}>{h.label}</span>
                        {isToday(h) ? (
                          <span className="ml-2 rounded-full bg-oxide px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.08em] text-white">
                            today
                          </span>
                        ) : null}
                        {h.note ? (
                          <span className="mt-0.5 block text-[0.7rem] leading-snug text-ink-3">{h.note}</span>
                        ) : null}
                      </td>
                      <td className="py-2.5 text-right align-top font-mono text-xs text-ink-2">
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
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-mint/25 bg-mint/10 p-4">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-mint">Delivery</p>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-2">{site.delivery}</p>
                <p className="mt-2 text-[0.72rem] leading-relaxed text-ink-3">
                  Putty bags and 20 L drums go by loading rickshaw. We load; you do not need to send anyone to lift.
                </p>
              </div>
              <div className="rounded-2xl border border-rule bg-white/70 p-4">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-3">Landmarks</p>
                <ul className="mt-2 grid gap-1.5 text-[0.8rem] text-ink-2">
                  {site.landmarks.map((l) => (
                    <li key={l} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-oxide" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>

        <div>
          <Reveal delay={60}>
            <div className="card p-5 sm:p-6">
              <span className="eyebrow">
                <span className="h-2 w-2 rounded-full bg-pink" />
                Before you come
              </span>
              <h2 className="mt-3 font-display text-xl font-bold leading-tight">Send a list before you come</h2>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-2">
                Photograph the painter&apos;s list or the wall. We will keep the packs aside and have the shade mixed by
                the time you reach.
              </p>
              <div className="mt-4">
                <EnquiryForm kind="contact" heading="Counter enquiry" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={130}>
            <div className="card mt-5 p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">Asked at the counter</h2>
              <div className="mt-2 divide-y divide-rule/70">
                {faqs.map((f) => (
                  <details key={f.q} className="group py-3">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 text-[0.88rem] font-bold marker:content-none [&::-webkit-details-marker]:hidden">
                      <span>{f.q}</span>
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-rule font-mono text-xs text-ink-3 transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-2 max-w-xl text-[0.82rem] leading-relaxed text-ink-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

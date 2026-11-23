import { EnquiryForm } from '../components/EnquiryForm';
import { Reveal } from '../components/Reveal';
import { site, telLink, whatsappLink } from '../site.config';
import { useTitle } from '../lib/useTitle';

const slabs = [
  { band: '₹50,000 – ₹1,00,000', off: '4%', note: 'Monthly billed value' },
  { band: '₹1,00,000 – ₹2,50,000', off: '5%', note: 'Most painting contractors here' },
  { band: 'Above ₹2,50,000', off: '6%', note: 'Site delivery included' },
];

const KHATA = [
  ['30 days', 'Bill date to payment. No interest inside the term, 1.5% a month after it.'],
  ['Limit agreed once', 'We set it together at the counter after two cash bills. It is not a fixed right.'],
  ['Statement on WhatsApp', 'Ask any evening and we send the ledger as a photo of the book page.'],
  ['GST invoice every time', 'Give us the GSTIN once and it prints on every bill after that.'],
  ['Site delivery', 'Above ₹3,000 in Teliyarganj, Jhalwa and Awas Vikas. Beyond that, rickshaw fare.'],
];

const SLAB_TONES = ['bg-sun/15', 'bg-pink/10', 'bg-mint/10'];

export default function Trade() {
  useTitle(
    'For contractors and painters — Rang Ghar Paint & Hardware, Teliyarganj',
    'Bulk slab rates, contractor khata with 30-day terms, site delivery in Teliyarganj and Jhalwa, and shade-wise stock for painters in Prayagraj.',
  );

  return (
    <div className="shell pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-oxide" />
            Trade
          </span>
          <h1 className="h1 mt-3 max-w-[18ch]">For painters and contractors</h1>
        </div>
        <p className="max-w-sm text-[0.9rem] leading-relaxed text-ink-2">
          Half our counter is contractors. You get a slab, a khata, and a statement you can show your client — not a
          loyalty card.
        </p>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Bulk slab</h2>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-3">Per month, billed</span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {slabs.map((s, i) => (
              <Reveal key={s.band} delay={i * 60}>
                <div
                  className={`flex h-full flex-col rounded-2xl border border-rule p-4 ${SLAB_TONES[i % SLAB_TONES.length]}`}
                >
                  <p className="font-display text-3xl font-extrabold leading-none text-ink">{s.off}</p>
                  <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-ink-3">off list</p>
                  <p className="mt-3 border-t border-ink/10 pt-2 text-[0.78rem] font-semibold leading-snug text-ink-2">
                    {s.band}
                  </p>
                  <p className="mt-1 text-[0.68rem] leading-snug text-ink-3">{s.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-3 text-[0.72rem] leading-relaxed text-ink-3">
            Slab is on the month&apos;s billed value, applied at the end of the month, and settled against the khata. It
            does not stack with combo rates.
          </p>

          <h2 className="mt-9 font-display text-xl font-bold">Khata terms</h2>
          <ul className="mt-3 divide-y divide-rule/70 border-y border-rule">
            {KHATA.map(([k, v]) => (
              <li key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <span className="flex items-start gap-2 text-[0.82rem] font-bold">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-oxide" />
                  {k}
                </span>
                <span className="text-[0.82rem] leading-relaxed text-ink-2">{v}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <a
              href={whatsappLink('Namaste, I am a contractor. I want to open a khata.')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-solid"
            >
              WhatsApp about a khata
            </a>
            <a href={telLink} className="btn btn-quiet">
              {site.phoneDisplay}
            </a>
          </div>
        </div>

        <Reveal delay={120}>
          <div className="card p-5 sm:p-6">
            <span className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-mint" />
              Open an account
            </span>
            <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-2">
              Send this and we will call with the slab and the limit. Bring your GSTIN and one running site address when
              you come to the counter.
            </p>
            <div className="mt-5">
              <EnquiryForm
                kind="quote"
                defaultMessage="I am a contractor. Please tell me the slab, khata limit and site delivery terms."
              />
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

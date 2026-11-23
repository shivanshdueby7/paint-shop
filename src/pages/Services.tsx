import { services, site, whatsappLink, telLink } from '../site.config';
import { OpenStatus } from '../components/OpenStatus';
import { Reveal } from '../components/Reveal';
import { useTitle } from '../lib/useTitle';

const TONES = [
  { dot: 'bg-sun', tint: 'bg-sun/12' },
  { dot: 'bg-pink', tint: 'bg-pink/10' },
  { dot: 'bg-mint', tint: 'bg-mint/10' },
  { dot: 'bg-oxide', tint: 'bg-oxide/10' },
  { dot: 'bg-tangerine', tint: 'bg-tangerine/10' },
  { dot: 'bg-lilac', tint: 'bg-lilac/15' },
];

export default function Services() {
  useTitle(
    'Services at the counter — Rang Ghar Paint & Hardware, Teliyarganj',
    'Shade mixing while you wait, shade sitting under daylight, delivery in Teliyarganj and Jhalwa, painter referrals, seepage checks and texture work.',
  );

  return (
    <div className="shell pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-mint" />
            Services
          </span>
          <h1 className="h1 mt-3 max-w-[20ch]">What the shop does beyond selling tins</h1>
        </div>
        <p className="max-w-sm text-[0.9rem] leading-relaxed text-ink-2">
          A paint shop that only sells paint is a godown with a counter. These are the things we actually do for people
          painting a house in this neighbourhood.
        </p>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => {
          const tone = TONES[i % TONES.length];
          return (
            <Reveal key={s.title} delay={Math.min(i * 60, 300)}>
              <article className="card group flex h-full flex-col p-5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lift">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone.tint}`}>
                  <span className={`h-3 w-3 rounded-full ${tone.dot}`} />
                </span>
                <h2 className="mt-4 font-display text-xl font-bold leading-tight tracking-[-0.01em]">{s.title}</h2>
                <p className="mt-2 flex-1 text-[0.88rem] leading-relaxed text-ink-2">{s.body}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-rule bg-paper-2/60 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-ink-3">
                  <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                  {s.detail}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={80}>
        <div className="relative mt-10 overflow-hidden rounded-[2rem] bg-ink p-6 text-paper sm:p-8">
          <div aria-hidden="true" className="blob absolute -right-16 -top-24 h-56 w-56 bg-oxide/60 blur-2xl" />
          <div aria-hidden="true" className="blob-2 absolute -bottom-24 left-1/3 h-52 w-52 bg-pink/20 blur-3xl" />
          <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-paper/80">
                <span className="h-2 w-2 rounded-full bg-sun" />
                Before you come
              </span>
              <p className="mt-3 max-w-xl text-[0.92rem] leading-relaxed text-paper/75">
                Bring the room measurements or the painter&apos;s list, and the shade code if you have already chosen
                one. If the wall has a damp patch, take a photo in daylight — that one picture saves a wasted trip.
              </p>
              <div className="mt-4">
                <OpenStatus onDark />
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <a
                href={whatsappLink('Namaste, I want to ask about a service.')}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sun"
              >
                WhatsApp the shop
              </a>
              <a href={telLink} className="btn btn-quiet">
                {site.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

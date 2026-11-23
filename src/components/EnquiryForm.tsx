import { useState, type FormEvent } from 'react';
import { apiSend } from '../lib/api';
import { site, whatsappLink } from '../site.config';

type Props = {
  kind: 'quote' | 'shade_list' | 'calculator' | 'contact';
  defaultMessage?: string;
  shadeCodes?: string[];
  areaSqft?: number;
  heading?: string;
};

async function shrink(file: File): Promise<string> {
  const readRaw = () =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read that file.'));
      reader.readAsDataURL(file);
    });

  try {
    const bitmap = await createImageBitmap(file);
    const max = 1400;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    if (file.size > 3_000_000) throw new Error('That photo is too large. Take a smaller one.');
    return readRaw();
  }
}

export function EnquiryForm({ kind, defaultMessage = '', shadeCodes = [], areaSqft, heading }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [photo, setPhoto] = useState<{ name: string; dataUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiSend('/api/enquiries', 'POST', {
        kind,
        name,
        phone,
        message,
        shadeCodes,
        areaSqft: areaSqft ?? null,
        photo: photo ? { name: photo.name, dataUrl: photo.dataUrl } : null,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that. Try WhatsApp instead.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border-2 border-mint/30 bg-mint/10 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-lg font-bold text-white">
            ✓
          </span>
          <div>
            <p className="font-display text-xl font-bold leading-tight">Likh liya. We will call you back.</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-2">
              Someone at the counter checks these twice a day. If it is urgent, call {site.phoneDisplay} — the shop line
              is faster than the website.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={whatsappLink('Namaste, I just sent an enquiry on the website.')}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-solid"
          >
            Also send on WhatsApp
          </a>
          <a href={`tel:${site.phoneRaw}`} className="btn btn-sm btn-quiet">
            Call {site.phoneDisplay}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {heading ? <p className="eyebrow">{heading}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`name-${kind}`} className="label">
            Your name
          </label>
          <input
            id={`name-${kind}`}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            minLength={2}
            placeholder="Ramesh Chandra"
          />
        </div>
        <div>
          <label htmlFor={`phone-${kind}`} className="label">
            Phone
          </label>
          <input
            id={`phone-${kind}`}
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            required
            pattern="[0-9\s\+\-]{10,15}"
            placeholder="98xxxxxxxx"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`msg-${kind}`} className="label">
          What do you need
        </label>
        <textarea
          id={`msg-${kind}`}
          className="input min-h-[104px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="2 BHK, hall and two bedrooms, outside boundary wall also. Painter will come Monday."
        />
      </div>

      <div>
        <label htmlFor={`photo-${kind}`} className="label">
          Photo of the painter&apos;s list (optional)
        </label>
        <input
          id={`photo-${kind}`}
          type="file"
          accept="image/*"
          className="block w-full rounded-2xl border-2 border-dashed border-rule bg-paper/60 p-2 text-xs text-ink-2 file:mr-3 file:rounded-full file:border-2 file:border-ink file:bg-sun file:px-3 file:py-1.5 file:text-[0.65rem] file:font-bold file:uppercase file:tracking-wider file:text-ink"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) {
              setPhoto(null);
              return;
            }
            try {
              const dataUrl = await shrink(file);
              setPhoto({ name: file.name, dataUrl });
              setError(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not read that photo.');
              setPhoto(null);
            }
          }}
        />
        {photo ? <p className="mt-1.5 text-[0.68rem] font-semibold text-open">Attached: {photo.name}</p> : null}
      </div>

      {shadeCodes.length ? (
        <p className="rounded-xl bg-paper-2 px-3 py-2 font-mono text-[0.68rem] text-ink-2">
          Shades: {shadeCodes.join(', ')}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-shut/30 bg-shut/10 px-3 py-2 text-sm text-shut">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-solid" disabled={busy}>
          {busy ? 'Sending…' : 'Send to the counter'}
        </button>
        <a
          href={whatsappLink(message || 'Namaste, I need a paint quote.')}
          target="_blank"
          rel="noreferrer"
          className="btn btn-quiet"
        >
          WhatsApp instead
        </a>
      </div>
      <p className="text-[0.7rem] leading-relaxed text-ink-3">
        We use your number only to answer this enquiry. No lists, no forwards.
      </p>
    </form>
  );
}

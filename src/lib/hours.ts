import { site, type HoursBlock } from '../site.config';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function trim(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour12}:${String(m).padStart(2, '0')} ${suffix}` : `${hour12} ${suffix}`;
}

/** Shop wall-clock time in IST, whatever the visitor's own timezone is. */
function shopNow(date: Date): { day: number; minutes: number } {
  const ist = new Date(date.getTime() + (date.getTimezoneOffset() + 330) * 60000);
  return { day: ist.getDay(), minutes: ist.getHours() * 60 + ist.getMinutes() };
}

function blockFor(day: number): HoursBlock | undefined {
  return site.hours.find((b) => b.days.includes(day));
}

export type ShopStatus = {
  open: boolean;
  headline: string;
  detail: string;
  todayLabel: string;
};

export function shopStatus(date = new Date()): ShopStatus {
  const { day, minutes } = shopNow(date);
  const today = blockFor(day);
  const todayLabel = today ? today.windows.map(([a, b]) => `${trim(a)} – ${trim(b)}`).join(', ') : 'Closed all day';

  if (today) {
    for (const [start, end] of today.windows) {
      if (minutes >= toMinutes(start) && minutes < toMinutes(end)) {
        return {
          open: true,
          headline: `Open now · till ${trim(end)}`,
          detail: today.note ?? 'Walk in, shade card is on the counter.',
          todayLabel,
        };
      }
    }
    const later = today.windows.find(([start]) => minutes < toMinutes(start));
    if (later) {
      return {
        open: false,
        headline: `Closed · opens ${trim(later[0])} today`,
        detail: today.note ?? '',
        todayLabel,
      };
    }
  }

  for (let step = 1; step <= 7; step++) {
    const nextDay = (day + step) % 7;
    const next = blockFor(nextDay);
    if (next && next.windows.length) {
      const when = step === 1 ? 'tomorrow' : DAY_NAMES[nextDay];
      return {
        open: false,
        headline: `Closed now · opens ${when} ${trim(next.windows[0][0])}`,
        detail: today?.note ?? '',
        todayLabel,
      };
    }
  }

  return { open: false, headline: 'Closed', detail: '', todayLabel };
}

export function hoursSummary(): string {
  const mon = site.hours.find((b) => b.days.includes(1));
  if (!mon) return '';
  return mon.windows.map(([a, b]) => `${trim(a)} – ${trim(b)}`).join(', ');
}

/** True when this row of the timetable is today. */
export function isToday(block: HoursBlock, date = new Date()): boolean {
  return block.days.includes(shopNow(date).day);
}

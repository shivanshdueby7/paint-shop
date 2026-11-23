/** Small colour helpers used by the illustrated packaging and the shade UI. */

function parse(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return [36, 27, 20];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

export function mix(hex: string, target: string, amount: number): string {
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(target);
  const t = Math.max(0, Math.min(1, amount));
  return `#${toHex(r1 + (r2 - r1) * t)}${toHex(g1 + (g2 - g1) * t)}${toHex(b1 + (b2 - b1) * t)}`;
}

export const lighten = (hex: string, amount: number) => mix(hex, '#FFFFFF', amount);
export const darken = (hex: string, amount: number) => mix(hex, '#000000', amount);

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/** Pick ink or cream text for a painted surface, by perceived luminance. */
export function readableOn(hex: string): string {
  const [r, g, b] = parse(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.42 ? '#FFF6E9' : '#241B14';
}

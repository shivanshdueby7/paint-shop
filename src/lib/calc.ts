export const PACKS_L = [20, 10, 4, 1];

/** Greedy pack split, the way the godown boy would count drums. */
export function packsForLitres(litres: number): { size: number; count: number }[] {
  let left = Math.ceil(litres);
  const out: { size: number; count: number }[] = [];
  for (const size of PACKS_L) {
    const count = Math.floor(left / size);
    if (count > 0) {
      out.push({ size, count });
      left -= count * size;
    }
  }
  if (left > 0) addPack(out, 1, left);
  return out;
}

function addPack(out: { size: number; count: number }[], size: number, count: number) {
  const existing = out.find((p) => p.size === size);
  if (existing) existing.count += count;
  else out.push({ size, count });
}

export function litresNeeded(areaSqft: number, coverage: number, coats: number): number {
  if (!areaSqft || !coverage) return 0;
  return (areaSqft * coats) / coverage;
}

export function kgsNeeded(areaSqft: number, coverage: number, coats: number): number {
  if (!areaSqft || !coverage) return 0;
  return (areaSqft * coats) / coverage;
}

export function packsForKg(kg: number): { size: number; count: number }[] {
  const sizes = [40, 20, 10, 5];
  let left = Math.ceil(kg);
  const out: { size: number; count: number }[] = [];
  for (const size of sizes) {
    const count = Math.floor(left / size);
    if (count > 0) {
      out.push({ size, count });
      left -= count * size;
    }
  }
  if (left > 0) addPack(out, 5, 1);
  return out;
}

export function packSummary(packs: { size: number; count: number }[], unit: string): string {
  return packs.map((p) => `${p.count} × ${p.size} ${unit}`).join(' + ');
}

export function estimateCost(ratePerUnit: number, units: number): number {
  return Math.round(ratePerUnit * units);
}

/** Cheapest per-litre or per-kg rate in a set of products, for the estimate line. */
export function bestRate(
  variants: { price: number; packSize: string }[],
  unit: 'L' | 'kg',
): number {
  let best = 0;
  for (const v of variants) {
    const m = /([\d.]+)\s*(L|kg|ml)/i.exec(v.packSize);
    if (!m) continue;
    let size = Number(m[1]);
    const suffix = m[2].toLowerCase();
    if (suffix === 'ml') size = size / 1000;
    if (unit === 'L' && suffix === 'kg') continue;
    if (unit === 'kg' && suffix !== 'kg') continue;
    if (!size) continue;
    const per = v.price / size;
    if (!best || per < best) best = per;
  }
  return best;
}

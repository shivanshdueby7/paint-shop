import { useEffect, useState } from 'react';

export type Shade = {
  id: number;
  code: string;
  name: string;
  family: string;
  hex: string;
  lrv: number;
  finishes: string;
};

export type Variant = { id: number; packSize: string; mrp: number; price: number; stock: number };

export type ShadeSample = { code: string; name: string; hex: string; lrv: number };

export type Product = {
  id: number;
  slug: string;
  name: string;
  brandSlug: string | null;
  brandName: string;
  categorySlug: string;
  categoryName: string;
  range: 'Economy' | 'Premium' | 'Luxury' | 'Ultra';
  finish: string;
  base: string;
  coverage: number;
  coverageUnit: string;
  coats: number;
  blurb: string;
  variants: Variant[];
  shadeCount: number;
  shadeSamples: ShadeSample[];
};

export type Brand = { id: number; slug: string; name: string; note: string };
export type Category = { id: number; slug: string; name: string; blurb: string; sort: number };
export type Offer = { id: number; tag: string; title: string; detail: string; saving: string };

export type Catalog = { brands: Brand[]; categories: Category[]; products: Product[] };
export type ShadesPayload = { shades: Shade[]; families: { label: string; count: number }[] };
export type Counts = { counts: { shades: number; products: number; brands: number } };

const store = new Map<string, unknown>();

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data ? String((data as { error: unknown }).error) : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function apiSend<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data ? String((data as { error: unknown }).error) : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function clearPublicCache(prefix?: string) {
  for (const key of [...store.keys()]) {
    if (!prefix || key.startsWith(prefix)) store.delete(key);
  }
}

type ApiState<T> = { data: T | null; error: string | null; loading: boolean };

export function useApi<T>(path: string | null): ApiState<T> & { reload: () => void } {
  const cached = path && !path.startsWith('/api/admin') ? (store.get(path) as T | undefined) : undefined;
  const [state, setState] = useState<ApiState<T>>({
    data: cached ?? null,
    error: null,
    loading: Boolean(path) && cached === undefined,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    const isAdmin = path.startsWith('/api/admin');
    if (!isAdmin && store.has(path)) {
      setState({ data: store.get(path) as T, error: null, loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet<T>(path)
      .then((data) => {
        if (!alive) return;
        if (!isAdmin) store.set(path, data);
        setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setState({ data: null, error: err instanceof Error ? err.message : 'Could not load', loading: false });
      });
    return () => {
      alive = false;
    };
  }, [path, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function shadesByFamily(shades: Shade[]): { label: string; shades: Shade[] }[] {
  const map = new Map<string, Shade[]>();
  for (const s of shades) {
    const list = map.get(s.family);
    if (list) list.push(s);
    else map.set(s.family, [s]);
  }
  return [...map.entries()].map(([label, list]) => ({ label, shades: list }));
}

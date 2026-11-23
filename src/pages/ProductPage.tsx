import { Link, useParams } from 'react-router-dom';
import { useApi, type Product, type Shade } from '../lib/api';
import { inr, stockLabel } from '../lib/format';
import { Swatch } from '../components/Swatch';
import { PackShot } from '../components/PackShot';
import { defaultBrand } from '../lib/brands';
import { packAccent, packKind, packLabel, packSize } from '../lib/pack';
import { whatsappLink, site } from '../site.config';
import { useTitle } from '../lib/useTitle';

type Payload = { product: Product; shadeCount: number; shades: Shade[] };

export default function ProductPage() {
  const { slug } = useParams();
  const { data, error, loading } = useApi<Payload>(slug ? `/api/products/${slug}` : null);
  const product = data?.product;
  useTitle(
    product ? `${product.name} — ${product.brandName} in Teliyarganj` : 'Product — Rang Ghar Paint & Hardware',
    product
      ? `${product.name} at Rang Ghar Paint & Hardware, Teliyarganj, Prayagraj. Pack rates, coverage and the shades we can mix in it.`
      : undefined,
  );

  const isPaint = (product?.shadeCount ?? 0) > 0;
  const lead = product ? (product.variants.find((v) => v.stock > 0) ?? product.variants[0]) : undefined;
  const totalStock = product?.variants.reduce((sum, v) => sum + v.stock, 0) ?? 0;
  const stock = stockLabel(totalStock);
  const sample = product?.shadeSamples?.[0];
  const hex = isPaint && sample ? sample.hex : product ? packAccent(product) : '#FFC53D';

  return (
    <div className="shell pt-8 lg:pt-12">
      <nav className="flex flex-wrap items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-ink-3">
        <Link to="/products" className="transition-colors hover:text-oxide">
          Catalogue
        </Link>
        <span className="text-rule-strong">/</span>
        {product ? (
          <>
            <span>{product.categoryName}</span>
            <span className="text-rule-strong">/</span>
            <span className="text-ink-2">{product.name}</span>
          </>
        ) : (
          <span className="text-ink-2">Not found</span>
        )}
      </nav>

      {loading ? <p className="mt-10 text-sm font-semibold text-ink-3">Getting the tin…</p> : null}
      {error ? (
        <div className="card mt-10 max-w-xl p-6">
          <span className="eyebrow">Product</span>
          <h1 className="h2 mt-3">No such product</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            This tin is not on our shelf, or the link is from an old price list. The catalogue has everything we stock;
            for anything else, ask at the counter — most ranges can be ordered in two days.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/products" className="btn btn-sm btn-solid">
              Back to the catalogue
            </Link>
            <Link to="/shades" className="btn btn-sm btn-quiet">
              Shade card
            </Link>
          </div>
        </div>
      ) : null}

      {product ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <h1 className="h1 max-w-[18ch] text-[2.2rem] sm:text-5xl">{product.name}</h1>
            <span className="tag">{product.range}</span>
            <span className="tag">{product.finish}</span>
          </div>
          <p className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-3">
            {product.brandName} · {product.categoryName}
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div>
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-br from-paper-2/80 via-white to-paper-2/40 p-6">
                  <div className="mx-auto flex h-[230px] items-end justify-center">
                    <PackShot
                      kind={packKind(product)}
                      hex={hex}
                      brand={product.brandName}
                      label={packLabel(product)}
                      pack={packSize(product)}
                      code={sample?.code}
                      className="h-full w-auto drop-shadow-[0_18px_20px_rgba(36,27,20,0.18)]"
                      alt={`${product.name} — ${packSize(product)} pack`}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-rule p-4">
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                      {lead?.packSize ?? packSize(product)} pack
                    </p>
                    <p className="font-display text-2xl font-extrabold leading-none">{inr(lead?.price ?? 0)}</p>
                  </div>
                  <span className={`rounded-full bg-paper-2 px-3 py-1.5 text-[0.68rem] font-bold ${stock.className}`}>
                    {stock.text}
                  </span>
                </div>
              </div>

              <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-ink-2">{product.blurb}</p>

              <div className="card mt-5 p-4">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Base', product.base],
                      ['Finish', product.finish],
                      ['Coverage', product.coverage ? `${product.coverage} ${product.coverageUnit}` : 'Not applicable'],
                      ['Coats we suggest', product.coats ? `${product.coats} coat${product.coats > 1 ? 's' : ''}` : '—'],
                      ['Range', product.range],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-rule/70 last:border-0">
                        <th scope="row" className="w-40 py-2.5 text-left font-semibold text-ink-3">
                          {k}
                        </th>
                        <td className="py-2.5 font-medium text-ink-2">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <a
                  href={whatsappLink(`Namaste, I want to ask about ${product.name} (${product.brandName}).`)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-solid"
                >
                  Ask about this on WhatsApp
                </a>
                <a href={`tel:${site.phoneRaw}`} className="btn btn-quiet">
                  Call {site.phoneDisplay}
                </a>
              </div>
            </div>

            <div>
              <div className="card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold">Pack sizes &amp; rates</h2>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-3">incl. GST</span>
                </div>
                <table className="mt-3 w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-rule-strong">
                      <th className="py-2 text-left text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-3">Pack</th>
                      <th className="py-2 text-right text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-3">Rate</th>
                      <th className="py-2 text-right text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-3">MRP</th>
                      <th className="py-2 text-right text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-3">At the shop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => {
                      const s = stockLabel(v.stock);
                      return (
                        <tr key={v.id} className="border-b border-rule/60 last:border-0">
                          <td className="py-2.5 font-mono text-xs">{v.packSize}</td>
                          <td className="py-2.5 text-right font-mono text-[0.8rem]">{inr(v.price)}</td>
                          <td className="py-2.5 text-right font-mono text-[0.72rem] text-ink-3 line-through">{inr(v.mrp)}</td>
                          <td className={`py-2.5 text-right text-[0.66rem] font-bold ${s.className}`}>{s.text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-[0.7rem] leading-relaxed text-ink-3">
                  Rates include GST. Pack prices move with the company list — confirm on the phone before sending someone
                  for a large order.
                </p>
              </div>

              <div className="mt-5 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-bold">Shades this can be mixed in</h2>
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-3">
                  {data?.shadeCount ?? 0} shades
                </span>
              </div>
              {data && data.shades.length ? (
                <>
                  <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6">
                    {data.shades.slice(0, 24).map((s) => (
                      <Link key={s.id} to={`/shades?q=${encodeURIComponent(s.code)}`} title={`${s.code} ${s.name}`}>
                        <Swatch shade={s} />
                      </Link>
                    ))}
                  </div>
                  <p className="mt-4 text-[0.72rem] leading-relaxed text-ink-3">
                    Mixed in {defaultBrand.name} {defaultBrand.range} unless you ask for another brand. Showing 24 of{' '}
                    {data.shadeCount}. The tinting machine holds the full card — pick what you like on the{' '}
                    <Link to="/shades" className="link-u">
                      shade card page
                    </Link>{' '}
                    and send the list in one message.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/shades" className="btn btn-sm btn-quiet">
                      Open the full shade card
                    </Link>
                    <Link
                      to={`/wall?shades=${data.shades.slice(0, 4).map((s) => s.code).join(',')}`}
                      className="btn btn-sm btn-quiet"
                    >
                      Compare four on a wall
                    </Link>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-ink-2">
                  This one is not tinted — it comes in the company&apos;s ready shades. Ask at the counter for the current
                  chart.
                </p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

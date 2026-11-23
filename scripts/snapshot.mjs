import fs from 'node:fs';

const base = 'http://127.0.0.1:8787';
const dir = 'snapshot';
fs.mkdirSync(dir, { recursive: true });

const get = async (path) => {
  const res = await fetch(base + path);
  if (!res.ok) throw new Error(path + ' -> ' + res.status);
  return res.json();
};

const write = (name, data) => {
  fs.writeFileSync(`${dir}/${name}.js`, `/* Generated from the Cloudflare Worker API — do not edit by hand. */\nexport default ${JSON.stringify(data)};\n`);
  console.log(name, JSON.stringify(data).length + ' bytes');
};

const [catalog, shades, offers, settings] = await Promise.all([
  get('/api/catalog'),
  get('/api/shades'),
  get('/api/offers'),
  get('/api/settings'),
]);

write('catalog', catalog);
write('shades', shades);
write('offers', offers);
write('settings', settings);

const products = {};
for (const p of catalog.products) {
  products[p.slug] = await get(`/api/products/${encodeURIComponent(p.slug)}`);
}
write('products', products);

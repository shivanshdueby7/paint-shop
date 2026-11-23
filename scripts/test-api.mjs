import apiHandler from '../api/[...path].js';

function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
    type() { return this; },
  };
  return res;
}

const checks = [
  ['catalog', { path: ['catalog'] }, (b) => b.products?.length > 0],
  ['shades', { path: ['shades'] }, (b) => b.shades?.length > 300],
  ['offers', { path: ['offers'] }, (b) => b.offers?.length > 0],
  ['settings', { path: ['settings'] }, (b) => b.counts?.shades > 0],
  ['product', { path: ['products', 'trucare-wall-putty'] }, (b) => b.product?.name === 'TruCare Wall Putty'],
  ['missing', { path: ['nope'] }, (b, r) => r.statusCode === 404],
];

let failed = 0;
for (const [name, query, assert] of checks) {
  const res = fakeRes();
  await apiHandler({ method: 'GET', query, url: '/api/' + query.path.join('/'), headers: {} }, res);
  const ok = assert(res.body, res);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} status=${res.statusCode}`);
}

// Writes must be refused when no backend is configured.
const res = fakeRes();
await apiHandler({ method: 'POST', query: { path: ['enquiries'] }, body: {}, url: '/api/enquiries', headers: {} }, res);
const ok = res.statusCode === 503;
if (!ok) failed++;
console.log(`${ok ? 'PASS' : 'FAIL'} write-without-backend status=${res.statusCode}`);

console.log(failed ? failed + ' FAILED' : 'ALL API HANDLER CHECKS PASSED');
process.exit(failed ? 1 : 0);

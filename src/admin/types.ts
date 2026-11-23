export type Me = {
  user: { sub: string; name?: string; email?: string; picture?: string } | null;
  isOwner: boolean;
  ownerEmail: string | null;
};

export type SaleRow = {
  id: number;
  bill_no: string;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  bill_type: string;
  sold_at: string;
  subtotal: number;
  discount: number;
  total: number;
  taxable?: number;
  cgst?: number;
  sgst?: number;
  payment_mode: string;
  status: string;
  notes: string;
};

export type SaleItem = {
  id: number;
  variant_id: number | null;
  product_name: string;
  pack_size: string;
  shade_code: string;
  shade_name: string;
  tint_formula: string;
  qty: number;
  rate: number;
  amount: number;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  type: string;
  gstin: string;
  address: string;
  credit_limit: number;
  balance: number;
  notes: string;
  last_sale_at: string | null;
  bill_count: number;
};

export type Overview = {
  today: { bills: number; total: number };
  split: { mode: string; bills: number; total: number }[];
  week: { day: string; bills: number; total: number }[];
  weekTotal: number;
  lowStock: { variantId: number; name: string; slug: string; packSize: string; stock: number; lowStockAt: number }[];
  khata: { n: number; total: number };
  recent: { id: number; bill_no: string; customer_name: string; total: number; payment_mode: string; status: string; sold_at: string }[];
  counts: { products: number; shades: number; customers: number; enquiries: number };
};

export type AdminVariant = {
  id: number;
  product_id: number;
  pack_size: string;
  mrp: number;
  price: number;
  stock: number;
  low_stock_at: number;
  batch: string;
  updated_at: string;
};

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  brand_id: number | null;
  category_id: number;
  brand_name: string | null;
  category_name: string;
  range_tier: string;
  finish: string;
  base: string;
  coverage: number;
  coverage_unit: string;
  coats: number;
  blurb: string;
  is_active: number;
};

export type BrandRow = { id: number; slug: string; name: string; note: string };
export type CategoryRow = { id: number; slug: string; name: string; blurb: string; sort: number };

export type StockRow = {
  id: number;
  product_id: number;
  pack_size: string;
  stock: number;
  low_stock_at: number;
  batch: string;
  price: number;
  updated_at: string;
  product_name: string;
  product_slug: string;
  category_name: string;
};

export type StockMove = {
  id: number;
  variant_id: number;
  qty: number;
  kind: string;
  ref: string;
  note: string;
  created_at: string;
  product_name: string;
  pack_size: string;
};

export type EnquiryRow = {
  id: number;
  kind: string;
  name: string;
  phone: string;
  message: string;
  shadeCodes: string;
  areaSqft: number | null;
  status: string;
  createdAt: string;
  handledAt: string;
  hasPhoto: boolean;
};

export type AdminShade = {
  id: number;
  code: string;
  name: string;
  family: string;
  hex: string;
  lrv: number;
  finishes: string;
};

export type AdminOffer = {
  id: number;
  tag: string;
  title: string;
  detail: string;
  saving: string;
  is_active: number;
  sort: number;
};

import type { Translation } from '../i18n/translations';
import type {
  GoodsReceipt,
  Material,
  PrintData,
  PrintDocRef,
  Product,
  PurchaseOrder,
  PurchaseRequest,
  SalesOrder,
  StoreSettings,
  Vendor,
} from '../types';

interface Ctx {
  t: Translation;
  fmt: (n: number) => string;
  materials: Material[];
  products: Product[];
  vendors: Vendor[];
}

function prPrintData(doc: PurchaseRequest, { t, materials }: Ctx): PrintData {
  return {
    title: t.pr,
    no: doc.no || '—',
    date: doc.date,
    party: `${t.requester}: ${doc.requester}`,
    cols: [t.seqNo, t.materialCode, t.material, t.qty, t.unitCol],
    rows: doc.items.map((it, idx) => {
      const m = materials.find((x) => x.code === it.materialCode);
      return [idx + 1, it.materialCode, m?.name ?? '', it.qty, m?.unit ?? ''];
    }),
    showTotal: false,
  };
}

function poPrintData(doc: PurchaseOrder, { t, fmt, materials, vendors }: Ctx): PrintData {
  const vendor = vendors.find((v) => v.code === doc.vendorCode);
  return {
    title: t.po,
    no: doc.no || '—',
    date: doc.date,
    party: vendor ? `${t.vendorName}: ${vendor.name} · ${vendor.address} · ${vendor.phone}` : t.supplier,
    cols: [t.seqNo, t.materialCode, t.material, t.qty, t.unitCost, t.lineTotal],
    rows: doc.items.map((it, idx) => {
      const m = materials.find((x) => x.code === it.materialCode);
      return [idx + 1, it.materialCode, m?.name ?? '', `${it.qty} ${m?.unit ?? ''}`, fmt(it.price), fmt(it.qty * it.price)];
    }),
    showTotal: true,
    totalLabel: fmt(doc.items.reduce((sum, it) => sum + it.qty * it.price, 0)),
  };
}

function soPrintData(doc: SalesOrder, { t, fmt, products }: Ctx): PrintData {
  return {
    title: t.so,
    no: doc.no,
    date: doc.date,
    party: `${t.customer}: ${doc.customer}`,
    cols: [t.product, t.qty, t.unitCost, t.lineTotal],
    rows: doc.items.map((it) => {
      const p = products.find((x) => x.id === it.productId);
      return [p?.name ?? '', it.qty, p ? fmt(p.price) : '', p ? fmt(p.price * it.qty) : ''];
    }),
    showTotal: true,
    totalLabel: fmt(
      doc.items.reduce((sum, it) => {
        const p = products.find((x) => x.id === it.productId);
        return sum + (p ? p.price * it.qty : 0);
      }, 0),
    ),
  };
}

function grPrintData(doc: GoodsReceipt, { t, materials }: Ctx): PrintData {
  return {
    title: t.gr,
    no: doc.no,
    date: doc.date,
    party: `PO: ${doc.poId}`,
    cols: [t.material, t.ordered, t.received],
    rows: doc.lines.map((l) => {
      const m = materials.find((x) => x.code === l.materialCode);
      return [m?.name ?? l.materialCode, `${l.ordered} ${m?.unit ?? ''}`, `${l.received} ${m?.unit ?? ''}`];
    }),
    showTotal: false,
  };
}

export function computePrintData(ref: PrintDocRef, ctx: Ctx): PrintData {
  switch (ref.type) {
    case 'pr':
      return prPrintData(ref.doc, ctx);
    case 'po':
      return poPrintData(ref.doc, ctx);
    case 'so':
      return soPrintData(ref.doc, ctx);
    case 'gr':
      return grPrintData(ref.doc, ctx);
  }
}

const esc = (v: string | number) =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const anchorId = (no: string, i: number) => `doc-${String(no).replace(/[^a-zA-Z0-9]/g, '-')}-${i}`;

/** Opens a standalone browser tab holding one or more printable documents. */
export function openDocsPreviewWindow(
  title: string,
  docs: PrintData[],
  store: StoreSettings,
  t: Translation,
): void {
  const docHtml = (pd: PrintData, i: number) => `
    <div class="doc" id="${anchorId(pd.no, i)}">
      <div class="doc-head">
        <div><div class="brand">${esc(store.name)}</div><div class="tagline">${esc(store.businessType)}</div></div>
        <div class="doc-meta"><div class="doc-title">${esc(pd.title)}</div><div>${esc(pd.no)}</div><div class="muted">${esc(pd.date)}</div></div>
      </div>
      <div class="party">${esc(pd.party)}</div>
      <table><thead><tr>${pd.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${pd.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
      ${pd.showTotal ? `<div class="total">${esc(t.docTotal)}: ${esc(pd.totalLabel ?? '')}</div>` : ''}
    </div>`;

  const index = docs.length
    ? `<div class="index">${docs.map((pd, i) => `<a href="#${anchorId(pd.no, i)}">${esc(pd.no)}</a>`).join('')}</div>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:'Plus Jakarta Sans',Arial,sans-serif;margin:0;padding:28px;color:#15151f;background:#f2f3f6}
  h1{font-size:17px;margin:0 0 14px}
  .index{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}
  .index a{display:inline-block;background:#fff;border:1px solid #e5e5ee;color:#15151f;text-decoration:none;font-weight:700;font-size:12.5px;padding:8px 14px;border-radius:20px}
  .index a:hover{border-color:#15151f}
  .doc{background:#fff;border-radius:14px;padding:30px;margin-bottom:22px;box-shadow:0 1px 2px rgba(20,20,40,.06);max-width:720px;scroll-margin-top:16px}
  .doc-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #15151f;padding-bottom:14px;margin-bottom:18px}
  .brand{font-weight:700;font-size:18px} .tagline{font-size:12px;color:#9a9aab;margin-top:2px}
  .doc-title{font-weight:700;font-size:15px} .muted{font-size:11px;color:#9a9aab}
  .doc-meta{text-align:right}
  .party{font-size:13px;font-weight:700;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  th{text-align:left;padding:8px 6px;border-bottom:2px solid #15151f;font-size:11px;text-transform:uppercase;color:#6b6b7b}
  td{padding:8px 6px;border-bottom:1px solid #eee}
  .total{display:flex;justify-content:flex-end;margin-top:14px;font-size:13.5px;font-weight:800}
  .empty{padding:40px;text-align:center;color:#b0b0be;font-size:13px}
</style></head><body>
<h1>${esc(title)}</h1>
${index}
${docs.length ? docs.map(docHtml).join('') : `<div class="empty">${esc(t.noCompletedDocs)}</div>`}
</body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

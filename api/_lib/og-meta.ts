import { encodeOgPayload, type IOgPayload } from './og-payload.js';

export interface IOgMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  imageType?: string;
  jsonLd?: string;
}

export interface IBillDataInput {
  code: string;
  name?: string;
  title?: string;
  description?: string;
  totalAmount?: number;
  memberCount?: number;
  image?: string;
  imageType?: string;
}

export const SITE_NAME = 'Bill Splitter';
export const DEFAULT_DESCRIPTION = 'Bạn cứ chill – bill tôi chia';
export const DEFAULT_CDN_BASE = 'https://cdn-chiatien.thanhdc.app';

/** Định dạng số tiền sang định dạng VND chuẩn (vd: 1.250.000 ₫) */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Thoát các ký tự đặc biệt để chống XSS và vỡ cú pháp HTML */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getImageMimeType(url: string): string {
  const pathname = url.split('?')[0].toLowerCase();
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/** Chuyển đường dẫn thành URL HTTPS tuyệt đối */
export function toAbsoluteUrl(raw: string, origin: string, cdnBase = DEFAULT_CDN_BASE): string {
  const value = raw.trim();
  if (!value) return '';

  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('//')) return `https:${value}`;

  // File lưu trữ trên Cloud Storage / CDN
  if (!value.startsWith('assets/') && !value.startsWith('images/') && !value.startsWith('icons/')) {
    const cleanKey = value.replace(/^\/+/, '');
    const cleanCdn = (cdnBase || DEFAULT_CDN_BASE).replace(/\/+$/, '');
    return `${cleanCdn}/${cleanKey}`;
  }

  // File tĩnh cục bộ thuộc web host
  try {
    const url = new URL(value, origin.replace(/\/+$/, '') + '/');
    return url.toString();
  } catch {
    return '';
  }
}

export function buildBillOgMeta(bill: IBillDataInput, origin: string): IOgMeta {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const billCode = bill.code.trim();
  const pageUrl = `${cleanOrigin}/${encodeURIComponent(billCode)}`;

  // 1. Xác định Title
  let title = bill.title?.trim();
  if (!title) {
    title = bill.name?.trim()
      ? `Hóa đơn: ${bill.name.trim()} — ${SITE_NAME}`
      : `${SITE_NAME} — ${DEFAULT_DESCRIPTION}`;
  }

  // 2. Xác định Description
  let description = bill.description?.trim();
  if (!description) {
    if (typeof bill.totalAmount === 'number' && bill.totalAmount > 0) {
      const parts = [`Tổng tiền: ${formatCurrency(bill.totalAmount)}`];
      if (typeof bill.memberCount === 'number' && bill.memberCount > 0) {
        parts.push(`${bill.memberCount} người tham gia`);
      }
      parts.push('Bấm để xem chi tiết và quét QR thanh toán.');
      description = parts.join(' • ');
    } else {
      description = `Xem chi tiết hóa đơn ${bill.name || billCode} trên ${SITE_NAME}.`;
    }
  }

  // 3. Xác định Image (ưu tiên dynamic image card 1200x630, fallback custom image hoặc thumbnail)
  let fullImage = '';
  let imageType = 'image/png';

  if (billCode) {
    // Luôn ưu tiên Dynamic OG Image Card chuẩn tỉ lệ 1.91:1
    const payload: IOgPayload = { c: billCode };
    const nameToPass = bill.name?.trim() || bill.title?.trim();
    if (nameToPass) payload.n = nameToPass;
    if (typeof bill.totalAmount === 'number' && bill.totalAmount > 0) payload.a = bill.totalAmount;
    if (typeof bill.memberCount === 'number' && bill.memberCount > 0) payload.m = bill.memberCount;

    const { d, s } = encodeOgPayload(payload);
    fullImage = `${cleanOrigin}/api/og-image?code=${encodeURIComponent(billCode)}&d=${encodeURIComponent(d)}&s=${encodeURIComponent(s)}`;
    imageType = 'image/png';
  } else if (bill.image) {
    fullImage = toAbsoluteUrl(bill.image, cleanOrigin);
    imageType = bill.imageType || getImageMimeType(fullImage);
  } else {
    fullImage = `${cleanOrigin}/thumbnail.webp`;
    imageType = 'image/webp';
  }

  // 4. Dựng cấu trúc Schema.org JSON-LD
  const jsonLdObj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description.slice(0, 300),
    url: pageUrl,
    image: [fullImage],
  };

  return {
    title,
    description: description.slice(0, 300),
    url: pageUrl,
    image: fullImage,
    imageType,
    jsonLd: JSON.stringify(jsonLdObj).replace(/<\/script/gi, '<\\/script'),
  };
}

/**
 * Xoá bỏ các thẻ Open Graph & Twitter cũ và chèn bộ thẻ Meta mới trước thẻ đóng </head>.
 */
export function injectOgMeta(html: string, meta: IOgMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const u = escapeHtml(meta.url);
  const i = meta.image ? escapeHtml(meta.image) : '';
  const it = meta.imageType || 'image/png';

  const newTags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:locale" content="vi_VN">`,
    `<meta property="og:url" content="${u}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    i && `<meta property="og:image" content="${i}">`,
    i && `<meta property="og:image:secure_url" content="${i}">`,
    i && `<meta property="og:image:type" content="${it}">`,
    i && `<meta property="og:image:width" content="1200">`,
    i && `<meta property="og:image:height" content="630">`,
    i && `<meta property="og:image:alt" content="${t}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    i && `<meta name="twitter:image" content="${i}">`,
    `<link rel="canonical" href="${u}">`,
    meta.jsonLd && `<script type="application/ld+json">${meta.jsonLd}</script>`,
  ]
    .filter(Boolean)
    .join('\n  ');

  // Loại bỏ các thẻ cũ tĩnh trong index.html gốc để tránh trùng lặp
  const cleanHtml = html
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${t}</title>`)
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']title["'][^>]*>/gi, '')
    .replace(/<meta\s+(property|name)=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\s+(property|name)=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '');

  return cleanHtml.replace('</head>', () => `  <meta name="description" content="${d}">\n  ${newTags}\n</head>`);
}

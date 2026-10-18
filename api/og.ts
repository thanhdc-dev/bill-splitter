import { buildBillOgMeta, injectOgMeta, type IBillDataInput } from './_lib/og-meta.js';

export const config = {
  runtime: 'edge',
};

const DEFAULT_API_BASE_URL = 'https://api.thanhdc.app';
const CODE_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const RESERVED_ROUTES = new Set(['bills', 'setting', 'auth', 'api']);

const CACHE_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
};

interface IBackendOgResponse {
  code: string;
  title?: string;
  description?: string;
  name?: string;
  totalAmount?: number;
  memberCount?: number;
  image?: string;
  imageType?: string;
}

interface IBackendBillResponse {
  code: string;
  name: string;
  data?: {
    totalAmount?: number;
    members?: Array<{ id: string; name: string }>;
    expenses?: Array<{ id: string; name: string; amount: number }>;
  };
  files?: Array<{ id: number; storagePath: string }>;
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') ?? requestUrl.host;
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;
  const code = (requestUrl.searchParams.get('code') ?? '').trim();

  // 1. Tải file index.html đã deploy (có kèm hash bundle)
  const shellHeaders: Record<string, string> = { cookie: request.headers.get('cookie') ?? '' };
  const bypass = process.env['VERCEL_AUTOMATION_BYPASS_SECRET'];
  if (bypass) shellHeaders['x-vercel-protection-bypass'] = bypass;

  const shell = await fetch(`${origin}/index.html`, { headers: shellHeaders });
  if (!shell.ok) return new Response('index.html unavailable', { status: 502 });
  const html = await shell.text();

  // Validate code: nếu rỗng, chứa ký tự lạ hoặc là route cố định, trả HTML gốc
  if (!code || !CODE_PATTERN.test(code) || RESERVED_ROUTES.has(code.toLowerCase())) {
    return new Response(html, { status: 200, headers: CACHE_HEADERS });
  }

  const apiBase = (process.env['API_BASE_URL']?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  try {
    let billInput: IBillDataInput | null = null;

    // 2a. Thử gọi Backend OG Endpoint chuyên dụng trước (GET /bills/:code/og)
    try {
      const ogRes = await fetch(`${apiBase}/bills/${encodeURIComponent(code)}/og`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (ogRes.ok) {
        const ogData = (await ogRes.json()) as IBackendOgResponse;
        billInput = {
          code: ogData.code || code,
          title: ogData.title,
          description: ogData.description,
          name: ogData.name,
          totalAmount: ogData.totalAmount,
          memberCount: ogData.memberCount,
          image: ogData.image,
          imageType: ogData.imageType,
        };
      }
    } catch {
      // Backend chưa có endpoint /og hoặc timeout, chuyển sang fallback gọi endpoint hiện có
      billInput = null;
    }

    // 2b. Nếu chưa có dữ liệu từ /og, fallback sang endpoint hiện có: GET /bills/:code
    if (!billInput) {
      const billRes = await fetch(`${apiBase}/bills/${encodeURIComponent(code)}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(3500),
      });

      if (billRes.status === 404) {
        // Hóa đơn không tồn tại: trả HTML với status 404 để crawler nhận biết, SPA client vẫn render màn hình 404
        return new Response(html, { status: 404, headers: CACHE_HEADERS });
      }

      if (!billRes.ok) {
        return new Response(html, { status: 200, headers: CACHE_HEADERS });
      }

      const billData = (await billRes.json()) as IBackendBillResponse;
      billInput = {
        code,
        name: billData.name,
        totalAmount: billData.data?.totalAmount ?? 0,
        memberCount: billData.data?.members?.length ?? 0,
        image: billData.files?.[0]?.storagePath,
      };
    }

    // 3. Inject thẻ meta động vào index.html
    const enrichedHtml = injectOgMeta(html, buildBillOgMeta(billInput, origin));
    return new Response(enrichedHtml, {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch (err) {
    // 4. Fallback an toàn: Khi có lỗi mạng hoặc timeout, vẫn trả HTML gốc không crash
    console.error('Lỗi khi tải thông tin OG cho bill:', err);
    return new Response(html, {
      status: 200,
      headers: { ...CACHE_HEADERS, 'cache-control': 'no-store' },
    });
  }
}

export async function HEAD(request: Request): Promise<Response> {
  const res = await GET(request);
  return new Response(null, { status: res.status, headers: res.headers });
}

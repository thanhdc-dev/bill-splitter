import React from 'react';
import { ImageResponse } from '@vercel/og';
import { decodeAndVerifyOgPayload } from './_lib/og-payload.js';

function ReceiptIcon() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1B6B72"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
        fill="#E0F2F1"
      />
      <path d="M16 8h-8" />
      <path d="M16 12h-8" />
      <path d="M13 16h-5" />
    </svg>
  );
}

function PointerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D9488"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginRight: '8px' }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 16 16 12 12 8" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}


const DEFAULT_API_BASE_URL = 'https://api.thanhdc.app';

function formatVND(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 đ';
  return (
    new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 0,
    }).format(amount) + ' đ'
  );
}

interface IFontConfig {
  name: string;
  data: ArrayBuffer;
  weight: 500 | 700;
  style: 'normal';
}

const INTER_500_URL =
  'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf';
const INTER_700_URL =
  'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf';

let cachedFontsPromise: Promise<IFontConfig[]> | null = null;

async function loadInterFonts(): Promise<IFontConfig[]> {
  if (!cachedFontsPromise) {
    cachedFontsPromise = (async () => {
      try {
        const [res500, res700] = await Promise.all([
          fetch(INTER_500_URL, { signal: AbortSignal.timeout(4000) }),
          fetch(INTER_700_URL, { signal: AbortSignal.timeout(4000) }),
        ]);

        if (!res500.ok || !res700.ok) {
          throw new Error(`Failed to fetch fonts: ${res500.status}/${res700.status}`);
        }

        const [data500, data700] = await Promise.all([res500.arrayBuffer(), res700.arrayBuffer()]);

        return [
          { name: 'Inter', data: data500, weight: 500, style: 'normal' },
          { name: 'Inter', data: data700, weight: 700, style: 'normal' },
        ];
      } catch (err) {
        console.warn('Không thể tải font Inter tùy biến, fallback font mặc định:', err);
        cachedFontsPromise = null;
        return [];
      }
    })();
  }
  return cachedFontsPromise;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const d = searchParams.get('d') ?? '';
  const s = searchParams.get('s') ?? '';
  let code = (searchParams.get('code') ?? '').trim();
  const apiBase = (process.env['API_BASE_URL']?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  let billName = 'Hóa đơn chia tiền';
  let totalAmount = 0;
  let memberCount = 0;
  let hasData = false;

  // 1. Thử giải mã và xác thực payload Base64URL + Checksum trước (Fast path - 0 backend call)
  const verifiedPayload = decodeAndVerifyOgPayload(d, s);
  if (verifiedPayload) {
    if (verifiedPayload.c) code = verifiedPayload.c;
    if (verifiedPayload.n?.trim()) billName = verifiedPayload.n.trim();
    if (typeof verifiedPayload.a === 'number') totalAmount = verifiedPayload.a;
    if (typeof verifiedPayload.m === 'number') memberCount = verifiedPayload.m;
    hasData = Boolean(verifiedPayload.n) || totalAmount > 0 || memberCount > 0;
  } else {
    // 2. Fallback kiểm tra query params truyền trực tiếp (name, amount, members)
    const directName = (searchParams.get('title') ?? searchParams.get('name') ?? '').trim();
    const directAmount = Number(searchParams.get('amount')) || 0;
    const directMembers = Number(searchParams.get('members')) || 0;

    if (directName) billName = directName;
    if (directAmount > 0) totalAmount = directAmount;
    if (directMembers > 0) memberCount = directMembers;
    hasData = Boolean(directName) || totalAmount > 0 || memberCount > 0;

    // 3. Nếu chưa có data và có code, fallback gọi backend (chỉ chạy khi gọi direct thiếu params)
    if (!hasData && code) {
      try {
        let fetched = false;
        try {
          const ogRes = await fetch(`${apiBase}/bills/${encodeURIComponent(code)}/og`, {
            signal: AbortSignal.timeout(2500),
          });
          if (ogRes.ok) {
            const og = await ogRes.json();
            billName = og.title || og.name || billName;
            totalAmount = Number(og.totalAmount) || 0;
            memberCount = Number(og.memberCount) || 0;
            fetched = true;
            hasData = true;
          }
        } catch {
          fetched = false;
        }

        if (!fetched) {
          const res = await fetch(`${apiBase}/bills/${encodeURIComponent(code)}`, {
            signal: AbortSignal.timeout(3000),
          });
          if (res.ok) {
            const bill = await res.json();
            billName = bill.name || billName;
            totalAmount = Number(bill.data?.totalAmount) || 0;
            memberCount = Array.isArray(bill.data?.members) ? bill.data.members.length : 0;
            hasData = true;
          }
        }
      } catch {
        hasData = false;
      }
    }
  }

  // Cắt ngắn tên nếu quá dài để hiển thị vừa vặn trong khung
  const displayTitle = billName.length > 55 ? `${billName.slice(0, 52)}...` : billName;

  const isCachedLong = hasData && Boolean(code);
  const cacheControl = isCachedLong
    ? 'public, s-maxage=604800, stale-while-revalidate=86400'
    : 'public, s-maxage=60, stale-while-revalidate=300';

  const fonts = await loadInterFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          backgroundImage: 'radial-gradient(circle at 50% 20%, #1E3A40 0%, #0F172A 70%)',
          fontFamily: 'Inter, sans-serif',
          padding: '40px',
        }}
      >
        {/* Card biên nhận ở giữa */}
        <div
          style={{
            width: '1060px',
            height: '540px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(27, 107, 114, 0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Header Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 44px',
              backgroundColor: '#F8FAFC',
              borderBottom: '2px dashed #CBD5E1',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <ReceiptIcon />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#1B6B72',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Bill Splitter
                </span>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                  Bạn cứ chill – bill tôi chia
                </span>
              </div>
            </div>

            {code ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 18px',
                  backgroundColor: '#E0F2F1',
                  borderRadius: '30px',
                  border: '1px solid #80CBC4',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#00695C', letterSpacing: '1px' }}>
                  #{code.toUpperCase()}
                </span>
              </div>
            ) : null}
          </div>

          {/* Body Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '36px 44px 28px',
              justifyContent: 'space-between',
            }}
          >
            {/* Tên hóa đơn */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#94A3B8',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                Tên Hóa Đơn
              </span>
              <span
                style={{
                  fontSize: '34px',
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: '1.25',
                }}
              >
                {displayTitle}
              </span>
            </div>

            {/* Khối hiển thị Tổng tiền & Thông tin chia tiền */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 28px',
                backgroundColor: '#F0FDFA',
                borderRadius: '16px',
                border: '1px solid #CCFBF1',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0D9488',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Tổng Tiền
                </span>
                <span
                  style={{
                    fontSize: '44px',
                    fontWeight: 700,
                    color: '#0F766E',
                    letterSpacing: '-1px',
                    marginTop: '2px',
                  }}
                >
                  {formatVND(totalAmount)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Thành viên</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                    {hasData && memberCount > 0 ? `${memberCount} người` : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Thanh toán</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                    Mã QR
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PointerIcon />
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#0D9488' }}>
                  Bấm vào để xem chi tiết tiền chia & quét mã QR
                </span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#64748B' }}>
                chiatien.thanhdc.app
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fonts.length > 0 ? { fonts } : {}),
      headers: {
        'content-type': 'image/png',
        'cache-control': cacheControl,
        'cdn-cache-control': cacheControl,
        'vercel-cdn-cache-control': cacheControl,
      },
    }
  );
}

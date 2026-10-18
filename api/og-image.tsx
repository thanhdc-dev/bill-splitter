import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const DEFAULT_API_BASE_URL = 'https://api.thanhdc.app';

function formatVND(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('code') ?? '').trim();
  const apiBase = (process.env['API_BASE_URL']?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  let billName = 'Hóa đơn chia tiền';
  let totalAmount = 0;
  let memberCount = 0;
  let hasData = false;

  if (code) {
    try {
      // 1. Thử gọi endpoint /og nếu có
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

      // 2. Fallback gọi endpoint /bills/:code hiện có
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
      // Lỗi mạng hoặc timeout: render thẻ mặc định
      hasData = false;
    }
  }

  // Cắt ngắn tên nếu quá dài để hiển thị vừa vặn trong khung
  const displayTitle = billName.length > 55 ? `${billName.slice(0, 52)}...` : billName;

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
          fontFamily: 'sans-serif',
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
              <span style={{ fontSize: '36px' }}>🧾</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
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
                  fontWeight: 800,
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
                    fontWeight: 900,
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
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Thành viên</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                    {hasData && memberCount > 0 ? `${memberCount} người` : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Thanh toán</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
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
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0D9488' }}>
                👉 Bấm vào để xem chi tiết tiền chia & quét mã QR
              </span>
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
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}

export interface IOgPayload {
  c: string; // bill code
  n?: string; // bill name / title
  a?: number; // total amount
  m?: number; // member count
  v?: number; // revision / version hash
}

const DEFAULT_OG_SALT = 'bill-splitter-og-salt-2026';

export function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function computeChecksumSync(
  str: string,
  salt = (typeof process !== 'undefined' && process.env?.['OG_SECRET']) || DEFAULT_OG_SALT
): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  const combined = `${salt}:${str}`;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const val = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return val.toString(36);
}

export function encodeOgPayload(payload: IOgPayload, salt?: string): { d: string; s: string } {
  const jsonStr = JSON.stringify(payload);
  const d = toBase64Url(jsonStr);
  const s = computeChecksumSync(d, salt);
  return { d, s };
}

export function decodeAndVerifyOgPayload(d: string, s: string, salt?: string): IOgPayload | null {
  if (!d || !s) return null;
  const expectedSig = computeChecksumSync(d, salt);
  if (expectedSig !== s) return null;

  try {
    const jsonStr = fromBase64Url(d);
    const parsed = JSON.parse(jsonStr) as IOgPayload;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) LOOKUP[ALPHABET[i]] = i;

/** Decodes a base64 string (padding and whitespace tolerated) into bytes. */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));

  let byteIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = LOOKUP[clean[i]];
    const b = LOOKUP[clean[i + 1]];
    const c = i + 2 < clean.length ? LOOKUP[clean[i + 2]] : undefined;
    const d = i + 3 < clean.length ? LOOKUP[clean[i + 3]] : undefined;

    bytes[byteIndex++] = (a << 2) | (b >> 4);
    if (c !== undefined) bytes[byteIndex++] = ((b & 15) << 4) | (c >> 2);
    if (d !== undefined) bytes[byteIndex++] = ((c! & 3) << 6) | d;
  }

  return bytes;
}

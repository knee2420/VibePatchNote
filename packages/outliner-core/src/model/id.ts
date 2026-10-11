/**
 * @file id.ts
 * @description 12자리 불변 Base62 Node ID 발급기
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ID_LENGTH = 12;

export function generateNodeId(): string {
  let id = '';
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : null;

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = new Uint8Array(ID_LENGTH);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < ID_LENGTH; i++) {
      id += ALPHABET[bytes[i] % ALPHABET.length];
    }
  } else {
    for (let i = 0; i < ID_LENGTH; i++) {
      id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
  }
  return id;
}

export function isValidNodeId(id: string): boolean {
  return typeof id === 'string' && /^[0-9a-zA-Z]{12}$/.test(id);
}

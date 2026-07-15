import {
  base64ToBytes,
  bytesToBase64,
  textToBytes,
} from "./encoding";

export const KDF_ALGORITHM =
  "PBKDF2-SHA256" as const;

export type KdfAlgorithm =
  typeof KDF_ALGORITHM;

export type KdfParameters = {
  algorithm: KdfAlgorithm;
  salt: string;
  iterations: number;
};

const SALT_LENGTH_BYTES = 16;
const MINIMUM_ITERATIONS = 100_000;

function toArrayBuffer(
  bytes: Uint8Array
): ArrayBuffer {
  const copy = new Uint8Array(
    bytes.byteLength
  );

  copy.set(bytes);

  return copy.buffer;
}

export function generateKdfSalt(): string {
  const salt = crypto.getRandomValues(
    new Uint8Array(SALT_LENGTH_BYTES)
  );

  return bytesToBase64(salt);
}

export async function deriveWrappingKey(params: {
  secret: string;
  salt: string;
  iterations: number;
}): Promise<CryptoKey> {
  const { secret, salt, iterations } = params;

  if (!secret) {
    throw new Error(
      "كلمة الاشتقاق فارغة"
    );
  }

  if (
    !Number.isInteger(iterations) ||
    iterations < MINIMUM_ITERATIONS
  ) {
    throw new Error(
      "عدد تكرارات PBKDF2 غير صالح"
    );
  }

  const secretBytes = textToBytes(secret);
  const saltBytes = base64ToBytes(salt);

  const baseKey =
    await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(secretBytes),
      {
        name: "PBKDF2",
      },
      false,
      ["deriveKey"]
    );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(saltBytes),
      iterations,
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}
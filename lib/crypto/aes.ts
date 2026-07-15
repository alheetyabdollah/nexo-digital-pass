import {
  base64ToBytes,
  bytesToBase64,
} from "./encoding";

export const CRYPTO_VERSION = 2 as const;
export const ENCRYPTION_ALGORITHM = "AES-GCM" as const;

type EncryptedEnvelope = {
  version: typeof CRYPTO_VERSION;
  algorithm: typeof ENCRYPTION_ALGORITHM;
  iv: string;
  ciphertext: string;
};

const IV_LENGTH_BYTES = 12;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  return copy.buffer;
}

function parseEnvelope(
  payload: string
): EncryptedEnvelope {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error(
      "صيغة البيانات المشفرة غير صالحة"
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    !("algorithm" in parsed) ||
    !("iv" in parsed) ||
    !("ciphertext" in parsed)
  ) {
    throw new Error("حزمة التشفير غير مكتملة");
  }

  const envelope =
    parsed as Record<string, unknown>;

  if (envelope.version !== CRYPTO_VERSION) {
    throw new Error("إصدار التشفير غير مدعوم");
  }

  if (
    envelope.algorithm !== ENCRYPTION_ALGORITHM
  ) {
    throw new Error(
      "خوارزمية التشفير غير مدعومة"
    );
  }

  if (
    typeof envelope.iv !== "string" ||
    typeof envelope.ciphertext !== "string"
  ) {
    throw new Error(
      "بيانات التشفير غير صالحة"
    );
  }

  const iv = base64ToBytes(envelope.iv);

  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error("طول IV غير صالح");
  }

  return {
    version: CRYPTO_VERSION,
    algorithm: ENCRYPTION_ALGORITHM,
    iv: envelope.iv,
    ciphertext: envelope.ciphertext,
  };
}

export async function encryptBytes(
  plaintext: Uint8Array,
  key: CryptoKey
): Promise<string> {
  if (plaintext.length === 0) {
    throw new Error(
      "لا يمكن تشفير بيانات فارغة"
    );
  }

  const iv = crypto.getRandomValues(
    new Uint8Array(IV_LENGTH_BYTES)
  );

  const encrypted =
    await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: toArrayBuffer(iv),
      },
      key,
      toArrayBuffer(plaintext)
    );

  const envelope: EncryptedEnvelope = {
    version: CRYPTO_VERSION,
    algorithm: ENCRYPTION_ALGORITHM,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(
      new Uint8Array(encrypted)
    ),
  };

  return JSON.stringify(envelope);
}

export async function decryptBytes(
  payload: string,
  key: CryptoKey
): Promise<Uint8Array> {
  const envelope = parseEnvelope(payload);

  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(
    envelope.ciphertext
  );

  try {
    const decrypted =
      await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_ALGORITHM,
          iv: toArrayBuffer(iv),
        },
        key,
        toArrayBuffer(ciphertext)
      );

    return new Uint8Array(decrypted);
  } catch {
    throw new Error(
      "فشل فك التشفير: المفتاح غير صحيح أو البيانات تالفة"
    );
  }
}
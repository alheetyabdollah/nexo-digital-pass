import {
  decryptBytes,
  encryptBytes,
} from "./aes";

const VAULT_KEY_LENGTH_BYTES = 32;

function toArrayBuffer(
  bytes: Uint8Array
): ArrayBuffer {
  const copy = new Uint8Array(
    bytes.byteLength
  );

  copy.set(bytes);

  return copy.buffer;
}

export function generateVaultKey(): Uint8Array {
  return crypto.getRandomValues(
    new Uint8Array(
      VAULT_KEY_LENGTH_BYTES
    )
  );
}

export async function importVaultKey(
  vaultKey: Uint8Array
): Promise<CryptoKey> {
  if (
    vaultKey.length !==
    VAULT_KEY_LENGTH_BYTES
  ) {
    throw new Error(
      "طول Vault Key غير صالح"
    );
  }

  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(vaultKey),
    {
      name: "AES-GCM",
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptVaultKey(
  vaultKey: Uint8Array,
  wrappingKey: CryptoKey
): Promise<string> {
  if (
    vaultKey.length !==
    VAULT_KEY_LENGTH_BYTES
  ) {
    throw new Error(
      "طول Vault Key غير صالح"
    );
  }

  return encryptBytes(
    vaultKey,
    wrappingKey
  );
}

export async function decryptVaultKey(
  encryptedVaultKey: string,
  wrappingKey: CryptoKey
): Promise<Uint8Array> {
  const vaultKey = await decryptBytes(
    encryptedVaultKey,
    wrappingKey
  );

  if (
    vaultKey.length !==
    VAULT_KEY_LENGTH_BYTES
  ) {
    throw new Error(
      "البيانات المفكوكة لا تمثل Vault Key صالحًا"
    );
  }

  return vaultKey;
}
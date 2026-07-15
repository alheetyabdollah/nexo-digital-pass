import {
  decryptBytes,
  encryptBytes,
} from "./aes";

import {
  bytesToText,
  textToBytes,
} from "./encoding";

import {
  hasActiveVaultSession,
  requireActiveVaultKey,
} from "./session";

export function isVaultSessionActive(
  cardCode: string
): boolean {
  const cleanedCardCode = cardCode.trim();

  if (!cleanedCardCode) {
    return false;
  }

  return hasActiveVaultSession(cleanedCardCode);
}

export async function encryptVaultText(
  value: string,
  cardCode: string
): Promise<string> {
  const cleanedCardCode = cardCode.trim();

  if (!cleanedCardCode) {
    throw new Error("رقم البطاقة غير صالح");
  }

  if (!value) {
    throw new Error("لا يمكن تشفير نص فارغ");
  }

  const vaultKey =
    requireActiveVaultKey(cleanedCardCode);

  return encryptBytes(
    textToBytes(value),
    vaultKey
  );
}

export async function decryptVaultText(
  encryptedValue: string,
  cardCode: string
): Promise<string> {
  const cleanedCardCode = cardCode.trim();

  if (!cleanedCardCode) {
    throw new Error("رقم البطاقة غير صالح");
  }

  if (!encryptedValue) {
    throw new Error("البيانات المشفرة فارغة");
  }

  const vaultKey =
    requireActiveVaultKey(cleanedCardCode);

  const decryptedBytes =
    await decryptBytes(
      encryptedValue,
      vaultKey
    );

  return bytesToText(decryptedBytes);
}

export async function encryptOptionalVaultText(
  value: string | null | undefined,
  cardCode: string
): Promise<string | null> {
  const cleanedValue = value?.trim() || "";

  if (!cleanedValue) {
    return null;
  }

  return encryptVaultText(
    cleanedValue,
    cardCode
  );
}

export async function decryptOptionalVaultText(
  encryptedValue:
    | string
    | null
    | undefined,
  cardCode: string
): Promise<string | null> {
  if (!encryptedValue) {
    return null;
  }

  return decryptVaultText(
    encryptedValue,
    cardCode
  );
}
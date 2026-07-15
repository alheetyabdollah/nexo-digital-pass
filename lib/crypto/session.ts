import { importVaultKey } from "./vault";

let activeVaultKey: CryptoKey | null = null;
let activeCardCode: string | null = null;

export async function establishVaultSession(params: {
  cardCode: string;
  vaultKeyBytes: Uint8Array;
}): Promise<void> {
  const cardCode = params.cardCode.trim();

  if (!cardCode) {
    throw new Error("رقم البطاقة غير صالح");
  }

  if (params.vaultKeyBytes.length !== 32) {
    throw new Error("Vault Key غير صالح");
  }

  try {
    const importedKey = await importVaultKey(
      params.vaultKeyBytes
    );

    activeVaultKey = importedKey;
    activeCardCode = cardCode;
  } finally {
    // مسح نسخة البايتات الخام بعد تحويلها إلى CryptoKey.
    params.vaultKeyBytes.fill(0);
  }
}

export function clearVaultSession(): void {
  activeVaultKey = null;
  activeCardCode = null;
}

export function hasActiveVaultSession(
  cardCode?: string
): boolean {
  if (!activeVaultKey || !activeCardCode) {
    return false;
  }

  if (!cardCode) {
    return true;
  }

  return activeCardCode === cardCode.trim();
}

export function requireActiveVaultKey(
  cardCode?: string
): CryptoKey {
  if (!activeVaultKey || !activeCardCode) {
    throw new Error("الخزنة مقفلة");
  }

  if (
    cardCode &&
    activeCardCode !== cardCode.trim()
  ) {
    throw new Error(
      "جلسة الخزنة لا تخص هذه البطاقة"
    );
  }

  return activeVaultKey;
}

export function getActiveCardCode(): string | null {
  return activeCardCode;
}
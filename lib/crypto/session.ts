import { importVaultKey } from "./vault";

type VaultSessionMemory = {
  activeVaultKey: CryptoKey | null;
  activeCardCode: string | null;
};

type NexoWindow = Window & {
  __NEXO_VAULT_SESSION__?: VaultSessionMemory;
};

const serverFallback: VaultSessionMemory = {
  activeVaultKey: null,
  activeCardCode: null,
};

function getVaultSessionMemory(): VaultSessionMemory {
  if (typeof window === "undefined") {
    return serverFallback;
  }

  const nexoWindow = window as NexoWindow;

  if (!nexoWindow.__NEXO_VAULT_SESSION__) {
    nexoWindow.__NEXO_VAULT_SESSION__ = {
      activeVaultKey: null,
      activeCardCode: null,
    };
  }

  return nexoWindow.__NEXO_VAULT_SESSION__;
}

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

    const memory = getVaultSessionMemory();

    memory.activeVaultKey = importedKey;
    memory.activeCardCode = cardCode;
  } finally {
    // مسح نسخة البايتات الخام بعد تحويلها إلى CryptoKey.
    params.vaultKeyBytes.fill(0);
  }
}

export function clearVaultSession(): void {
  const memory = getVaultSessionMemory();

  memory.activeVaultKey = null;
  memory.activeCardCode = null;
}

export function hasActiveVaultSession(
  cardCode?: string
): boolean {
  const memory = getVaultSessionMemory();

  if (
    !memory.activeVaultKey ||
    !memory.activeCardCode
  ) {
    return false;
  }

  if (!cardCode) {
    return true;
  }

  return (
    memory.activeCardCode ===
    cardCode.trim()
  );
}

export function requireActiveVaultKey(
  cardCode?: string
): CryptoKey {
  const memory = getVaultSessionMemory();

  if (
    !memory.activeVaultKey ||
    !memory.activeCardCode
  ) {
    throw new Error("الخزنة مقفلة");
  }

  if (
    cardCode &&
    memory.activeCardCode !==
      cardCode.trim()
  ) {
    throw new Error(
      "جلسة الخزنة لا تخص هذه البطاقة"
    );
  }

  return memory.activeVaultKey;
}

export function getActiveCardCode(): string | null {
  return getVaultSessionMemory().activeCardCode;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearVaultSession,
  establishVaultSession,
  hasActiveVaultSession,
} from "@/lib/crypto/session";

import {
  decryptOptionalVaultText,
  decryptVaultText,
  encryptOptionalVaultText,
  encryptVaultText,
} from "@/lib/crypto/access";

type OpenSessionParams = {
  cardCode: string;
  vaultKeyBytes: Uint8Array;
};

type VaultSessionContextValue = {
  isUnlocked: boolean;
  cardCode: string | null;
  unlockedAt: number | null;

  openSession: (
    params: OpenSessionParams
  ) => Promise<void>;

  lockSession: () => void;

  matchesCard: (
    cardCode: string
  ) => boolean;

  encryptText: (
    value: string,
    requestedCardCode?: string
  ) => Promise<string>;

  decryptText: (
    encryptedValue: string,
    requestedCardCode?: string
  ) => Promise<string>;

  encryptOptionalText: (
    value: string | null | undefined,
    requestedCardCode?: string
  ) => Promise<string | null>;

  decryptOptionalText: (
    encryptedValue:
      | string
      | null
      | undefined,
    requestedCardCode?: string
  ) => Promise<string | null>;
};

const VaultSessionContext =
  createContext<VaultSessionContextValue | null>(
    null
  );

type VaultSessionProviderProps = {
  children: ReactNode;
};

export default function VaultSessionProvider({
  children,
}: VaultSessionProviderProps) {
  const [cardCode, setCardCode] =
    useState<string | null>(null);

  const [unlockedAt, setUnlockedAt] =
    useState<number | null>(null);

  const requireSessionCardCode =
    useCallback(
      (
        requestedCardCode?: string
      ): string => {
        if (!cardCode) {
          throw new Error(
            "الخزنة مقفلة"
          );
        }

        const cleanedRequestedCardCode =
          requestedCardCode?.trim();

        if (
          cleanedRequestedCardCode &&
          cleanedRequestedCardCode !==
            cardCode
        ) {
          throw new Error(
            "جلسة الخزنة لا تخص هذه البطاقة"
          );
        }

        if (
          !hasActiveVaultSession(
            cardCode
          )
        ) {
          throw new Error(
            "جلسة الخزنة غير صالحة"
          );
        }

        return cardCode;
      },
      [cardCode]
    );

  const openSession = useCallback(
    async ({
      cardCode: nextCardCode,
      vaultKeyBytes,
    }: OpenSessionParams) => {
      const cleanedCardCode =
        nextCardCode.trim();

      if (!cleanedCardCode) {
        throw new Error(
          "رقم البطاقة غير صالح"
        );
      }

      await establishVaultSession({
        cardCode: cleanedCardCode,
        vaultKeyBytes,
      });

      setCardCode(cleanedCardCode);
      setUnlockedAt(Date.now());
    },
    []
  );

  const lockSession =
    useCallback(() => {
      clearVaultSession();
      setCardCode(null);
      setUnlockedAt(null);
    }, []);

  const matchesCard = useCallback(
    (
      requestedCardCode: string
    ): boolean => {
      const cleanedCardCode =
        requestedCardCode.trim();

      if (!cleanedCardCode) {
        return false;
      }

      return hasActiveVaultSession(
        cleanedCardCode
      );
    },
    []
  );

  const encryptText = useCallback(
    async (
      value: string,
      requestedCardCode?: string
    ): Promise<string> => {
      const activeCardCode =
        requireSessionCardCode(
          requestedCardCode
        );

      return encryptVaultText(
        value,
        activeCardCode
      );
    },
    [requireSessionCardCode]
  );

  const decryptText = useCallback(
    async (
      encryptedValue: string,
      requestedCardCode?: string
    ): Promise<string> => {
      const activeCardCode =
        requireSessionCardCode(
          requestedCardCode
        );

      return decryptVaultText(
        encryptedValue,
        activeCardCode
      );
    },
    [requireSessionCardCode]
  );

  const encryptOptionalText =
    useCallback(
      async (
        value:
          | string
          | null
          | undefined,
        requestedCardCode?: string
      ): Promise<string | null> => {
        const activeCardCode =
          requireSessionCardCode(
            requestedCardCode
          );

        return encryptOptionalVaultText(
          value,
          activeCardCode
        );
      },
      [requireSessionCardCode]
    );

  const decryptOptionalText =
    useCallback(
      async (
        encryptedValue:
          | string
          | null
          | undefined,
        requestedCardCode?: string
      ): Promise<string | null> => {
        const activeCardCode =
          requireSessionCardCode(
            requestedCardCode
          );

        return decryptOptionalVaultText(
          encryptedValue,
          activeCardCode
        );
      },
      [requireSessionCardCode]
    );

  useEffect(() => {
    return () => {
      clearVaultSession();
    };
  }, []);

  const value =
    useMemo<VaultSessionContextValue>(
      () => ({
        isUnlocked:
          cardCode !== null &&
          unlockedAt !== null &&
          hasActiveVaultSession(
            cardCode
          ),

        cardCode,
        unlockedAt,

        openSession,
        lockSession,
        matchesCard,

        encryptText,
        decryptText,
        encryptOptionalText,
        decryptOptionalText,
      }),
      [
        cardCode,
        unlockedAt,
        openSession,
        lockSession,
        matchesCard,
        encryptText,
        decryptText,
        encryptOptionalText,
        decryptOptionalText,
      ]
    );

  return (
    <VaultSessionContext.Provider
      value={value}
    >
      {children}
    </VaultSessionContext.Provider>
  );
}

export function useVaultSession(): VaultSessionContextValue {
  const context = useContext(
    VaultSessionContext
  );

  if (!context) {
    throw new Error(
      "useVaultSession يجب استخدامه داخل VaultSessionProvider"
    );
  }

  return context;
}
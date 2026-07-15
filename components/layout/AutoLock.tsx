"use client";

import { useEffect } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useVaultSession } from "@/components/providers/VaultSessionProvider";

const AUTO_LOCK_MINUTES = 10;

const PROTECTED_PATHS = [
  "/vault",
  "/service",
  "/account",
  "/apple",
  "/google",
  "/instagram",
  "/facebook",
  "/whatsapp",
  "/telegram",
  "/tiktok",
  "/other",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
}

function clearLegacySession(cardCode?: string | null) {
  if (cardCode) {
    localStorage.removeItem(
      `nexo_unlocked_${cardCode}`
    );

    sessionStorage.removeItem(
      `nexo_unlocked_${cardCode}`
    );

    sessionStorage.removeItem(
      `nexo_vault_password_${cardCode}`
    );
  }

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("nexo_unlocked_")) {
      localStorage.removeItem(key);
    }
  });

  Object.keys(sessionStorage).forEach((key) => {
    if (
      key.startsWith("nexo_unlocked_") ||
      key.startsWith("nexo_vault_password_")
    ) {
      sessionStorage.removeItem(key);
    }
  });
}

export default function AutoLock() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    cardCode,
    isUnlocked,
    lockSession,
  } = useVaultSession();

  useEffect(() => {
    if (
      !isUnlocked ||
      !isProtectedPath(pathname)
    ) {
      return;
    }

    let timer: ReturnType<
      typeof setTimeout
    > | null = null;

    const lockVault = () => {
      const lastCard =
        cardCode ||
        sessionStorage.getItem(
          "nexo_last_card"
        );

      lockSession();
      clearLegacySession(lastCard);

      if (lastCard) {
        router.replace(
          `/unlock?card=${encodeURIComponent(
            lastCard
          )}`
        );
      } else {
        router.replace("/");
      }
    };

    const resetTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(
        lockVault,
        AUTO_LOCK_MINUTES * 60 * 1000
      );
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;

    activityEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        resetTimer,
        { passive: true }
      );
    });

    /*
     * عند إخفاء الصفحة لا نوقف المؤقت.
     * بذلك تستمر مدة القفل أثناء انتقال
     * المستخدم إلى تطبيق آخر.
     */
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        resetTimer();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    resetTimer();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            resetTimer
          );
        }
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    cardCode,
    isUnlocked,
    lockSession,
    pathname,
    router,
  ]);

  return null;
}
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const AUTO_LOCK_MINUTES = 5;

export default function AutoLock() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("nexo_vault_password_")) {
            sessionStorage.removeItem(key);
          }
        });

        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("nexo_unlocked_")) {
            localStorage.removeItem(key);
          }
        });

        const lastCard = sessionStorage.getItem("nexo_last_card");

        if (
          lastCard &&
          (
            pathname.startsWith("/vault") ||
            pathname.startsWith("/service") ||
            pathname.startsWith("/account") ||
            pathname.startsWith("/apple") ||
            pathname.startsWith("/google") ||
            pathname.startsWith("/instagram") ||
            pathname.startsWith("/facebook") ||
            pathname.startsWith("/whatsapp") ||
            pathname.startsWith("/telegram") ||
            pathname.startsWith("/tiktok") ||
            pathname.startsWith("/other")
          )
        ) {
          router.push(`/unlock?card=${lastCard}`);
        }
      }, AUTO_LOCK_MINUTES * 60 * 1000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        startTimer();
      } else {
        if (timer) clearTimeout(timer);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);

      if (timer) clearTimeout(timer);
    };
  }, [pathname, router]);

  return null;
}
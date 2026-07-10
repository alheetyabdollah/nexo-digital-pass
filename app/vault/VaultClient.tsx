"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineCube } from "react-icons/hi2";

import { supabase } from "@/lib/supabase";
import VaultHeader from "./components/VaultHeader";
import WelcomeCard from "./components/WelcomeCard";
import VaultSummaryCard from "./components/VaultSummaryCard";
import AppsGrid from "./components/AppsGrid";
import SecurityCard from "./components/SecurityCard";

type ServiceCount = {
  service: string;
};

export default function VaultClient() {
  const searchParams = useSearchParams();
  const cardCode = searchParams.get("card");

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<ServiceCount[]>([]);
  const [cardId, setCardId] = useState<string | null>(null);

  const accountCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    accounts.forEach((account) => {
      const service = account.service?.toLowerCase();

      if (!service) return;

      counts[service] = (counts[service] || 0) + 1;
    });

    return counts;
  }, [accounts]);

  const totalAccounts = accounts.length;

  const closeVault = () => {
    if (!cardCode) {
      window.location.href = "/";
      return;
    }

    localStorage.removeItem(`nexo_unlocked_${cardCode}`);
    sessionStorage.removeItem(`nexo_vault_password_${cardCode}`);
    window.location.href = `/card/${cardCode}`;
  };

  useEffect(() => {
    async function loadVault() {
      if (!cardCode) {
        setLoading(false);
        return;
      }

      sessionStorage.setItem("nexo_last_card", cardCode);

      const unlocked = localStorage.getItem(
        `nexo_unlocked_${cardCode}`
      );

      const vaultPassword = sessionStorage.getItem(
        `nexo_vault_password_${cardCode}`
      );

      if (!unlocked || !vaultPassword) {
        window.location.href = `/unlock?card=${cardCode}`;
        return;
      }

      const { data: card, error: cardError } = await supabase
        .from("cards")
        .select("id")
        .eq("card_code", cardCode)
        .maybeSingle();

      if (cardError || !card) {
        window.location.href = `/card/${cardCode}`;
        return;
      }

      setCardId(card.id);

      const { data: accountData, error: accountsError } =
        await supabase
          .from("accounts")
          .select("service")
          .eq("card_id", card.id);

      if (!accountsError && accountData) {
        setAccounts(accountData);
      }

      setLoading(false);
    }

    loadVault();
  }, [cardCode]);

  useEffect(() => {
    if (!cardCode) return;

    let timer: ReturnType<typeof setTimeout>;

    const lockVault = () => {
      localStorage.removeItem(`nexo_unlocked_${cardCode}`);
      sessionStorage.removeItem(`nexo_vault_password_${cardCode}`);
      window.location.href = `/unlock?card=${cardCode}`;
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(lockVault, 10 * 60 * 1000);
    };

    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timer);

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [cardCode]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

          <p className="text-sm text-white/60">
            جاري تجهيز خزنتك...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#070707] text-white"
    >
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden px-4 pb-10 pt-5">
        <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[90px]" />

        <VaultHeader onClose={closeVault} />

        <WelcomeCard />

        <VaultSummaryCard
          cardCode={cardCode}
          totalAccounts={totalAccounts}
        />

        <Link
          href={
            cardCode
              ? `/service/all?card=${cardCode}`
              : "/service/all"
          }
          className="mb-6 flex items-center justify-between rounded-[25px] border border-orange-500/30 bg-white/[0.04] p-5 transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
              <HiOutlineCube size={28} />
            </div>

            <div>
              <h3 className="text-lg font-black">
                كل الحسابات
              </h3>

              <p className="mt-1 text-xs text-white/45">
                عرض وإدارة جميع حسابات خزنتك
              </p>
            </div>
          </div>

          <HiOutlineArrowLeft
            size={23}
            className="text-orange-400"
          />
        </Link>

        <AppsGrid
          cardCode={cardCode}
          accountCounts={accountCounts}
        />

        <SecurityCard />

        {!cardId && cardCode && (
          <p className="mt-5 text-center text-xs text-red-300">
            تعذر تحميل معلومات البطاقة بشكل كامل.
          </p>
        )}
      </div>
    </main>
  );
}
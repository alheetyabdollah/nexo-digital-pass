"use client";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Image from "next/image";
import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  FaApple,
  FaFacebook,
  FaTelegramPlane,
  FaWhatsapp,
} from "react-icons/fa";

import {
  SiGoogle,
  SiInstagram,
  SiTiktok,
} from "react-icons/si";

import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  
  HiOutlineCube,
  
  HiOutlineLockClosed,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineUser,
} from "react-icons/hi2";

import { supabase } from "@/lib/supabase";

import { useVaultSession } from "@/components/providers/VaultSessionProvider";


type ServiceCount = {
  service: string;
};

const apps = [
  {
    key: "apple",
    name: "Apple",
    href: "/apple",
    icon: <FaApple size={34} />,
    iconClass: "text-white",
  },
  {
    key: "google",
    name: "Google",
    href: "/google",
    icon: <SiGoogle size={31} />,
    iconClass: "text-white",
  },
  {
    key: "instagram",
    name: "Instagram",
    href: "/instagram",
    icon: <SiInstagram size={32} />,
    iconClass: "text-pink-500",
  },
  {
    key: "facebook",
    name: "Facebook",
    href: "/facebook",
    icon: <FaFacebook size={32} />,
    iconClass: "text-blue-500",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    href: "/whatsapp",
    icon: <FaWhatsapp size={33} />,
    iconClass: "text-green-500",
  },
  {
    key: "telegram",
    name: "Telegram",
    href: "/telegram",
    icon: <FaTelegramPlane size={31} />,
    iconClass: "text-sky-400",
  },
  {
    key: "tiktok",
    name: "TikTok",
    href: "/tiktok",
    icon: <SiTiktok size={30} />,
    iconClass: "text-white",
  },
  {
    key: "other",
    name: "Other",
    href: "/other",
    icon: <HiOutlineSquares2X2 size={33} />,
    iconClass: "text-white",
  },
];

function clearLegacyStorage(cardCode: string) {
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

export default function VaultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cardCode =
    searchParams.get("card")?.trim() || null;

  const {
    isUnlocked,
    matchesCard,
    lockSession,
  } = useVaultSession();

  const [loading, setLoading] =
    useState(true);

  const [accounts, setAccounts] =
    useState<ServiceCount[]>([]);

  const [cardId, setCardId] =
    useState<string | null>(null);

  const [loadError, setLoadError] =
    useState("");

  const accountCounts = useMemo(() => {
    const counts: Record<string, number> =
      {};

    accounts.forEach((account) => {
      const service =
        account.service?.toLowerCase();

      if (!service) return;

      counts[service] =
        (counts[service] || 0) + 1;
    });

    return counts;
  }, [accounts]);

  const totalAccounts = accounts.length;

  const closeVault = () => {
    if (!cardCode) {
      lockSession();
      router.replace("/");
      return;
    }

    lockSession();
    clearLegacyStorage(cardCode);

    router.replace(
      `/card/${encodeURIComponent(
        cardCode
      )}`
    );
  };

  useEffect(() => {
    let cancelled = false;

    async function loadVault() {
      setLoading(true);
      setLoadError("");

      if (!cardCode) {
        lockSession();
        router.replace("/");
        return;
      }

      sessionStorage.setItem(
        "nexo_last_card",
        cardCode
      );

      clearLegacyStorage(cardCode);

      if (
        !isUnlocked ||
        !matchesCard(cardCode)
      ) {
        router.replace(
          `/unlock?card=${encodeURIComponent(
            cardCode
          )}`
        );

        return;
      }

      const {
        data: card,
        error: cardError,
      } = await supabase
        .from("cards")
        .select(
          "id, status, crypto_version"
        )
        .eq("card_code", cardCode)
        .maybeSingle();

      if (cancelled) return;

      if (cardError) {
        console.error(cardError);

        setLoadError(
          "حدث خطأ أثناء تحميل البطاقة"
        );

        setLoading(false);
        return;
      }

      if (!card) {
        lockSession();

        router.replace(
          `/card/${encodeURIComponent(
            cardCode
          )}`
        );

        return;
      }

      if (card.status !== "Activated") {
        lockSession();

        router.replace(
          `/card/${encodeURIComponent(
            cardCode
          )}`
        );

        return;
      }

      if (card.crypto_version !== 2) {
        setLoadError(
          "إصدار تشفير البطاقة غير مدعوم"
        );

        setLoading(false);
        return;
      }

      setCardId(card.id);

      const {
        data: accountData,
        error: accountsError,
      } = await supabase
        .from("accounts")
        .select("service")
        .eq("card_id", card.id);

      if (cancelled) return;

      if (accountsError) {
        console.error(accountsError);

        setLoadError(
          "حدث خطأ أثناء تحميل الحسابات"
        );

        setLoading(false);
        return;
      }

      setAccounts(accountData || []);
      setLoading(false);
    }

    void loadVault();

    return () => {
      cancelled = true;
    };
  }, [
    cardCode,
    isUnlocked,
    lockSession,
    matchesCard,
    router,
  ]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

          <p className="text-sm text-white/55">
            جاري تجهيز خزنتك...
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#030303] px-5 text-white"
      >
        <section className="w-full max-w-md rounded-[28px] border border-red-500/20 bg-red-500/[0.06] p-6 text-center">
          <HiOutlineLockClosed
            size={38}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-5 text-xl font-black">
            تعذر فتح الخزنة
          </h1>

          <p className="mt-3 text-sm leading-7 text-red-200/70">
            {loadError}
          </p>

          <button
            type="button"
            onClick={closeVault}
            className="mt-6 w-full rounded-2xl bg-orange-500 py-4 font-black text-black transition active:scale-[0.98]"
          >
            الرجوع إلى البطاقة
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#020202] text-white"
    >
<div
  id="vault-top"
  className="relative mx-auto min-h-screen w-full max-w-[540px] overflow-hidden border-x border-white/10 bg-[#050505] pb-32 shadow-[0_0_100px_rgba(0,0,0,0.95)]"
>        {/* إضاءة الخلفية */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_7%,rgba(255,106,0,0.17),transparent_24%),radial-gradient(circle_at_15%_45%,rgba(255,106,0,0.06),transparent_28%)]" />

        {/* شبكة الخلفية */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
          <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative z-10 px-4 pt-5 sm:px-6">
          {/* الهيدر */}
          <header className="relative mb-5 overflow-hidden px-1 pb-2">
            <button
              type="button"
              onClick={closeVault}
              aria-label="إغلاق الخزنة"
              className="absolute left-0 top-0 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300 transition active:scale-95"
            >
              <HiOutlineLockClosed
                size={21}
              />
            </button>

            <div
              dir="ltr"
              className="grid min-h-[260px] grid-cols-[1fr_285px] items-center gap-2 sm:grid-cols-[1fr_350px]"
            >
              {/* الشعار والنص */}
              <div className="text-left">
                <h1 className="text-[48px] font-black leading-none tracking-tight text-[#ff6900] sm:text-[56px]">
                  NEXO
                </h1>

                <p className="mt-2 text-[12px] font-bold tracking-[0.3em] text-white sm:text-[14px]">
                  DIGITAL PASS
                </p>

                <p className="mt-4 text-[14px] text-white/75 sm:text-[16px]">
                  <span className="text-orange-500">
                    Secure.
                  </span>{" "}
                  Private.{" "}
                  <span className="text-orange-500">
                    Yours.
                  </span>
                </p>

                <p
                  dir="rtl"
                  className="mt-2 text-[16px] font-bold text-white/70 sm:text-lg"
                >
                  آمن
                  <span className="mx-2 text-orange-500">
                    •
                  </span>
                  خاص
                  <span className="mx-2 text-orange-500">
                    •
                  </span>
                  ملكك
                </p>
              </div>

              {/* الخزنة */}
              <div className="relative flex items-center justify-center pt-3">
                <div className="absolute bottom-4 h-8 w-40 rounded-full bg-orange-500/30 blur-2xl" />

                <Image
                  src="/images/nexo-vault.png"
                  alt="NEXO Vault"
                  width={320}
                  height={320}
                  priority
                  className="relative z-10 h-auto w-[245px] object-contain drop-shadow-[0_0_55px_rgba(255,106,0,0.55)] transition duration-500 hover:scale-[1.02] sm:w-[315px]"
                />
              </div>
            </div>
          </header>

          {/* بطاقة الترحيب */}
          <section className="relative mb-4 overflow-hidden rounded-[26px] border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-4 shadow-[0_22px_60px_rgba(0,0,0,0.52)]">
            <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-[70px]" />

            <div
              dir="ltr"
              className="relative flex items-center gap-4"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                <HiOutlineLockClosed
                  size={38}
                />
              </div>

              <div className="h-24 w-px shrink-0 bg-gradient-to-b from-transparent via-orange-500/55 to-transparent" />

              <div
                dir="rtl"
                className="min-w-0 flex-1"
              >
                <p className="text-xl font-bold text-white">
                  مرحبًا بك في
                </p>

                <h2 className="mt-1 text-[34px] font-black tracking-tight text-orange-500">
                  خزنتك الرقمية
                </h2>

                <div className="mt-4 space-y-3 text-sm leading-7 text-white/75">
                  <p className="flex items-start gap-2">
                    <HiOutlineLockClosed
                      size={16}
                      className="mt-1 shrink-0 text-orange-500"
                    />

                    <span>
                      بياناتك تُشفّر على
                      جهازك قبل حفظها.
                    </span>
                  </p>

                  <p className="flex items-start gap-2">
                    <HiOutlineShieldCheck
                      size={17}
                      className="mt-1 shrink-0 text-orange-500"
                    />

                    <span>
                      حتى فريق NEXO لا يستطيع
                      الاطلاع على محتوى
                      حساباتك.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* بطاقة رقم البطاقة */}
          <section className="mb-5 overflow-hidden rounded-[30px] border border-orange-500/50 bg-gradient-to-br from-[#181818] via-[#111111] to-[#090909] p-5 shadow-[0_25px_60px_rgba(255,106,0,0.12)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-orange-500">
                  <HiOutlineSquares2X2
                    size={26}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-orange-400/70">
                    DIGITAL PASS
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    رقم البطاقة
                  </p>
                </div>
              </div>

              <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                ACTIVE
              </div>
            </div>

            <div className="mt-5">
              <p
                dir="ltr"
                className="text-3xl font-black tracking-[0.22em] text-white"
              >
                {cardCode || "غير محدد"}
              </p>
            </div>

            <div className="my-5 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                    <HiOutlineUser
                      size={22}
                    />
                  </div>

                  <div>
                    <p className="text-2xl font-black text-white">
                      {totalAccounts}
                    </p>

                    <p className="text-xs text-white/50">
                      حسابات محفوظة
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                    <HiOutlineLockClosed
                      size={22}
                    />
                  </div>

                  <div>
                    <p className="font-black text-green-400">
                      محمية
                    </p>

                    <p className="text-xs text-white/50">
                      AES-256 Encryption
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* كل الحسابات */}
          <Link
            href={
              cardCode
                ? `/service/all?card=${encodeURIComponent(
                    cardCode
                  )}`
                : "/service/all"
            }
            className="group relative mb-5 flex items-center justify-between overflow-hidden rounded-[28px] border border-orange-500/35 bg-gradient-to-l from-orange-500/[0.08] via-white/[0.055] to-white/[0.025] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.34)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-500/55 hover:shadow-[0_24px_55px_rgba(255,106,0,0.12)] active:translate-y-0 active:scale-[0.98]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-orange-500/25 bg-orange-500/10 text-orange-500 shadow-[0_0_24px_rgba(255,106,0,0.14)] transition duration-300 group-hover:scale-105">
                <HiOutlineCube
                  size={31}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.18em] text-orange-400/70">
                  ALL ACCOUNTS
                </p>

                <h3 className="mt-1 text-xl font-black text-white">
                  كل الحسابات
                </h3>

                <p className="mt-1 text-sm leading-6 text-white/50">
                  عرض وإدارة جميع الحسابات
                  الموجودة في خزنتك
                </p>
              </div>
            </div>

            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-black/25 text-orange-500 transition duration-300 group-hover:-translate-x-1 group-hover:bg-orange-500/10">
              <HiOutlineArrowLeft
                size={24}
              />
            </div>
          </Link>

          {/* شبكة التطبيقات */}
          <section
            id="accounts"
            className="mt-6 scroll-mt-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-orange-400/70">
                  YOUR ACCOUNTS
                </p>

                <h3 className="mt-2 text-2xl font-black text-white">
                  حساباتك
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-500">
                <HiOutlinePlus
                  size={23}
                />
              </div>
            </div>

            <section className="grid grid-cols-2 gap-4">
              {apps.map((app) => {
                const count =
                  accountCounts[app.key] ||
                  0;

                return (
                  <Link
                    key={app.key}
                    href={
                      cardCode
                        ? `${app.href}?card=${encodeURIComponent(
                            cardCode
                          )}`
                        : app.href
                    }
                    className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-black/10 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-orange-500/35 hover:shadow-[0_0_28px_rgba(255,106,0,0.15)] active:scale-[0.98]"
                  >
                    {count > 0 && (
                      <span className="absolute left-3 top-3 flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-black text-black shadow-[0_0_18px_rgba(255,106,0,0.35)]">
                        {count}
                      </span>
                    )}

                    <div
                      className={`mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-white/10 bg-black/30 transition duration-300 group-hover:scale-110 ${app.iconClass}`}
                    >
                      {app.icon}
                    </div>

                    <h4
                      dir="ltr"
                      className="truncate text-lg font-black text-white"
                    >
                      {app.name}
                    </h4>

                    <p className="mt-2 text-sm text-white/45">
                      {count === 0
                        ? "لا توجد حسابات"
                        : count === 1
                          ? "حساب واحد"
                          : `${count} حسابات`}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          count > 0
                            ? "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,.8)]"
                            : "bg-white/20"
                        }`}
                      />

                      <HiOutlineArrowLeft
                        size={18}
                        className="text-orange-400 transition duration-300 group-hover:-translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </section>
          </section>

          {/* الحماية التلقائية */}
          <section className="mt-4 flex items-center gap-3 rounded-[23px] border border-white/10 bg-white/[0.035] p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-500/10 text-orange-500">
              <HiOutlineClock
                size={27}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">
                سيتم قفل الخزنة تلقائيًا
              </p>

              <p className="mt-1 text-xs text-white/55">
                بعد{" "}
                <span className="font-black text-orange-500">
                  10 دقائق
                </span>{" "}
                من عدم النشاط.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/40">
              <HiOutlineLockClosed
                size={21}
              />
            </div>
          </section>

          {!cardId && cardCode && (
            <p className="mt-5 text-center text-xs text-red-300">
              تعذر تحميل معلومات البطاقة
              بشكل كامل.
            </p>
          )}
        </div>

        {/* الشريط السفلي */}
<BottomNavigation cardCode={cardCode} />
      </div>
    </main>
  );
}
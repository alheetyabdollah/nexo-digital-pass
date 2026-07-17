"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";
import { useVaultSession } from "@/components/providers/VaultSessionProvider";

import {
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineCheckBadge,
  HiOutlineCreditCard,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

type CardData = {
  id: string;
  card_code: string;
  status: string | null;
  created_at?: string | null;
  activated_at?: string | null;
  updated_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "غير متوفر";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير متوفر";
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function MyCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cardCode = searchParams.get("card");

  const {
    isUnlocked,
    matchesCard,
  } = useVaultSession();

  const [card, setCard] =
    useState<CardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [statusMessage, setStatusMessage] =
    useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadCard() {
      const cleanedCardCode =
        cardCode?.trim();

      if (!cleanedCardCode) {
        router.replace("/");
        return;
      }

      if (
        !isUnlocked ||
        !matchesCard(cleanedCardCode)
      ) {
        router.replace(
          `/unlock?card=${encodeURIComponent(
            cleanedCardCode
          )}`
        );

        return;
      }

      try {
        const { data, error } =
          await supabase
            .from("cards")
            .select("*")
            .eq(
              "card_code",
              cleanedCardCode
            )
            .maybeSingle();

        if (cancelled) {
          return;
        }

        if (error) {
          console.error(error);

          setStatusMessage(
            "حدث خطأ أثناء تحميل معلومات البطاقة"
          );
          setLoading(false);
          return;
        }

        if (!data) {
          router.replace(
            `/card/${encodeURIComponent(
              cleanedCardCode
            )}`
          );
          return;
        }

        setCard(data as CardData);
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setStatusMessage(
            "تعذر تحميل معلومات البطاقة"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCard();

    return () => {
      cancelled = true;
    };
  }, [
    cardCode,
    isUnlocked,
    matchesCard,
    router,
  ]);


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

          <p className="text-sm text-white/50">
            جاري تحميل معلومات البطاقة...
          </p>
        </div>
      </main>
    );
  }

  if (!card) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#070707] px-4 text-white"
      >
        <div className="w-full max-w-sm rounded-[28px] border border-red-500/20 bg-red-500/[0.08] p-6 text-center">
          <HiOutlineCreditCard
            size={42}
            className="mx-auto text-red-300"
          />

          <h1 className="mt-4 text-xl font-black">
            تعذر عرض البطاقة
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/50">
            {statusMessage ||
              "لم يتم العثور على معلومات البطاقة."}
          </p>

          <Link
            href={
              cardCode
                ? `/vault?card=${encodeURIComponent(
                    cardCode
                  )}`
                : "/"
            }
            className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-black transition hover:bg-orange-400 active:scale-95"
          >
            الرجوع إلى الخزنة
          </Link>
        </div>
      </main>
    );
  }

  const isActivated =
    card.status === "Activated";

  const activationDate =
    card.activated_at ||
    card.updated_at ||
    card.created_at;

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#070707] text-white"
    >
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden px-4 pb-28 pt-5">
        {/* الإضاءة الخلفية */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[90px]" />

        <div className="pointer-events-none absolute bottom-16 right-[-90px] h-64 w-64 rounded-full bg-orange-500/[0.06] blur-[100px]" />

        {/* الهيدر */}
        <header className="relative mb-6 flex items-center justify-between">
          <Link
            href={`/vault?card=${encodeURIComponent(
              card.card_code
            )}`}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-orange-500/30 hover:text-orange-400 active:scale-95"
            aria-label="الرجوع إلى الخزنة"
          >
            <HiOutlineArrowRight size={22} />
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-black tracking-[0.12em] text-orange-500">
              NEXO
            </h1>

            <p className="mt-1 text-[9px] tracking-[0.35em] text-white/60">
              DIGITAL PASS
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <HiOutlineCreditCard size={22} />
          </div>
        </header>

        {/* عنوان الصفحة */}
        <section className="relative mb-5 overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-orange-500/[0.035] p-5 shadow-[0_25px_75px_rgba(255,106,0,0.08)]">
          <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-[0_0_30px_rgba(255,106,0,0.08)]">
              <HiOutlineCreditCard size={34} />
            </div>

            <div>
              <p className="text-xs text-white/45">
                معلومات البطاقة
              </p>

              <h2 className="mt-1 text-3xl font-black">
                بطاقتي
              </h2>

              <p className="mt-2 text-sm text-white/45">
                معلومات بطاقتك الرقمية وحالة حمايتها
              </p>
            </div>
          </div>
        </section>

        {/* شكل البطاقة */}
        <section className="relative mb-5 overflow-hidden rounded-[32px] border border-orange-500/25 bg-gradient-to-br from-[#1a1a1a] via-[#111111] to-[#090909] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-orange-500/15 blur-[80px]" />

          <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-orange-500/[0.08] blur-[90px]" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-3xl font-black tracking-[0.12em] text-orange-500">
                  NEXO
                </h3>

                <p className="mt-1 text-[9px] tracking-[0.32em] text-white/45">
                  DIGITAL PASS
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <HiOutlineShieldCheck
                  size={25}
                  className="text-orange-400"
                />
              </div>
            </div>

            <div className="mt-12">
              <p className="text-xs text-white/40">
                رقم البطاقة
              </p>

              <p
                dir="ltr"
                className="mt-2 text-left text-2xl font-black tracking-[0.14em] text-white"
              >
                {card.card_code}
              </p>
            </div>

            <div className="mt-8 flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <p className="text-[10px] text-white/35">
                  الحالة
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActivated
                        ? "bg-green-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]"
                        : "bg-yellow-400"
                    }`}
                  />

                  <span className="text-sm font-black">
                    {isActivated
                      ? "مفعلة"
                      : "غير مفعلة"}
                  </span>
                </div>
              </div>

              <p className="text-xs font-bold tracking-[0.2em] text-white/25">
                SECURE CARD
              </p>
            </div>
          </div>
        </section>

        {/* معلومات البطاقة */}
        <section className="grid grid-cols-2 gap-4">
          <article className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-300">
              <HiOutlineCheckBadge size={24} />
            </div>

            <p className="mt-4 text-xs text-white/40">
              حالة التفعيل
            </p>

            <p className="mt-1 text-lg font-black">
              {isActivated
                ? "مفعلة"
                : "غير مفعلة"}
            </p>
          </article>

          <article className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <HiOutlineCalendarDays size={23} />
            </div>

            <p className="mt-4 text-xs text-white/40">
              تاريخ التفعيل
            </p>

            <p
              dir="ltr"
              className="mt-1 text-left text-sm font-black"
            >
              {formatDate(activationDate)}
            </p>
          </article>
        </section>



        {/* حالة الحماية */}
        <section className="mt-4 rounded-[26px] border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.09] to-white/[0.025] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <HiOutlineLockClosed size={27} />
            </div>

            <div>
              <p className="text-xs text-white/40">
                حالة الحماية
              </p>

              <h3 className="mt-1 text-xl font-black text-white">
                محمية
              </h3>

              <p className="mt-2 text-xs leading-6 text-white/45">
                لا يمكن الوصول إلى محتوى الخزنة إلا بعد فتح
                البطاقة بكلمة المرور.
              </p>
            </div>
          </div>
        </section>

        {/* رسالة الخصوصية */}
        <section className="mt-4 flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/[0.025] p-4">
          <HiOutlineShieldCheck
            size={23}
            className="mt-0.5 shrink-0 text-orange-400"
          />

          <p className="text-xs leading-7 text-white/45">
            بطاقتك الرقمية محمية، وجميع بياناتك مشفرة ولا
            يمكن الوصول إليها إلا بعد فتح الخزنة.
          </p>
        </section>
      </div>
    </main>
  );
}
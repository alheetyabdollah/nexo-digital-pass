"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { decryptText } from "@/lib/accountRules";

import {
  FaApple,
  FaFacebook,
  FaWhatsapp,
  FaTelegramPlane,
} from "react-icons/fa";

import {
  SiGoogleplay,
  SiInstagram,
  SiTiktok,
} from "react-icons/si";

import {
  HiOutlineSquares2X2,
  HiOutlineArrowRight,
  HiOutlineChevronLeft,
  HiOutlineTrash,
  HiOutlineCalendarDays,
  HiOutlineEnvelope,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineInbox,
} from "react-icons/hi2";

type Account = {
  id: string;
  service: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  created_at: string;
};

function getServiceIcon(service: string, size = 34) {
  if (service === "Apple") {
    return <FaApple size={size} className="text-white" />;
  }

  if (service === "Google") {
    return <SiGoogleplay size={size} className="text-white" />;
  }

  if (service === "Instagram") {
    return <SiInstagram size={size} className="text-pink-500" />;
  }

  if (service === "Facebook") {
    return <FaFacebook size={size} className="text-blue-500" />;
  }

  if (service === "WhatsApp") {
    return <FaWhatsapp size={size} className="text-green-500" />;
  }

  if (service === "TikTok") {
    return <SiTiktok size={size} className="text-white" />;
  }

  if (service === "Telegram") {
    return <FaTelegramPlane size={size} className="text-sky-400" />;
  }

  return (
    <HiOutlineSquares2X2
      size={size}
      className="text-orange-400"
    />
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-CA");
}

export default function ServicePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const service = decodeURIComponent(params.service as string);
  const cardCode = searchParams.get("card");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadAccounts() {
      if (!cardCode) {
        setLoading(false);
        return;
      }

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

      const { data: card } = await supabase
        .from("cards")
        .select("id")
        .eq("card_code", cardCode)
        .single();

      if (!card) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("accounts")
        .select(
          "id, service, email, username, phone, created_at"
        )
        .eq("card_id", card.id)
        .order("created_at", { ascending: false });

      if (service !== "all") {
        query = query.eq("service", service);
      }

      const { data } = await query;

      const decryptField = async (value: string | null) => {
        if (!value) return null;

        try {
          return await decryptText(value, vaultPassword);
        } catch {
          return "تعذر فك التشفير";
        }
      };

      if (data) {
        const decryptedAccounts = await Promise.all(
          data.map(async (account) => ({
            ...account,
            email: await decryptField(account.email),
            username: await decryptField(account.username),
            phone: await decryptField(account.phone),
          }))
        );

        setAccounts(decryptedAccounts);
      }

      setLoading(false);
    }

    loadAccounts();
  }, [cardCode, service]);

  const deleteAccount = async (id: string) => {
    const confirmDelete = confirm(
      "هل أنت متأكد من حذف هذا الحساب؟"
    );

    if (!confirmDelete) return;

    setStatus("جاري حذف الحساب...");

    const { error, count } = await supabase
      .from("accounts")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      console.error(error);
      setStatus("حدث خطأ أثناء الحذف");
      return;
    }

    if (count === 0) {
      setStatus("لم يتم حذف الحساب من قاعدة البيانات");
      return;
    }

    setAccounts((prev) =>
      prev.filter((account) => account.id !== id)
    );

    setStatus("تم حذف الحساب بنجاح ✅");

    setTimeout(() => {
      setStatus("");
    }, 2500);
  };

  const pageTitle =
    service === "all" ? "كل الحسابات" : service;

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#070707] text-white"
    >
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden px-4 pb-12 pt-5">
        {/* إضاءة خلفية */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[90px]" />

        {/* الهيدر */}
        <header className="relative mb-6 flex items-center justify-between">
          <Link
            href={
              cardCode
                ? `/vault?card=${cardCode}`
                : "/"
            }
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

          <div className="h-11 w-11" />
        </header>

        {/* رأس الصفحة */}
        <section className="relative mb-5 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-500/[0.03] p-5 shadow-[0_20px_70px_rgba(255,106,0,0.08)]">
          <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-black/40">
              {service === "all" ? (
                <HiOutlineSquares2X2
                  size={34}
                  className="text-orange-400"
                />
              ) : (
                getServiceIcon(service, 34)
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs text-white/45">
                الحسابات المحفوظة
              </p>

              <h2 className="mt-1 truncate text-3xl font-black">
                {pageTitle}
              </h2>

              <p className="mt-2 text-sm text-white/45">
                {accounts.length === 0
                  ? "لا توجد حسابات"
                  : `${accounts.length} ${
                      accounts.length === 1
                        ? "حساب محفوظ"
                        : "حسابات محفوظة"
                    }`}
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-start gap-2 border-t border-white/10 pt-4">
            <HiOutlineShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-orange-400"
            />

            <p className="text-xs leading-6 text-white/45">
              يتم فك تشفير البيانات على جهازك عند فتح الحساب.
            </p>
          </div>
        </section>

        {/* حالة العملية */}
        {status && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
              status.includes("بنجاح")
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : status.includes("جاري")
                  ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {status}
          </div>
        )}

        {/* التحميل */}
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

              <p className="text-sm text-white/50">
                جاري تحميل الحسابات...
              </p>
            </div>
          </div>
        ) : accounts.length === 0 ? (
          /* الحالة الفارغة */
          <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-400">
              <HiOutlineInbox size={34} />
            </div>

            <h3 className="mt-5 text-xl font-black">
              لا توجد حسابات محفوظة
            </h3>

            <p className="mt-2 text-sm leading-7 text-white/45">
              أضف حسابًا جديدًا من صفحة الخدمة ليظهر هنا.
            </p>

            {service !== "all" && (
              <Link
                href={
                  cardCode
                    ? `/${service.toLowerCase()}?card=${cardCode}`
                    : `/${service.toLowerCase()}`
                }
                className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-black transition hover:bg-orange-400 active:scale-95"
              >
                إضافة حساب
              </Link>
            )}
          </section>
        ) : (
          /* قائمة الحسابات */
          <section className="space-y-4">
            {accounts.map((account) => {
              const mainTitle =
                account.email ||
                account.username ||
                account.phone ||
                "حساب بدون اسم";

              return (
                <article
                  key={account.id}
                  className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-500/[0.02] p-4 transition-all duration-300 hover:border-orange-500/35 hover:shadow-[0_0_30px_rgba(255,106,0,0.1)]"
                >
                  <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-orange-500/[0.06] blur-3xl" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 transition-transform duration-300 group-hover:scale-105">
                      {getServiceIcon(account.service)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-orange-400">
                            {account.service}
                          </p>

                          <h3 className="mt-1 truncate text-lg font-black text-white">
                            {mainTitle}
                          </h3>
                        </div>

                        <Link
                          href={
                            cardCode
                              ? `/account/${account.id}?card=${cardCode}`
                              : `/account/${account.id}`
                          }
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 transition hover:bg-orange-500 hover:text-black active:scale-95"
                          aria-label="فتح الحساب"
                        >
                          <HiOutlineChevronLeft size={21} />
                        </Link>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        {account.email && (
                          <div className="flex min-w-0 items-center gap-2 text-sm text-white/60">
                            <HiOutlineEnvelope
                              size={18}
                              className="shrink-0 text-orange-400"
                            />

                            <span
                              dir="ltr"
                              className="truncate text-left"
                            >
                              {account.email}
                            </span>
                          </div>
                        )}

                        {account.username && (
                          <div className="flex min-w-0 items-center gap-2 text-sm text-white/60">
                            <HiOutlineUser
                              size={18}
                              className="shrink-0 text-orange-400"
                            />

                            <span className="truncate">
                              {account.username}
                            </span>
                          </div>
                        )}

                        {account.phone && (
                          <div className="flex min-w-0 items-center gap-2 text-sm text-white/60">
                            <HiOutlinePhone
                              size={18}
                              className="shrink-0 text-orange-400"
                            />

                            <span
                              dir="ltr"
                              className="truncate text-left"
                            >
                              {account.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <HiOutlineCalendarDays
                        size={17}
                        className="text-orange-400"
                      />

                      <span>{formatDate(account.created_at)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteAccount(account.id)}
                      className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500 hover:text-white active:scale-95"
                    >
                      <HiOutlineTrash size={17} />
                      حذف
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
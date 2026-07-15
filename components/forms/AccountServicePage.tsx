"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  HiOutlineArrowRight,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

import InputCard from "@/components/forms/InputCard";
import PasswordCard from "@/components/forms/PasswordCard";
import SaveButton from "@/components/buttons/SaveButton";

import { supabase } from "@/lib/supabase";

import {
  checkDuplicateAccount,
  encryptAccountFieldsV2,
  hashText,
  isEmptyAccount,
} from "@/lib/accountRules";

import { useVaultSession } from "@/components/providers/VaultSessionProvider";

type AccountServicePageProps = {
  service: string;
  title: string;
  description: string;
  emailPlaceholder: string;
  icon: React.ReactNode;
  cardCode: string | null;
  showRecovery?: boolean;
};

export default function AccountServicePage({
  service,
  title,
  description,
  emailPlaceholder,
  icon,
  cardCode,
  showRecovery = false,
}: AccountServicePageProps) {
  const router = useRouter();

  const {
    isUnlocked,
    matchesCard,
  } = useVaultSession();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [recovery, setRecovery] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [checkingSession, setCheckingSession] =
    useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cleanedCardCode = cardCode?.trim();

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

    setCheckingSession(false);
  }, [
    cardCode,
    isUnlocked,
    matchesCard,
    router,
  ]);

  const saveAccount = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (saving) return;

    const cleanedCardCode =
      cardCode?.trim();

    if (!cleanedCardCode) {
      setStatus(
        "لم يتم العثور على البطاقة"
      );
      return;
    }

    if (
      !isUnlocked ||
      !matchesCard(cleanedCardCode)
    ) {
      setStatus("انتهت جلسة الخزنة");

      router.replace(
        `/unlock?card=${encodeURIComponent(
          cleanedCardCode
        )}`
      );

      return;
    }

    if (
      isEmptyAccount([
        email,
        username,
        password,
        phone,
        recovery,
        notes,
      ])
    ) {
      setStatus(
        "لا يمكن حفظ حساب فارغ. أدخل معلومة واحدة على الأقل."
      );
      return;
    }

    setSaving(true);
    setStatus("جاري الحفظ...");

    try {
      const {
        data: card,
        error: cardError,
      } = await supabase
        .from("cards")
        .select("id, status, crypto_version")
        .eq(
          "card_code",
          cleanedCardCode
        )
        .maybeSingle();

      if (cardError) {
        console.error(cardError);
        setStatus(
          "حدث خطأ أثناء التحقق من البطاقة"
        );
        return;
      }

      if (!card) {
        setStatus("البطاقة غير موجودة");
        return;
      }

      if (card.status !== "Activated") {
        setStatus(
          "هذه البطاقة غير مفعلة"
        );
        return;
      }

      if (card.crypto_version !== 2) {
        setStatus(
          "إصدار تشفير البطاقة غير مدعوم"
        );
        return;
      }

      const isDuplicate =
        await checkDuplicateAccount({
          cardId: card.id,
          service,
          email,
        });

      if (isDuplicate) {
        setStatus(
          `هذا الحساب موجود مسبقًا داخل ${service}.`
        );
        return;
      }

      const cleanEmail = email
        .trim()
        .toLowerCase();

      const emailHash = cleanEmail
        ? await hashText(cleanEmail)
        : null;

      const encrypted =
        await encryptAccountFieldsV2(
          {
            email,
            username,
            password,
            phone,

            recovery: showRecovery
              ? recovery
              : "",

            notes,
          },
          cleanedCardCode
        );

      const { error: insertError } =
        await supabase
          .from("accounts")
          .insert({
            card_id: card.id,
            service,
            ...encrypted,
            email_hash: emailHash,
          });

      if (insertError) {
        console.error(insertError);
        setStatus(
          "حدث خطأ أثناء حفظ الحساب"
        );
        return;
      }

      setEmail("");
      setUsername("");
      setPassword("");
      setPhone("");
      setRecovery("");
      setNotes("");

      setStatus(
        "تم حفظ الحساب بنجاح ✅"
      );
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error &&
        (
          error.message.includes(
            "الخزنة مقفلة"
          ) ||
          error.message.includes(
            "جلسة الخزنة"
          )
        )
      ) {
        setStatus("انتهت جلسة الخزنة");

        router.replace(
          `/unlock?card=${encodeURIComponent(
            cleanedCardCode
          )}`
        );

        return;
      }

      setStatus(
        "حدث خطأ أثناء تشفير الحساب"
      );
    } finally {
      setSaving(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

          <p className="text-sm text-white/50">
            جاري التحقق من جلسة الخزنة...
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
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden px-4 pb-12 pt-5">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[90px]" />

        <header className="relative mb-6 flex items-center justify-between">
          <Link
            href={
              cardCode
                ? `/vault?card=${encodeURIComponent(
                    cardCode
                  )}`
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

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <HiOutlineLockClosed size={21} />
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-500/[0.03] p-5 shadow-[0_20px_70px_rgba(255,106,0,0.08)]">
          <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/10 bg-black/40 shadow-[0_0_35px_rgba(255,255,255,0.06)]">
              {icon}
            </div>

            <div className="min-w-0">
              <p className="text-xs text-white/45">
                إضافة حساب جديد
              </p>

              <h2 className="mt-1 truncate text-3xl font-black text-white">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                {description}
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-start gap-2 border-t border-white/10 pt-4">
            <HiOutlineShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-orange-400"
            />

            <p className="text-xs leading-6 text-white/45">
              تُشفّر البيانات باستخدام Vault Key
              على جهازك قبل حفظها داخل خزنتك.
            </p>
          </div>
        </section>

        <form
          onSubmit={saveAccount}
          className="space-y-4"
        >
          <InputCard
            label="البريد الإلكتروني"
            placeholder={emailPlaceholder}
            value={email}
            onChange={setEmail}
          />

          <InputCard
            label="اسم المستخدم"
            placeholder="NEXO_TEST"
            value={username}
            onChange={setUsername}
          />

          <PasswordCard
            label="كلمة المرور"
            value={password}
            onChange={setPassword}
          />

          <InputCard
            label="رقم الهاتف"
            placeholder="+964..."
            value={phone}
            onChange={setPhone}
          />

          {showRecovery && (
            <section className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.055] via-white/[0.03] to-transparent p-4">
              <label className="block text-sm font-black text-white">
                بيانات الاسترداد
              </label>

              <p className="mt-1 text-xs text-white/40">
                أضف معلومات الاسترداد أو
                الأسئلة الأمنية
              </p>

              <textarea
                value={recovery}
                onChange={(event) =>
                  setRecovery(
                    event.target.value
                  )
                }
                placeholder="اكتب بيانات الاسترداد..."
                className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-right text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10"
              />
            </section>
          )}

          <section className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.055] via-white/[0.03] to-transparent p-4">
            <label className="block text-sm font-black text-white">
              الملاحظات
            </label>

            <p className="mt-1 text-xs text-white/40">
              أي معلومات إضافية تريد الاحتفاظ
              بها
            </p>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="اكتب أي ملاحظات مهمة عن الحساب..."
              className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-right text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10"
            />
          </section>

          <div className="pt-1">
            <SaveButton
              text={
                saving
                  ? "جاري الحفظ..."
                  : "حفظ الحساب"
              }
            />
          </div>

          {status && (
            <div
              className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
                status.includes("بنجاح")
                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                  : status ===
                      "جاري الحفظ..."
                    ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                    : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {status}
            </div>
          )}
        </form>

        <section className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.025] p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
            <HiOutlineLockClosed size={22} />
          </div>

          <p className="text-xs leading-6 text-white/45">
            لن يستطيع فريق NEXO الاطلاع على
            كلمة المرور أو محتوى الحساب.
          </p>
        </section>
      </div>
    </main>
  );
}
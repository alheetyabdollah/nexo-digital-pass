"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

import { supabase } from "@/lib/supabase";

import {
  CRYPTO_VERSION,
} from "@/lib/crypto/aes";

import {
  generateKdfSalt,
  KDF_ALGORITHM,
} from "@/lib/crypto/kdf";

import {
  recoverVaultKey,
  wrapVaultKeyWithPassword,
} from "@/lib/crypto/recovery";

type RecoveryClientProps = {
  cardCode: string | null;
};

type RecoveryCardData = {
  status: string;
  crypto_version: number | null;
  kdf_algorithm: string | null;
  recovery_encrypted_vault_key: string | null;
  recovery_salt: string | null;
  recovery_iterations: number | null;
};

const NEW_PASSWORD_ITERATIONS = 600_000;

export default function RecoveryClient({
  cardCode,
}: RecoveryClientProps) {
  const router = useRouter();

  const [recoveryKey, setRecoveryKey] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [recovering, setRecovering] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const recoverVault = async () => {
    if (recovering) return;

    const cleanedCardCode =
      cardCode?.trim();

    if (!cleanedCardCode) {
      setStatus(
        "لم يتم العثور على البطاقة"
      );
      return;
    }

    const cleanedRecoveryKey =
      recoveryKey
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

    if (!cleanedRecoveryKey) {
      setStatus(
        "أدخل مفتاح الاسترداد"
      );
      return;
    }

    if (
      !cleanedRecoveryKey.startsWith(
        "NEXO-"
      )
    ) {
      setStatus(
        "صيغة مفتاح الاسترداد غير صحيحة"
      );
      return;
    }

    if (newPassword.length < 8) {
      setStatus(
        "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"
      );
      return;
    }

    if (
      newPassword !== confirmNewPassword
    ) {
      setStatus(
        "كلمتا المرور الجديدتان غير متطابقتين"
      );
      return;
    }

    setRecovering(true);
    setStatus(
      "جاري استعادة الخزنة..."
    );

    let vaultKeyBytes:
      | Uint8Array
      | null = null;

    try {
      const {
        data,
        error,
      } = await supabase
        .from("cards")
        .select(
          [
            "status",
            "crypto_version",
            "kdf_algorithm",
            "recovery_encrypted_vault_key",
            "recovery_salt",
            "recovery_iterations",
          ].join(",")
        )
        .eq(
          "card_code",
          cleanedCardCode
        )
        .maybeSingle<RecoveryCardData>();

      if (error) {
        console.error(error);

        setStatus(
          "حدث خطأ أثناء قراءة بيانات البطاقة"
        );
        return;
      }

      if (!data) {
        setStatus(
          "البطاقة غير موجودة"
        );
        return;
      }

      if (data.status !== "Activated") {
        setStatus(
          "هذه البطاقة غير مفعلة"
        );
        return;
      }

      if (
        data.crypto_version !==
        CRYPTO_VERSION
      ) {
        setStatus(
          "إصدار تشفير البطاقة غير مدعوم"
        );
        return;
      }

      if (
        data.kdf_algorithm !==
        KDF_ALGORITHM
      ) {
        setStatus(
          "خوارزمية حماية البطاقة غير مدعومة"
        );
        return;
      }

      if (
        !data.recovery_encrypted_vault_key ||
        !data.recovery_salt ||
        !data.recovery_iterations
      ) {
        setStatus(
          "بيانات الاسترداد غير مكتملة"
        );
        return;
      }

      try {
        vaultKeyBytes =
          await recoverVaultKey({
            recoveryKey:
              cleanedRecoveryKey,

            recoverySalt:
              data.recovery_salt,

            recoveryIterations:
              data.recovery_iterations,

            encryptedRecoveryVaultKey:
              data.recovery_encrypted_vault_key,
          });
      } catch (error) {
        console.error(error);

        setStatus(
          "مفتاح الاسترداد غير صحيح"
        );
        return;
      }

      const newPasswordSalt =
        generateKdfSalt();

      const newEncryptedVaultKey =
        await wrapVaultKeyWithPassword({
          vaultKey: vaultKeyBytes,
          password: newPassword,
          passwordSalt:
            newPasswordSalt,
          passwordIterations:
            NEW_PASSWORD_ITERATIONS,
        });

      const {
        data: updatedCard,
        error: updateError,
      } = await supabase
        .from("cards")
        .update({
          encrypted_vault_key:
            newEncryptedVaultKey,

          password_salt:
            newPasswordSalt,

          password_iterations:
            NEW_PASSWORD_ITERATIONS,

          crypto_version:
            CRYPTO_VERSION,

          kdf_algorithm:
            KDF_ALGORITHM,

          card_password_hash: null,
        })
        .eq(
          "card_code",
          cleanedCardCode
        )
        .eq(
          "status",
          "Activated"
        )
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error(updateError);

        setStatus(
          "حدث خطأ أثناء تعيين كلمة المرور الجديدة"
        );
        return;
      }

      if (!updatedCard) {
        setStatus(
          "لم يتم تحديث بيانات البطاقة"
        );
        return;
      }

      setRecoveryKey("");
      setNewPassword("");
      setConfirmNewPassword("");
      setStatus("");
      setCompleted(true);
    } catch (error) {
      console.error(error);

      setStatus(
        "حدث خطأ غير متوقع أثناء الاسترداد"
      );
    } finally {
      if (vaultKeyBytes) {
        vaultKeyBytes.fill(0);
      }

      setRecovering(false);
    }
  };

  if (completed) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#050505] px-5 text-white"
      >
        <section className="w-full max-w-md rounded-[30px] border border-green-500/20 bg-[#111111] p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-green-500/25 bg-green-500/10 text-green-400">
            <HiOutlineCheckCircle
              size={42}
            />
          </div>

          <h1 className="mt-6 text-3xl font-black">
            تمت استعادة الخزنة
          </h1>

          <p className="mt-4 text-sm leading-7 text-white/50">
            تم تعيين كلمة المرور الجديدة بنجاح،
            ويمكنك الآن فتح خزنتك بها.
          </p>

          <button
            type="button"
            onClick={() =>
              router.replace(
                `/unlock?card=${encodeURIComponent(
                  cardCode || ""
                )}`
              )
            }
            className="mt-7 h-16 w-full rounded-2xl bg-orange-500 font-black text-white transition hover:bg-orange-400 active:scale-[0.98]"
          >
            العودة إلى تسجيل الدخول
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#050505] text-white"
    >
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden px-4 pb-12 pt-5">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[90px]" />

        <header className="relative mb-6 flex items-center justify-between">
          <Link
            href={
              cardCode
                ? `/unlock?card=${encodeURIComponent(
                    cardCode
                  )}`
                : "/"
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:text-orange-400 active:scale-95"
            aria-label="الرجوع"
          >
            <HiOutlineArrowRight
              size={22}
            />
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-black tracking-[0.12em] text-orange-500">
              NEXO
            </h1>

            <p className="mt-1 text-[9px] tracking-[0.35em] text-white/60">
              VAULT RECOVERY
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <HiOutlineShieldCheck
              size={22}
            />
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-500/[0.03] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-orange-500/25 bg-orange-500/10 text-orange-400">
              <HiOutlineKey size={32} />
            </div>

            <div>
              <p className="text-xs text-white/45">
                نسيت كلمة المرور؟
              </p>

              <h2 className="mt-1 text-2xl font-black">
                استعادة الخزنة
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                استخدم مفتاح الاسترداد لتعيين
                كلمة مرور جديدة.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <label className="mb-3 block text-sm font-black text-white/75">
            مفتاح الاسترداد
          </label>

          <input
            dir="ltr"
            type="text"
            value={recoveryKey}
            disabled={recovering}
            onChange={(event) => {
              setRecoveryKey(
                event.target.value
              );
              setStatus("");
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="NEXO-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
            className="h-16 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-left text-sm font-bold tracking-wide text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/60 disabled:opacity-60"
          />

          <div className="my-5 h-px bg-white/10" />

          <label className="mb-3 block text-sm font-black text-white/75">
            كلمة المرور الجديدة
          </label>

          <div className="relative">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={newPassword}
              disabled={recovering}
              onChange={(event) => {
                setNewPassword(
                  event.target.value
                );
                setStatus("");
              }}
              autoComplete="new-password"
              placeholder="أدخل كلمة المرور الجديدة"
              className="h-16 w-full rounded-2xl border border-white/10 bg-black/40 pr-5 pl-14 text-right text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/60 disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              disabled={recovering}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/5 hover:text-orange-400"
              aria-label={
                showPassword
                  ? "إخفاء كلمة المرور"
                  : "إظهار كلمة المرور"
              }
            >
              {showPassword ? (
                <HiOutlineEyeSlash
                  size={21}
                />
              ) : (
                <HiOutlineEye size={21} />
              )}
            </button>
          </div>

          <label className="mb-3 mt-4 block text-sm font-black text-white/75">
            تأكيد كلمة المرور الجديدة
          </label>

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={confirmNewPassword}
            disabled={recovering}
            onChange={(event) => {
              setConfirmNewPassword(
                event.target.value
              );
              setStatus("");
            }}
            autoComplete="new-password"
            placeholder="أعد كتابة كلمة المرور الجديدة"
            className="h-16 w-full rounded-2xl border border-white/10 bg-black/40 px-5 text-right text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/60 disabled:opacity-60"
          />

          {status && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
                status.includes("جاري")
                  ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {status}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              void recoverVault()
            }
            disabled={recovering}
            className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-[#ff6500] to-[#ff7a00] font-black text-white shadow-[0_18px_40px_rgba(255,106,0,0.25)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {recovering ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                جاري الاسترداد...
              </>
            ) : (
              <>
                <HiOutlineLockClosed
                  size={22}
                />
                تعيين كلمة مرور جديدة
              </>
            )}
          </button>
        </section>

        <section className="mt-5 flex items-start gap-3 rounded-[22px] border border-orange-500/15 bg-orange-500/[0.05] p-4">
          <HiOutlineShieldCheck
            size={21}
            className="mt-0.5 shrink-0 text-orange-400"
          />

          <p className="text-xs leading-6 text-white/45">
            تتم عملية الاسترداد على جهازك، ولا
            يستطيع فريق NEXO رؤية مفتاح
            الاسترداد أو محتوى خزنتك.
          </p>
        </section>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  deriveWrappingKey,
  generateKdfSalt,
  KDF_ALGORITHM,
} from "@/lib/crypto/kdf";

import {
  decryptVaultKey,
  encryptVaultKey,
} from "@/lib/crypto/vault";

import { useVaultSession } from "@/components/providers/VaultSessionProvider";

type SettingsClientProps = {
  cardCode: string | null;
};

type CardSecurityData = {
  status: string;
  crypto_version: number | null;
  kdf_algorithm: string | null;
  encrypted_vault_key: string | null;
  password_salt: string | null;
  password_iterations: number | null;
};

const NEW_PASSWORD_ITERATIONS = 600_000;

export default function SettingsClient({
  cardCode,
}: SettingsClientProps) {
  const router = useRouter();

  const {
    isUnlocked,
    matchesCard,
  } = useVaultSession();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingSession, setCheckingSession] =
    useState(true);

  useEffect(() => {
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

    setCheckingSession(false);
  }, [
    cardCode,
    isUnlocked,
    matchesCard,
    router,
  ]);

  const changePassword = async () => {
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

    if (!currentPassword) {
      setStatus(
        "أدخل كلمة المرور الحالية"
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

    if (
      currentPassword === newPassword
    ) {
      setStatus(
        "كلمة المرور الجديدة مطابقة للكلمة الحالية"
      );
      return;
    }

    setSaving(true);
    setStatus(
      "جاري تحديث كلمة المرور..."
    );

    let vaultKeyBytes: Uint8Array | null =
      null;

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
            "encrypted_vault_key",
            "password_salt",
            "password_iterations",
          ].join(",")
        )
        .eq(
          "card_code",
          cleanedCardCode
        )
        .maybeSingle<CardSecurityData>();

      if (error) {
        console.error(error);

        setStatus(
          "حدث خطأ أثناء قراءة بيانات البطاقة"
        );
        return;
      }

      if (!data) {
        setStatus(
          "لم يتم العثور على البطاقة"
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
        !data.encrypted_vault_key ||
        !data.password_salt ||
        !data.password_iterations
      ) {
        setStatus(
          "بيانات حماية البطاقة غير مكتملة"
        );
        return;
      }

      const currentWrappingKey =
        await deriveWrappingKey({
          secret: currentPassword,
          salt: data.password_salt,
          iterations:
            data.password_iterations,
        });

      try {
        vaultKeyBytes =
          await decryptVaultKey(
            data.encrypted_vault_key,
            currentWrappingKey
          );
      } catch (error) {
        console.error(error);

        setStatus(
          "كلمة المرور الحالية غير صحيحة"
        );
        return;
      }

      const newPasswordSalt =
        generateKdfSalt();

      const newWrappingKey =
        await deriveWrappingKey({
          secret: newPassword,
          salt: newPasswordSalt,
          iterations:
            NEW_PASSWORD_ITERATIONS,
        });

      const newEncryptedVaultKey =
        await encryptVaultKey(
          vaultKeyBytes,
          newWrappingKey
        );

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

          kdf_algorithm:
            KDF_ALGORITHM,

          crypto_version:
            CRYPTO_VERSION,

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
          "حدث خطأ أثناء تحديث كلمة المرور"
        );
        return;
      }

      if (!updatedCard) {
        setStatus(
          "لم يتم تحديث بيانات البطاقة"
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setStatus(
        "تم تغيير كلمة المرور بنجاح ✅"
      );
    } catch (error) {
      console.error(error);

      setStatus(
        "حدث خطأ غير متوقع أثناء تغيير كلمة المرور"
      );
    } finally {
      if (vaultKeyBytes) {
        vaultKeyBytes.fill(0);
      }

      setSaving(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
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
      className="min-h-screen overflow-x-hidden bg-[#050505] text-white"
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
              SECURITY SETTINGS
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <HiOutlineShieldCheck size={22} />
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-500/[0.03] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-orange-500/25 bg-orange-500/10 text-orange-400">
              <HiOutlineKey size={32} />
            </div>

            <div>
              <p className="text-xs text-white/45">
                إعدادات الحماية
              </p>

              <h2 className="mt-1 text-2xl font-black">
                تغيير كلمة المرور
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                لن تتغير بيانات حساباتك أو يُعاد تشفيرها.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <PasswordInput
            label="كلمة المرور الحالية"
            value={currentPassword}
            show={showCurrentPassword}
            disabled={saving}
            onChange={(value) => {
              setCurrentPassword(value);
              setStatus("");
            }}
            onToggle={() =>
              setShowCurrentPassword(
                (value) => !value
              )
            }
          />

          <div className="my-5 h-px bg-white/10" />

          <PasswordInput
            label="كلمة المرور الجديدة"
            value={newPassword}
            show={showNewPassword}
            disabled={saving}
            onChange={(value) => {
              setNewPassword(value);
              setStatus("");
            }}
            onToggle={() =>
              setShowNewPassword(
                (value) => !value
              )
            }
          />

          <div className="mt-4">
            <label className="mb-3 block text-sm font-black text-white/75">
              تأكيد كلمة المرور الجديدة
            </label>

            <input
              type={
                showNewPassword
                  ? "text"
                  : "password"
              }
              value={confirmNewPassword}
              disabled={saving}
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

            <p className="mt-2 text-xs leading-6 text-white/35">
              يجب أن تحتوي على 8 أحرف على الأقل.
            </p>
          </div>

          {status && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
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

          <button
            type="button"
            onClick={() =>
              void changePassword()
            }
            disabled={saving}
            className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-[#ff6500] to-[#ff7a00] font-black text-white shadow-[0_18px_40px_rgba(255,106,0,0.25)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                جاري التحديث...
              </>
            ) : (
              <>
                <HiOutlineCheckCircle
                  size={22}
                />
                تحديث كلمة المرور
              </>
            )}
          </button>
        </section>

        <section className="mt-5 flex items-start gap-3 rounded-[22px] border border-orange-500/15 bg-orange-500/[0.05] p-4">
          <HiOutlineLockClosed
            size={21}
            className="mt-0.5 shrink-0 text-orange-400"
          />

          <p className="text-xs leading-6 text-white/45">
            يتم تغيير حماية Vault Key فقط، لذلك تبقى جميع حساباتك وبياناتك المشفرة كما هي.
          </p>
        </section>
      </div>
    </main>
  );
}

type PasswordInputProps = {
  label: string;
  value: string;
  show: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
};

function PasswordInput({
  label,
  value,
  show,
  disabled,
  onChange,
  onToggle,
}: PasswordInputProps) {
  return (
    <div>
      <label className="mb-3 block text-sm font-black text-white/75">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          autoComplete="current-password"
          placeholder={label}
          className="h-16 w-full rounded-2xl border border-white/10 bg-black/40 pr-5 pl-14 text-right text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/60 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/5 hover:text-orange-400 disabled:opacity-50"
          aria-label={
            show
              ? "إخفاء كلمة المرور"
              : "إظهار كلمة المرور"
          }
        >
          {show ? (
            <HiOutlineEyeSlash size={21} />
          ) : (
            <HiOutlineEye size={21} />
          )}
        </button>
      </div>
    </div>
  );
}
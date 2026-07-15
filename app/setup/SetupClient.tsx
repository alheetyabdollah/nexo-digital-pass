"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import {
  CRYPTO_VERSION,
} from "@/lib/crypto/aes";

import {
  KDF_ALGORITHM,
  deriveWrappingKey,
  generateKdfSalt,
} from "@/lib/crypto/kdf";

import {
  encryptVaultKey,
  generateVaultKey,
} from "@/lib/crypto/vault";

type SetupClientProps = {
  cardCode: string;
};

type CardSetupState = {
  id: string;
  status: string;
  card_password_hash: string | null;
  encrypted_vault_key: string | null;
  crypto_version: number | null;
};

const PASSWORD_ITERATIONS = 600_000;
const RECOVERY_ITERATIONS = 600_000;

function generateRecoveryKey(): string {
  const randomBytes = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const hexadecimal = Array.from(randomBytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("")
    .toUpperCase();

  const groups = hexadecimal.match(/.{1,8}/g);

  if (!groups || groups.length !== 4) {
    throw new Error(
      "تعذر إنشاء مفتاح الاسترداد"
    );
  }

  return `NEXO-${groups.join("-")}`;
}

export default function SetupClient({
  cardCode,
}: SetupClientProps) {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [recoveryKey, setRecoveryKey] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [checking, setChecking] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkCard() {
      setChecking(true);
      setStatus("");

      const { data, error } = await supabase
        .from("cards")
        .select(
          [
            "id",
            "status",
            "card_password_hash",
            "encrypted_vault_key",
            "crypto_version",
          ].join(",")
        )
        .eq("card_code", cardCode)
        .maybeSingle<CardSetupState>();

      if (cancelled) return;

      if (error) {
        console.error(error);

        setStatus(
          "حدث خطأ أثناء التحقق من البطاقة"
        );

        setChecking(false);
        return;
      }

      if (!data) {
        router.replace("/");
        return;
      }

      if (data.status === "Disabled") {
        setStatus(
          "هذه البطاقة متوقفة حاليًا"
        );

        setChecking(false);
        return;
      }

      const isCryptoV2Activated =
        data.status === "Activated" &&
        data.crypto_version === CRYPTO_VERSION &&
        Boolean(data.encrypted_vault_key);

      const isLegacyActivated =
        data.status === "Activated" &&
        Boolean(data.card_password_hash);

      if (
        isCryptoV2Activated ||
        isLegacyActivated
      ) {
        router.replace(
          `/unlock?card=${encodeURIComponent(
            cardCode
          )}`
        );

        return;
      }

      if (data.status !== "New") {
        setStatus(
          "حالة البطاقة لا تسمح بإنشاء خزنة جديدة"
        );

        setChecking(false);
        return;
      }

      setChecking(false);
    }

    checkCard();

    return () => {
      cancelled = true;
    };
  }, [cardCode, router]);

  const createVault = async () => {
    if (creating || checking) return;

    if (password.length < 8) {
      setStatus(
        "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
      );

      return;
    }

    if (password !== confirmPassword) {
      setStatus(
        "كلمتا المرور غير متطابقتين"
      );

      return;
    }

    setCreating(true);
    setStatus("جاري إنشاء الخزنة...");

    let vaultKeyBytes: Uint8Array | null =
      null;

    try {
      const newRecoveryKey =
        generateRecoveryKey();

      const passwordSalt =
        generateKdfSalt();

      const recoverySalt =
        generateKdfSalt();

      vaultKeyBytes =
        generateVaultKey();

      const passwordWrappingKey =
        await deriveWrappingKey({
          secret: password,
          salt: passwordSalt,
          iterations:
            PASSWORD_ITERATIONS,
        });

      const recoveryWrappingKey =
        await deriveWrappingKey({
          secret: newRecoveryKey,
          salt: recoverySalt,
          iterations:
            RECOVERY_ITERATIONS,
        });

      const encryptedVaultKey =
        await encryptVaultKey(
          vaultKeyBytes,
          passwordWrappingKey
        );

      const recoveryEncryptedVaultKey =
        await encryptVaultKey(
          vaultKeyBytes,
          recoveryWrappingKey
        );

      const { data, error } = await supabase
        .from("cards")
        .update({
          status: "Activated",

          encrypted_vault_key:
            encryptedVaultKey,

          recovery_encrypted_vault_key:
            recoveryEncryptedVaultKey,

          password_salt:
            passwordSalt,

          recovery_salt:
            recoverySalt,

          password_iterations:
            PASSWORD_ITERATIONS,

          recovery_iterations:
            RECOVERY_ITERATIONS,

          crypto_version:
            CRYPTO_VERSION,

          kdf_algorithm:
            KDF_ALGORITHM,

          /*
           * Crypto v2 لا يعتمد على SHA-256
           * سريع للتحقق من كلمة المرور.
           * نجاح فك encrypted_vault_key هو
           * التحقق الحقيقي.
           */
          card_password_hash: null,
          recovery_key_hash: null,
        })
        .eq("card_code", cardCode)
        .eq("status", "New")
        .select("id")
        .maybeSingle();

      if (error) {
        console.error(error);

        setStatus(
          "حدث خطأ أثناء إنشاء الخزنة"
        );

        return;
      }

      if (!data) {
        setStatus(
          "لم يتم تفعيل البطاقة؛ قد تكون مفعلة مسبقًا"
        );

        return;
      }

      setRecoveryKey(
        newRecoveryKey
      );

      setPassword("");
      setConfirmPassword("");
      setStatus("");
      setStep(3);
    } catch (error) {
      console.error(error);

      setStatus(
        "حدث خطأ أثناء إنشاء الخزنة"
      );
    } finally {
      if (vaultKeyBytes) {
        vaultKeyBytes.fill(0);
      }

      setCreating(false);
    }
  };

  const copyRecoveryKey = async () => {
    try {
      await navigator.clipboard.writeText(
        recoveryKey
      );

      setStatus(
        "تم نسخ مفتاح الاسترداد ✅"
      );
    } catch (error) {
      console.error(error);

      setStatus(
        "تعذر نسخ مفتاح الاسترداد"
      );
    }
  };

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

          <p className="text-sm text-white/50">
            جاري التحقق من البطاقة...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#111111] via-[#0b0b0b] to-[#111111] p-5 text-white sm:p-8"
    >
      <div className="w-full max-w-xl rounded-3xl border border-orange-500/20 bg-[#151515] p-6 text-center shadow-[0_0_60px_rgba(255,106,0,0.18)] sm:p-8">
        {step === 1 && (
          <>
            <h1 className="text-5xl font-black text-orange-500">
              NEXO
            </h1>

            <p className="mt-2 tracking-[6px] text-orange-400">
              DIGITAL VAULT
            </p>

            <h2 className="mt-10 text-3xl font-bold">
              👋 أهلاً بك
            </h2>

            <p className="mt-4 text-gray-400">
              لنجهز خزنتك خلال أقل من دقيقة.
            </p>

            {status && (
              <p className="mt-5 font-bold text-red-400">
                {status}
              </p>
            )}

            <button
              type="button"
              disabled={Boolean(status)}
              onClick={() => {
                setStatus("");
                setStep(2);
              }}
              className="mt-10 w-full rounded-3xl bg-orange-500 py-5 font-bold transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              ابدأ
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-3xl font-black text-orange-500">
              🔐 اختر كلمة مرور الخزنة
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/45">
              استخدم كلمة مرور قوية لا تقل عن
              8 أحرف واحتفظ بها في مكان آمن.
            </p>

            <div className="mt-8 space-y-5">
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                disabled={creating}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  setStatus("");
                }}
                autoComplete="new-password"
                className="h-16 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none transition focus:border-orange-500 disabled:opacity-60"
              />

              <input
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={confirmPassword}
                disabled={creating}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value
                  );

                  setStatus("");
                }}
                autoComplete="new-password"
                className="h-16 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none transition focus:border-orange-500 disabled:opacity-60"
              />
            </div>

            {status && (
              <p
                className={`mt-5 font-bold ${
                  status.includes("جاري")
                    ? "text-orange-400"
                    : "text-red-400"
                }`}
              >
                {status}
              </p>
            )}

            <button
              type="button"
              onClick={createVault}
              disabled={creating}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-3xl bg-orange-500 py-5 font-bold transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  جاري إنشاء الخزنة...
                </>
              ) : (
                "إنشاء الخزنة"
              )}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-3xl font-black text-orange-500">
              🎉 تم إنشاء خزنتك
            </h2>

            <p className="mt-4 leading-7 text-gray-400">
              هذا هو مفتاح الاسترداد الخاص بك.
              احتفظ به في مكان آمن خارج جهازك.
            </p>

            <div
              dir="ltr"
              className="mt-6 break-all rounded-2xl border border-orange-500/30 bg-black/50 p-5 text-lg font-bold text-orange-400 sm:text-xl"
            >
              {recoveryKey}
            </div>

            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4">
              <p className="text-sm leading-7 text-red-300">
                ⚠️ إذا نسيت كلمة المرور وفقدت
                مفتاح الاسترداد، فلن يستطيع فريق
                NEXO استعادة بياناتك.
              </p>
            </div>

            {status && (
              <p
                className={`mt-5 font-bold ${
                  status.includes("✅")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {status}
              </p>
            )}

            <button
              type="button"
              onClick={copyRecoveryKey}
              className="mt-8 w-full rounded-3xl bg-zinc-800 py-5 font-bold transition hover:bg-zinc-700 active:scale-[0.98]"
            >
              📋 نسخ مفتاح الاسترداد
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/unlock?card=${encodeURIComponent(
                    cardCode
                  )}`
                )
              }
              className="mt-4 w-full rounded-3xl bg-orange-500 py-5 font-bold transition hover:bg-orange-600 active:scale-[0.98]"
            >
              دخول الخزنة
            </button>
          </>
        )}
      </div>
    </main>
  );
}
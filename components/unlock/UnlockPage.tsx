"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { CRYPTO_VERSION } from "@/lib/crypto/aes";
import {
  deriveWrappingKey,
  KDF_ALGORITHM,
} from "@/lib/crypto/kdf";
import { decryptVaultKey } from "@/lib/crypto/vault";
import { useVaultSession } from "@/components/providers/VaultSessionProvider";

type UnlockPageProps = {
  cardCode: string | null;
};

type UnlockCard = {
  status: string;
  crypto_version: number | null;
  kdf_algorithm: string | null;
  encrypted_vault_key: string | null;
  password_salt: string | null;
  password_iterations: number | null;
};

export default function UnlockPage({
  cardCode,
}: UnlockPageProps) {
  const router = useRouter();
  const { openSession } = useVaultSession();

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  const unlockVault = async () => {
    if (isLoading) return;

    const cleanedCardCode = cardCode?.trim();

    if (!cleanedCardCode) {
      setStatus("البطاقة غير موجودة");
      return;
    }

    if (!password) {
      setStatus("أدخل كلمة المرور أولًا");
      return;
    }

    setIsLoading(true);
    setStatus("جاري التحقق...");

    try {
      const { data, error } = await supabase
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
        .eq("card_code", cleanedCardCode)
        .maybeSingle<UnlockCard>();

      if (error) {
        console.error(error);
        setStatus(
          "حدث خطأ أثناء التحقق من البطاقة"
        );
        return;
      }

      if (!data) {
        setStatus("تعذر العثور على البطاقة");
        return;
      }

      if (data.status === "Locked") {
        setStatus(
          "هذه البطاقة مقفلة حاليًا"
        );
        return;
      }

      if (data.status !== "Activated") {
        setStatus(
          "هذه البطاقة غير مفعلة بعد"
        );
        return;
      }

      if (
        data.crypto_version !==
        CRYPTO_VERSION
      ) {
        setStatus(
          "إصدار تشفير هذه البطاقة غير مدعوم"
        );
        return;
      }

      if (
        data.kdf_algorithm !== KDF_ALGORITHM
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

      const wrappingKey =
        await deriveWrappingKey({
          secret: password,
          salt: data.password_salt,
          iterations:
            data.password_iterations,
        });

      let vaultKeyBytes: Uint8Array;

      try {
        vaultKeyBytes =
          await decryptVaultKey(
            data.encrypted_vault_key,
            wrappingKey
          );
      } catch (error) {
        console.error(error);
        setStatus(
          "كلمة المرور غير صحيحة"
        );
        return;
      }

      await openSession({
        cardCode: cleanedCardCode,
        vaultKeyBytes,
      });

      /*
       * تنظيف آثار النظام القديم.
       * لا يتم تخزين كلمة المرور أو Vault Key
       * داخل LocalStorage أو SessionStorage.
       */
      localStorage.removeItem(
        `nexo_unlocked_${cleanedCardCode}`
      );

      sessionStorage.removeItem(
        `nexo_unlocked_${cleanedCardCode}`
      );

      sessionStorage.removeItem(
        `nexo_vault_password_${cleanedCardCode}`
      );

      /*
       * رقم البطاقة ليس سرًا، ويستخدم فقط
       * لمعرفة صفحة Unlock عند القفل التلقائي.
       */
      sessionStorage.setItem(
        "nexo_last_card",
        cleanedCardCode
      );

      setPassword("");
      setStatus("");

      router.replace(
        `/vault?card=${encodeURIComponent(
          cleanedCardCode
        )}`
      );
    } catch (error) {
      console.error(error);
      setStatus(
        "حدث خطأ أثناء فتح الخزنة"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isChecking =
    status === "جاري التحقق...";

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,106,0,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,106,0,0.09),transparent_30%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.045]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[140px]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <header className="flex items-center justify-between">
          <div className="w-12" />

          <div className="text-center">
            <h1 className="text-4xl font-black tracking-[0.16em] text-[#ff6500]">
              NEXO
            </h1>

            <p className="mt-1 text-[10px] font-bold tracking-[0.45em] text-white/40">
              DIGITAL PASS
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.08)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.7"
              />

              <path
                d="M8 10V7.5C8 5.57 9.57 4 11.5 4H12.5C14.43 4 16 5.57 16 7.5V10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </header>

        <div className="flex flex-1 items-center py-8">
          <div className="w-full">
            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.035] p-6 shadow-[0_35px_100px_rgba(0,0,0,0.72)] backdrop-blur-2xl">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/90 to-transparent" />

              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-[80px]" />

              <div className="relative">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-orange-500/5 shadow-[0_0_45px_rgba(255,106,0,0.16)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-11 w-11 text-orange-500"
                  >
                    <rect
                      x="4"
                      y="8"
                      width="16"
                      height="12"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />

                    <path
                      d="M8 8V6.5C8 4.57 9.57 3 11.5 3H12.5C14.43 3 16 4.57 16 6.5V8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    <circle
                      cx="12"
                      cy="14"
                      r="1.4"
                      fill="currentColor"
                    />

                    <path
                      d="M12 15.4V17"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="mt-7 text-center">
                  <p className="text-xs font-bold tracking-[0.18em] text-orange-400/80">
                    NEXO SECURE ACCESS
                  </p>

                  <h2 className="mt-3 text-3xl font-black text-white">
                    افتح خزنتك
                  </h2>

                  <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-white/45">
                    أدخل كلمة مرور البطاقة للوصول
                    إلى حساباتك وبياناتك المشفرة.
                  </p>
                </div>

                {cardCode && (
                  <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                    <span className="text-xs text-white/35">
                      رقم البطاقة
                    </span>

                    <span
                      dir="ltr"
                      className="text-sm font-black tracking-wider text-white/80"
                    >
                      {cardCode}
                    </span>
                  </div>
                )}

                <div className="mt-6">
                  <label className="mb-3 block text-sm font-bold text-white/75">
                    كلمة المرور
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      disabled={isLoading}
                      onChange={(event) => {
                        setPassword(
                          event.target.value
                        );
                        setStatus("");
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter"
                        ) {
                          void unlockVault();
                        }
                      }}
                      placeholder="أدخل كلمة المرور"
                      autoComplete="current-password"
                      className="h-16 w-full rounded-2xl border border-white/10 bg-black/35 pr-5 pl-14 text-base font-bold text-white outline-none transition placeholder:font-normal placeholder:text-white/20 focus:border-orange-500/70 focus:bg-black/50 focus:shadow-[0_0_0_4px_rgba(255,106,0,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      disabled={isLoading}
                      aria-label={
                        showPassword
                          ? "إخفاء كلمة المرور"
                          : "إظهار كلمة المرور"
                      }
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-white/35 transition hover:bg-white/5 hover:text-orange-400 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                        >
                          <path
                            d="M3 3L21 21"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />

                          <path
                            d="M10.7 10.8A2 2 0 0013.2 13.3"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />

                          <path
                            d="M9.8 4.4C10.5 4.1 11.3 4 12 4C17 4 20.4 8 21.5 10.1C21.8 10.7 21.8 11.4 21.5 12C21 12.9 20.3 14 19.2 15.1"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />

                          <path
                            d="M6.2 6.2C4.4 7.5 3.1 9.2 2.5 10.2C2.2 10.8 2.2 11.5 2.5 12.1C3.6 14.1 7 18 12 18C13.4 18 14.8 17.6 15.9 17"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                        >
                          <path
                            d="M2.5 10.2C3.6 8.1 7 4 12 4C17 4 20.4 8.1 21.5 10.2C21.8 10.8 21.8 11.5 21.5 12.1C20.4 14.1 17 18 12 18C7 18 3.6 14.1 2.5 12.1C2.2 11.5 2.2 10.8 2.5 10.2Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />

                          <circle
                            cx="12"
                            cy="11"
                            r="2.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {status && (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
                      isChecking
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
                    void unlockVault()
                  }
                  disabled={isLoading}
                  className="group mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-[#ff6500] to-[#ff7a00] text-base font-black text-white shadow-[0_18px_40px_rgba(255,106,0,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(255,106,0,0.38)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      جاري فتح الخزنة...
                    </>
                  ) : (
                    <>
                      <span>فتح الخزنة</span>

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-5 w-5 transition duration-300 group-hover:-translate-x-1"
                      >
                        <path
                          d="M19 12H5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />

                        <path
                          d="M11 18L5 12L11 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
<div className="mt-5 text-center">
  <button
    type="button"
    onClick={() =>
      router.push(
        `/recovery?card=${encodeURIComponent(
          cardCode || ""
        )}`
      )
    }
    className="text-sm font-bold text-orange-400 transition hover:text-orange-300"
  >
    نسيت كلمة المرور؟
  </button>
</div>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 text-orange-500/80"
                  >
                    <path
                      d="M12 3L19 6V11C19 15.4 16.1 19.4 12 21C7.9 19.4 5 15.4 5 11V6L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M9 12L11 14L15 10"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span>
                    بياناتك مشفرة وخاصة بك وحدك
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] text-white/20">
              حتى فريق NEXO لا يستطيع الاطلاع على
              محتوى خزنتك
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
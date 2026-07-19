"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TwoFactorMode =
  | "loading"
  | "enroll"
  | "verify";

export default function AdminTwoFactorPage() {
  const router = useRouter();

  const supabaseRef = useRef(
    createClient()
  );

  const supabase = supabaseRef.current;

  const [mode, setMode] =
    useState<TwoFactorMode>("loading");

  const [factorId, setFactorId] =
    useState("");

  const [qrCode, setQrCode] =
    useState("");

  const [secret, setSecret] =
    useState("");

  const [verificationCode, setVerificationCode] =
    useState("");

  const [status, setStatus] =
    useState(
      "جاري التحقق من إعدادات المصادقة الثنائية..."
    );

  const [isLoading, setIsLoading] =
    useState(false);

  useEffect(() => {
    async function prepareTwoFactor() {
      try {
        const {
          data: userData,
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !userData.user
        ) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        const {
          data: adminUser,
          error: adminError,
        } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq(
            "user_id",
            userData.user.id
          )
          .maybeSingle();

        if (
          adminError ||
          !adminUser
        ) {
          await supabase.auth.signOut();

          router.replace(
            "/admin/login"
          );

          return;
        }

        const {
          data: aalData,
          error: aalError,
        } =
          await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel();

        if (aalError) {
          setStatus(
            "تعذر التحقق من حالة المصادقة الثنائية"
          );

          return;
        }

        if (
          aalData.currentLevel ===
          "aal2"
        ) {
          router.replace(
            "/admin/cards"
          );

          router.refresh();

          return;
        }

        const {
          data: factorsData,
          error: factorsError,
        } =
          await supabase.auth.mfa
            .listFactors();

        if (factorsError) {
          setStatus(
            "تعذر قراءة إعدادات المصادقة الثنائية"
          );

          return;
        }

        const verifiedFactor =
          factorsData.totp.find(
            (factor) =>
              factor.status ===
              "verified"
          );

        if (verifiedFactor) {
          setFactorId(
            verifiedFactor.id
          );

          setMode("verify");

          setStatus(
            "أدخل الرمز الظاهر في تطبيق المصادقة"
          );

          return;
        }

        

        const {
          data: enrollData,
          error: enrollError,
        } =
          await supabase.auth.mfa
            .enroll({
              factorType: "totp",
              friendlyName:
                "NEXO Owner",
            });

        if (
          enrollError ||
          !enrollData
        ) {
          setStatus(
            "تعذر إنشاء المصادقة الثنائية"
          );

          return;
        }

        setFactorId(
          enrollData.id
        );

        setQrCode(
          enrollData.totp.qr_code
        );

        setSecret(
          enrollData.totp.secret
        );

        setMode("enroll");

        setStatus(
          "امسح رمز QR ثم أدخل الرمز المكوّن من 6 أرقام"
        );
      } catch (error) {
        console.error(
          "Prepare admin 2FA error:",
          error
        );

        setStatus(
          "حدث خطأ غير متوقع أثناء إعداد المصادقة الثنائية"
        );
      }
    }

    void prepareTwoFactor();
  }, [router, supabase]);

  const handleVerify = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const cleanCode =
      verificationCode
        .replace(/\D/g, "")
        .slice(0, 6);

    if (
      cleanCode.length !== 6
    ) {
      setStatus(
        "يرجى إدخال رمز مكوّن من 6 أرقام"
      );

      return;
    }

    if (!factorId) {
      setStatus(
        "عامل المصادقة غير موجود، أعد تسجيل الدخول"
      );

      return;
    }

    setIsLoading(true);

    setStatus(
      "جاري التحقق من الرمز..."
    );

    try {
      const {
        error: verifyError,
      } =
        await supabase.auth.mfa
          .challengeAndVerify({
            factorId,
            code: cleanCode,
          });

      if (verifyError) {
        setVerificationCode("");

        setStatus(
          "الرمز غير صحيح أو انتهت صلاحيته"
        );

        return;
      }

      const {
        data: aalData,
        error: aalError,
      } =
        await supabase.auth.mfa
          .getAuthenticatorAssuranceLevel();

      if (
        aalError ||
        aalData.currentLevel !==
          "aal2"
      ) {
        setStatus(
          "تم قبول الرمز، لكن تعذر إكمال المصادقة"
        );

        return;
      }

      setStatus(
        "تم التحقق بنجاح"
      );

      router.replace(
        "/admin/cards"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Admin 2FA verification error:",
        error
      );

      setStatus(
        "حدث خطأ غير متوقع، حاول مرة أخرى"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout =
    async () => {
      await supabase.auth.signOut();

      router.replace(
        "/admin/login"
      );

      router.refresh();
    };

  if (mode === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-orange-500" />

          <p className="text-sm text-white/60">
            {status}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070707] px-5 py-10 text-white">
      <div className="pointer-events-none absolute left-1/2 top-[-170px] h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-orange-500/15 blur-[110px]" />

      <section className="relative w-full max-w-[460px] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.035] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border border-orange-500/25 bg-orange-500/10 shadow-[0_12px_35px_rgba(249,115,22,0.15)]">
            <span className="text-3xl font-black text-orange-500">
              N
            </span>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.32em] text-orange-500">
            NEXO SECURITY
          </p>

          <h1 className="text-2xl font-black">
            المصادقة الثنائية
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/50">
            حماية إضافية لحساب مالك
            نظام NEXO
          </p>
        </header>

        {mode === "enroll" && (
          <div className="mb-6">
            <div className="rounded-[26px] border border-white/10 bg-black/30 p-5">
              <p className="mb-4 text-center text-sm font-bold text-white/80">
                افتح Google
                Authenticator أو
                Microsoft Authenticator
                وامسح الرمز
              </p>

              {qrCode && (
                <div className="mx-auto flex w-fit items-center justify-center rounded-3xl bg-white p-4">
                  <img
                    src={qrCode}
                    alt="رمز إعداد المصادقة الثنائية"
                    className="h-[210px] w-[210px]"
                  />
                </div>
              )}

              {secret && (
                <div className="mt-5">
                  <p className="mb-2 text-center text-xs text-white/45">
                    أو أدخل المفتاح يدويًا
                  </p>

                  <div
                    dir="ltr"
                    className="break-all rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-center font-mono text-sm text-orange-300"
                  >
                    {secret}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === "verify" && (
          <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-4 text-center">
            <p className="text-sm leading-7 text-orange-200">
              افتح تطبيق المصادقة
              وأدخل الرمز الحالي
              المكوّن من 6 أرقام.
            </p>
          </div>
        )}

        <form
          onSubmit={handleVerify}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="admin-2fa-code"
              className="mb-2 block text-center text-sm font-bold text-white/75"
            >
              رمز المصادقة
            </label>

            <input
              id="admin-2fa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              maxLength={6}
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(
                  event.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(0, 6)
                )
              }
              placeholder="000000"
              disabled={isLoading}
              className="h-16 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-center text-2xl font-black tracking-[0.5em] text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {status && (
            <div
              className={`rounded-2xl border px-4 py-3 text-center text-sm leading-6 ${
                status.includes(
                  "بنجاح"
                )
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : status.includes(
                        "جاري"
                      ) ||
                      status.includes(
                        "امسح"
                      ) ||
                      status.includes(
                        "أدخل الرمز"
                      )
                    ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                    : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {status}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              verificationCode.length !==
                6
            }
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-base font-black text-white shadow-[0_15px_35px_rgba(249,115,22,0.22)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "جاري التحقق..."
              : mode === "enroll"
                ? "تفعيل المصادقة الثنائية"
                : "التحقق والدخول"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            الرجوع إلى تسجيل الدخول
          </button>
        </form>

        <div className="mt-7 border-t border-white/10 pt-5 text-center">
          <p className="text-xs leading-6 text-white/35">
            NEXO Digital Pass
            <br />
            Two-Factor Authentication
          </p>
        </div>
      </section>
    </main>
  );
}
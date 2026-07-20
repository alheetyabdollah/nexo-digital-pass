"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isCheckingSession,
    setIsCheckingSession,
  ] = useState(true);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsCheckingSession(false);
          return;
        }

        const {
          data: aalData,
          error: aalError,
        } =
          await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel();

        if (aalError) {
          setIsCheckingSession(false);
          return;
        }

        if (
          aalData.currentLevel === "aal2"
        ) {
          window.location.replace(
            "/admin/cards"
          );

          return;
        }

        window.location.replace(
          "/admin/2fa"
        );
      } catch (error) {
        console.error(
          "Admin session check error:",
          error
        );

        setIsCheckingSession(false);
      }
    }

    void checkExistingSession();
  }, [supabase]);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setStatus(
        "يرجى إدخال الإيميل وكلمة المرور"
      );

      return;
    }

    setIsLoading(true);

    setStatus(
      "جاري التحقق من بيانات الدخول..."
    );

    try {
      const {
        data,
        error,
      } =
        await supabase.auth
          .signInWithPassword({
            email: cleanEmail,
            password,
          });

      if (
        error ||
        !data.user ||
        !data.session
      ) {
        setPassword("");

        setStatus(
          "الإيميل أو كلمة المرور غير صحيحة"
        );

        return;
      }

      setStatus(
        "تم تسجيل الدخول بنجاح"
      );

      const {
        data: aalData,
        error: aalError,
      } =
        await supabase.auth.mfa
          .getAuthenticatorAssuranceLevel();

      if (aalError) {
        setStatus(
          "تعذر التحقق من المصادقة الثنائية"
        );

        return;
      }

      if (
        aalData.currentLevel === "aal2"
      ) {
        window.location.replace(
          "/admin/cards"
        );

        return;
      }

      window.location.replace(
        "/admin/2fa"
      );
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      setStatus(
        "حدث خطأ غير متوقع، حاول مرة أخرى"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-orange-500" />

          <p className="text-sm text-white/60">
            جاري التحقق من الجلسة...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070707] px-5 py-10 text-white">
      <div className="pointer-events-none absolute left-1/2 top-[-170px] h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-orange-500/15 blur-[110px]" />

      <section className="relative w-full max-w-[430px] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.035] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border border-orange-500/25 bg-orange-500/10 shadow-[0_12px_35px_rgba(249,115,22,0.15)]">
            <span className="text-3xl font-black text-orange-500">
              N
            </span>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.32em] text-orange-500">
            NEXO CONTROL
          </p>

          <h1 className="text-2xl font-black">
            تسجيل دخول الإدارة
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/50">
            هذه الصفحة مخصصة لمالك نظام
            NEXO فقط
          </p>
        </header>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm font-bold text-white/75"
            >
              البريد الإلكتروني
            </label>

            <input
              id="admin-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="admin@example.com"
              disabled={isLoading}
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-left text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-bold text-white/75"
            >
              كلمة المرور
            </label>

            <input
              id="admin-password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="••••••••••••"
              disabled={isLoading}
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-left text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {status && (
            <div
              className={`rounded-2xl border px-4 py-3 text-center text-sm leading-6 ${
                status.includes("بنجاح")
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : status.includes(
                        "جاري"
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
            disabled={isLoading}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-base font-black text-white shadow-[0_15px_35px_rgba(249,115,22,0.22)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "جاري تسجيل الدخول..."
              : "دخول لوحة التحكم"}
          </button>
        </form>

        <div className="mt-7 border-t border-white/10 pt-5 text-center">
          <p className="text-xs leading-6 text-white/35">
            NEXO Digital Pass
            <br />
            Secure Administration System
          </p>
        </div>
      </section>
    </main>
  );
}
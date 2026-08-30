"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const prepareRecoverySession = async () => {
      try {
        setError("");

        // 1) يمكن Supabase أنشأ الجلسة تلقائياً
        const {
          data: sessionData,
        } = await supabase.auth.getSession();

        if (sessionData.session) {
          if (active) {
            setReady(true);
          }

          return;
        }

        const url = new URL(
          window.location.href
        );

        // 2) دعم PKCE: ?code=...
        const code =
          url.searchParams.get("code");

        if (code) {
          const {
            data,
            error: exchangeError,
          } =
            await supabase.auth
              .exchangeCodeForSession(code);

          if (
            exchangeError ||
            !data.session
          ) {
            console.error(
              "Recovery code exchange error:",
              exchangeError
            );

            if (active) {
              setError(
                "تعذر التحقق من رابط الاستعادة. اطلب رابطًا جديدًا."
              );
            }

            return;
          }

          // إزالة الكود من العنوان
          window.history.replaceState(
            {},
            document.title,
            "/reset-password"
          );

          if (active) {
            setReady(true);
          }

          return;
        }

        // 3) دعم الرابط القديم:
        // #access_token=...&refresh_token=...
        const hash =
          window.location.hash;

        if (hash) {
          const params =
            new URLSearchParams(
              hash.substring(1)
            );

          const accessToken =
            params.get("access_token");

          const refreshToken =
            params.get("refresh_token");

          const type =
            params.get("type");

          if (
            type !== "recovery" ||
            !accessToken ||
            !refreshToken
          ) {
            if (active) {
              setError(
                "رابط استعادة كلمة المرور غير صالح أو منتهي."
              );
            }

            return;
          }

          const {
            data,
            error: sessionError,
          } =
            await supabase.auth
              .setSession({
                access_token:
                  accessToken,
                refresh_token:
                  refreshToken,
              });

          if (
            sessionError ||
            !data.session
          ) {
            console.error(
              "Recovery setSession error:",
              sessionError
            );

            if (active) {
              setError(
                "تعذر التحقق من رابط الاستعادة. اطلب رابطًا جديدًا."
              );
            }

            return;
          }

          // إزالة التوكنات من العنوان
          window.history.replaceState(
            {},
            document.title,
            "/reset-password"
          );

          if (active) {
            setReady(true);
          }

          return;
        }

        if (active) {
          setError(
            "رابط استعادة كلمة المرور غير صالح أو منتهي."
          );
        }
      } catch (recoveryError) {
        console.error(
          "Prepare recovery error:",
          recoveryError
        );

        if (active) {
          setError(
            "حدث خطأ أثناء التحقق من رابط الاستعادة."
          );
        }
      }
    };

    void prepareRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    // نخليها 12 بدل 8
    if (password.length < 12) {
      setError(
        "كلمة المرور يجب أن تحتوي على 12 حرفًا على الأقل."
      );

      return;
    }

    if (
      password !== confirmPassword
    ) {
      setError(
        "كلمتا المرور غير متطابقتين."
      );

      return;
    }

    setLoading(true);

    try {
      // نتأكد أن الجلسة موجودة فعلاً
      const {
        data: sessionData,
        error: sessionError,
      } =
        await supabase.auth
          .getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        setError(
          "جلسة استعادة كلمة المرور انتهت. اطلب رابط استعادة جديدًا."
        );

        return;
      }

      const {
        error: updateError,
      } =
        await supabase.auth
          .updateUser({
            password,
          });

      if (updateError) {
        console.error(
          "Password update error:",
          updateError
        );

        // هسه ما نخفي السبب الحقيقي
        const text =
          updateError.message ||
          "Unknown error";

        const lower =
          text.toLowerCase();

        if (
          lower.includes("weak") ||
          lower.includes("password strength")
        ) {
          setError(
            "كلمة المرور غير قوية بما يكفي. اختر كلمة أقوى تحتوي أحرفًا وأرقامًا ورموزًا."
          );
        } else if (
          lower.includes(
            "same password"
          ) ||
          lower.includes(
            "different from the old"
          )
        ) {
          setError(
            "اختر كلمة مرور مختلفة عن كلمة المرور السابقة."
          );
        } else {
          setError(
            `تعذر تغيير كلمة المرور: ${text}`
          );
        }

        return;
      }

      setPassword("");
      setConfirmPassword("");

      setMessage(
        "تم تغيير كلمة المرور بنجاح."
      );

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace(
          "/admin/login"
        );
      }, 1500);
    } catch (submitError) {
      console.error(
        "Password reset submit error:",
        submitError
      );

      setError(
        "حدث خطأ غير متوقع أثناء تغيير كلمة المرور."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#050505] px-5 py-8 text-white"
    >
      <section className="w-full max-w-md rounded-[32px] border border-orange-500/25 bg-[#0b0b0b] p-7 shadow-[0_0_100px_rgba(255,106,0,0.18)]">
        <div
          dir="ltr"
          className="text-center"
        >
          <h1 className="text-5xl font-black text-orange-500">
            NEXO
          </h1>

          <p className="mt-2 text-xs tracking-[0.3em] text-orange-500">
            DIGITAL PASS
          </p>
        </div>

        <h2 className="mt-8 text-center text-2xl font-bold">
          تغيير كلمة المرور
        </h2>

        {!ready &&
          !error && (
            <p className="mt-6 text-center text-gray-400">
              جاري التحقق من رابط
              الاستعادة...
            </p>
          )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center text-green-300">
            {message}
          </div>
        )}

        {ready &&
          !message && (
            <form
              onSubmit={
                handleSubmit
              }
              className="mt-7 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  كلمة المرور
                  الجديدة
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target
                        .value
                    )
                  }
                  autoComplete="new-password"
                  minLength={12}
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  تأكيد كلمة
                  المرور
                </label>

                <input
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target
                        .value
                    )
                  }
                  autoComplete="new-password"
                  minLength={12}
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-orange-500 px-5 py-3 font-bold text-black transition hover:bg-orange-400 disabled:opacity-50"
              >
                {loading
                  ? "جاري الحفظ..."
                  : "حفظ كلمة المرور الجديدة"}
              </button>
            </form>
          )}
      </section>
    </main>
  );
}
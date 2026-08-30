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

  const [factorId, setFactorId] =
    useState("");

  const [mfaVerified, setMfaVerified] =
    useState(false);

  const [totpCode, setTotpCode] =
    useState("");

  const [verifyingMfa, setVerifyingMfa] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    let active = true;

    const prepareRecoverySession =
      async () => {
        try {
          setError("");

          let sessionExists = false;

          const url = new URL(
            window.location.href
          );

          // =====================================
          // 1) PKCE recovery link: ?code=...
          // =====================================

          const code =
            url.searchParams.get("code");

          if (code) {
            const {
              data,
              error: exchangeError,
            } =
              await supabase.auth
                .exchangeCodeForSession(
                  code
                );

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

            sessionExists = true;

            window.history.replaceState(
              {},
              document.title,
              "/reset-password"
            );
          }

          // =====================================
          // 2) Legacy recovery link:
          // #access_token=...
          // =====================================

          if (
            !sessionExists &&
            window.location.hash
          ) {
            const params =
              new URLSearchParams(
                window.location.hash.substring(
                  1
                )
              );

            const accessToken =
              params.get(
                "access_token"
              );

            const refreshToken =
              params.get(
                "refresh_token"
              );

            const type =
              params.get("type");

            if (
              type === "recovery" &&
              accessToken &&
              refreshToken
            ) {
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

              sessionExists = true;

              window.history.replaceState(
                {},
                document.title,
                "/reset-password"
              );
            }
          }

          // =====================================
          // 3) Maybe session already exists
          // =====================================

          if (!sessionExists) {
            const {
              data,
              error:
                existingSessionError,
            } =
              await supabase.auth
                .getSession();

            if (
              existingSessionError ||
              !data.session
            ) {
              if (active) {
                setError(
                  "رابط استعادة كلمة المرور غير صالح أو منتهي."
                );
              }

              return;
            }

            sessionExists = true;
          }

          // =====================================
          // 4) Check current AAL
          // =====================================

          const {
            data: aalData,
            error: aalError,
          } =
            await supabase.auth.mfa
              .getAuthenticatorAssuranceLevel();

          if (aalError) {
            console.error(
              "Recovery AAL error:",
              aalError
            );

            if (active) {
              setError(
                "تعذر التحقق من مستوى الأمان للحساب."
              );
            }

            return;
          }

          // Already verified with MFA
          if (
            aalData.currentLevel ===
            "aal2"
          ) {
            if (active) {
              setMfaVerified(true);
              setReady(true);
            }

            return;
          }

          // =====================================
          // 5) Find enrolled TOTP factor
          // =====================================

          const {
            data: factorsData,
            error: factorsError,
          } =
            await supabase.auth.mfa
              .listFactors();

          if (factorsError) {
            console.error(
              "Recovery listFactors error:",
              factorsError
            );

            if (active) {
              setError(
                "تعذر قراءة إعدادات المصادقة الثنائية."
              );
            }

            return;
          }

          const totpFactor =
            factorsData.totp[0];

          if (!totpFactor) {
            if (active) {
              setError(
                "لم يتم العثور على تطبيق مصادقة مرتبط بهذا الحساب."
              );
            }

            return;
          }

          if (active) {
            setFactorId(
              totpFactor.id
            );

            setReady(true);
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

  // =========================================
  // Verify Authenticator code
  // =========================================

  const handleVerifyMfa = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    if (verifyingMfa) {
      return;
    }

    setError("");
    setMessage("");

    const cleanCode =
      totpCode
        .replace(/\D/g, "")
        .slice(0, 6);

    if (cleanCode.length !== 6) {
      setError(
        "أدخل رمز المصادقة المكوّن من 6 أرقام."
      );

      return;
    }

    if (!factorId) {
      setError(
        "عامل المصادقة غير موجود. افتح رابط استعادة جديدًا."
      );

      return;
    }

    setVerifyingMfa(true);

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
        console.error(
          "Recovery MFA verification error:",
          verifyError
        );

        setTotpCode("");

        setError(
          "رمز المصادقة غير صحيح أو انتهت صلاحيته. أدخل الرمز الجديد الظاهر في التطبيق."
        );

        return;
      }

      // تأكد فعلياً أن الجلسة أصبحت AAL2
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
        console.error(
          "AAL2 verification failed:",
          aalError,
          aalData
        );

        setError(
          "تم قبول الرمز، لكن تعذر رفع مستوى أمان الجلسة. حاول مرة أخرى."
        );

        return;
      }

      setTotpCode("");
      setMfaVerified(true);
      setMessage("");
    } catch (mfaError) {
      console.error(
        "Recovery MFA error:",
        mfaError
      );

      setError(
        "حدث خطأ أثناء التحقق من رمز المصادقة."
      );
    } finally {
      setVerifyingMfa(false);
    }
  };

  // =========================================
  // Change password
  // =========================================

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    if (!mfaVerified) {
      setError(
        "يجب التحقق من رمز المصادقة أولاً."
      );

      return;
    }

    if (password.length < 12) {
      setError(
        "كلمة المرور يجب أن تحتوي على 12 حرفًا على الأقل."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "كلمتا المرور غير متطابقتين."
      );

      return;
    }

    setLoading(true);

    try {
      // نتأكد أن الجلسة ما زالت AAL2
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
        setMfaVerified(false);

        setError(
          "انتهت جلسة التحقق الأمني. أدخل رمز المصادقة مرة أخرى."
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

        const text =
          updateError.message ||
          "Unknown error";

        const lower =
          text.toLowerCase();

        if (
          lower.includes("weak") ||
          lower.includes(
            "password strength"
          )
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
        } else if (
          lower.includes("aal2")
        ) {
          setMfaVerified(false);

          setError(
            "يجب إعادة التحقق من رمز المصادقة."
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
          !mfaVerified &&
          !message && (
            <form
              onSubmit={
                handleVerifyMfa
              }
              className="mt-7 space-y-5"
            >
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
                <p className="font-bold text-orange-400">
                  التحقق الأمني
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  افتح تطبيق
                  المصادقة وأدخل رمز
                  NEXO المكوّن من 6
                  أرقام.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  رمز المصادقة
                </label>

                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(
                      e.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
                    )
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  dir="ltr"
                  placeholder="000000"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-center text-2xl font-bold tracking-[0.4em] text-white outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={
                  verifyingMfa
                }
                className="w-full rounded-2xl bg-orange-500 px-5 py-3 font-bold text-black transition hover:bg-orange-400 disabled:opacity-50"
              >
                {verifyingMfa
                  ? "جاري التحقق..."
                  : "تحقق من الرمز"}
              </button>
            </form>
          )}

        {ready &&
          mfaVerified &&
          !message && (
            <form
              onSubmit={
                handleSubmit
              }
              className="mt-7 space-y-5"
            >
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-center text-sm text-green-300">
                ✓ تم التحقق من
                المصادقة الثنائية
              </div>

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
                      e.target.value
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
                      e.target.value
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
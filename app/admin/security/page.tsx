"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineCheckBadge,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineTrash,
} from "react-icons/hi2";

import { createClient } from "@/lib/supabase/client";

type PageMode =
  | "loading"
  | "ready"
  | "not-enabled"
  | "error";

export default function AdminSecurityPage() {
  const router = useRouter();

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [mode, setMode] =
    useState<PageMode>("loading");

  const [factorId, setFactorId] =
    useState("");

  const [status, setStatus] =
    useState(
      "جاري التحقق من إعدادات الأمان..."
    );

  const [isResetting, setIsResetting] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordStatus, setPasswordStatus] =
    useState("");

  const [isChangingPassword, setIsChangingPassword] =
    useState(false);

  useEffect(() => {
    async function loadSecuritySettings() {
      try {
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

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
          .select("user_id, role")
          .eq(
            "user_id",
            userData.user.id
          )
          .eq("role", "owner")
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
          setMode("error");

          setStatus(
            "تعذر التحقق من مستوى الحماية"
          );

          return;
        }

        if (
          aalData.currentLevel !==
          "aal2"
        ) {
          router.replace(
            "/admin/2fa"
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
          setMode("error");

          setStatus(
            "تعذر قراءة عوامل المصادقة"
          );

          return;
        }

        const verifiedFactor =
          factorsData.totp[0];

        if (!verifiedFactor) {
          setMode("not-enabled");

          setStatus(
            "المصادقة الثنائية غير مفعلة"
          );

          return;
        }

        setFactorId(
          verifiedFactor.id
        );

        setMode("ready");

        setStatus(
          "المصادقة الثنائية مفعلة وتحمي حساب الإدارة"
        );
      } catch (error) {
        console.error(
          "Load admin security settings error:",
          error
        );

        setMode("error");

        setStatus(
          "حدث خطأ غير متوقع أثناء تحميل إعدادات الأمان"
        );
      }
    }

    void loadSecuritySettings();
  }, [router, supabase]);

  const handleResetTwoFactor =
    async () => {
      if (
        !factorId ||
        isResetting
      ) {
        return;
      }

      setShowConfirm(false);
      setIsResetting(true);

      setStatus(
        "جاري إعادة تعيين المصادقة الثنائية..."
      );

      try {
        const response = await fetch(
          "/api/admin/2fa/reset",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              factorId,
            }),
          }
        );

        const result =
          (await response.json()) as {
            success?: boolean;
            error?: string;
            message?: string;
          };

        if (
          !response.ok ||
          !result.success
        ) {
          setStatus(
            result.error ||
              "تعذر إعادة تعيين المصادقة الثنائية"
          );

          return;
        }

        setStatus(
          "تمت إعادة التعيين، جاري تحويلك إلى تسجيل الدخول..."
        );

        await supabase.auth.signOut();

        router.replace(
          "/admin/login"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Reset admin 2FA error:",
          error
        );

        setStatus(
          "حدث خطأ غير متوقع أثناء إعادة التعيين"
        );
      } finally {
        setIsResetting(false);
      }
    };

  const handleChangePassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isChangingPassword) {
      return;
    }

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordStatus(
        "يرجى ملء جميع حقول كلمة المرور"
      );

      return;
    }

    if (newPassword.length < 12) {
      setPasswordStatus(
        "كلمة المرور الجديدة يجب أن تكون 12 حرفًا على الأقل"
      );

      return;
    }

    if (newPassword === currentPassword) {
      setPasswordStatus(
        "كلمة المرور الجديدة يجب أن تختلف عن الحالية"
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus(
        "كلمة المرور الجديدة وتأكيدها غير متطابقين"
      );

      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus(
      "جاري تغيير كلمة المرور..."
    );

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          current_password:
            currentPassword,
          password: newPassword,
        });

      if (updateError) {
        const errorMessage =
          updateError.message.toLowerCase();

        if (
          errorMessage.includes(
            "current password"
          ) ||
          errorMessage.includes(
            "invalid credentials"
          )
        ) {
          setPasswordStatus(
            "كلمة المرور الحالية غير صحيحة"
          );
        } else if (
          errorMessage.includes("weak") ||
          errorMessage.includes("password")
        ) {
          setPasswordStatus(
            "كلمة المرور الجديدة غير مقبولة، اختر كلمة أقوى"
          );
        } else {
          setPasswordStatus(
            updateError.message ||
              "تعذر تغيير كلمة المرور"
          );
        }

        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordStatus(
        "تم تغيير كلمة المرور بنجاح، جاري تحويلك إلى تسجيل الدخول..."
      );

      await supabase.auth.signOut();

      router.replace(
        "/admin/login"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Change admin password error:",
        error
      );

      setPasswordStatus(
        "حدث خطأ غير متوقع أثناء تغيير كلمة المرور"
      );
    } finally {
      setIsChangingPassword(false);
    }
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
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#070707] px-5 py-8 text-white"
    >
      <div className="pointer-events-none absolute left-1/2 top-[-170px] h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-orange-500/15 blur-[110px]" />

      <section className="relative mx-auto w-full max-w-[620px]">
        <header className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/cards"
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-orange-500/30 hover:bg-orange-500/10 active:scale-95"
            aria-label="الرجوع إلى لوحة التحكم"
          >
            <HiOutlineArrowRight
              size={22}
            />
          </button>

          <div className="text-center">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
              NEXO SECURITY
            </p>

            <h1 className="text-xl font-black sm:text-2xl">
              إعدادات الأمان
            </h1>
          </div>

          <div className="h-11 w-11" />
        </header>

        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.035] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
          <div className="mb-7 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-orange-500/25 bg-orange-500/10 text-orange-500">
              <HiOutlineShieldCheck
                size={34}
              />
            </div>

            <div>
              <h2 className="text-lg font-black">
                المصادقة الثنائية
              </h2>

              <p className="mt-1 text-sm leading-6 text-white/45">
                حماية حساب الإدارة
                باستخدام رمز متغير من
                تطبيق المصادقة
              </p>
            </div>
          </div>

          {mode === "ready" && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
              <div>
                <p className="font-bold text-emerald-300">
                  الحالة: مفعلة
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-200/60">
                  حساب الـOwner محمي
                  بالمصادقة الثنائية
                </p>
              </div>

              <HiOutlineCheckBadge
                size={30}
                className="text-emerald-400"
              />
            </div>
          )}

          {mode ===
            "not-enabled" && (
            <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-4 text-center text-sm text-orange-300">
              {status}
            </div>
          )}

          {mode === "error" && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-center text-sm text-red-300">
              {status}
            </div>
          )}

          {mode === "ready" && (
            <>
              <form
                onSubmit={handleChangePassword}
                className="mb-5 rounded-2xl border border-orange-500/15 bg-orange-500/[0.05] p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
                    <HiOutlineKey
                      size={23}
                    />
                  </div>

                  <div>
                    <h3 className="font-black text-white">
                      تغيير كلمة المرور
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-white/45">
                      أدخل كلمة المرور الحالية ثم اختر كلمة جديدة قوية.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="current-password"
                      className="mb-2 block text-sm font-bold text-white/70"
                    >
                      كلمة المرور الحالية
                    </label>

                    <input
                      id="current-password"
                      type="password"
                      dir="ltr"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(
                          event.target.value
                        )
                      }
                      disabled={isChangingPassword}
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-left text-sm text-white outline-none transition focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-sm font-bold text-white/70"
                    >
                      كلمة المرور الجديدة
                    </label>

                    <input
                      id="new-password"
                      type="password"
                      dir="ltr"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      disabled={isChangingPassword}
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-left text-sm text-white outline-none transition focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-bold text-white/70"
                    >
                      تأكيد كلمة المرور الجديدة
                    </label>

                    <input
                      id="confirm-password"
                      type="password"
                      dir="ltr"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      disabled={isChangingPassword}
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-left text-sm text-white outline-none transition focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {passwordStatus && (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-center text-sm leading-6 ${
                      passwordStatus.includes(
                        "بنجاح"
                      )
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : passwordStatus.includes(
                              "جاري"
                            )
                          ? "border-orange-500/20 bg-orange-500/10 text-orange-300"
                          : "border-red-500/20 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {passwordStatus}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-4 font-black text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HiOutlineKey
                    size={20}
                  />

                  {isChangingPassword
                    ? "جاري تغيير كلمة المرور..."
                    : "تغيير كلمة المرور"}
                </button>
              </form>

              <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.06] p-5">
                <h3 className="font-black text-white">
                  إعادة تعيين المصادقة
                </h3>

                <p className="mt-2 text-sm leading-7 text-white/45">
                  استخدم هذا الخيار عند
                  تغيير الهاتف أو عندما
                  تريد حذف إعداد المصادقة
                  الحالي وإنشاء رمز QR
                  جديد.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirm(true)
                  }
                  disabled={isResetting}
                  className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 font-black text-red-300 transition hover:bg-red-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HiOutlineTrash
                    size={20}
                  />

                  {isResetting
                    ? "جاري إعادة التعيين..."
                    : "إعادة تعيين المصادقة الثنائية"}
                </button>
              </div>

              {status.includes(
                "جاري"
              ) && (
                <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-center text-sm text-orange-300">
                  {status}
                </div>
              )}

              {status.includes(
                "تعذر"
              ) && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
                  {status}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[430px] rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <HiOutlineTrash
                size={27}
              />
            </div>

            <h2 className="text-xl font-black">
              تأكيد إعادة التعيين
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/50">
              سيتم حذف المصادقة
              الثنائية الحالية وتسجيل
              خروجك من لوحة الإدارة.
              عند تسجيل الدخول القادم
              سيظهر لك رمز QR جديد.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowConfirm(false)
                }
                disabled={isResetting}
                className="h-12 rounded-2xl border border-white/10 bg-white/5 font-bold text-white/70 transition hover:bg-white/10 disabled:opacity-60"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={
                  handleResetTwoFactor
                }
                disabled={isResetting}
                className="h-12 rounded-2xl bg-red-600 font-black text-white transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                نعم، إعادة التعيين
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
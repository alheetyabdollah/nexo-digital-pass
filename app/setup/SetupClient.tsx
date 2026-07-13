"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SetupClientProps = {
  cardCode: string;
};

function generateRecoveryKey() {
  const part = () =>
    Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

  return `NEXO-${part()}-${part()}-${part()}-${part()}`;
}

async function hashText(text: string) {
  const data = new TextEncoder().encode(text);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

export default function SetupClient({
  cardCode,
}: SetupClientProps) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [status, setStatus] = useState("");
  const [checking, setChecking] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function checkCard() {
      const { data, error } = await supabase
        .from("cards")
        .select(
          "id, status, card_password_hash"
        )
        .eq("card_code", cardCode)
        .maybeSingle();

      if (error) {
        console.error(error);
        setStatus("حدث خطأ أثناء التحقق من البطاقة");
        setChecking(false);
        return;
      }

      if (!data) {
        router.replace("/");
        return;
      }

      const activated =
        data.status === "Activated" &&
        Boolean(data.card_password_hash);

      if (activated) {
        router.replace(
          `/unlock?card=${encodeURIComponent(cardCode)}`
        );
        return;
      }

      setChecking(false);
    }

    checkCard();
  }, [cardCode, router]);

  const createVault = async () => {
    if (creating || checking) return;

    if (password.length < 6) {
      setStatus(
        "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
      );
      return;
    }

    if (password !== confirmPassword) {
      setStatus("كلمة المرور غير متطابقة");
      return;
    }

    setCreating(true);
    setStatus("جاري إنشاء الخزنة...");

    try {
      const newRecoveryKey = generateRecoveryKey();

      const passwordHash = await hashText(password);

      const recoveryHash = await hashText(
        newRecoveryKey
      );

      const { data, error } = await supabase
        .from("cards")
        .update({
          status: "Activated",
          card_password_hash: passwordHash,
          recovery_key_hash: recoveryHash,
        })
        .eq("card_code", cardCode)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error(error);
        setStatus("حدث خطأ أثناء إنشاء الخزنة");
        setCreating(false);
        return;
      }

      if (!data) {
        setStatus("لم يتم العثور على البطاقة");
        setCreating(false);
        return;
      }

      setRecoveryKey(newRecoveryKey);
      setPassword("");
      setConfirmPassword("");
      setStatus("");
      setStep(3);
      setCreating(false);
    } catch (error) {
      console.error(error);
      setStatus("حدث خطأ أثناء إنشاء الخزنة");
      setCreating(false);
    }
  };

  const copyRecoveryKey = async () => {
    try {
      await navigator.clipboard.writeText(
        recoveryKey
      );

      setStatus("تم نسخ مفتاح الخزنة ✅");
    } catch (error) {
      console.error(error);
      setStatus("تعذر نسخ مفتاح الخزنة");
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

            <button
              type="button"
              onClick={() => {
                setStatus("");
                setStep(2);
              }}
              className="mt-10 w-full rounded-3xl bg-orange-500 py-5 font-bold transition hover:bg-orange-600 active:scale-[0.98]"
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

            <div className="mt-8 space-y-5">
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setStatus("");
                }}
                autoComplete="new-password"
                className="h-16 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none transition focus:border-orange-500"
              />

              <input
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value
                  );

                  setStatus("");
                }}
                autoComplete="new-password"
                className="h-16 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none transition focus:border-orange-500"
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

            <p className="mt-4 text-gray-400">
              هذا هو مفتاح الخزنة. احتفظ به في مكان
              آمن.
            </p>

            <div
              dir="ltr"
              className="mt-6 break-all rounded-2xl border border-orange-500/30 bg-black/50 p-5 text-lg font-bold text-orange-400 sm:text-xl"
            >
              {recoveryKey}
            </div>

            <p className="mt-4 text-sm text-red-400">
              ⚠️ قد تحتاجه إذا نسيت كلمة مرور الخزنة.
            </p>

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
              📋 نسخ مفتاح الخزنة
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
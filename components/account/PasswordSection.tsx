"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

type PasswordSectionProps = {
  password: string | null;
  editing: boolean;
  onChange: (value: string) => void;
};

export default function PasswordSection({
  password,
  editing,
  onChange,
}: PasswordSectionProps) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("تعذر نسخ كلمة المرور:", error);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.07] via-white/[0.035] to-transparent p-4">
      <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-orange-500/[0.07] blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <KeyRound size={17} className="text-orange-400" />

          <p className="text-xs font-bold text-white/45">
            كلمة المرور
          </p>
        </div>

        {editing ? (
          <div className="relative mt-3">
            <input
              type={show ? "text" : "password"}
              value={password || ""}
              onChange={(e) => onChange(e.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 px-4 pl-14 text-right text-sm font-bold text-white outline-none transition focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10"
            />

            <button
              type="button"
              onClick={() => setShow((previous) => !previous)}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-white/50 transition hover:bg-orange-500/10 hover:text-orange-400"
              aria-label={
                show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
            >
              {show ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-2">
              <div
                dir="ltr"
                className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-left text-base font-black tracking-wide text-white"
              >
                <span className="block truncate">
                  {password
                    ? show
                      ? password
                      : "••••••••••••"
                    : "لا توجد بيانات"}
                </span>
              </div>

              {password && (
                <>
                  <button
                    type="button"
                    onClick={() => setShow((previous) => !previous)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-white/60 transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 active:scale-95"
                    aria-label={
                      show
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                    }
                  >
                    {show ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={copyPassword}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 active:scale-95 ${
                      copied
                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                        : "border-white/10 bg-black/40 text-white/60 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400"
                    }`}
                    aria-label="نسخ كلمة المرور"
                  >
                    {copied ? (
                      <Check size={20} />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </>
              )}
            </div>

            {copied && (
              <p className="mt-3 text-xs font-bold text-green-300">
                تم نسخ كلمة المرور بنجاح
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
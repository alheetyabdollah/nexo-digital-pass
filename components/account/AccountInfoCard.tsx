"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type AccountInfoCardProps = {
  label: string;
  value: string | null;
  editing: boolean;
  onChange: (value: string) => void;
};

export default function AccountInfoCard({
  label,
  value,
  editing,
  onChange,
}: AccountInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const copyValue = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("تعذر نسخ القيمة:", error);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.055] via-white/[0.03] to-orange-500/[0.015] p-4">
      <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-orange-500/[0.05] blur-3xl" />

      <div className="relative">
        <p className="text-xs font-bold text-white/45">
          {label}
        </p>

        {editing ? (
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-right text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10"
          />
        ) : (
          <>
            <div className="mt-3 flex items-center gap-3">
              <p className="min-w-0 flex-1 break-all text-right text-base font-black leading-7 text-white">
                {value || (
                  <span className="font-normal text-white/30">
                    لا توجد بيانات
                  </span>
                )}
              </p>

              {value && (
                <button
                  type="button"
                  onClick={copyValue}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 active:scale-95 ${
                    copied
                      ? "border-green-500/30 bg-green-500/10 text-green-300"
                      : "border-white/10 bg-black/40 text-white/60 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400"
                  }`}
                  aria-label={`نسخ ${label}`}
                >
                  {copied ? (
                    <Check size={19} />
                  ) : (
                    <Copy size={19} />
                  )}
                </button>
              )}
            </div>

            {copied && (
              <p className="mt-3 text-xs font-bold text-green-300">
                تم نسخ {label} بنجاح
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
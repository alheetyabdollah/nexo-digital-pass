"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

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

    await navigator.clipboard.writeText(value);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#151515] p-6">
      <p className="text-sm text-gray-400">{label}</p>

      {editing ? (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
        />
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            {value && (
              <button
                onClick={copyValue}
                className="rounded-xl bg-zinc-800 p-3 hover:bg-orange-500 transition"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            )}

            <p className="flex-1 text-xl font-bold text-white break-all text-right">
              {value || "لا توجد بيانات"}
            </p>
          </div>

          {copied && (
            <p className="mt-3 text-sm text-orange-400">
              تم نسخ {label} ✅
            </p>
          )}
        </>
      )}
    </div>
  );
}
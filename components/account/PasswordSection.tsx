"use client";

import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { useState } from "react";

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

    await navigator.clipboard.writeText(password);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#151515] p-6">
      <p className="text-sm text-gray-400">كلمة المرور</p>

      {editing ? (
        <input
          value={password || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-4 h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
        />
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={copyPassword}
              className="rounded-xl bg-zinc-800 p-3 hover:bg-orange-500 transition"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>

            <button
              onClick={() => setShow(!show)}
              className="rounded-xl bg-zinc-800 p-3 hover:bg-orange-500 transition"
            >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            <div className="flex-1 rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-right text-xl font-bold">
              {show ? password || "لا توجد بيانات" : "••••••••••••"}
            </div>
          </div>

          {copied && (
            <p className="mt-3 text-sm text-orange-400">
              تم نسخ كلمة المرور ✅
            </p>
          )}
        </>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

type PasswordCardProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function PasswordCard({ label, value, onChange }: PasswordCardProps) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#151515] p-6">
      <label className="block text-right text-lg font-bold text-white">{label}</label>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={copyPassword} className="rounded-xl bg-zinc-800 p-3 hover:bg-orange-500 transition">
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>

        <button type="button" onClick={() => setShow(!show)} className="rounded-xl bg-zinc-800 p-3 hover:bg-orange-500 transition">
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-16 flex-1 rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
        />
      </div>
    </div>
  );
}
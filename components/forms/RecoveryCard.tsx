"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function RecoveryCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#151515] p-6 transition-all duration-300 hover:border-orange-500/40 hover:shadow-[0_0_35px_rgba(255,106,0,0.12)]">

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-xl font-bold text-white">
          🔐 بيانات الاسترداد
        </span>

        {open ? (
          <ChevronUp size={24} />
        ) : (
          <ChevronDown size={24} />
        )}
      </button>

      {open && (
        <div className="mt-6 space-y-5">

          <input
            placeholder="السؤال الأول"
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
          />

          <input
            placeholder="الجواب الأول"
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
          />

          <input
            placeholder="السؤال الثاني"
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
          />

          <input
            placeholder="الجواب الثاني"
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
          />

          <input
            placeholder="السؤال الثالث"
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
          />

          <input
            placeholder="الجواب الثالث"
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/50 px-5 text-right text-white outline-none focus:border-orange-500"
          />

        </div>
      )}
    </div>
  );
}
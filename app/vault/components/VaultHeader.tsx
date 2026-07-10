"use client";

import { HiOutlineLockClosed } from "react-icons/hi2";

type VaultHeaderProps = {
  onClose: () => void;
};

export default function VaultHeader({
  onClose,
}: VaultHeaderProps) {
  return (
    <header className="relative mb-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onClose}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 transition active:scale-95"
        aria-label="إغلاق الخزنة"
      >
        <HiOutlineLockClosed size={22} />
      </button>

      <div className="text-center">
        <h1 className="text-4xl font-black tracking-[0.12em] text-orange-500">
          NEXO
        </h1>

        <p className="mt-1 text-[10px] tracking-[0.35em] text-white/65">
          DIGITAL PASS
        </p>
      </div>

      <div className="h-11 w-11" />
    </header>
  );
}
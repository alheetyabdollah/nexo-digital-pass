"use client";

import { HiOutlineLockClosed } from "react-icons/hi2";
import NexoLogo from "@/components/ui/NexoLogo";

type VaultHeaderProps = {
  onClose: () => void;
};

export default function VaultHeader({
  onClose,
}: VaultHeaderProps) {
  return (
    <header className="relative mb-7 flex items-center justify-between">
      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق الخزنة"
        className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] border border-red-500/25 bg-red-500/[0.08] text-red-300 shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition duration-300 hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-200 active:scale-95"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

        <HiOutlineLockClosed
          size={22}
          className="relative z-10"
        />
      </button>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <NexoLogo
          variant="full"
          size={40}
          animated
        />
      </div>

      <div
        aria-hidden="true"
        className="h-12 w-12"
      />
    </header>
  );
}
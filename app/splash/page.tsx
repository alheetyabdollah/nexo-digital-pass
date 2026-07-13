"use client";

import NexoLogo from "@/components/ui/NexoLogo";

export default function SplashPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070707]">
      <div className="flex flex-col items-center">

        <NexoLogo
          variant="full"
          size={92}
          animated
        />

        <p
  dir="ltr"
  className="mt-12 text-sm font-semibold tracking-[0.45em] text-orange-400"
>
  ENCRYPTING...
</p>

        <div className="mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-24 animate-pulse rounded-full bg-orange-500" />
        </div>

      </div>
    </main>
  );
}
import {
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

export default function WelcomeCard() {
  return (
    <section className="relative mb-4 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl">
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-orange-400">
          <HiOutlineShieldCheck size={32} />
        </div>

        <div>
          <p className="text-sm text-white/70">
            مرحبًا بك في
          </p>

          <h2 className="mt-1 text-2xl font-black text-orange-500">
            خزنتك الرقمية
          </h2>
        </div>
      </div>

      <div className="relative mt-5 space-y-3 text-sm leading-7 text-white/65">
        <p className="flex items-start gap-2">
          <HiOutlineLockClosed
            size={18}
            className="mt-1 shrink-0 text-orange-400"
          />

          <span>
            بياناتك تُشفَّر على جهازك قبل حفظها، وهي ملكٌ لك وحدك.
          </span>
        </p>

        <p className="flex items-start gap-2">
          <HiOutlineShieldCheck
            size={19}
            className="mt-1 shrink-0 text-orange-400"
          />

          <span>
            حتى فريق NEXO لا يستطيع الاطلاع على كلمات مرورك أو محتوى حساباتك.
          </span>
        </p>
      </div>
    </section>
  );
}
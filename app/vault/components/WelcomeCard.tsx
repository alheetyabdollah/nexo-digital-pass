import {
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

export default function WelcomeCard() {
  return (
    <section className="relative mb-5 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">

      <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-orange-500/10 blur-[80px]" />

      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/80 to-transparent" />

      <div className="relative flex items-center gap-4">

        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-[0_0_30px_rgba(255,106,0,0.15)]">
          <HiOutlineShieldCheck size={34} />
        </div>

        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-orange-400/80">
            NEXO SECURITY
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            خزنتك الرقمية
          </h2>

          <p className="mt-2 text-sm leading-7 text-white/50">
            جميع حساباتك في مكان واحد، محمية بتشفير قوي.
          </p>
        </div>

      </div>

      <div className="mt-7 grid gap-3">

        <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">

          <HiOutlineLockClosed
            size={20}
            className="text-orange-400"
          />

          <span className="text-sm text-white/70">
            كلمات المرور تبقى مشفرة ولا يمكن قراءتها.
          </span>

        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">

          <HiOutlineShieldCheck
            size={20}
            className="text-orange-400"
          />

          <span className="text-sm text-white/70">
            حتى فريق NEXO لا يستطيع الوصول إلى بياناتك.
          </span>

        </div>

      </div>

    </section>
  );
}
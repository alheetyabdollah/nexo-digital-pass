"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";

import {
  HiOutlineArrowRight,
  HiOutlineInformationCircle,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";

export default function AboutPage() {
  const searchParams = useSearchParams();
  const cardCode = searchParams.get("card");

  const vaultHref = cardCode
    ? `/vault?card=${encodeURIComponent(cardCode)}`
    : "/";

  const instagramUrl =
    "https://www.instagram.com/nexo.312/";

  const whatsappUrl =
    "https://wa.me/9647825515160";

  const phoneUrl =
    "tel:+9647825515160";

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#070707] text-white"
    >
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden px-4 pb-28 pt-5">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[90px]" />

        <div className="pointer-events-none absolute bottom-20 right-[-100px] h-64 w-64 rounded-full bg-orange-500/[0.06] blur-[100px]" />

        {/* الهيدر */}
        <header className="relative mb-6 flex items-center justify-between">
          <Link
            href={vaultHref}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-orange-500/30 hover:text-orange-400 active:scale-95"
            aria-label="الرجوع إلى الخزنة"
          >
            <HiOutlineArrowRight size={22} />
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-black tracking-[0.12em] text-orange-500">
              NEXO
            </h1>

            <p className="mt-1 text-[9px] tracking-[0.35em] text-white/60">
              DIGITAL PASS
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <HiOutlineInformationCircle size={23} />
          </div>
        </header>

        {/* القسم الرئيسي */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-orange-500/[0.035] p-6 shadow-[0_25px_75px_rgba(255,106,0,0.08)]">
          <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-[0_0_40px_rgba(255,106,0,0.12)]">
              <HiOutlineSparkles size={38} />
            </div>

            <h2 className="mt-5 text-3xl font-black">
              عن NEXO
            </h2>

            <p className="mt-2 text-xs font-bold tracking-[0.18em] text-orange-400">
              Secure. Private. Yours.
            </p>

            <p className="mt-5 text-sm leading-8 text-white/55">
              NEXO Digital Pass هو نظام ذكي وآمن لإدارة
              حساباتك الرقمية وحمايتها داخل خزنة مشفرة،
              يجمع بين الأمان والخصوصية وسهولة الاستخدام.
            </p>
          </div>
        </section>

        {/* الخصوصية */}
        <section className="mt-5 rounded-[28px] border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.09] to-white/[0.025] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <HiOutlineShieldCheck size={28} />
            </div>

            <div>
              <h3 className="text-xl font-black">
                خصوصيتك أولًا
              </h3>

              <p className="mt-3 text-sm leading-7 text-white/50">
                جميع بياناتك يتم تشفيرها على جهازك، ولا
                يستطيع فريق NEXO الاطلاع على كلمات المرور
                أو محتوى حساباتك.
              </p>
            </div>
          </div>
        </section>

        {/* الدعم الفني */}
        <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-5">
            <p className="text-xs text-white/40">
              تواصل معنا
            </p>

            <h3 className="mt-1 text-2xl font-black">
              الدعم الفني
            </h3>
          </div>

          <div className="space-y-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:border-orange-500/30 hover:bg-orange-500/[0.06] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400">
                  <FaInstagram size={25} />
                </div>

                <div>
                  <p className="text-sm font-black">
                    Instagram
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 text-left text-xs text-white/45"
                  >
                    @nexo.312
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-orange-400">
                فتح
              </span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:border-green-500/30 hover:bg-green-500/[0.06] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
                  <FaWhatsapp size={25} />
                </div>

                <div>
                  <p className="text-sm font-black">
                    WhatsApp
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 text-left text-xs text-white/45"
                  >
                    07825515160
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-orange-400">
                مراسلة
              </span>
            </a>

            <a
              href={phoneUrl}
              className="flex items-center justify-between rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:border-orange-500/30 hover:bg-orange-500/[0.06] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <HiOutlinePhone size={25} />
                </div>

                <div>
                  <p className="text-sm font-black">
                    اتصال مباشر
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 text-left text-xs text-white/45"
                  >
                    07825515160
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-orange-400">
                اتصال
              </span>
            </a>
          </div>
        </section>

        {/* الإصدار */}
        <section className="mt-5 flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.025] p-4">
          <div>
            <p className="text-xs text-white/40">
              الإصدار الحالي
            </p>

            <p className="mt-1 font-black">
              NEXO Digital Pass
            </p>
          </div>

          <span
            dir="ltr"
            className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-400"
          >
            v1.0.0
          </span>
        </section>

        {/* الرسالة الختامية */}
        <section className="mt-5 rounded-[28px] border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] to-white/[0.02] p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-orange-500/10 text-orange-400">
            <HiOutlineLockClosed size={28} />
          </div>

          <p className="mt-5 text-lg font-black leading-8">
            نحن لا نحفظ أسرارك...
          </p>

          <p className="mt-1 text-lg font-black text-orange-400">
            نحن نحميها.
          </p>
        </section>

        <footer className="pb-3 pt-7 text-center">
          <p className="text-xs text-white/25">
            © 2026 NEXO
          </p>

          <p className="mt-2 text-[10px] font-bold tracking-[0.2em] text-white/20">
            SECURE • PRIVATE • YOURS
          </p>
        </footer>
      </div>
    </main>
  );
}
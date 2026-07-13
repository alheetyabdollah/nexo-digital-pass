import Link from "next/link";

import {
  FaApple,
  FaFacebook,
  FaWhatsapp,
  FaTelegramPlane,
} from "react-icons/fa";

import {
  SiGoogleplay,
  SiInstagram,
  SiTiktok,
} from "react-icons/si";

import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineSquares2X2,
} from "react-icons/hi2";

type AppsGridProps = {
  cardCode: string | null;
  accountCounts: Record<string, number>;
};

const apps = [
  {
    key: "apple",
    name: "Apple",
    href: "/apple",
    icon: <FaApple size={31} />,
    iconClass: "text-white",
    glowClass: "group-hover:shadow-[0_0_28px_rgba(255,255,255,0.10)]",
  },
  {
    key: "google",
    name: "Google",
    href: "/google",
    icon: <SiGoogleplay size={29} />,
    iconClass: "text-white",
    glowClass: "group-hover:shadow-[0_0_28px_rgba(255,255,255,0.10)]",
  },
  {
    key: "instagram",
    name: "Instagram",
    href: "/instagram",
    icon: <SiInstagram size={29} />,
    iconClass: "text-pink-500",
    glowClass: "group-hover:shadow-[0_0_28px_rgba(236,72,153,0.16)]",
  },
  {
    key: "facebook",
    name: "Facebook",
    href: "/facebook",
    icon: <FaFacebook size={29} />,
    iconClass: "text-blue-500",
    glowClass: "group-hover:shadow-[0_0_28px_rgba(59,130,246,0.16)]",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    href: "/whatsapp",
    icon: <FaWhatsapp size={30} />,
    iconClass: "text-green-500",
    glowClass: "group-hover:shadow-[0_0_28px_rgba(34,197,94,0.16)]",
  },
  {
    key: "telegram",
    name: "Telegram",
    href: "/telegram",
    icon: <FaTelegramPlane size={29} />,
    iconClass: "text-sky-400",
    glowClass: "group-hover:shadow-[0_0_28px_rgba(56,189,248,0.16)]",
  },
  {
    key: "tiktok",
    name: "TikTok",
    href: "/tiktok",
    icon: <SiTiktok size={28} />,
    iconClass: "text-white",
    glowClass: "group-hover:shadow-[0_0_28px_rgba(255,255,255,0.10)]",
  },
  {
    key: "other",
    name: "أخرى",
    href: "/other",
    icon: <HiOutlineSquares2X2 size={31} />,
    iconClass: "text-orange-400",
    glowClass: "group-hover:shadow-[0_0_28px_rgba(255,106,0,0.18)]",
  },
];

export default function AppsGrid({
  cardCode,
  accountCounts,
}: AppsGridProps) {
  return (
    <section className="mb-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-orange-400/75">
            YOUR ACCOUNTS
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            حساباتك
          </h3>

          <p className="mt-1 text-xs leading-6 text-white/40">
            اختر الخدمة لإضافة حساب جديد أو إدارة حساباتك.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
          <HiOutlinePlus size={22} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {apps.map((app) => {
          const count = accountCounts[app.key] || 0;

          return (
            <Link
              key={app.key}
              href={
                cardCode
                  ? `${app.href}?card=${cardCode}`
                  : app.href
              }
              className="group relative min-w-0 overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.065] via-white/[0.035] to-transparent p-4 shadow-[0_18px_45px_rgba(0,0,0,0.32)] transition duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:bg-white/[0.055] hover:shadow-[0_24px_55px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-[0.98]"
            >
              <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-orange-500/[0.035] blur-3xl transition duration-300 group-hover:bg-orange-500/[0.07]" />

              {count > 0 && (
                <span className="absolute left-3 top-3 z-10 flex h-7 min-w-7 items-center justify-center rounded-full border border-orange-300/30 bg-orange-500 px-2 text-xs font-black text-black shadow-[0_0_18px_rgba(255,106,0,0.30)]">
                  {count}
                </span>
              )}

              <div className="relative flex items-start justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-[19px] border border-white/10 bg-black/35 transition duration-300 group-hover:scale-105 ${app.iconClass} ${app.glowClass}`}
                >
                  {app.icon}
                </div>

                <HiOutlineArrowLeft
                  size={18}
                  className="mt-1 text-white/20 transition duration-300 group-hover:-translate-x-1 group-hover:text-orange-400"
                />
              </div>

              <div className="relative mt-5">
                <h4
                  dir="ltr"
                  className="truncate text-left text-base font-black text-white"
                >
                  {app.name}
                </h4>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      count > 0
                        ? "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.65)]"
                        : "bg-white/20"
                    }`}
                  />

                  <p className="text-xs text-white/40">
                    {count === 0
                      ? "لا توجد حسابات"
                      : count === 1
                        ? "حساب واحد"
                        : `${count} حسابات`}
                  </p>
                </div>
              </div>

              <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500/0 to-transparent transition duration-300 group-hover:via-orange-500/45" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
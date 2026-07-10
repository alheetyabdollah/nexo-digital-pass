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
  HiOutlineSquares2X2,
  HiOutlinePlus,
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
    icon: <FaApple size={32} />,
    iconClass: "text-white",
  },
  {
    key: "google",
    name: "Google",
    href: "/google",
    icon: <SiGoogleplay size={30} />,
    iconClass: "text-white",
  },
  {
    key: "instagram",
    name: "Instagram",
    href: "/instagram",
    icon: <SiInstagram size={30} />,
    iconClass: "text-pink-500",
  },
  {
    key: "facebook",
    name: "Facebook",
    href: "/facebook",
    icon: <FaFacebook size={30} />,
    iconClass: "text-blue-500",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    href: "/whatsapp",
    icon: <FaWhatsapp size={31} />,
    iconClass: "text-green-500",
  },
  {
    key: "telegram",
    name: "Telegram",
    href: "/telegram",
    icon: <FaTelegramPlane size={30} />,
    iconClass: "text-sky-400",
  },
  {
    key: "tiktok",
    name: "TikTok",
    href: "/tiktok",
    icon: <SiTiktok size={29} />,
    iconClass: "text-white",
  },
  {
    key: "other",
    name: "أخرى",
    href: "/other",
    icon: <HiOutlineSquares2X2 size={32} />,
    iconClass: "text-orange-400",
  },
];

export default function AppsGrid({
  cardCode,
  accountCounts,
}: AppsGridProps) {
  return (
    <>
      {/* عنوان التطبيقات */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black">
            حساباتك
          </h3>

          <p className="mt-1 text-xs text-white/40">
            اختر الخدمة لإضافة أو إدارة الحساب
          </p>
        </div>

        <HiOutlinePlus
          size={25}
          className="text-orange-400"
        />
      </div>

      {/* شبكة التطبيقات */}
      <section className="grid grid-cols-2 gap-3">
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
              className="group relative min-w-0 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-500/[0.02] p-3 transition-all duration-300 hover:border-orange-500/40 hover:bg-white/[0.06] hover:shadow-[0_0_25px_rgba(255,106,0,0.12)] active:scale-[0.97]"
            >
              {count > 0 && (
                <span className="absolute left-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-black text-black">
                  {count}
                </span>
              )}

              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/35 transition-transform duration-300 group-hover:scale-110 ${app.iconClass}`}
              >
                {app.icon}
              </div>

              <h4 className="truncate text-base font-black">
                {app.name}
              </h4>

              <p className="mt-1 text-xs text-white/40">
                {count === 0
                  ? "لا توجد حسابات"
                  : `${count} ${
                      count === 1 ? "حساب" : "حسابات"
                    }`}
              </p>
            </Link>
          );
        })}
      </section>
    </>
  );
}
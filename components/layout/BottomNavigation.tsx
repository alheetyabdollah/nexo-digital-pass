"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlinePlus,
} from "react-icons/hi2";

type BottomNavigationProps = {
  cardCode: string | null;
};

export default function BottomNavigation({
  cardCode,
}: BottomNavigationProps) {
  const pathname = usePathname();

  const buildHref = (
    path: string,
    hash?: string
  ) => {
    const query = cardCode
      ? `?card=${encodeURIComponent(cardCode)}`
      : "";

    const hashValue = hash
      ? `#${hash}`
      : "";

    return `${path}${query}${hashValue}`;
  };

  const isActive = (path: string) =>
    pathname === path;

  const handleVaultClick = () => {
    if (pathname !== "/vault") {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <nav
      dir="rtl"
      className="fixed bottom-0 left-1/2 z-50 flex h-[94px] w-full max-w-[540px] -translate-x-1/2 items-center justify-around rounded-t-[30px] border border-white/10 bg-[#0a0a0a]/95 px-3 pb-3 pt-3 shadow-[0_-20px_55px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
    >
      {/* الإعدادات */}
      <Link
        href={buildHref("/settings")}
        className={`flex min-w-[58px] flex-col items-center gap-1.5 transition active:scale-95 ${
          isActive("/settings")
            ? "text-orange-400"
            : "text-white/55 hover:text-orange-400"
        }`}
      >
        <HiOutlineCog6Tooth size={27} />

        <span className="text-[11px] font-bold">
          الإعدادات
        </span>
      </Link>

      {/* عن NEXO */}
      <Link
        href={buildHref("/about")}
        className={`flex min-w-[58px] flex-col items-center gap-1.5 transition active:scale-95 ${
          isActive("/about")
            ? "text-orange-400"
            : "text-white/55 hover:text-orange-400"
        }`}
      >
        <HiOutlineInformationCircle
          size={28}
        />

        <span className="text-[11px] font-bold">
          عن NEXO
        </span>
      </Link>

      {/* إضافة حساب */}
      <Link
        href={
          pathname === "/vault"
            ? "#accounts"
            : buildHref(
                "/vault",
                "accounts"
              )
        }
        aria-label="إضافة حساب"
        className="-mt-12 flex min-w-[76px] flex-col items-center"
      >
        <div className="group relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-[5px] border-[#0a0a0a] bg-gradient-to-br from-[#ff8a00] to-[#ff5f00] text-white shadow-[0_0_34px_rgba(255,106,0,0.5)] transition duration-300 hover:scale-105 active:scale-95">
          <div className="pointer-events-none absolute inset-1 rounded-full border border-white/20" />

          <HiOutlinePlus
            size={38}
            className="relative z-10 transition duration-300 group-hover:rotate-90"
          />
        </div>

        <span className="mt-1 text-[11px] font-black text-orange-500">
          إضافة حساب
        </span>
      </Link>

      {/* بطاقتي */}
      <Link
        href={buildHref("/my-card")}
        className={`flex min-w-[58px] flex-col items-center gap-1.5 transition active:scale-95 ${
          isActive("/my-card")
            ? "text-orange-400"
            : "text-white/55 hover:text-orange-400"
        }`}
      >
        <HiOutlineCreditCard size={28} />

        <span className="text-[11px] font-bold">
          بطاقتي
        </span>
      </Link>

      {/* الخزنة */}
      <Link
        href={
          pathname === "/vault"
            ? "#vault-top"
            : buildHref("/vault")
        }
        onClick={handleVaultClick}
        className={`flex min-w-[58px] flex-col items-center gap-1.5 transition active:scale-95 ${
          isActive("/vault")
            ? "text-orange-400"
            : "text-white/55 hover:text-orange-400"
        }`}
      >
        <HiOutlineHome size={28} />

        <span className="text-[11px] font-bold">
          الخزنة
        </span>
      </Link>
    </nav>
  );
}
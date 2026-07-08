import Link from "next/link";
import { ReactNode } from "react";

type AppCardProps = {
  name: string;
  desc: string;
  href: string;
  icon: ReactNode;
  featured?: boolean;
};

export default function AppCard({
  name,
  desc,
  href,
  icon,
  featured,
}: AppCardProps) {
  return (
    <Link
      href={href}
      className="
        relative
        rounded-3xl
        border border-orange-500/20
        bg-[#171717]
        p-8
        cursor-pointer
        transition-all
        duration-300
        hover:-translate-y-2
        hover:scale-[1.02]
        hover:border-orange-400
        hover:shadow-[0_0_45px_rgba(255,106,0,0.35)]
        block
      "
    >
      {featured && (
        <span className="absolute top-5 left-5 rounded-full bg-orange-500 px-4 py-1 text-xs font-bold">
          الأكثر استخدامًا
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="text-right">
          <h3 className="text-4xl font-bold">{name}</h3>
          <p className="mt-2 text-gray-400">{desc}</p>
        </div>

        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-zinc-800 to-black shadow-[0_0_30px_rgba(255,255,255,0.10)]">
          {icon}
        </div>
      </div>
    </Link>
  );
}
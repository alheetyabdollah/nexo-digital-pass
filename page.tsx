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

import { HiOutlineSquares2X2 } from "react-icons/hi2";
const apps = [
  {
  icon: <FaApple size={42} className="text-white" />,
  name: "Apple ID",
  desc: "إدارة حساب Apple",
  featured: true,
},
  { icon: "▶️", name: "Google Play", desc: "إدارة حساب Google Play" },
  { icon: "📷", name: "Instagram", desc: "إدارة حساب Instagram" },
  { icon: "f", name: "Facebook", desc: "إدارة حساب Facebook" },
  { icon: "💬", name: "WhatsApp", desc: "إدارة حساب WhatsApp" },
  { icon: "🎵", name: "TikTok", desc: "إدارة حساب TikTok" },
  { icon: "✈️", name: "Telegram", desc: "إدارة حساب Telegram" },
  { icon: "➕", name: "أخرى", desc: "PlayStation, Xbox أو أي حساب آخر" },
];

export default function VaultPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#111111] via-[#0b0b0b] to-[#111111] text-white p-8">
      <div className="relative mx-auto max-w-6xl">

  <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-orange-500/5 blur-[180px] -z-10"></div>

        <div className="text-center mb-14">
          <h1 className="text-6xl font-black text-orange-500">
            NEXO
          </h1>

          <p className="tracking-[8px] text-orange-400 mt-2">
            DIGITAL PASS
          </p>

          <h2 className="mt-12 text-5xl font-bold">
            خزنتك الرقمية
          </h2>

          <p className="mt-4 text-gray-400 text-xl">
            اختر الحساب الذي تريد تنظيمه وإدارته بأمان.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {apps.map((app) => (
            <div
              key={app.name}
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
"
            >
              {app.featured && (
                <span className="absolute top-5 left-5 rounded-full bg-orange-500 px-4 py-1 text-xs font-bold">
                  الأكثر استخدامًا
                </span>
              )}

              <div className="flex items-center justify-between">

                <div className="text-right">
                  <h3 className="text-4xl font-bold">
                    {app.name}
                  </h3>

                  <p className="mt-2 text-gray-400">
                    {app.desc}
                  </p>
                </div>

                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-zinc-800 to-black shadow-[0_0_30px_rgba(255,255,255,0.10)]">
  {app.icon}
</div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
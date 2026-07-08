import Link from "next/link";

export default function Home() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-5 py-8"
    >
      <section className="w-full max-w-3xl rounded-[36px] border border-orange-500/25 bg-[#0b0b0b] px-6 py-10 text-center shadow-[0_0_120px_rgba(255,106,0,0.22)]">
        <div dir="ltr" className="text-center">
          <h1 className="text-8xl font-black text-orange-500 drop-shadow-[0_0_55px_rgba(255,106,0,0.75)]">
            NEXO
          </h1>

          <p className="mt-3 text-lg tracking-[0.35em] text-orange-500">
            DIGITAL PASS
          </p>
        </div>

        <div className="mt-12">
          <h2
            dir="rtl"
            className="text-4xl font-bold leading-relaxed text-white"
          >
            مرحبًا بك في عائلة{" "}
            <span className="text-orange-500">NEXO</span>
          </h2>

          <p className="mt-6 text-2xl leading-relaxed text-gray-300">
            لأن حياتك الرقمية تستحق نظامًا يحافظ عليها.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-orange-500/30 bg-black/40 p-6">
          <div className="flex flex-col items-center">
            <div className="mb-3 text-5xl">🔒</div>

            <h3 className="text-2xl font-bold text-orange-500">
              خصوصيتك أولويتنا
            </h3>
          </div>

          <p className="mt-4 text-xl leading-relaxed text-gray-300">
            حتى فريق{" "}
            <span className="font-semibold text-orange-500">NEXO</span>{" "}
            لا يستطيع الاطلاع على كلمات مرورك أو محتوى حساباتك.
          </p>
        </div>

        <Link
          href="/setup"
          className="mx-auto mt-10 block w-full max-w-md rounded-3xl bg-orange-500 px-8 py-6 text-center text-2xl font-bold text-white shadow-[0_0_35px_rgba(255,106,0,0.45)] transition hover:bg-orange-600"
        >
          ابدأ الآن
        </Link>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-xl text-orange-500">🔒</span>
            <span>تشفير كامل</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl text-orange-500">⚡</span>
            <span>إعداد خلال دقيقة</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl text-orange-500">📱</span>
            <span>جميع حساباتك في مكان واحد</span>
          </div>
        </div>

        <p dir="ltr" className="mt-8 text-sm text-gray-600">
          Version 1.0
        </p>
      </section>
    </main>
  );
}
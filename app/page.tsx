export default function Home() {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#050505] px-5 py-8 text-white"
    >
      <section className="w-full max-w-3xl rounded-[36px] border border-orange-500/25 bg-[#0b0b0b] px-6 py-10 text-center shadow-[0_0_120px_rgba(255,106,0,0.22)]">
        <div dir="ltr" className="text-center">
          <h1 className="text-7xl font-black text-orange-500 drop-shadow-[0_0_55px_rgba(255,106,0,0.75)] sm:text-8xl">
            NEXO
          </h1>

          <p className="mt-3 text-sm tracking-[0.35em] text-orange-500 sm:text-lg">
            DIGITAL PASS
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold leading-relaxed text-white sm:text-4xl">
            مرحبًا بك في عائلة{" "}
            <span className="text-orange-500">NEXO</span>
          </h2>

          <p className="mt-6 text-xl leading-relaxed text-gray-300 sm:text-2xl">
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

          <p className="mt-4 text-lg leading-relaxed text-gray-300 sm:text-xl">
            حتى فريق{" "}
            <span className="font-semibold text-orange-500">
              NEXO
            </span>{" "}
            لا يستطيع الاطلاع على كلمات مرورك أو محتوى حساباتك.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full max-w-md">
          <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 px-8 py-6">
            <p className="text-xl font-black text-orange-400">
              امسح رمز QR الموجود على بطاقتك
            </p>

            <p className="mt-2 text-sm leading-6 text-white/50">
              الدخول إلى الخزنة متاح فقط من خلال بطاقة NEXO
              الأصلية.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <span>تشفير كامل</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span>إعداد خلال دقيقة</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
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
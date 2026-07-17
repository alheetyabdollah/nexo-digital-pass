import { Suspense } from "react";
import AboutPage from "@/components/about/AboutPage";

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

        <p className="text-sm text-white/50">
          جاري التحميل...
        </p>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AboutPage />
    </Suspense>
  );
}
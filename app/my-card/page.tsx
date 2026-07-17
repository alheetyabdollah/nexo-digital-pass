import { Suspense } from "react";
import MyCardPage from "@/components/my-card/MyCardPage";

function MyCardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

        <p className="text-sm text-white/50">
          جاري تحميل معلومات البطاقة...
        </p>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<MyCardLoading />}>
      <MyCardPage />
    </Suspense>
  );
}
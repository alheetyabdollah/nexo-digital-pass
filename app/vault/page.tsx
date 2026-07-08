import { Suspense } from "react";
import { connection } from "next/server";
import VaultClient from "./VaultClient";

export default async function VaultPage() {
  await connection();

  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <VaultClient />
    </Suspense>
  );
}
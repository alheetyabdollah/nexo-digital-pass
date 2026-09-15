import UnlockPage from "@/components/unlock/UnlockPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ card?: string; m?: string; t?: string }>;
}) {
  const { card, m, t } = await searchParams;

  return <UnlockPage cardCode={card || null} migrationSecret={m || null} transferProof={t || null} />;
}
import UnlockPage from "@/components/unlock/UnlockPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    card?: string;
    m?: string;
  }>;
}) {
  const { card, m } = await searchParams;

  return (
    <UnlockPage
      cardCode={card || null}
      migrationSecret={m || null}
    />
  );
}
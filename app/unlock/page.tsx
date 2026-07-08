import UnlockPage from "@/components/unlock/UnlockPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return <UnlockPage cardCode={card || null} />;
}
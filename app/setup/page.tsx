import { redirect } from "next/navigation";
import SetupClient from "./SetupClient";

type SetupPageProps = {
  searchParams: Promise<{
    card?: string | string[];
  }>;
};

export default async function SetupPage({
  searchParams,
}: SetupPageProps) {
  const resolvedSearchParams = await searchParams;

  const rawCardCode = resolvedSearchParams.card;

  const cardCode = Array.isArray(rawCardCode)
    ? rawCardCode[0]
    : rawCardCode;

  if (!cardCode?.trim()) {
    redirect("/");
  }

  return <SetupClient cardCode={cardCode.trim()} />;
}
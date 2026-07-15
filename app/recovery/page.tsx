import RecoveryClient from "./RecoveryClient";

type RecoveryPageProps = {
  searchParams: Promise<{
    card?: string;
  }>;
};

export default async function RecoveryPage({
  searchParams,
}: RecoveryPageProps) {
  const params = await searchParams;

  return (
    <RecoveryClient
      cardCode={params.card ?? null}
    />
  );
}
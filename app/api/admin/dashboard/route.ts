import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const [
      cardsResult,
      accountsResult,
      batchesResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("cards")
        .select("status"),

      supabaseAdmin
        .from("accounts")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("card_batches")
        .select("id", {
          count: "exact",
          head: true,
        }),
    ]);

    if (cardsResult.error) {
      throw cardsResult.error;
    }

    if (accountsResult.error) {
      throw accountsResult.error;
    }

    if (batchesResult.error) {
      throw batchesResult.error;
    }

    const cards = cardsResult.data ?? [];

    return NextResponse.json({
      totalCards: cards.length,
      activatedCards: cards.filter(
        (card) => card.status === "Activated"
      ).length,
      inactiveCards: cards.filter(
        (card) => card.status !== "Activated"
      ).length,
      totalAccounts:
        accountsResult.count ?? 0,
      totalBatches:
        batchesResult.count ?? 0,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "تعذر تحميل الإحصائيات",
      },
      {
        status: 500,
      }
    );
  }
}
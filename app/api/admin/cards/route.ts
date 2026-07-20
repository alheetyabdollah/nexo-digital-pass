import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = supabaseAdmin;

    const { data: cards, error: cardsError } =
      await supabase
        .from("cards")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (cardsError) {
      throw cardsError;
    }

    const { count: accountsCount, error: accountsError } =
      await supabase
        .from("accounts")
        .select("id", {
          count: "exact",
          head: true,
        });

    if (accountsError) {
      throw accountsError;
    }

    return NextResponse.json({
      cards: cards || [],
      accountsCount: accountsCount || 0,
    });
  } catch (error) {
    console.error("GET /api/admin/cards error:", error);

    return NextResponse.json(
      {
        error: "تعذر تحميل البطاقات",
      },
      {
        status: 500,
      }
    );
  }
}
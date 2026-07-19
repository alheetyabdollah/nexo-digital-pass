import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function getArabicStatus(status: string | null) {
  if (status === "Activated") return "مفعلة";
  if (status === "Disabled") return "متوقفة";
  return "غير مفعلة";
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: batchId } = await context.params;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: "إعدادات Supabase غير مكتملة",
        },
        {
          status: 500,
        }
      );
    }

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const batchResult = await adminSupabase
      .from("card_batches")
      .select("id, batch_code")
      .eq("id", batchId)
      .maybeSingle();

    if (batchResult.error) {
      throw batchResult.error;
    }

    if (!batchResult.data) {
      return NextResponse.json(
        {
          error: "الدفعة غير موجودة",
        },
        {
          status: 404,
        }
      );
    }

    const cardsResult = await adminSupabase
      .from("cards")
      .select("card_code, status")
      .eq("batch_id", batchId)
      .order("card_code", {
        ascending: true,
      });

    if (cardsResult.error) {
      throw cardsResult.error;
    }

    const cards = cardsResult.data || [];

    const rows = [
      [
        "رقم البطاقة",
        "الحالة",
        "الحالة الإنجليزية",
        "رقم الدفعة",
      ],
      ...cards.map((card) => [
        card.card_code,
        getArabicStatus(card.status),
        card.status || "Inactive",
        batchResult.data?.batch_code ?? "",
      ]),
    ];

    const csvContent =
      "\uFEFF" +
      rows
        .map((row) =>
          row.map(escapeCsv).join(",")
        )
        .join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="${batchResult.data.batch_code}-cards.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);

    return NextResponse.json(
      {
        error: "تعذر إنشاء ملف CSV",
      },
      {
        status: 500,
      }
    );
  }
}
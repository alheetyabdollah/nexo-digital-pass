import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "معرّف البطاقة غير موجود" },
        { status: 400 }
      );
    }

    const { data: card, error: cardError } = await supabaseAdmin
      .from("cards")
      .select("id, card_code")
      .eq("id", id)
      .maybeSingle();

    if (cardError) {
      console.error("Find card before delete error:", cardError);

      return NextResponse.json(
        { error: "تعذر التحقق من البطاقة" },
        { status: 500 }
      );
    }

    if (!card) {
      return NextResponse.json(
        { error: "البطاقة غير موجودة" },
        { status: 404 }
      );
    }

    const { error: accountsError } = await supabaseAdmin
      .from("accounts")
      .delete()
      .eq("card_id", id);

    if (accountsError) {
      console.error("Delete card accounts error:", accountsError);

      return NextResponse.json(
        { error: "تعذر حذف الحسابات المرتبطة بالبطاقة" },
        { status: 500 }
      );
    }

    const { error: deleteCardError } = await supabaseAdmin
      .from("cards")
      .delete()
      .eq("id", id);

    if (deleteCardError) {
      console.error("Delete card error:", deleteCardError);

      return NextResponse.json(
        { error: "تعذر حذف البطاقة" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cardCode: card.card_code,
    });
  } catch (error) {
    console.error("Admin delete card API error:", error);

    return NextResponse.json(
      { error: "غير مصرح بتنفيذ العملية" },
      { status: 401 }
    );
  }
}
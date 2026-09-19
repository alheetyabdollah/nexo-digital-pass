import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  deriveActivationSecret,
  hashActivationSecret,
} from "@/lib/activationToken";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nexo-digital-pass.vercel.app";

export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await context.params;

    const { data: card, error: cardError } =
      await supabaseAdmin
        .from("cards")
        .select(`
          id,
          card_code,
          status,
          owner_id,
          activation_mode,
          print_status,
          activation_secret_hash,
          activation_secret_used_at
        `)
        .eq("id", id)
        .maybeSingle();

    if (cardError || !card) {
      return NextResponse.json(
        { error: "البطاقة غير موجودة" },
        { status: 404 }
      );
    }

    // حماية البطاقات القديمة والمطبوعة
    if (
      card.status !== "New" ||
      card.owner_id !== null ||
      card.activation_mode !== "secure_v2" ||
      card.print_status !== "unprinted" ||
      card.activation_secret_used_at !== null
    ) {
      return NextResponse.json(
        { error: "هذه البطاقة غير مسموح بإصدار QR تفعيل جديد لها" },
        { status: 409 }
      );
    }

    const activationSecret =
      deriveActivationSecret(card.id);

    const activationSecretHash =
      hashActivationSecret(activationSecret);

    // أول إصدار فقط نخزن الـ hash
    if (!card.activation_secret_hash) {
      const { error: updateError } =
        await supabaseAdmin
          .from("cards")
          .update({
            activation_secret_hash: activationSecretHash,
            activation_secret_created_at:
              new Date().toISOString(),
          })
          .eq("id", card.id)
          .eq("status", "New")
          .eq("activation_mode", "secure_v2")
          .eq("print_status", "unprinted")
          .is("owner_id", null)
          .is("activation_secret_hash", null);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    } else if (
      card.activation_secret_hash !== activationSecretHash
    ) {
      return NextResponse.json(
        {
          error:
            "البطاقة تحتوي على مفتاح تفعيل مختلف، تم إيقاف العملية للحماية",
        },
        { status: 409 }
      );
    }

    const activationUrl =
      `${SITE_ORIGIN}/card/` +
      encodeURIComponent(card.card_code) +
      `?token=${activationSecret}`;

    return NextResponse.json({
      success: true,
      card_code: card.card_code,
      activation_url: activationUrl,
    });
  } catch (error) {
    console.error("activation-qr error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء QR التفعيل" },
      { status: 500 }
    );
  }
}
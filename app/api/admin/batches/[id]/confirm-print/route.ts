import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CardRecord = {
  id: string;
  card_code: string;
  print_status: string | null;
  print_count: number | null;
};

type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function getErrorDetails(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const value = error as SupabaseErrorLike;

    return {
      message:
        value.message ||
        "Unknown server error",
      details: value.details || null,
      hint: value.hint || null,
      code: value.code || null,
    };
  }

  return {
    message:
      error instanceof Error
        ? error.message
        : String(error),
    details: null,
    hint: null,
    code: null,
  };
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  let stage = "start";
  let createdPrintJobId: string | null = null;

  try {
    const { id: batchId } =
      await context.params;

    if (!batchId) {
      return NextResponse.json(
        {
          error:
            "معرّف الدفعة غير موجود",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "إعدادات Supabase الخاصة بالسيرفر غير مكتملة",
        },
        { status: 500 }
      );
    }

    const adminSupabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    stage = "load_batch";

    const {
      data: batch,
      error: batchError,
    } = await adminSupabase
      .from("card_batches")
      .select(
        "id, batch_code, quantity, status"
      )
      .eq("id", batchId)
      .maybeSingle();

    if (batchError) {
      throw batchError;
    }

    if (!batch) {
      return NextResponse.json(
        {
          error:
            "لم يتم العثور على الدفعة",
        },
        { status: 404 }
      );
    }

    stage = "load_cards";

    const {
      data: cardsData,
      error: cardsError,
    } = await adminSupabase
      .from("cards")
      .select(
        "id, card_code, print_status, print_count"
      )
      .eq("batch_id", batchId)
      .order("card_code", {
        ascending: true,
      });

    if (cardsError) {
      throw cardsError;
    }

    const cards =
      (cardsData ||
        []) as CardRecord[];

    if (cards.length === 0) {
      return NextResponse.json(
        {
          error:
            "لا توجد بطاقات داخل الدفعة",
        },
        { status: 400 }
      );
    }

    const previouslyPrintedCards =
      cards.filter(
        (card) =>
          card.print_status ===
            "printed" ||
          (card.print_count ?? 0) >
            0
      );

    if (
      previouslyPrintedCards.length >
      0
    ) {
      return NextResponse.json(
        {
          error:
            "تم إيقاف العملية: تحتوي الدفعة على بطاقات مطبوعة سابقًا",
          code:
            "BATCH_ALREADY_PRINTED",
          printedCardsCount:
            previouslyPrintedCards.length,
          printedCardCodes:
            previouslyPrintedCards
              .slice(0, 10)
              .map(
                (card) =>
                  card.card_code
              ),
        },
        { status: 409 }
      );
    }

    const now =
      new Date().toISOString();

    stage = "create_print_job";

    const {
      data: printJob,
      error: printJobError,
    } = await adminSupabase
      .from("print_jobs")
      .insert({
        batch_id: batchId,
        total_cards: cards.length,
        status: "completed",
        notes: `First print for batch ${batch.batch_code}`,
      })
      .select("id")
      .single();

    if (printJobError) {
      throw printJobError;
    }

    createdPrintJobId =
      printJob.id as string;

    stage = "link_print_job_cards";

    const printJobCards =
      cards.map((card) => ({
        print_job_id:
          createdPrintJobId,
        card_id: card.id,
        print_type:
          "first_print",
        copy_number: 1,
      }));

    const {
      error:
        printJobCardsError,
    } = await adminSupabase
      .from("print_job_cards")
      .insert(printJobCards);

    if (printJobCardsError) {
      throw printJobCardsError;
    }

    stage = "update_cards";

    const {
      data: updatedCards,
      error: updateCardsError,
    } = await adminSupabase
      .from("cards")
      .update({
        print_status:
          "printed",
        printed_at: now,
        print_count: 1,
        last_print_job_id:
          createdPrintJobId,
      })
      .eq("batch_id", batchId)
      .or(
        "print_status.is.null,print_status.eq.unprinted"
      )
      .or(
        "print_count.is.null,print_count.eq.0"
      )
      .select("id");

    if (updateCardsError) {
      throw updateCardsError;
    }

    if (
      (updatedCards?.length ?? 0) !==
      cards.length
    ) {
      throw new Error(
        `تم تحديث ${
          updatedCards?.length ?? 0
        } من أصل ${
          cards.length
        } بطاقة فقط`
      );
    }

    stage = "update_batch";

    const {
      data: updatedBatch,
      error: updateBatchError,
    } = await adminSupabase
      .from("card_batches")
      .update({
        status: "Printed",
      })
      .eq("id", batchId)
      .select("id")
      .single();

    if (updateBatchError) {
      throw updateBatchError;
    }

    if (!updatedBatch) {
      throw new Error(
        "لم يتم تحديث حالة الدفعة"
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "تم تأكيد الطباعة بنجاح",
      printJobId:
        createdPrintJobId,
      printedCards:
        cards.length,
      printedAt: now,
    });
  } catch (error) {
    const details =
      getErrorDetails(error);

    console.error(
      "Confirm batch print error:",
      {
        stage,
        createdPrintJobId,
        ...details,
      }
    );

    return NextResponse.json(
      {
        error:
          "تعذر تأكيد عملية الطباعة، يرجى المحاولة مرة أخرى.",
      },
      { status: 500 }
    );
  }
}
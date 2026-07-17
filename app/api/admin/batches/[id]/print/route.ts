import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BatchRecord = {
  id: string;
  batch_code: string;
  quantity: number;
  status: string;
  created_at: string;
};

type CardRecord = {
  id: string;
  card_code: string;
  status: string | null;
  batch_id: string | null;
};

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nexo-digital-pass.vercel.app";

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];

  if (!base64) {
    throw new Error("Invalid QR image");
  }

  return Uint8Array.from(
    Buffer.from(base64, "base64")
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: batchId } =
      await context.params;

    if (!batchId) {
      return NextResponse.json(
        {
          error:
            "معرّف الدفعة غير موجود",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "إعدادات Supabase الخاصة بالسيرفر غير مكتملة",
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

    const [
      batchResult,
      cardsResult,
    ] = await Promise.all([
      adminSupabase
        .from("card_batches")
        .select(
          "id, batch_code, quantity, status, created_at"
        )
        .eq("id", batchId)
        .maybeSingle(),

      adminSupabase
        .from("cards")
        .select(
          "id, card_code, status, batch_id"
        )
        .eq("batch_id", batchId)
        .order("card_code", {
          ascending: true,
        }),
    ]);

    if (batchResult.error) {
      throw batchResult.error;
    }

    if (cardsResult.error) {
      throw cardsResult.error;
    }

    if (!batchResult.data) {
      return NextResponse.json(
        {
          error:
            "لم يتم العثور على الدفعة",
        },
        {
          status: 404,
        }
      );
    }

    const batch =
      batchResult.data as BatchRecord;

    const cards =
      (cardsResult.data ||
        []) as CardRecord[];

    if (cards.length === 0) {
      return NextResponse.json(
        {
          error:
            "لا توجد بطاقات داخل الدفعة",
        },
        {
          status: 400,
        }
      );
    }

    const pdfDocument =
      await PDFDocument.create();

    const boldFont =
      await pdfDocument.embedFont(
        StandardFonts.HelveticaBold
      );

    const regularFont =
      await pdfDocument.embedFont(
        StandardFonts.Helvetica
      );

    // A4 in PDF points.
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Standard card: 85.6 × 54 mm.
    const cardWidth = 242.65;
    const cardHeight = 153.07;

    const marginX = 20;
    const gapX =
      pageWidth -
      marginX * 2 -
      cardWidth * 2;

    const marginY = 15;
    const gapY =
      (pageHeight -
        marginY * 2 -
        cardHeight * 5) /
      4;

    for (
      let cardIndex = 0;
      cardIndex < cards.length;
      cardIndex += 1
    ) {
      if (cardIndex % 10 === 0) {
        pdfDocument.addPage([
          pageWidth,
          pageHeight,
        ]);
      }

      const page =
        pdfDocument.getPages()[
          pdfDocument.getPageCount() - 1
        ];

      const position =
        cardIndex % 10;

      const column =
        position % 2;

      const row =
        Math.floor(position / 2);

      const x =
        marginX +
        column *
          (cardWidth + gapX);

      const y =
        pageHeight -
        marginY -
        cardHeight -
        row *
          (cardHeight + gapY);

      const card = cards[cardIndex];

      const cardUrl =
        `${SITE_ORIGIN}/card/` +
        encodeURIComponent(
          card.card_code
        );

      const qrDataUrl =
        await QRCode.toDataURL(
          cardUrl,
          {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 700,
            color: {
              dark: "#111111",
              light: "#FFFFFF",
            },
          }
        );

      const qrImage =
        await pdfDocument.embedPng(
          dataUrlToBytes(qrDataUrl)
        );

      // White, printer-friendly card.
      page.drawRectangle({
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(
          1,
          0.42,
          0
        ),
        borderWidth: 2,
      });

      // Orange top strip.
      page.drawRectangle({
        x,
        y:
          y +
          cardHeight -
          23,
        width: cardWidth,
        height: 23,
        color: rgb(
          1,
          0.42,
          0
        ),
      });

      page.drawText("NEXO", {
        x: x + 12,
        y:
          y +
          cardHeight -
          17,
        size: 14,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      page.drawText(
        "DIGITAL PASS",
        {
          x:
            x +
            cardWidth -
            83,
          y:
            y +
            cardHeight -
            15,
          size: 7,
          font: boldFont,
          color: rgb(1, 1, 1),
        }
      );

      const qrSize = 104;

      page.drawImage(qrImage, {
        x: x + 12,
        y: y + 15,
        width: qrSize,
        height: qrSize,
      });

      page.drawText(
        card.card_code,
        {
          x: x + 129,
          y: y + 79,
          size: 15,
          font: boldFont,
          color: rgb(
            0.08,
            0.08,
            0.08
          ),
        }
      );

      page.drawText(
        "Scan to open your secure card",
        {
          x: x + 129,
          y: y + 59,
          size: 7.2,
          font: regularFont,
          color: rgb(
            0.35,
            0.35,
            0.35
          ),
        }
      );

      page.drawText(
        "Secure  |  Private  |  Yours",
        {
          x: x + 129,
          y: y + 39,
          size: 7.5,
          font: boldFont,
          color: rgb(
            1,
            0.42,
            0
          ),
        }
      );

      page.drawText(
        batch.batch_code,
        {
          x: x + 129,
          y: y + 20,
          size: 6.5,
          font: regularFont,
          color: rgb(
            0.45,
            0.45,
            0.45
          ),
        }
      );

      // Light crop marks.
      const markLength = 5;
      const markColor = rgb(
        0.72,
        0.72,
        0.72
      );

      page.drawLine({
        start: {
          x: x - markLength,
          y,
        },
        end: { x, y },
        thickness: 0.5,
        color: markColor,
      });

      page.drawLine({
        start: {
          x: x + cardWidth,
          y,
        },
        end: {
          x:
            x +
            cardWidth +
            markLength,
          y,
        },
        thickness: 0.5,
        color: markColor,
      });
    }

    pdfDocument.setTitle(
      `NEXO ${batch.batch_code}`
    );

    pdfDocument.setSubject(
      `${cards.length} NEXO cards`
    );

    const pdfBytes =
      await pdfDocument.save();

    return new NextResponse(
      Buffer.from(pdfBytes),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",
          "Content-Disposition":
            `attachment; filename="${batch.batch_code}-NEXO-Cards.pdf"`,
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Generate batch PDF error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر إنشاء ملف الطباعة",
      },
      {
        status: 500,
      }
    );
  }
}
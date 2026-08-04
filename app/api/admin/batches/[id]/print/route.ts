import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  degrees,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  concatTransformationMatrix,
} from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";

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

// =====================================================
// NEXO PRINT SETTINGS — جميع القياسات بالمليمتر
// =====================================================

const SHEET_WIDTH_MM = 200;
const SHEET_HEIGHT_MM = 300;

// قياس القص النهائي للبطاقة
const CARD_WIDTH_MM = 93;
const CARD_HEIGHT_MM = 60;

const COLUMNS = 2;
const ROWS = 5;
const CARDS_PER_SHEET = COLUMNS * ROWS;

const MARGIN_X_MM = 1.5;
const MARGIN_Y_MM = 0;

const GAP_X_MM = 11;
const GAP_Y_MM = 0;

// تمديد خلفية التصميم باتجاه المنتصف
const INNER_BLEED_MM = 1.5;

// إعدادات QR
const QR_SIZE_MM = 22.6;
const QR_OFFSET_X_MM = 35.5;
const QR_OFFSET_Y_MM = 8.2;

// سحب QR الظاهر في الجهة اليمنى نحو اليسار
// لأن الصفحة معكوسة أفقيًا، نزيد X قبل الانعكاس
const RIGHT_VISIBLE_QR_SHIFT_MM = 1;

// إعداد رقم الورقة في المساحة الوسطية
const SHEET_LABEL_FONT_SIZE_PT = 10;

const CROP_MARK_LENGTH_MM = 2.5;
const CROP_MARK_GAP_MM = 0.8;
const CROP_MARK_THICKNESS = 0.35;

const MM_TO_POINTS = 72 / 25.4;

function mm(value: number) {
  return value * MM_TO_POINTS;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];

  if (!base64) {
    throw new Error("Invalid QR image");
  }

  return Uint8Array.from(
    Buffer.from(base64, "base64")
  );
}

async function loadImage(fileName: string) {
  const imagePath = path.join(
    process.cwd(),
    "public",
    "print",
    fileName
  );

  return fs.readFile(imagePath);
}

/**
 * إحداثيات القص الحقيقية للبطاقة.
 *
 * هذه الإحداثيات لا تتغير حتى يبقى:
 * - قياس البطاقة 93 × 60 ملم
 * - موضع علامات القص ثابتًا
 * - الوجه والظهر متطابقين
 */
function getCardPosition(position: number) {
  const column = position % COLUMNS;
  const row = Math.floor(position / COLUMNS);

  const cardWidth = mm(CARD_WIDTH_MM);
  const cardHeight = mm(CARD_HEIGHT_MM);
  const pageHeight = mm(SHEET_HEIGHT_MM);

  const x =
    mm(MARGIN_X_MM) +
    column * (cardWidth + mm(GAP_X_MM));

  const y =
    pageHeight -
    mm(MARGIN_Y_MM) -
    cardHeight -
    row * (cardHeight + mm(GAP_Y_MM));

  return {
    x,
    y,
    column,
    row,
  };
}

/**
 * تمديد صورة التصميم باتجاه المساحة الوسطية فقط.
 *
 * البطاقة الموجودة في العمود الأول:
 * تتمدد 1.5 ملم نحو اليمين.
 *
 * البطاقة الموجودة في العمود الثاني:
 * تتحرك 1.5 ملم نحو اليسار وتتمدد.
 *
 * علامات القص تبقى على قياس البطاقة الأصلي.
 */
function getArtworkBounds(
  position: number,
  x: number,
  y: number
) {
  const column = position % COLUMNS;

  const cardWidth = mm(CARD_WIDTH_MM);
  const cardHeight = mm(CARD_HEIGHT_MM);
  const innerBleed = mm(INNER_BLEED_MM);

  if (column === 0) {
    return {
      x,
      y,
      width: cardWidth + innerBleed,
      height: cardHeight,
    };
  }

  return {
    x: x - innerBleed,
    y,
    width: cardWidth + innerBleed,
    height: cardHeight,
  };
}

/**
 * حساب موضع QR.
 *
 * بسبب الانعكاس الأفقي الكامل:
 * العمود رقم 0 يظهر على يمين الصفحة بعد الانعكاس.
 *
 * لذلك نزيد X للعمود رقم 0 بمقدار 1 ملم،
 * فيظهر QR النهائي متحركًا إلى اليسار.
 */
function getQrPosition(
  x: number,
  y: number,
  column: number
) {
  const qrHorizontalAdjustment =
    column === 0
      ? RIGHT_VISIBLE_QR_SHIFT_MM
      : 0;

  return {
    x:
      x +
      mm(
        QR_OFFSET_X_MM +
          qrHorizontalAdjustment
      ),

    y:
      y +
      mm(QR_OFFSET_Y_MM),
  };
}

function drawCropMarks(
  page: PDFPage,
  x: number,
  y: number,
  cardWidth: number,
  cardHeight: number
) {
  const length = mm(CROP_MARK_LENGTH_MM);
  const gap = mm(CROP_MARK_GAP_MM);
  const color = rgb(0.55, 0.55, 0.55);

  const line = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    page.drawLine({
      start: {
        x: startX,
        y: startY,
      },
      end: {
        x: endX,
        y: endY,
      },
      thickness: CROP_MARK_THICKNESS,
      color,
    });
  };

  // الزاوية السفلية اليسرى
  line(
    x - gap - length,
    y,
    x - gap,
    y
  );

  line(
    x,
    y - gap - length,
    x,
    y - gap
  );

  // الزاوية السفلية اليمنى
  line(
    x + cardWidth + gap,
    y,
    x + cardWidth + gap + length,
    y
  );

  line(
    x + cardWidth,
    y - gap - length,
    x + cardWidth,
    y - gap
  );

  // الزاوية العلوية اليسرى
  line(
    x - gap - length,
    y + cardHeight,
    x - gap,
    y + cardHeight
  );

  line(
    x,
    y + cardHeight + gap,
    x,
    y + cardHeight + gap + length
  );

  // الزاوية العلوية اليمنى
  line(
    x + cardWidth + gap,
    y + cardHeight,
    x + cardWidth + gap + length,
    y + cardHeight
  );

  line(
    x + cardWidth,
    y + cardHeight + gap,
    x + cardWidth,
    y + cardHeight + gap + length
  );
}

/**
 * رسم رقم الورقة داخل الممر الأبيض الوسطي.
 *
 * رقم الوجه والظهر يكون واحدًا:
 *
 * الصفحة الأولى: SHEET 1
 * الصفحة الثانية: SHEET 1
 * الصفحة الثالثة: SHEET 2
 * الصفحة الرابعة: SHEET 2
 */
function drawSheetLabel(
  page: PDFPage,
  sheetNumber: number,
  pageWidth: number,
  pageHeight: number,
  font: PDFFont
) {
  const label =
    `SHEET ${sheetNumber}`;

  const labelWidth =
    font.widthOfTextAtSize(
      label,
      SHEET_LABEL_FONT_SIZE_PT
    );

  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;

  page.drawText(label, {
    x: centerX + mm(1.7),
    y: centerY - labelWidth / 2,
    size: SHEET_LABEL_FONT_SIZE_PT,
    font,
    color: rgb(0.18, 0.18, 0.18),
    rotate: degrees(90),
  });
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
          error: "معرّف الدفعة غير موجود",
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
      (cardsResult.data || []) as CardRecord[];

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

    const [
      frontImageBytes,
      backImageBytes,
    ] = await Promise.all([
      loadImage("card-front.png"),
      loadImage("card-back.png"),
    ]);

    const frontImage =
      await pdfDocument.embedPng(
        frontImageBytes
      );

    const backImage =
      await pdfDocument.embedPng(
        backImageBytes
      );

    const boldFont =
      await pdfDocument.embedFont(
        StandardFonts.HelveticaBold
      );

    const pageWidth =
      mm(SHEET_WIDTH_MM);

    const pageHeight =
      mm(SHEET_HEIGHT_MM);

    const cardWidth =
      mm(CARD_WIDTH_MM);

    const cardHeight =
      mm(CARD_HEIGHT_MM);

    const qrSize =
      mm(QR_SIZE_MM);

    let pageNumber = 1;

    for (
      let sheetStart = 0;
      sheetStart < cards.length;
      sheetStart += CARDS_PER_SHEET
    ) {
      const sheetCards =
        cards.slice(
          sheetStart,
          sheetStart + CARDS_PER_SHEET
        );

      // =================================================
      // الصفحة الأمامية
      // =================================================

      const frontPage =
        pdfDocument.addPage([
          pageWidth,
          pageHeight,
        ]);

      frontPage.pushOperators(
        pushGraphicsState()
      );

      // انعكاس أفقي كامل
      frontPage.pushOperators(
        concatTransformationMatrix(
          -1,
          0,
          0,
          1,
          pageWidth,
          0
        )
      );

      for (
        let position = 0;
        position < sheetCards.length;
        position += 1
      ) {
        const card =
          sheetCards[position];

        const {
          x,
          y,
          column,
        } = getCardPosition(position);

        const artwork =
          getArtworkBounds(
            position,
            x,
            y
          );

        frontPage.drawImage(
          frontImage,
          {
            x: artwork.x,
            y: artwork.y,
            width: artwork.width,
            height: artwork.height,
          }
        );

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

        const qrPosition =
          getQrPosition(
            x,
            y,
            column
          );

        frontPage.drawImage(
          qrImage,
          {
            x: qrPosition.x,
            y: qrPosition.y,
            width: qrSize,
            height: qrSize,
          }
        );

        drawCropMarks(
          frontPage,
          x,
          y,
          cardWidth,
          cardHeight
        );
      }

      frontPage.pushOperators(
        popGraphicsState()
      );

      // رقم الورقة يبقى غير معكوس
      drawSheetLabel(
        frontPage,
        pageNumber++,
        pageWidth,
        pageHeight,
        boldFont
      );

      // =================================================
      // الصفحة الخلفية
      // =================================================

      const backPage =
        pdfDocument.addPage([
          pageWidth,
          pageHeight,
        ]);

      backPage.pushOperators(
        pushGraphicsState()
      );

      // نفس الانعكاس الأفقي المستخدم في الوجه
      backPage.pushOperators(
        concatTransformationMatrix(
          -1,
          0,
          0,
          1,
          pageWidth,
          0
        )
      );

      for (
        let position = 0;
        position < sheetCards.length;
        position += 1
      ) {
        /*
         * مهم:
         * نفس البطاقة ونفس position المستخدمين
         * في صفحة الوجه.
         *
         * لذلك كل QR يقابله CARD ID الصحيح.
         */
        const card =
          sheetCards[position];

        const {
          x,
          y,
        } = getCardPosition(position);

        const artwork =
          getArtworkBounds(
            position,
            x,
            y
          );

        backPage.drawImage(
          backImage,
          {
            x: artwork.x,
            y: artwork.y,
            width: artwork.width,
            height: artwork.height,
          }
        );

        drawCropMarks(
          backPage,
          x,
          y,
          cardWidth,
          cardHeight
        );
      }

      backPage.pushOperators(
        popGraphicsState()
      );

      // نفس رقم ورقة الوجه
      drawSheetLabel(
        backPage,
        pageNumber++,
        pageWidth,
        pageHeight,
        boldFont
      );
    }

    pdfDocument.setTitle(
      `NEXO ${batch.batch_code}`
    );

    pdfDocument.setSubject(
      `${cards.length} NEXO cards`
    );

    pdfDocument.setCreator(
      "NEXO Digital Pass"
    );

    pdfDocument.setProducer(
      "NEXO Digital Pass"
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
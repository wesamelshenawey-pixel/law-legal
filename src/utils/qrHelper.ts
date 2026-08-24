import QRCode from "qrcode";

/**
 * Generate a QR Code Data URL string synchronously or asynchronously
 */
export async function generateQrDataUrl(text: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1.5,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      },
      errorCorrectionLevel: "M",
      ...options
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
    return "";
  }
}

/**
 * Standard formatted unique codes generator
 */
export function generateEntityCode(type: "CL" | "OP" | "CS" | "DOC" | "SES", indexOrRandom?: number): string {
  const currentYear = 2026;
  const num = indexOrRandom ?? Math.floor(1000 + Math.random() * 9000);
  const padded = num.toString().padStart(4, "0");
  return `${type}-${currentYear}-${padded}`;
}

/**
 * Generate verification payload for QR codes printed on official documents
 */
export function getDocumentQrPayload(docInfo: {
  title: string;
  code?: string;
  clientName?: string;
  caseNumber?: string;
  date?: string;
  lawyerName?: string;
}): string {
  const lawyer = docInfo.lawyerName || "الأستاذ وسام الشناوي المحامي بالنقض";
  return JSON.stringify({
    title: docInfo.title,
    ref: docInfo.code || generateEntityCode("DOC"),
    client: docInfo.clientName || "غير محدد",
    case: docInfo.caseNumber || "مستند رسمي عام",
    date: docInfo.date || new Date().toISOString().split("T")[0],
    office: lawyer,
    verifyUrl: `https://elshenawey-law.portal/verify?ref=${docInfo.code || "DOC"}`
  });
}

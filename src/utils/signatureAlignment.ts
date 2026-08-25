/**
 * Utility for Smart Auto-Alignment, Background Cleaning, and Bounding-Box Centering
 * for Legal Signatures in ClientSignatureConfirmationPortal.
 */

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface AlignmentOptions {
  targetWidth?: number;
  targetHeight?: number;
  padding?: number;
  alignment?: "center" | "baseline" | "top";
  scale?: number;
  removeWhiteBackground?: boolean;
  contrastEnhance?: boolean;
}

/**
 * Detects the tight bounding box of ink/strokes in an image Data URL
 */
export async function detectSignatureBoundingBox(
  dataUrl: string,
  alphaThreshold = 20,
  whiteThreshold = 240
): Promise<{ box: BoundingBox | null; image: HTMLImageElement; canvas: HTMLCanvasElement }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({ box: null, image: img, canvas });
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Check if pixel is ink (not fully transparent and not pure white)
          const isTransparent = a < alphaThreshold;
          const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;

          if (!isTransparent && !isWhite) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX === Infinity || minY === Infinity || maxX < minX || maxY < minY) {
        resolve({ box: null, image: img, canvas });
        return;
      }

      resolve({
        box: {
          minX,
          minY,
          maxX,
          maxY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        },
        image: img,
        canvas
      });
    };
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

/**
 * Smart Auto-Align: Crops out excess padding and centers the signature with optical balance
 */
export async function smartAutoAlignSignature(
  dataUrl: string,
  options: AlignmentOptions = {}
): Promise<string> {
  const {
    targetWidth = 600,
    targetHeight = 220,
    padding = 24,
    alignment = "center",
    scale = 1.0,
    removeWhiteBackground = true,
    contrastEnhance = false
  } = options;

  try {
    const { box, image, canvas: sourceCanvas } = await detectSignatureBoundingBox(dataUrl);

    if (!box) {
      // If no ink detected, return original
      return dataUrl;
    }

    const destCanvas = document.createElement("canvas");
    destCanvas.width = targetWidth;
    destCanvas.height = targetHeight;
    const destCtx = destCanvas.getContext("2d");

    if (!destCtx) return dataUrl;

    // Available inner drawing area
    const availW = Math.max(50, targetWidth - padding * 2);
    const availH = Math.max(30, targetHeight - padding * 2);

    // Calculate scale factor preserving aspect ratio
    const scaleX = availW / box.width;
    const scaleY = availH / box.height;
    const fitScale = Math.min(scaleX, scaleY) * scale;

    const renderW = box.width * fitScale;
    const renderH = box.height * fitScale;

    // Horizontal centering
    const destX = (targetWidth - renderW) / 2;

    // Vertical placement according to alignment mode
    let destY = (targetHeight - renderH) / 2;
    if (alignment === "baseline") {
      destY = targetHeight - padding - renderH;
    } else if (alignment === "top") {
      destY = padding;
    }

    destCtx.imageSmoothingEnabled = true;
    destCtx.imageSmoothingQuality = "high";

    // Draw cropped portion from source to destination centered
    destCtx.drawImage(
      sourceCanvas,
      box.minX,
      box.minY,
      box.width,
      box.height,
      destX,
      destY,
      renderW,
      renderH
    );

    // Optional background transparency cleanup (e.g. converting white paper scans to transparent ink)
    if (removeWhiteBackground) {
      const imgData = destCtx.getImageData(0, 0, targetWidth, targetHeight);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // If near white background, fade or make transparent
        if (brightness > 225) {
          d[i + 3] = 0; // Transparent
        } else if (brightness > 190) {
          // Soft alpha feathering
          const alphaFactor = (225 - brightness) / 35;
          d[i + 3] = Math.round(d[i + 3] * alphaFactor);
        } else if (contrastEnhance && d[i + 3] > 30) {
          // Slightly deepen dark ink for clarity
          d[i] = Math.max(0, r - 30);
          d[i + 1] = Math.max(0, g - 30);
          d[i + 2] = Math.max(0, b - 20);
        }
      }
      destCtx.putImageData(imgData, 0, 0);
    }

    return destCanvas.toDataURL("image/png");
  } catch (err) {
    console.error("Smart Auto-Alignment error:", err);
    return dataUrl;
  }
}

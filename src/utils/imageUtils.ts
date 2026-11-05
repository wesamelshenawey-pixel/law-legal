export const checkIs3x4Ratio = (srcOrBase64: string): Promise<{ is3x4: boolean; ratio: number; width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const targetRatio = 3 / 4; // 0.75
      // allow small margin of error (0.05)
      const is3x4 = Math.abs(ratio - targetRatio) < 0.05;
      resolve({ is3x4, ratio, width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ is3x4: true, ratio: 0.75, width: 600, height: 800 });
    };
    img.src = srcOrBase64;
  });
};

export const cropBase64To3x4 = (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const targetRatio = 3 / 4;
      const imgRatio = img.width / img.height;

      let drawWidth = img.width;
      let drawHeight = img.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > targetRatio) {
        drawWidth = img.height * targetRatio;
        offsetX = (img.width - drawWidth) / 2;
      } else {
        drawHeight = img.width / targetRatio;
        offsetY = (img.height - drawHeight) / 2;
      }

      canvas.width = 600;
      canvas.height = 800;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          drawWidth,
          drawHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };
    img.onerror = reject;
    img.src = base64;
  });
};

export const cropTo3x4Portrait = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetRatio = 3 / 4;
        const imgRatio = img.width / img.height;

        let drawWidth = img.width;
        let drawHeight = img.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > targetRatio) {
          // Image is wider than 3:4, crop horizontally
          drawWidth = img.height * targetRatio;
          offsetX = (img.width - drawWidth) / 2;
        } else {
          // Image is taller than 3:4, crop vertically
          drawHeight = img.width / targetRatio;
          offsetY = (img.height - drawHeight) / 2;
        }

        // Set output resolution to standard portrait size 600x800
        canvas.width = 600;
        canvas.height = 800;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight, // Source rectangle
            0,
            0,
            canvas.width,
            canvas.height // Destination rectangle
          );
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

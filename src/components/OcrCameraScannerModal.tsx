import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, X, Check, Image as ImageIcon, Sparkles } from "lucide-react";

interface OcrCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64: string, name: string) => void;
}

export default function OcrCameraScannerModal({
  isOpen,
  onClose,
  onCapture
}: OcrCameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedPhoto(dataUrl);
    }
    setIsProcessing(false);
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      const fileName = `لقطة_كاميرا_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jpg`;
      onCapture(capturedPhoto, fileName);
      setCapturedPhoto(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2 text-amber-400">
            <Camera className="w-5 h-5" />
            <h3 className="text-sm font-black text-white">الماسح الضوئي الحي بكاميرا الجهاز</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative bg-black min-h-[360px] max-h-[500px] flex items-center justify-center overflow-hidden">
          {capturedPhoto ? (
            <img src={capturedPhoto} alt="Captured preview" className="w-full h-full object-contain max-h-[460px]" />
          ) : hasPermission === false ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <Camera className="w-12 h-12 mx-auto text-red-400" />
              <p className="text-sm font-bold text-slate-200">تعذر الوصول إلى كاميرا الجهاز</p>
              <p className="text-xs text-slate-400">يرجى التأكد من منح إذن الكاميرا في إعدادات المتصفح أو الجهاز.</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[460px]"
              />
              {/* Document Alignment Frame Overlay */}
              <div className="absolute inset-6 border-2 border-dashed border-amber-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <span className="text-[11px] font-bold bg-slate-950/70 text-amber-400 px-2 py-0.5 rounded-md self-center">
                  قم بمحاذاة أوراق المستند داخل الإطار
                </span>
                <span className="text-[10px] text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded-md self-center">
                  تأكد من وضوح الإضاءة واستقامة المستند
                </span>
              </div>
            </>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          {capturedPhoto ? (
            <div className="flex items-center justify-between w-full gap-3">
              <button
                onClick={handleRetake}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة الالتقاط</span>
              </button>
              <button
                onClick={handleConfirmPhoto}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد المستند وإضافته للفحص</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={toggleCameraFacing}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="تبديل الكاميرا (الأمامية / الخلفية)"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">تبديل الكاميرا</span>
              </button>

              <button
                onClick={takeSnapshot}
                disabled={hasPermission === false || isProcessing}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl text-sm font-black transition shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                <span>التقاط الصورة الآن</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

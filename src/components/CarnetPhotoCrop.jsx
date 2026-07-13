import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, RotateCcw, Check, X, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { traducirError } from '../utils/traducirError';

const createCroppedImage = (imageSrc, croppedAreaPixels) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // evita canvas taint desde origen cruzado (localhost:8080 → :5173)
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0,
        croppedAreaPixels.width, croppedAreaPixels.height
      );
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('canvas vacío'));
        const file = new File([blob], 'foto-carnet-crop.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.92);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });

/**
 * @param {object}   props
 * @param {number}   props.jugadorId
 * @param {string}   props.token
 * @param {string}   props.apiBase        e.g. http://localhost:8080/api
 * @param {string}   props.serverUrl      e.g. http://localhost:8080
 * @param {Function} props.onCropComplete (croppedFile: File) => void
 */
export default function CarnetPhotoCrop({ jugadorId, token, apiBase, serverUrl, onCropComplete }) {
  const fileRef = useRef(null);

  // step: idle | processing | cropping | done
  const [step, setStep]                   = useState('idle');
  const [processedUrl, setProcessedUrl]   = useState(null); // URL absoluta del img procesado
  const [preview, setPreview]             = useState(null); // objectURL del recorte final
  const [error, setError]                 = useState(null);

  // react-easy-crop state
  const [crop, setCrop]   = useState({ x: 0, y: 0 });
  const [zoom, setZoom]   = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteInternal = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setError(null);
    setStep('processing');
    setProcessedUrl(null);
    setPreview(null);

    try {
      const fd = new FormData();
      fd.append('foto', file);
      if (jugadorId) fd.append('id_jugador', jugadorId);

      const res = await fetch(`${apiBase}/carnets/procesar-foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error al procesar');

      // Agregar timestamp para evitar caché del navegador
      setProcessedUrl(`${serverUrl}${data.url}?t=${Date.now()}`);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setStep('cropping');
    } catch (err) {
      setError(traducirError(err.message));
      setStep('idle');
    }
  };

  const handleConfirmCrop = async () => {
    if (!croppedAreaPixels || !processedUrl) return;
    setStep('processing');
    try {
      const croppedFile = await createCroppedImage(processedUrl, croppedAreaPixels);

      // Preview local
      const objUrl = URL.createObjectURL(croppedFile);
      setPreview(objUrl);
      setStep('done');

      onCropComplete(croppedFile);
    } catch (err) {
      console.error('[CarnetCrop] error al recortar:', err);
      setError(err?.message?.includes('tainted') || err?.name === 'SecurityError'
        ? 'Error de seguridad del canvas. Recargá la página e intentá de nuevo.'
        : 'Error al recortar la imagen. Intentá de nuevo.');
      setStep('cropping');
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setStep('idle');
    setProcessedUrl(null);
    setPreview(null);
    setError(null);
    onCropComplete(null);
  };

  /* ── Idle: botón de subir ─────────────────────────────── */
  if (step === 'idle') return (
    <div className="pt-2">
      <p className="text-lg sm:text-base font-bold text-gray-700 sm:text-gray-600 mb-3 sm:mb-2">
        Foto del Carnet (opcional)
      </p>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
      >
        <Upload size={28} className="text-gray-400" />
        <span className="text-sm text-gray-500">Seleccionar foto del jugador</span>
        <span className="text-xs text-gray-400">Se procesará automáticamente (fondo blanco + escudo)</span>
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );

  /* ── Processing: spinner ──────────────────────────────── */
  if (step === 'processing') return (
    <div className="pt-2">
      <p className="text-lg sm:text-base font-bold text-gray-700 mb-3">Foto del Carnet</p>
      <div className="flex flex-col items-center gap-3 py-8 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
        <span className="text-sm text-blue-600 font-medium">Procesando imagen...</span>
        <span className="text-xs text-blue-400">Eliminando fondo y aplicando escudo del club</span>
      </div>
    </div>
  );

  /* ── Done: thumbnail + botón cambiar ─────────────────── */
  if (step === 'done') return (
    <div className="pt-2">
      <p className="text-lg sm:text-base font-bold text-blue-600 mb-3">Foto del Carnet</p>
      <div className="flex items-center gap-4 p-3 border border-blue-200 rounded-xl bg-blue-50">
        <img
          src={preview}
          alt="Foto carnet"
          className="w-20 h-24 object-cover rounded-lg border border-blue-200 shadow-sm"
          style={{ aspectRatio: '3/4' }}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700">Foto procesada y recortada</p>
          <p className="text-xs text-gray-500 mt-1">Fondo blanco + escudo del club aplicado</p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <RotateCcw size={13} /> Cambiar foto
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Cropping: modal centrado ────────────────────────── */
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-gray-900 rounded-2xl w-full max-w-xs flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
          <span className="text-white font-semibold text-sm">Encuadrar foto</span>
          <button type="button" onClick={reset} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Área de crop — altura fija para react-easy-crop */}
        <div className="relative" style={{ height: 280 }}>
          <Cropper
            image={processedUrl}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteInternal}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: { background: '#1a1a2e' },
              cropAreaStyle:  { border: '2px solid #38bdf8' },
            }}
          />
        </div>

        {/* Controles */}
        <div className="px-4 py-3 bg-gray-900">
          <div className="flex items-center gap-2 mb-3">
            <ZoomOut size={14} className="text-gray-500 shrink-0" />
            <input
              type="range"
              min={1} max={3} step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-sky-400 h-1"
            />
            <ZoomIn size={14} className="text-gray-500 shrink-0" />
          </div>

          {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-xs font-medium transition-colors"
            >
              <X size={13} /> Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmCrop}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors"
            >
              <Check size={13} /> Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

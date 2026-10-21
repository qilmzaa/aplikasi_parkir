import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Loader2,
  RefreshCw,
  ScanLine,
} from 'lucide-react';
import Modal from './Modal';
import { Button, Select } from './ui';

const SCAN_HINTS = new Map();
SCAN_HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
SCAN_HINTS.set(DecodeHintType.TRY_HARDER, true);

function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 920;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);

    window.setTimeout(() => {
      const closing = context.close?.();
      if (closing?.catch) closing.catch(() => {});
    }, 350);
  } catch {
    // Suara hanya umpan balik tambahan; abaikan jika browser memblokir audio.
  }
}

function describeCameraError(error) {
  const name = error?.name || '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Izin kamera ditolak. Klik ikon kamera di address bar browser, pilih "Izinkan", lalu coba lagi.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Kamera tidak ditemukan. Pastikan webcam terpasang dan tidak dinonaktifkan di pengaturan Windows.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Kamera sedang dipakai aplikasi lain (Zoom, Teams, atau browser lain). Tutup aplikasi tersebut lalu coba lagi.';
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'Kamera yang dipilih tidak mendukung mode yang diminta. Pilih kamera lain atau gunakan kamera default.';
  }
  if (name === 'AbortError') {
    return 'Akses kamera dibatalkan. Silakan coba lagi.';
  }

  return error?.message || 'Kamera gagal dibuka. Periksa izin kamera dan perangkat Anda.';
}

/**
 * Modal pemindai barcode lewat kamera/webcam.
 * Barcode yang terdeteksi langsung dikirim ke parent untuk diproses ke API scan.
 */
export default function CameraScannerModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const detectedRef = useRef(false);
  const requestedDeviceRef = useRef('');
  const onDetectedRef = useRef(onDetected);

  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [restartKey, setRestartKey] = useState(0);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [lastCode, setLastCode] = useState('');

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    const video = videoRef.current;
    detectedRef.current = false;
    setStarting(true);
    setReady(false);
    setError('');
    setLastCode('');

    const timer = window.setTimeout(startCamera, 140);

    async function startCamera() {
      if (cancelled) return;

      if (!window.isSecureContext) {
        setStarting(false);
        setError('Akses kamera hanya tersedia melalui HTTPS atau http://localhost. Buka aplikasi di http://localhost:5173.');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setStarting(false);
        setError('Browser ini tidak mendukung akses kamera. Gunakan Chrome atau Edge versi terbaru.');
        return;
      }

      const requestedId = requestedDeviceRef.current;
      const constraints = requestedId
        ? {
          video: {
            deviceId: { exact: requestedId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }
        : {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

      try {
        const reader = new BrowserMultiFormatReader(SCAN_HINTS, {
          delayBetweenScanAttempts: 120,
          delayBetweenScanSuccess: 400,
        });

        const controls = await reader.decodeFromConstraints(constraints, video, (result, _error, control) => {
          if (cancelled || detectedRef.current) return;
          if (!result) return;

          const raw = (result.getText() || '').trim();
          if (!raw) return;

          detectedRef.current = true;
          setLastCode(raw);
          setReady(false);
          playBeep();
          navigator.vibrate?.(60);

          try {
            control?.stop?.();
          } catch {
            // Stream sudah berhenti.
          }

          window.setTimeout(() => {
            if (!cancelled) onDetectedRef.current?.(raw);
          }, 240);
        });

        if (cancelled) {
          try {
            controls.stop();
          } catch {
            // Abaikan jika stream sudah berhenti.
          }
          return;
        }

        controlsRef.current = controls;
        setStarting(false);
        setReady(true);

        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          if (cancelled) return;

          const cameras = allDevices
            .filter((device) => device.kind === 'videoinput')
            .map((device, index) => ({
              id: device.deviceId,
              label: device.label || `Kamera ${index + 1}`,
            }));
          setDevices(cameras);

          const activeTrack = video?.srcObject?.getVideoTracks?.()[0];
          const activeId = activeTrack?.getSettings?.().deviceId;
          if (activeId) {
            setDeviceId((current) => current || activeId);
            if (!requestedDeviceRef.current) requestedDeviceRef.current = activeId;
          }
        } catch {
          // Daftar kamera bersifat opsional; kamera default tetap dapat dipakai.
        }
      } catch (cameraError) {
        if (cancelled) return;
        setStarting(false);
        setReady(false);
        setError(describeCameraError(cameraError));
      }
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);

      const controls = controlsRef.current;
      controlsRef.current = null;
      try {
        controls?.stop?.();
      } catch {
        // Abaikan jika stream sudah berhenti.
      }

      const stream = video?.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
    };
  }, [open, restartKey]);

  function retry(nextDeviceId = requestedDeviceRef.current) {
    requestedDeviceRef.current = nextDeviceId;
    setDeviceId(nextDeviceId);
    setRestartKey((current) => current + 1);
  }

  function handleDeviceChange(event) {
    retry(event.target.value);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Scan dengan Kamera"
      description="Arahkan kamera ke barcode kendaraan atau barcode tiket pada struk."
      size="md"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
          <Button variant="secondary" onClick={() => retry()} disabled={starting}>
            <RefreshCw size={16} />
            Coba Lagi
          </Button>
        </>
      )}
    >
      <div className="space-y-3.5">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {ready && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="relative h-[42%] w-[78%] max-w-sm">
                <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-emerald-400" />
                <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-emerald-400" />
                <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-emerald-400" />
                <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-emerald-400" />
                <span className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
              </div>
            </div>
          )}

          {(starting || (!ready && !error && !lastCode)) && (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/70 px-6 text-center text-white">
              <div>
                <Loader2 size={28} className="mx-auto animate-spin text-emerald-400" />
                <p className="mt-2 text-sm font-bold">Membuka kamera...</p>
                <p className="mt-1 text-[11px] text-slate-300">Izinkan akses kamera jika browser meminta.</p>
              </div>
            </div>
          )}

          {error && !starting && (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/85 px-6 text-center text-white">
              <div>
                <CameraOff size={30} className="mx-auto text-rose-400" />
                <p className="mt-2 text-sm font-bold">Kamera tidak aktif</p>
                <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-300">{error}</p>
              </div>
            </div>
          )}

          {lastCode && (
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-emerald-500 px-3 py-2 text-center text-sm font-bold text-white shadow-lg">
              Terdeteksi: <span className="font-mono tracking-wider">{lastCode}</span>
            </div>
          )}

          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/15 backdrop-blur">
            <Camera size={12} />
            Kamera
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Kamera tidak dapat digunakan</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <label htmlFor="camera-device" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Camera size={14} />
            Pilih kamera
          </label>
          <Select
            id="camera-device"
            value={deviceId}
            onChange={handleDeviceChange}
            disabled={starting || devices.length < 1}
            className="h-10 w-full text-xs sm:max-w-[280px]"
          >
            <option value="">Kamera default (belakang)</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>{device.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <ScanLine size={15} className="mt-0.5 shrink-0 text-emerald-500" />
          <p>
            Posisikan barcode di dalam kotak. Cahaya cukup, kamera tidak goyang, dan barcode tidak terlipat.
            Setelah terbaca, transaksi langsung diproses tanpa perlu menekan tombol.
          </p>
        </div>
      </div>
    </Modal>
  );
}

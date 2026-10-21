import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CarFront,
  CheckCircle2,
  Keyboard,
  ReceiptText,
  ScanLine,
  Ticket,
  Wallet,
} from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, formatRupiah, JENIS_LABEL } from '../../lib/format';
import Barcode from '../../components/Barcode';
import ReceiptModal from '../../components/ReceiptModal';
import { Badge, Button, Card } from '../../components/ui';
import { cn } from '../../lib/cn';

const CameraScannerModal = lazy(() => import('../../components/CameraScannerModal'));

/** Halaman scan barcode: kendaraan masuk dan tiket keluar otomatis. */
export default function ScanParkirPage() {
  const toast = useToast();
  const inputRef = useRef(null);
  const processingRef = useRef(false);
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function focusInput() {
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function processCode(rawValue) {
    const value = String(rawValue || '').trim();
    if (!value || processingRef.current || receiptOpen) return;

    processingRef.current = true;
    setCode(value);
    setScanning(true);
    setError('');
    let openedReceipt = false;

    try {
      const response = await api.post('/transaksi/scan', { kode: value });
      const result = response.data.data;
      setLastResult(result);
      setHistory((current) => [result, ...current].slice(0, 6));
      setReceipt(result.transaksi);
      setReceiptOpen(true);
      openedReceipt = true;
      setCode('');
      toast.success(
        response.data.message,
        result.mode === 'masuk' ? 'Kendaraan masuk' : 'Kendaraan keluar',
      );
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Barcode gagal diproses.');
      setError(message);
      toast.error(message);
      inputRef.current?.select();
    } finally {
      processingRef.current = false;
      setScanning(false);
      if (!openedReceipt) focusInput();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (cameraOpen) return;
    processCode(code);
  }

  function handleCameraDetected(value) {
    setCameraOpen(false);
    processCode(value);
  }

  function closeReceipt() {
    setReceiptOpen(false);
    focusInput();
  }

  function closeCamera() {
    setCameraOpen(false);
    focusInput();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Scan Barcode Parkir</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Scan barcode kendaraan untuk masuk, atau barcode tiket untuk keluar. Data langsung tersimpan ke database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/petugas/masuk" className="btn btn-secondary h-10 px-4">
            <Keyboard size={16} />
            Input Manual
          </Link>
          <Link to="/petugas/aktif" className="btn btn-secondary h-10 px-4">
            <CarFront size={16} />
            Kendaraan Aktif
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-cyan-900 px-6 py-6 text-white shadow-soft sm:px-8 sm:py-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-white/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            Scanner siap
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <ScanLine size={25} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">Arahkan scanner ke barcode</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-emerald-100/75">
                Scanner USB mode keyboard akan mengirim kode lalu menekan Enter secara otomatis.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <ScanLine size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError('');
                }}
                placeholder="Scan / ketik barcode di sini..."
                autoFocus
                autoComplete="off"
                spellCheck={false}
                aria-label="Kode barcode"
                className="input h-14 w-full border-0 bg-white pl-12 pr-4 font-mono text-base font-bold tracking-wider text-slate-900 shadow-lg placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:ring-4 focus:ring-white/20 dark:bg-white dark:text-slate-900"
              />
            </div>
            <div className="flex gap-2.5">
              <Button
                type="submit"
                size="lg"
                loading={scanning}
                disabled={!code.trim()}
                className="h-14 flex-1 shrink-0 bg-white px-6 text-emerald-800 shadow-lg hover:bg-emerald-50 sm:flex-none"
              >
                {!scanning && <ArrowRight size={18} />}
                Proses
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => setCameraOpen(true)}
                disabled={scanning || receiptOpen}
                className="h-14 flex-1 shrink-0 bg-white/10 px-5 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20 disabled:opacity-50 sm:flex-none"
              >
                <Camera size={18} />
                Kamera
              </Button>
            </div>
          </form>

          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-100/65">
            <Keyboard size={13} />
            Scanner USB atau ketik manual lalu Enter. Klik <span className="font-semibold text-emerald-100">Kamera</span>
            {' '}untuk scan lewat webcam/kamera HP.
          </p>
          <p className="mt-1 text-[11px] text-emerald-100/65">
            Contoh valid: <span className="font-mono font-bold text-emerald-100">B 1234 XYZ</span> (barcode kendaraan)
            atau <span className="font-mono font-bold text-emerald-100">PKR-000001</span> (barcode tiket pada struk).
          </p>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Barcode tidak dapat diproses</p>
            <p className="mt-0.5 text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ScanLine size={19} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Kendaraan Masuk</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Barcode label kendaraan</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Scan barcode berisi <span className="font-semibold">plat nomor</span>. Area dipilih otomatis sesuai jenis
            kendaraan dan sisa kapasitas.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Ticket size={19} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Tiket Keluar</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Barcode pada struk</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Scan barcode <span className="font-mono font-semibold">PKR-000001</span> pada struk. Durasi, biaya, dan
            pengurangan kapasitas diproses otomatis.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Camera size={19} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Kamera atau Manual?</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Dua cara cadangan</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Klik tombol <span className="font-semibold">Kamera</span> di atas untuk memindai lewat webcam/kamera HP,
            atau ketik kode barcode secara manual lalu tekan Enter.
          </p>
        </Card>
      </div>

      {lastResult && (
        <Card className={cn(
          'p-5',
          lastResult.mode === 'masuk'
            ? 'border-emerald-200 dark:border-emerald-500/20'
            : 'border-amber-200 dark:border-amber-500/20',
        )}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                lastResult.mode === 'masuk'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
              )}>
                {lastResult.mode === 'masuk' ? <CarFront size={21} /> : <CheckCircle2 size={21} />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={lastResult.mode === 'masuk' ? 'emerald' : 'amber'} dot>
                    {lastResult.mode === 'masuk' ? 'Masuk' : 'Keluar'}
                  </Badge>
                  <span className="font-mono text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
                    {lastResult.transaksi.plat_nomor}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {JENIS_LABEL[lastResult.transaksi.jenis_kendaraan] || lastResult.transaksi.jenis_kendaraan}
                  {' · '}{lastResult.transaksi.nama_area}
                  {' · '}{formatDateTime(lastResult.transaksi.waktu_masuk)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Kode tiket: <span className="font-mono font-bold">{lastResult.transaksi.kode_tiket}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {lastResult.mode === 'keluar' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total bayar</p>
                  <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatRupiah(lastResult.transaksi.biaya_total)}
                  </p>
                </div>
              )}
              <Button variant="secondary" onClick={() => setReceiptOpen(true)}>
                <ReceiptText size={16} />
                Lihat Struk
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-[220px_1fr] sm:items-center">
            <div className="rounded-xl border border-slate-200 bg-white p-2">
              <Barcode value={lastResult.transaksi.kode_tiket} height={42} width={1.3} fontSize={9} displayValue={false} />
              <p className="text-center font-mono text-[10px] font-bold text-slate-600">{lastResult.transaksi.kode_tiket}</p>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {lastResult.mode === 'masuk'
                ? 'Simpan / cetak struk ini. Barcode tiket dipakai petugas untuk memproses kendaraan keluar.'
                : 'Transaksi sudah tersimpan. Kapasitas area telah dikurangi otomatis dan log aktivitas tercatat.'}
            </p>
          </div>
        </Card>
      )}

      {history.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white">Riwayat Scan Sesi Ini</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Enam pemindaian terakhir pada halaman ini.</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((item, index) => (
              <div key={`${item.transaksi.id_parkir}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg',
                    item.mode === 'masuk'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
                  )}>
                    {item.mode === 'masuk' ? <CarFront size={15} /> : <CheckCircle2 size={15} />}
                  </span>
                  <div>
                    <p className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-100">{item.transaksi.plat_nomor}</p>
                    <p className="text-[10px] text-slate-400">{item.kode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.mode === 'keluar' && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(item.transaksi.biaya_total)}
                    </span>
                  )}
                  <Badge variant={item.mode === 'masuk' ? 'emerald' : 'amber'}>
                    {item.mode === 'masuk' ? 'Masuk' : 'Keluar'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-start gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-relaxed text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
        <Wallet size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">Cara mencetak barcode kendaraan</p>
          <p className="mt-1 text-indigo-600/80 dark:text-indigo-300/80">
            Admin membuka menu <span className="font-semibold">Kendaraan</span> lalu menekan ikon barcode pada baris
            kendaraan. Cetak label dan tempelkan pada kendaraan atau kartu parkir.
          </p>
        </div>
      </div>

      <ReceiptModal open={receiptOpen} onClose={closeReceipt} receipt={receipt} />

      <Suspense
        fallback={(
          <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-xl dark:bg-slate-900 dark:text-slate-100">
              Menyiapkan kamera...
            </div>
          </div>
        )}
      >
        {cameraOpen && (
          <CameraScannerModal
            open={cameraOpen}
            onClose={closeCamera}
            onDetected={handleCameraDetected}
          />
        )}
      </Suspense>
    </div>
  );
}

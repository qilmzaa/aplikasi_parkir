import { useState } from 'react';
import { Hash, Info, Printer, ReceiptText, Search } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { ReceiptCard } from '../../components/ReceiptModal';
import { Button, Card, EmptyState, Field, Input, StatusBadge } from '../../components/ui';

export default function SearchReceiptPage() {
  const toast = useToast();
  const [id, setId] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(event) {
    event.preventDefault();
    setError('');
    setReceipt(null);
    setSearched(false);

    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError('Masukkan ID parkir berupa angka positif.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/transaksi/${parsed}/struk`);
      setReceipt(response.data.data);
      setSearched(true);
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Struk tidak ditemukan.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrint() {
    if (!receipt) return;
    setPrinting(true);
    try {
      await api.post(`/transaksi/${receipt.id_parkir}/cetak`);
      toast.success('Aktivitas cetak struk berhasil dicatat.');
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Gagal mencatat aktivitas cetak.'));
    } finally {
      setPrinting(false);
      setTimeout(() => window.print(), 80);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Cari & Cetak Struk</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Masukkan ID parkir untuk menampilkan kembali struk transaksi.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <ReceiptText size={21} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white">Pencarian Struk</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  ID parkir tercantum pada struk atau tabel kendaraan.
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="ID Parkir" htmlFor="id-parkir" className="flex-1" required>
                <div className="relative">
                  <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="id-parkir"
                    type="number"
                    min="1"
                    value={id}
                    onChange={(event) => setId(event.target.value)}
                    placeholder="Contoh: 6"
                    className="pl-10"
                  />
                </div>
              </Field>
              <Button type="submit" loading={loading} className="h-[42px] sm:mb-0">
                {!loading && <Search size={16} />}
                Cari Struk
              </Button>
            </form>

            {error && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            )}
          </Card>

          {!receipt && !searched && (
            <Card>
              <EmptyState
                icon={ReceiptText}
                title="Belum ada struk ditampilkan"
                description="Masukkan ID parkir di atas untuk melihat rincian transaksi dan mencetak struk."
              />
            </Card>
          )}

          {receipt && (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <StatusBadge status={receipt.status} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Transaksi #{receipt.id_parkir}</span>
                </div>
                <Button onClick={handlePrint} loading={printing}>
                  <Printer size={16} />
                  Cetak
                </Button>
              </div>
              <div className="bg-slate-50/50 p-5 dark:bg-slate-950/20">
                <ReceiptCard receipt={receipt} />
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-extrabold text-slate-900 dark:text-white">Panduan Cetak</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
              {[
                'Cari ID parkir pada tabel kendaraan aktif atau struk sebelumnya.',
                'Masukkan ID lalu klik Cari Struk.',
                'Periksa plat nomor, durasi, dan total biaya.',
                'Klik Cetak untuk membuka dialog print browser.',
              ].map((text, index) => (
                <li key={text} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-indigo-50 text-[10px] font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ol>
          </Card>

          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <Info size={16} className="mt-0.5 shrink-0" />
            Gunakan ukuran kertas 80mm pada dialog print untuk hasil struk yang optimal. Setiap aktivitas cetak tercatat di log.
          </div>
        </div>
      </div>
    </div>
  );
}

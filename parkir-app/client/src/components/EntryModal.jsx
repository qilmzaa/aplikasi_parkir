import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import Modal from './Modal';
import EntryForm from './EntryForm';
import { Button, Skeleton } from './ui';

/** Modal transaksi masuk; memuat opsi kendaraan/area/tarif saat dibuka. */
export default function EntryModal({ open, onClose, onSuccess }) {
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadOptions() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/transaksi/opsi');
      setOptions(response.data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Gagal memuat data kendaraan dan area.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadOptions();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kendaraan Masuk"
      description="Catat kendaraan baru yang akan memasuki area parkir."
      size="md"
    >
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-28" />
          <Skeleton className="h-10 w-40 self-end" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={loadOptions}>
            <RefreshCw size={14} /> Coba lagi
          </Button>
        </div>
      )}

      {!loading && !error && options && (
        <EntryForm
          options={options}
          onCancel={onClose}
          onSuccess={(receipt) => {
            onSuccess?.(receipt);
            onClose?.();
            loadOptions();
          }}
        />
      )}
    </Modal>
  );
}

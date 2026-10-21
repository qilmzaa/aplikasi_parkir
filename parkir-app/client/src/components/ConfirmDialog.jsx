import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { Button } from './ui';

/** Dialog konfirmasi reusable, dipakai untuk hapus dan aksi penting. */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message = 'Data yang dihapus tidak dapat dikembalikan.',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  loading = false,
  tone = 'danger',
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelText}</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </>
      )}
    >
      <div className="flex gap-4">
        <div className={
          tone === 'danger'
            ? 'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
            : 'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400'
        }>
          <AlertTriangle size={24} />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { Bike, Car, CarFront, Pencil, Plus, ScanLine, Trash2, Truck } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import useDataTable from '../../hooks/useDataTable';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import BarcodeLabelModal from '../../components/BarcodeLabelModal';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  IconButton,
  Input,
  Select,
} from '../../components/ui';

const EMPTY_FORM = {
  plat_nomor: '',
  jenis_kendaraan: 'motor',
  warna: '',
  pemilik: '',
  id_user: '',
};

const JENIS_ICON = { motor: Bike, mobil: Car, lainnya: Truck };
const JENIS_BADGE = { motor: 'emerald', mobil: 'indigo', lainnya: 'amber' };

export default function KendaraanPage() {
  const toast = useToast();
  const table = useDataTable('/kendaraan', { defaultSort: 'id_kendaraan', defaultOrder: 'desc' });
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [barcodeTarget, setBarcodeTarget] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/users', { params: { limit: 100, sort: 'nama_lengkap', order: 'asc' } })
      .then((response) => {
        if (active) setUsers(response.data.data || []);
      })
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error, 'Gagal memuat daftar user.'));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, id_user: users[0]?.id_user ? String(users[0].id_user) : '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      plat_nomor: row.plat_nomor,
      jenis_kendaraan: row.jenis_kendaraan,
      warna: row.warna,
      pemilik: row.pemilik,
      id_user: String(row.id_user),
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!form.plat_nomor.trim() || !form.warna.trim() || !form.pemilik.trim() || !form.id_user) {
      setFormError('Semua field bertanda wajib harus diisi.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        plat_nomor: form.plat_nomor.trim().toUpperCase(),
        warna: form.warna.trim(),
        pemilik: form.pemilik.trim(),
        id_user: Number(form.id_user),
      };
      if (editing) {
        await api.put(`/kendaraan/${editing.id_kendaraan}`, payload);
        toast.success('Data kendaraan berhasil diperbarui.');
      } else {
        await api.post('/kendaraan', payload);
        toast.success('Kendaraan berhasil ditambahkan.');
      }
      setModalOpen(false);
      table.reload();
    } catch (error) {
      const message = getErrorMessage(error);
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/kendaraan/${deleteTarget.id_kendaraan}`);
      toast.success(`Kendaraan ${deleteTarget.plat_nomor} berhasil dihapus.`);
      setDeleteTarget(null);
      table.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'plat_nomor',
      label: 'Plat Nomor',
      sortable: true,
      render: (row) => {
        const Icon = JENIS_ICON[row.jenis_kendaraan] || CarFront;
        return (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Icon size={19} />
            </div>
            <div>
              <p className="inline-flex rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-extrabold tracking-wider text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white">
                {row.plat_nomor}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">ID #{row.id_kendaraan}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'jenis_kendaraan',
      label: 'Jenis',
      sortable: true,
      render: (row) => (
        <Badge variant={JENIS_BADGE[row.jenis_kendaraan] || 'slate'} dot>
          {row.jenis_kendaraan}
        </Badge>
      ),
    },
    { key: 'warna', label: 'Warna', sortable: true, render: (row) => row.warna },
    { key: 'pemilik', label: 'Pemilik', sortable: true, render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-200">{row.pemilik}</span> },
    {
      key: 'nama_pendaftar',
      label: 'Didaftarkan Oleh',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{row.nama_pendaftar}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">User #{row.id_user}</p>
        </div>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <IconButton label="Cetak barcode kendaraan" onClick={() => setBarcodeTarget(row)}>
            <ScanLine size={16} />
          </IconButton>
          <IconButton label="Ubah kendaraan" onClick={() => openEdit(row)}>
            <Pencil size={16} />
          </IconButton>
          <IconButton
            label="Hapus kendaraan"
            onClick={() => setDeleteTarget(row)}
            className="hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Data Kendaraan</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola kendaraan yang terdaftar beserta data pemiliknya. Gunakan ikon barcode untuk mencetak label scan masuk.
          </p>
        </div>
        <Button onClick={openCreate} className="w-fit">
          <Plus size={17} />
          Tambah Kendaraan
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder="Cari plat, pemilik, jenis..."
            className="w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Jenis:</span>
            <Select
              value={table.filters.jenis_kendaraan || ''}
              onChange={(event) => table.setFilter('jenis_kendaraan', event.target.value)}
              className="h-10 w-32 py-0 text-xs"
            >
              <option value="">Semua</option>
              <option value="motor">Motor</option>
              <option value="mobil">Mobil</option>
              <option value="lainnya">Lainnya</option>
            </Select>
          </div>
        </div>

        {table.error ? (
          <ErrorState message={table.error} onRetry={table.reload} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={table.rows}
              loading={table.loading}
              sort={table.sort}
              order={table.order}
              onSort={table.handleSort}
              rowKey={(row) => row.id_kendaraan}
              emptyTitle="Kendaraan tidak ditemukan"
              emptyDescription={table.search ? 'Coba kata kunci lain.' : 'Tambahkan kendaraan agar dapat diproses pada transaksi parkir.'}
              emptyAction={!table.search ? <Button size="sm" onClick={openCreate}><Plus size={15} /> Tambah Kendaraan</Button> : null}
            />
            <Pagination meta={table.meta} onPage={table.setPage} />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Ubah Kendaraan' : 'Tambah Kendaraan'}
        description="Data kendaraan digunakan petugas saat mencatat kendaraan masuk."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Batal</Button>
            <Button type="submit" form="kendaraan-form" loading={saving}>
              {editing ? 'Simpan Perubahan' : 'Tambah Kendaraan'}
            </Button>
          </>
        )}
      >
        <form id="kendaraan-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plat Nomor" htmlFor="plat_nomor" required hint="Contoh: B 1234 XYZ">
              <Input
                id="plat_nomor"
                value={form.plat_nomor}
                onChange={(event) => setForm((current) => ({ ...current, plat_nomor: event.target.value.toUpperCase() }))}
                placeholder="B 1234 XYZ"
                maxLength={15}
                className="font-mono font-bold tracking-wider"
              />
            </Field>
            <Field label="Jenis Kendaraan" htmlFor="jenis_kendaraan" required>
              <Select
                id="jenis_kendaraan"
                value={form.jenis_kendaraan}
                onChange={(event) => setForm((current) => ({ ...current, jenis_kendaraan: event.target.value }))}
              >
                <option value="motor">Motor</option>
                <option value="mobil">Mobil</option>
                <option value="lainnya">Lainnya</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Warna" htmlFor="warna" required>
              <Input
                id="warna"
                value={form.warna}
                onChange={(event) => setForm((current) => ({ ...current, warna: event.target.value }))}
                placeholder="Hitam"
                maxLength={20}
              />
            </Field>
            <Field label="Nama Pemilik" htmlFor="pemilik" required>
              <Input
                id="pemilik"
                value={form.pemilik}
                onChange={(event) => setForm((current) => ({ ...current, pemilik: event.target.value }))}
                placeholder="Nama lengkap pemilik"
                maxLength={100}
              />
            </Field>
          </div>

          <Field label="Didaftarkan Oleh (User)" htmlFor="id_user" required>
            <Select
              id="id_user"
              value={form.id_user}
              onChange={(event) => setForm((current) => ({ ...current, id_user: event.target.value }))}
            >
              <option value="">Pilih user...</option>
              {users.map((item) => (
                <option key={item.id_user} value={item.id_user}>
                  {item.nama_lengkap} (@{item.username})
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Kendaraan"
        message={`Hapus kendaraan ${deleteTarget?.plat_nomor || ''}? Kendaraan yang sudah memiliki riwayat transaksi tidak dapat dihapus.`}
      />

      <BarcodeLabelModal
        open={Boolean(barcodeTarget)}
        onClose={() => setBarcodeTarget(null)}
        vehicle={barcodeTarget}
      />
    </div>
  );
}

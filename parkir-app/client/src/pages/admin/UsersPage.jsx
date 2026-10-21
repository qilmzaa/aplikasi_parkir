import { useState } from 'react';
import { Pencil, Plus, Trash2, UserCog, UserRound } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import useDataTable from '../../hooks/useDataTable';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  IconButton,
  Input,
  RoleBadge,
  Select,
} from '../../components/ui';

const EMPTY_FORM = {
  nama_lengkap: '',
  username: '',
  password: '',
  role: 'petugas',
  status_aktif: '1',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const table = useDataTable('/users', { defaultSort: 'id_user', defaultOrder: 'desc' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      nama_lengkap: row.nama_lengkap,
      username: row.username,
      password: '',
      role: row.role,
      status_aktif: String(row.status_aktif),
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    if (!form.nama_lengkap.trim() || !form.username.trim()) {
      setFormError('Nama lengkap dan username wajib diisi.');
      return;
    }
    if (!editing && form.password.length < 6) {
      setFormError('Password minimal 6 karakter.');
      return;
    }
    if (editing && form.password && form.password.length < 6) {
      setFormError('Password baru minimal 6 karakter.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        nama_lengkap: form.nama_lengkap.trim(),
        username: form.username.trim().toLowerCase(),
        status_aktif: Number(form.status_aktif),
      };
      if (!payload.password) delete payload.password;

      if (editing) {
        await api.put(`/users/${editing.id_user}`, payload);
        toast.success('Data user berhasil diperbarui.');
      } else {
        await api.post('/users', payload);
        toast.success('User baru berhasil ditambahkan.');
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
      await api.delete(`/users/${deleteTarget.id_user}`);
      toast.success(`User ${deleteTarget.username} berhasil dihapus.`);
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
      key: 'nama_lengkap',
      label: 'Nama Lengkap',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <UserRound size={17} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{row.nama_lengkap}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">ID #{row.id_user}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">@{row.username}</span>,
    },
    { key: 'role', label: 'Role', sortable: true, render: (row) => <RoleBadge role={row.role} /> },
    {
      key: 'status_aktif',
      label: 'Status',
      sortable: true,
      render: (row) => (
        Number(row.status_aktif) === 1
          ? <Badge variant="emerald" dot>Aktif</Badge>
          : <Badge variant="rose" dot>Nonaktif</Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <IconButton label="Ubah user" onClick={() => openEdit(row)}>
            <Pencil size={16} />
          </IconButton>
          {row.id_user === currentUser?.id_user ? (
            <span title="Tidak dapat menghapus akun sendiri">
              <IconButton label="Tidak dapat menghapus akun sendiri" disabled className="cursor-not-allowed opacity-35">
                <Trash2 size={16} />
              </IconButton>
            </span>
          ) : (
            <IconButton
              label="Hapus user"
              onClick={() => setDeleteTarget(row)}
              className="hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <Trash2 size={16} />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Manajemen User</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola akun admin, petugas, dan owner beserta status aktifnya.
          </p>
        </div>
        <Button onClick={openCreate} className="w-fit">
          <Plus size={17} />
          Tambah User
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder="Cari nama atau username..."
            className="w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Filter role:</span>
            <Select
              value={table.filters.role || ''}
              onChange={(event) => table.setFilter('role', event.target.value)}
              className="h-10 w-32 py-0 text-xs"
            >
              <option value="">Semua</option>
              <option value="admin">Admin</option>
              <option value="petugas">Petugas</option>
              <option value="owner">Owner</option>
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
              rowKey={(row) => row.id_user}
              emptyTitle="User tidak ditemukan"
              emptyDescription={table.search ? 'Coba gunakan kata kunci lain.' : 'Tambahkan user pertama untuk mulai mengelola akses.'}
              emptyAction={!table.search ? <Button size="sm" onClick={openCreate}><Plus size={15} /> Tambah User</Button> : null}
            />
            <Pagination meta={table.meta} onPage={table.setPage} />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Ubah User' : 'Tambah User Baru'}
        description={editing ? `Perbarui data akun @${editing.username}.` : 'Buat akun baru dan tentukan hak aksesnya.'}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Batal</Button>
            <Button type="submit" form="user-form" loading={saving}>
              {editing ? 'Simpan Perubahan' : 'Tambah User'}
            </Button>
          </>
        )}
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {formError}
            </div>
          )}

          <Field label="Nama Lengkap" htmlFor="nama_lengkap" required>
            <Input
              id="nama_lengkap"
              value={form.nama_lengkap}
              onChange={(event) => setForm((current) => ({ ...current, nama_lengkap: event.target.value }))}
              placeholder="Contoh: Petugas Parkir Satu"
              maxLength={50}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username" htmlFor="username" required hint="Huruf kecil, angka, titik, garis bawah.">
              <Input
                id="username"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="petugas2"
                maxLength={50}
                autoComplete="off"
              />
            </Field>

            <Field label={editing ? 'Password Baru' : 'Password'} htmlFor="password" required={!editing} hint={editing ? 'Kosongkan jika tidak diubah.' : 'Minimal 6 karakter.'}>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editing ? '••••••••' : 'Minimal 6 karakter'}
                autoComplete="new-password"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" htmlFor="role" required>
              <Select
                id="role"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="admin">Admin</option>
                <option value="petugas">Petugas</option>
                <option value="owner">Owner</option>
              </Select>
            </Field>

            <Field label="Status Akun" htmlFor="status_aktif">
              <Select
                id="status_aktif"
                value={form.status_aktif}
                onChange={(event) => setForm((current) => ({ ...current, status_aktif: event.target.value }))}
              >
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </Select>
            </Field>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
            <UserCog size={14} className="mr-1.5 inline text-indigo-500" />
            Akun dengan status nonaktif tidak dapat login. Admin tidak dapat menghapus akunnya sendiri.
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus User"
        message={`Yakin ingin menghapus akun "${deleteTarget?.nama_lengkap}" (@${deleteTarget?.username})? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}

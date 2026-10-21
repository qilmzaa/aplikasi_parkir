import { Link } from 'react-router-dom';
import { ArrowLeft, CarFront } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function NotFoundPage() {
  const { homePath } = useAuth();

  return (
    <div className="grid min-h-[65vh] place-items-center">
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
          <CarFront size={38} />
        </div>
        <p className="text-6xl font-black tracking-tighter text-slate-200 dark:text-slate-800">404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Tujuan parkir Anda sepertinya salah jalur. Kembali ke dashboard untuk melanjutkan.
        </p>
        <Link to={homePath} className="btn btn-primary mt-6 inline-flex h-10 px-5">
          <ArrowLeft size={16} />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

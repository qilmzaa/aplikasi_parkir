import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import TarifPage from './pages/admin/TarifPage';
import AreaPage from './pages/admin/AreaPage';
import KendaraanPage from './pages/admin/KendaraanPage';
import LogPage from './pages/admin/LogPage';
import PetugasDashboard from './pages/petugas/PetugasDashboard';
import ScanParkirPage from './pages/petugas/ScanParkirPage';
import TransaksiMasukPage from './pages/petugas/TransaksiMasukPage';
import KendaraanAktifPage from './pages/petugas/KendaraanAktifPage';
import SearchReceiptPage from './pages/petugas/SearchReceiptPage';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerRekapPage from './pages/owner/OwnerRekapPage';
import { PageLoader } from './components/ui';

function RootRedirect() {
  const { user, loading, homePath } = useAuth();
  if (loading) return <PageLoader />;
  return <Navigate to={user ? homePath : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/tarif" element={<TarifPage />} />
          <Route path="/admin/area" element={<AreaPage />} />
          <Route path="/admin/kendaraan" element={<KendaraanPage />} />
          <Route path="/admin/log" element={<LogPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['petugas']} />}>
        <Route element={<AppLayout />}>
          <Route path="/petugas" element={<PetugasDashboard />} />
          <Route path="/petugas/scan" element={<ScanParkirPage />} />
          <Route path="/petugas/masuk" element={<TransaksiMasukPage />} />
          <Route path="/petugas/aktif" element={<KendaraanAktifPage />} />
          <Route path="/petugas/struk" element={<SearchReceiptPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['owner']} />}>
        <Route element={<AppLayout />}>
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/rekap" element={<OwnerRekapPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

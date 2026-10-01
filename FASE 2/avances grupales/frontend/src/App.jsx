import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegistroPage from "./pages/RegistroPage.jsx";
import OperadorLayout from "./pages/operador/OperadorLayout.jsx";
import OperadorInicioPage from "./pages/operador/OperadorInicioPage.jsx";
import RecepcionPage from "./pages/operador/RecepcionPage.jsx";
import NuevaOrdenPage from "./pages/operador/NuevaOrdenPage.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminInicioPage from "./pages/admin/AdminInicioPage.jsx";
import TarifasPage from "./pages/admin/TarifasPage.jsx";
import UsuariosPage from "./pages/admin/UsuariosPage.jsx";
import MaestrosPage from "./pages/admin/MaestrosPage.jsx";
import ClienteLayout from "./pages/cliente/ClienteLayout.jsx";
import PeonetaLayout from "./pages/peoneta/PeonetaLayout.jsx";
import ManifiestosPeonetaPage from "./pages/peoneta/ManifiestosPeonetaPage.jsx";
import ClientesPage from "./pages/shared/ClientesPage.jsx";
import OrdenesListadoPage from "./pages/shared/OrdenesListadoPage.jsx";
import BodegaPage from "./pages/shared/BodegaPage.jsx";
import ManifiestosPage from "./pages/shared/ManifiestosPage.jsx";
import SeguimientoPage from "./pages/shared/SeguimientoPage.jsx";
import PerfilPage from "./pages/shared/PerfilPage.jsx";
import PlaceholderPage from "./pages/shared/PlaceholderPage.jsx";
import ProntoDespachoPage from "./pages/operador/ProntoDespachoPage.jsx";
import PagosOtPage, { RedirigirComprobantesAPagos } from "./pages/operador/PagosOtPage.jsx";

function PublicHome() {
    const { autenticado, usuario, rutaPorRol } = useAuth();

    if (autenticado) {
        return <Navigate to={rutaPorRol(usuario.rol)} replace />;
    }

    return <LoginPage />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/registro" element={<RegistroPage />} />

            <Route
                path="/operador"
                element={
                    <ProtectedRoute roles={["OPERADOR"]}>
                        <OperadorLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<OperadorInicioPage />} />
                <Route path="recepcion" element={<RecepcionPage />} />
                <Route path="ordenes" element={<NuevaOrdenPage />} />
                <Route path="ordenes-listado" element={<OrdenesListadoPage />} />
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="bodega" element={<BodegaPage />} />
                <Route path="manifiestos" element={<ManifiestosPage />} />
                <Route path="despacho" element={<ProntoDespachoPage />} />
                <Route path="seguimiento" element={<SeguimientoPage />} />
                <Route path="pagos" element={<PagosOtPage />} />
                <Route path="comprobantes" element={<RedirigirComprobantesAPagos />} />
            </Route>

            <Route
                path="/administrador"
                element={
                    <ProtectedRoute roles={["ADMINISTRADOR"]}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<AdminInicioPage />} />
                <Route path="ordenes" element={<OrdenesListadoPage />} />
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="tarifas" element={<TarifasPage />} />
                <Route path="maestros" element={<MaestrosPage />} />
                <Route path="usuarios" element={<UsuariosPage />} />
                <Route path="manifiestos" element={<ManifiestosPage />} />
                <Route path="bodega" element={<BodegaPage />} />
                <Route path="seguimiento" element={<SeguimientoPage />} />
                <Route path="cuentas" element={<PlaceholderPage titulo="Cuentas corrientes" />} />
                <Route path="facturacion" element={<PlaceholderPage titulo="Facturación" />} />
                <Route path="reportes" element={<PlaceholderPage titulo="Reportes" />} />
            </Route>

            <Route
                path="/cliente"
                element={
                    <ProtectedRoute roles={["CLIENTE"]}>
                        <ClienteLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<PlaceholderPage titulo="Portal cliente" descripcion="Tu cuenta ya está autenticada. El detalle de OT propias se habilitará con los endpoints filtrados por cliente." />} />
                <Route path="ordenes" element={<PlaceholderPage titulo="Mis órdenes" />} />
                <Route path="seguimiento" element={<PlaceholderPage titulo="Seguimiento" />} />
                <Route path="documentos" element={<PlaceholderPage titulo="Documentos" />} />
                <Route path="pagos" element={<PlaceholderPage titulo="Pagos" />} />
                <Route path="evidencias" element={<PlaceholderPage titulo="Evidencias" />} />
                <Route path="perfil" element={<PerfilPage />} />
            </Route>

            <Route
                path="/peoneta"
                element={
                    <ProtectedRoute roles={["PEONETA"]}>
                        <PeonetaLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<ManifiestosPeonetaPage />} />
                <Route path="manifiestos" element={<ManifiestosPeonetaPage />} />
                <Route path="entregas" element={<ManifiestosPeonetaPage />} />
                <Route path="historial" element={<PlaceholderPage titulo="Historial" />} />
                <Route path="perfil" element={<PerfilPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

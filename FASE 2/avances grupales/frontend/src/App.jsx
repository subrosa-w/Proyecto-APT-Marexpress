import { Navigate, Routes, Route } from 'react-router'
import LayoutPublico from './components/LayoutPublico.jsx'
import Inicio from './pages/Inicio.jsx'
import Servicios from './pages/Servicios.jsx'
import Cobertura from './pages/Cobertura.jsx'
import Nosotros from './pages/Nosotros.jsx'
import Seguimiento from './pages/Seguimiento.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'

// Sistema interno (mismas vistas del front de prueba, en src/sistema)
import { useAuth } from './sistema/auth.jsx'
import ProtectedRoute from './sistema/components/ProtectedRoute.jsx'
import LoginPage from './sistema/pages/LoginPage.jsx'
import RegistroPage from './sistema/pages/RegistroPage.jsx'
import OperadorLayout from './sistema/pages/operador/OperadorLayout.jsx'
import OperadorInicioPage from './sistema/pages/operador/OperadorInicioPage.jsx'
import RecepcionPage from './sistema/pages/operador/RecepcionPage.jsx'
import NuevaOrdenPage from './sistema/pages/operador/NuevaOrdenPage.jsx'
import ProntoDespachoPage from './sistema/pages/operador/ProntoDespachoPage.jsx'
import PagosOtPage, { RedirigirComprobantesAPagos } from './sistema/pages/operador/PagosOtPage.jsx'
import AdminLayout from './sistema/pages/admin/AdminLayout.jsx'
import AdminInicioPage from './sistema/pages/admin/AdminInicioPage.jsx'
import TarifasPage from './sistema/pages/admin/TarifasPage.jsx'
import UsuariosPage from './sistema/pages/admin/UsuariosPage.jsx'
import MaestrosPage from './sistema/pages/admin/MaestrosPage.jsx'
import ClienteLayout from './sistema/pages/cliente/ClienteLayout.jsx'
import PeonetaLayout from './sistema/pages/peoneta/PeonetaLayout.jsx'
import ManifiestosPeonetaPage from './sistema/pages/peoneta/ManifiestosPeonetaPage.jsx'
import ClientesPage from './sistema/pages/shared/ClientesPage.jsx'
import OrdenesListadoPage from './sistema/pages/shared/OrdenesListadoPage.jsx'
import BodegaPage from './sistema/pages/shared/BodegaPage.jsx'
import ManifiestosPage from './sistema/pages/shared/ManifiestosPage.jsx'
import SeguimientoPage from './sistema/pages/shared/SeguimientoPage.jsx'
import PerfilPage from './sistema/pages/shared/PerfilPage.jsx'
import PlaceholderPage from './sistema/pages/shared/PlaceholderPage.jsx'

// Si ya hay sesión iniciada, /acceso lleva directo al panel de su rol
function PaginaAcceso() {
  const { autenticado, usuario, rutaPorRol } = useAuth()

  if (autenticado) {
    return <Navigate to={rutaPorRol(usuario.rol)} replace />
  }

  return <LoginPage />
}

// Mapa de la aplicación: qué página se muestra en cada dirección (URL)
function App() {
  return (
    <Routes>
      {/* Sitio público: comparten Header y Footer a través de LayoutPublico */}
      <Route element={<LayoutPublico />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/cobertura" element={<Cobertura />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/seguimiento" element={<Seguimiento />} />
      </Route>

      {/* Acceso al sistema */}
      <Route path="/acceso" element={<PaginaAcceso />} />
      <Route path="/registro" element={<RegistroPage />} />

      {/* ===== Rutas del sistema: iguales al front de prueba ===== */}
      <Route
        path="/operador"
        element={
          <ProtectedRoute roles={['OPERADOR']}>
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
          <ProtectedRoute roles={['ADMINISTRADOR']}>
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
          <ProtectedRoute roles={['CLIENTE']}>
            <ClienteLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <PlaceholderPage
              titulo="Portal cliente"
              descripcion="Tu cuenta ya está autenticada. El detalle de OT propias se habilitará con los endpoints filtrados por cliente."
            />
          }
        />
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
          <ProtectedRoute roles={['PEONETA']}>
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

      {/* Cualquier otra dirección */}
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}

export default App

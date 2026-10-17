import { Navigate, Routes, Route } from 'react-router'
import LayoutPublico from './components/LayoutPublico.jsx'
import Inicio from './pages/Inicio.jsx'
import Servicios from './pages/Servicios.jsx'
import Cobertura from './pages/Cobertura.jsx'
import Nosotros from './pages/Nosotros.jsx'
import Seguimiento from './pages/Seguimiento.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'

/*
  Sistema interno. Cada pantalla vive en src/sistema y se engancha aquí.
  Orden de lectura de una vista:
  1. Esta ruta (qué URL la abre y qué rol entra).
  2. El archivo de la vista, en sistema/pages.
  3. El diseño, en sistema/sistema.css (clases admin-card, mx-table, button-primary).
  4. Las funciones de esa vista y las comunes de sistema/utils.js y sistema/api.js.
*/
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
import ClienteInicioPage from './sistema/pages/cliente/ClienteInicioPage.jsx'
import OrdenesClientePage from './sistema/pages/cliente/OrdenesClientePage.jsx'
import PagosPendientesPage from './sistema/pages/cliente/PagosPendientesPage.jsx'
import CotizarPage from './sistema/pages/cliente/CotizarPage.jsx'
import CotizacionesPage from './sistema/pages/cliente/CotizacionesPage.jsx'
import SoloCuentaCorriente from './sistema/pages/cliente/SoloCuentaCorriente.jsx'
import PeonetaLayout from './sistema/pages/peoneta/PeonetaLayout.jsx'
import ManifiestosPeonetaPage from './sistema/pages/peoneta/ManifiestosPeonetaPage.jsx'
import ClientesPage from './sistema/pages/shared/ClientesPage.jsx'
import OrdenesListadoPage from './sistema/pages/shared/OrdenesListadoPage.jsx'
import BodegaPage from './sistema/pages/shared/BodegaPage.jsx'
import ManifiestosPage from './sistema/pages/shared/ManifiestosPage.jsx'
import SeguimientoPage from './sistema/pages/shared/SeguimientoPage.jsx'
import PerfilPage from './sistema/pages/shared/PerfilPage.jsx'
import PlaceholderPage from './sistema/pages/shared/PlaceholderPage.jsx'
import ReportesPage from './sistema/pages/admin/ReportesPage.jsx'
import CuentasCorrientesPage from './sistema/pages/admin/CuentasCorrientesPage.jsx'
import FronteraError from './sistema/components/FronteraError.jsx'

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
    <FronteraError>
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
      {/* Registro público: toda cuenta nueva parte como cliente normal */}
      <Route path="/registro" element={<RegistroPage />} />

      {/*
        Operador. Menú: sistema/pages/operador/OperadorLayout.jsx
        Vistas compartidas con el administrador están en sistema/pages/shared.
      */}
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

      {/*
        Administrador. Menú: sistema/pages/admin/AdminLayout.jsx
        Crear OT reutiliza la misma vista del operador (NuevaOrdenPage).
      */}
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
        <Route path="nueva-orden" element={<NuevaOrdenPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="tarifas" element={<TarifasPage />} />
        <Route path="maestros" element={<MaestrosPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="manifiestos" element={<ManifiestosPage />} />
        <Route path="bodega" element={<BodegaPage />} />
        <Route path="seguimiento" element={<SeguimientoPage />} />
        <Route path="cuentas" element={<CuentasCorrientesPage />} />
        <Route path="reportes" element={<ReportesPage />} />
      </Route>

      {/* Cliente. El portal propio sigue en preparación; el perfil ya funciona. */}
      <Route
        path="/cliente"
        element={
          <ProtectedRoute roles={['CLIENTE', 'CLIENTE NORMAL', 'CLIENTE CUENTA CORRIENTE']}>
            <ClienteLayout />
          </ProtectedRoute>
        }
      >
        {/* Ambos tipos de cliente */}
        <Route index element={<ClienteInicioPage />} />
        <Route path="ordenes" element={<OrdenesClientePage />} />
        <Route path="perfil" element={<PerfilPage />} />
        {/* Solo cliente normal */}
        <Route path="historial" element={<OrdenesClientePage vista="historial" />} />
        {/* Solo cliente con cuenta corriente */}
        <Route path="pagos" element={<SoloCuentaCorriente><PagosPendientesPage /></SoloCuentaCorriente>} />
        <Route path="cotizar" element={<SoloCuentaCorriente><CotizarPage /></SoloCuentaCorriente>} />
        <Route path="cotizaciones" element={<SoloCuentaCorriente><CotizacionesPage /></SoloCuentaCorriente>} />
      </Route>

      {/*
        Peoneta. La misma vista cambia según la URL:
        /peoneta ruta, /peoneta/entregas completadas, /peoneta/historial entregado al 100%.
      */}
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
        <Route path="historial" element={<ManifiestosPeonetaPage />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>

      {/* Cualquier otra dirección */}
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
    </FronteraError>
  )
}

export default App

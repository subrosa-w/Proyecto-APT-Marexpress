/*
  VISTA: inicio del administrador
  RUTA: /administrador
  CSS: admin-card, mx-table, GraficoBarras
  API: GET /api/reportes
  FUNCIONES: resumen del día, gráficos del mes y tabla de movimientos
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { api } from "../../api.js";
import { formatearCLP } from "../../utils.js";
import GraficoBarras from "../../components/GraficoBarras.jsx";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";

// Rellena los días sin movimiento con cero. Si no, el gráfico muestra una sola barra y no se ve el mes.
const completarMes = (serie, etiqueta) => {
  const base = Array.isArray(serie) ? serie : [];
  const diaConocido = base.find((item) => /^\d{4}-\d{2}-\d{2}$/.test(item?.dia || ""))?.dia;
  const mes = /^\d{4}-\d{2}$/.test(etiqueta || "")
    ? etiqueta
    : diaConocido
      ? diaConocido.slice(0, 7)
      : "";
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    return base;
  }
  const [anio, numero] = mes.split("-").map(Number);
  const dias = new Date(anio, numero, 0).getDate();
  const mapa = new Map(base.map((item) => [item.dia, item]));
  return Array.from({ length: dias }, (_, indice) => {
    const dia = `${mes}-${String(indice + 1).padStart(2, "0")}`;
    return mapa.get(dia) || { dia, ordenes: 0, ingresos: 0 };
  });
};

// Saca el arreglo de la respuesta, venga suelto o dentro de una clave.
const obtenerLista = (respuesta, clave) => {
  if (Array.isArray(respuesta)) return respuesta;
  return Array.isArray(respuesta?.[clave]) ? respuesta[clave] : [];
};

// Atajos del panel. Cada uno abre el módulo que ya existe en el menú.
const accesos = [
  { nombre: "Tarifario", ruta: "/administrador/tarifas", detalle: "Precios y trayectos" },
  { nombre: "Usuarios", ruta: "/administrador/usuarios", detalle: "Gestión de accesos" },
  { nombre: "Conductores y vehículos", ruta: "/administrador/maestros", detalle: "Gestión de flota" },
  { nombre: "Bodega", ruta: "/administrador/bodega", detalle: "Control de mercancías" },
  { nombre: "Manifiestos", ruta: "/administrador/manifiestos", detalle: "Despachos y entregas" },
  { nombre: "Reportes", ruta: "/administrador/reportes", detalle: "Análisis e indicadores" },
];

export default function AdminInicioPage() {
  const { ordenDeBodega, nombreBodega } = useBodegaTrabajo();

  const [datos, setDatos] = useState({
    ordenes: [],
    clientes: [],
    usuarios: [],
    tarifas: [],
  });

  const [cargando, setCargando] = useState(true);
  const [errores, setErrores] = useState([]);
  const [informe, setInforme] = useState(null);

  // Carga órdenes, clientes, usuarios y tarifas por separado. Si una falla, las demás igual se muestran.
  const cargar = useCallback(async () => {
    setCargando(true);

    const consultas = [
      ["ordenes", "/ordenes-transporte", null],
      ["clientes", "/clientes", null],
      ["usuarios", "/maestros/usuarios", "usuarios"],
      ["tarifas", "/maestros/tarifas", "tarifas"],
    ];

    const resultados = await Promise.allSettled(
      consultas.map(([, ruta]) => api(ruta))
    );

    const actualizados = {};
    const fallos = [];

    resultados.forEach((resultado, indice) => {
      const [clave, , campo] = consultas[indice];

      if (resultado.status === "fulfilled") {
        actualizados[clave] = obtenerLista(resultado.value, campo);
      } else {
        actualizados[clave] = [];
        fallos.push(clave);
      }
    });

    setDatos(actualizados);
    setErrores(fallos);
    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
    api(`/reportes?periodo=mes&fecha=${hoy}`)
      .then(setInforme)
      .catch(() => setInforme(null));
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Solo las OT de la bodega elegida en la barra, para que el número coincida con el listado.
  const ordenesBodega = useMemo(
    () => datos.ordenes.filter(ordenDeBodega),
    [datos.ordenes, ordenDeBodega]
  );

  // Serie del mes completo para los gráficos de órdenes e ingresos.
  const serieMes = useMemo(
    () => completarMes(informe?.serie, informe?.etiqueta),
    [informe]
  );
  const diasConMovimiento = serieMes.filter((item) => item.ordenes > 0 || item.ingresos > 0);

  // Números grandes del panel. Cada uno enlaza a su pantalla.
  const indicadores = [
    {
      nombre: "OT en bodega",
      valor: ordenesBodega.length,
      detalle: nombreBodega || "Bodega seleccionada",
      ruta: "/administrador/ordenes",
      clave: "ordenes",
    },
    {
      nombre: "Clientes",
      valor: datos.clientes.length,
      detalle: "Clientes registrados",
      ruta: "/administrador/clientes",
      clave: "clientes",
    },
    {
      nombre: "Usuarios",
      valor: datos.usuarios.length,
      detalle: "Accesos registrados",
      ruta: "/administrador/usuarios",
      clave: "usuarios",
    },
    {
      nombre: "Tarifarios",
      valor: datos.tarifas.length,
      detalle: "Tarifas registradas",
      ruta: "/administrador/tarifas",
      clave: "tarifas",
    },
  ];

  return (
    <>
      {/* Encabezado y aviso si alguna consulta no respondió. */}
      <section className="admin-card">
        <header className="admin-card-header">
          <div>
            <span>CENTRO DE CONTROL</span>
            <h2>Resumen administrativo</h2>
          </div>

          <button
            type="button"
            className="button-secondary"
            onClick={cargar}
            disabled={cargando}
          >
            {cargando ? "Actualizando..." : "Actualizar datos"}
          </button>
        </header>

        <p className="mx-note">
          Consulta la información operativa y accede a los
          módulos principales de Marexpress.
        </p>

        {errores.length > 0 && (
          <p role="alert">
            No se pudieron consultar: {errores.join(", ")}.
            Revisa la conexión con el servidor.
          </p>
        )}
      </section>

      {/* Contadores de la bodega activa, clientes, usuarios y tarifarios. */}
      <section className="admin-kpis">
        {indicadores.map((indicador) => (
          <article className="admin-kpi" key={indicador.nombre}>
            <span>{indicador.nombre}</span>
            <strong>
              {cargando
                ? "..."
                : errores.includes(indicador.clave)
                  ? "N/D"
                  : indicador.valor}
            </strong>
            <small>{indicador.detalle}</small>
            <Link to={indicador.ruta}>Ver detalle →</Link>
          </article>
        ))}
      </section>

      {/* Mes en curso: totales, barras de cada día y tabla solo de los días con movimiento. */}
      <section className="admin-card">
        <header className="admin-card-header">
          <div>
            <span>ESTADÍSTICAS</span>
            <h2>Mes en curso</h2>
          </div>
          <Link className="button-secondary" to="/administrador/reportes">Ver informes</Link>
        </header>
        <div className="mx-ciudad-info">
          <p><span>Ingresos</span><strong>{formatearCLP(informe?.totales?.ingresos || 0)}</strong></p>
          <p><span>Órdenes</span><strong>{informe?.totales?.ordenes || 0}</strong></p>
          <p><span>Vueltas</span><strong>{informe?.totales?.vueltas || 0}</strong></p>
          <p><span>Entregas</span><strong>{informe?.totales?.entregas || 0}</strong></p>
        </div>
        <GraficoBarras
          titulo="Órdenes por día"
          unidad="órdenes"
          datos={serieMes.map((item) => ({ nombre: item.dia, valor: item.ordenes }))}
        />
        <GraficoBarras
          titulo="Ingresos por día"
          formato={formatearCLP}
          datos={serieMes.map((item) => ({ nombre: item.dia, valor: Math.round(item.ingresos || 0) }))}
        />
        <div className="mx-table-wrap">
          <table className="mx-table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Órdenes</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {diasConMovimiento.length === 0 ? (
                <tr><td colSpan={3} className="mx-empty">Sin movimiento en el mes.</td></tr>
              ) : diasConMovimiento.map((item) => (
                <tr key={item.dia}>
                  <td>{new Date(`${item.dia}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}</td>
                  <td>{item.ordenes}</td>
                  <td>{formatearCLP(item.ingresos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Accesos directos a los módulos del administrador. */}
      <section className="admin-card">
        <header className="admin-card-header">
          <div>
            <span>ADMINISTRACIÓN</span>
            <h2>Accesos rápidos</h2>
          </div>
        </header>

        <div className="admin-grid-2">
          {accesos.map((acceso) => (
            <Link
              key={acceso.ruta}
              to={acceso.ruta}
              className="admin-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3>{acceso.nombre} →</h3>
              <p className="mx-note">{acceso.detalle}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
  
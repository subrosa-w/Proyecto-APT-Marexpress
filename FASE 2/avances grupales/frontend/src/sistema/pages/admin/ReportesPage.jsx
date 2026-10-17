/*
  VISTA: informes
  RUTA: /administrador/reportes
  CSS: admin-card, mx-table, mx-toolbar, GraficoBarras
  API: GET /api/reportes?periodo=&fecha=
  FUNCIONES: elige día, semana, mes o año; arma el Excel de entregas
  y el Excel de camiones (todos o una patente). Solo entran manifiestos
  cerrados: cada OT entregada o rechazada.
*/
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { api } from "../../api.js";
import { formatearCLP, formatearFechaHora } from "../../utils.js";
import Message from "../../components/Message.jsx";
import GraficoBarras from "../../components/GraficoBarras.jsx";

// Hoy en Chile, en formato YYYY-MM-DD. El informe siempre parte del día local, no del reloj UTC.
const hoyChile = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

// Convierte un Date a YYYY-MM-DD sin pasar por UTC, para que el lunes no se corra de día.
const fechaLocal = (fecha) => {
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${fecha.getFullYear()}-${mes}-${dia}`;
};

// Arma la fecha a mediodía local. new Date("YYYY-MM-DD") la interpretaría como UTC y cambiaría el día.
const partirFecha = (iso) => {
    const [anio, mes, dia] = String(iso || "").split("-").map(Number);
    return new Date(anio, (mes || 1) - 1, dia || 1);
};

// Lunes de la semana de esa fecha. El domingo cuenta como cierre de la semana anterior.
const lunesDe = (iso) => {
    const fecha = partirFecha(iso);
    const dia = fecha.getDay();
    fecha.setDate(fecha.getDate() - (dia === 0 ? 6 : dia - 1));
    return fecha;
};

// Número de semana ISO (YYYY-Www) para el input type="week" del navegador.
const semanaIso = (iso) => {
    const lunes = lunesDe(iso);
    const jueves = new Date(lunes);
    jueves.setDate(lunes.getDate() + 3);
    const anio = jueves.getFullYear();
    const enero4 = new Date(anio, 0, 4);
    const diaEnero = enero4.getDay() || 7;
    const lunes1 = new Date(enero4);
    lunes1.setDate(enero4.getDate() - diaEnero + 1);
    const semana = Math.floor((jueves - lunes1) / 86400000 / 7) + 1;
    return `${anio}-W${String(semana).padStart(2, "0")}`;
};

// Vuelve de YYYY-Www al lunes de esa semana. El API solo acepta un día YYYY-MM-DD.
const lunesDeSemanaIso = (valor) => {
    const coincidencia = /^(\d{4})-W(\d{2})$/.exec(valor || "");
    if (!coincidencia) return hoyChile();
    const anio = Number(coincidencia[1]);
    const semana = Number(coincidencia[2]);
    const enero4 = new Date(anio, 0, 4);
    const dia = enero4.getDay() || 7;
    const lunes = new Date(enero4);
    lunes.setDate(enero4.getDate() - dia + 1 + (semana - 1) * 7);
    return fechaLocal(lunes);
};

// Fecha larga en español para el título del informe diario.
const textoDia = (iso) => partirFecha(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric"
});

// Kilos y m³ con coma decimal chilena, para que Excel no los lea como texto raro.
const textoMedida = (valor, decimales) => Number(valor || 0).toLocaleString("es-CL", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
});

// Baja un CSV con BOM y saltos de Windows. Excel en Chile abre así las tildes y separa por punto y coma.
const descargarTexto = (nombre, lineas) => {
    const blob = new Blob([`\uFEFF${lineas.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${nombre}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
};

// Excel de entregas: una fila por entrega, con las columnas que pide la tabla de la pantalla.
const descargarExcel = (nombre, columnas, filas) => {
    const encabezado = columnas.map((columna) => columna.titulo).join(";");
    const cuerpo = filas.map((fila) => columnas.map((columna) => {
        const valor = String(fila[columna.clave] ?? "").replaceAll('"', '""');
        return `"${valor}"`;
    }).join(";")).join("\n");
    const blob = new Blob([`\uFEFF${encabezado}\n${cuerpo}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${nombre}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
};

// Encierra el valor entre comillas y duplica las comillas internas para que una coma no parta la celda.
const celda = (valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`;

// Excel de camiones. Sin patente totaliza todos; con patente deja solo ese camión y sus manifiestos cerrados.
const descargarExcelCamiones = (informe, tituloPeriodo, patente = "") => {
    const camiones = (informe?.vueltas || []).filter((item) => !patente || item.patente === patente);
    const detalle = (informe?.detalleVueltas || []).filter((item) => !patente || item.patente === patente);
    const elegido = camiones[0];
    const ordenes = camiones.reduce((suma, item) => suma + Number(item.ordenes || 0), 0);
    const kilos = camiones.reduce((suma, item) => suma + Number(item.kilos || 0), 0);
    const m3 = camiones.reduce((suma, item) => suma + Number(item.m3 || 0), 0);
    const vueltas = camiones.reduce((suma, item) => suma + Number(item.vueltas || 0), 0);
    const manifiestos = camiones.reduce((suma, item) => suma + Number(item.manifiestos || item.vueltas || 0), 0);
    const titulo = patente ? `Camión ${patente}` : "Total de camiones";
    const lineas = [
        titulo,
        ["Vueltas", "Manifiestos", "Órdenes", "Kilos", "m3"].map(celda).join(";"),
        [vueltas, manifiestos, ordenes, textoMedida(kilos, 2), textoMedida(m3, 3)].map(celda).join(";"),
        ""
    ];
    if (!patente) {
        lineas.push(
            "Totalización por camión",
            ["Patente", "Camión", "Vueltas", "Manifiestos", "Órdenes", "Kilos", "m3"].map(celda).join(";"),
            ...camiones.map((item) => [
                item.patente,
                item.camion,
                item.vueltas,
                item.manifiestos || item.vueltas,
                item.ordenes,
                textoMedida(item.kilos, 2),
                textoMedida(item.m3, 3)
            ].map(celda).join(";")),
            ""
        );
    }
    lineas.push(
        patente ? `Manifiestos de ${elegido?.camion || patente}` : "Manifiestos",
        ["Manifiesto", "Fecha", "Estado", "Patente", "Camión", "Conductor", "Peoneta", "Órdenes", "Kilos", "m3"].map(celda).join(";"),
        ...detalle.map((item) => [
            item.manifiesto,
            formatearFechaHora(item.fecha),
            item.estado,
            item.patente,
            item.camion,
            item.conductor,
            item.peoneta,
            (item.ordenesDetalle || []).map((orden) => `${orden.numeroOT} ${orden.resultado || ""}`.trim()).join(", ") || item.ordenes,
            textoMedida(item.kilos, 2),
            textoMedida(item.m3, 3)
        ].map(celda).join(";")),
        "",
        "Órdenes de cada manifiesto",
        ["Manifiesto", "OT", "Resultado", "Cliente", "Peoneta", "Kilos", "m3"].map(celda).join(";"),
        ...(detalle.some((item) => (item.ordenesDetalle || []).length)
            ? detalle.flatMap((item) => (item.ordenesDetalle || []).map((orden) => [
                item.manifiesto,
                orden.numeroOT,
                orden.resultado,
                orden.cliente,
                item.peoneta,
                textoMedida(orden.kilos, 2),
                textoMedida(orden.m3, 3)
            ].map(celda).join(";")))
            : [celda("Sin manifiestos cerrados en este período")])
    );
    const archivo = patente
        ? `camion-${patente}-${informe?.etiqueta || tituloPeriodo}`
        : `camiones-${informe?.etiqueta || tituloPeriodo}`;
    descargarTexto(archivo.replaceAll(" ", "-"), lineas);
};

// PDF horizontal de entregas, para imprimir el mismo listado sin abrir Excel.
const descargarPdf = (titulo, columnas, filas) => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(titulo, 14, 16);
    doc.setFontSize(9);
    let y = 26;
    doc.text(columnas.map((columna) => columna.titulo).join(" | "), 14, y);
    y += 6;
    filas.forEach((fila) => {
        if (y > 190) {
            doc.addPage();
            y = 16;
        }
        const linea = columnas.map((columna) => String(fila[columna.clave] ?? "")).join(" | ");
        doc.text(linea.slice(0, 180), 14, y);
        y += 6;
    });
    if (!filas.length) {
        doc.text("Sin registros en el período.", 14, y);
    }
    doc.save(`${titulo}.pdf`);
};

export default function ReportesPage() {
    const [periodo, setPeriodo] = useState("mes");
    const [fecha, setFecha] = useState(hoyChile);
    const [anioBorrador, setAnioBorrador] = useState("");
    const [informe, setInforme] = useState(null);
    const [camionInforme, setCamionInforme] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);

    // Pide el informe. Al cambiar el período se llama con el valor nuevo, porque el estado aún no se actualizó.
    const cargar = async (siguientePeriodo = periodo, siguienteFecha = fecha) => {
        setCargando(true);
        try {
            const datos = await api(`/reportes?periodo=${siguientePeriodo}&fecha=${siguienteFecha}`);
            setInforme(datos);
            setMensaje("");
        } catch (error) {
            setMensaje(error.message);
        } finally {
            setCargando(false);
        }
    };

    // Al entrar muestra el mes en curso. El día, la semana o el año se piden con Ver informe.
    useEffect(() => {
        cargar();
    }, []);

    // Entregas listas para la tabla y para Excel/PDF, con fecha y plata ya en texto.
    const columnasEntregas = [
        { clave: "fechaTexto", titulo: "Fecha" },
        { clave: "numeroOT", titulo: "OT" },
        { clave: "cliente", titulo: "Cliente" },
        { clave: "resultado", titulo: "Resultado" },
        { clave: "receptor", titulo: "Receptor" },
        { clave: "valorTexto", titulo: "Valor" }
    ];
    const entregas = (informe?.entregas || []).map((item) => ({
        ...item,
        fechaTexto: formatearFechaHora(item.fecha),
        valorTexto: formatearCLP(item.valor)
    }));
    const nombresPeriodo = {
        dia: "día",
        semana: "semana",
        mes: "mes",
        anio: "año"
    };
    const lunes = lunesDe(fecha);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const tituloPeriodo = periodo === "anio"
        ? `año ${fecha.slice(0, 4)}`
        : periodo === "mes"
            ? partirFecha(fecha).toLocaleDateString("es-CL", { month: "long", year: "numeric" })
            : periodo === "semana"
                ? `semana del ${lunes.getDate()} al ${domingo.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`
                : textoDia(fecha);
    const campoPeriodo = {
        dia: { rotulo: "Día", tipo: "date", valor: fecha, cambiar: (valor) => valor && setFecha(valor) },
        semana: { rotulo: "Semana", tipo: "week", valor: semanaIso(fecha), cambiar: (valor) => valor && setFecha(lunesDeSemanaIso(valor)) },
        mes: { rotulo: "Mes", tipo: "month", valor: fecha.slice(0, 7), cambiar: (valor) => valor && setFecha(`${valor}-01`) },
        anio: {
            rotulo: "Año",
            tipo: "number",
            valor: anioBorrador || fecha.slice(0, 4),
            cambiar: (valor) => {
                if (!/^\d{0,4}$/.test(valor)) return;
                setAnioBorrador(valor);
                const anio = Number(valor);
                if (valor.length === 4 && anio >= 2000 && anio <= 2100) {
                    setFecha(`${anio}-01-01`);
                    setAnioBorrador("");
                }
            }
        }
    }[periodo];
    const camionesPeriodo = informe?.vueltas || [];
    const camionElegido = camionesPeriodo.find((item) => item.patente === camionInforme) || null;
    const manifiestosCamion = (informe?.detalleVueltas || []).filter((item) => !camionInforme || item.patente === camionInforme);
    const resumenCamion = camionElegido || {
        vueltas: informe?.totales?.vueltas || 0,
        manifiestos: informe?.totales?.manifiestos || 0,
        ordenes: camionesPeriodo.reduce((suma, item) => suma + Number(item.ordenes || 0), 0),
        kilos: informe?.totales?.kilos || 0,
        m3: informe?.totales?.m3 || 0
    };

    return (
        <>
            {/* Filtro: el campo de la izquierda cambia según día, semana, mes o año. */}
            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>GESTIÓN</span>
                        <h2>Informes de rentabilidad</h2>
                    </div>
                </header>
                <Message texto={mensaje} tipo="error" />
                <form
                    className="mx-toolbar"
                    onSubmit={(event) => {
                        event.preventDefault();
                        cargar();
                    }}
                >
                    <label className="flex min-w-60 flex-1 items-center gap-2 text-sm font-semibold text-marino">
                        <span className="shrink-0">{campoPeriodo.rotulo}</span>
                        <input
                            className="min-w-0 flex-1"
                            type={campoPeriodo.tipo}
                            min={campoPeriodo.tipo === "number" ? "2000" : undefined}
                            max={campoPeriodo.tipo === "number" ? "2100" : undefined}
                            step={campoPeriodo.tipo === "number" ? "1" : undefined}
                            value={campoPeriodo.valor}
                            onChange={(event) => campoPeriodo.cambiar(event.target.value)}
                            onBlur={() => setAnioBorrador("")}
                            aria-label={campoPeriodo.rotulo}
                        />
                    </label>
                    <select
                        value={periodo}
                        onChange={(event) => {
                            const siguiente = event.target.value;
                            setAnioBorrador("");
                            setPeriodo(siguiente);
                            cargar(siguiente, fecha);
                        }}
                        aria-label="Período"
                    >
                        <option value="dia">Por día</option>
                        <option value="semana">Por semana</option>
                        <option value="mes">Por mes</option>
                        <option value="anio">Por año</option>
                    </select>
                    <button className="button-primary" type="submit" disabled={cargando}>
                        {cargando ? "Calculando..." : "Ver informe"}
                    </button>
                </form>
                <div className="mx-ciudad-info">
                    <p><span>Ingresos</span><strong>{formatearCLP(informe?.totales?.ingresos || 0)}</strong></p>
                    <p><span>Órdenes</span><strong>{informe?.totales?.ordenes || 0}</strong></p>
                    <p><span>Vueltas</span><strong>{informe?.totales?.vueltas || 0}</strong></p>
                    <p><span>Entregas</span><strong>{informe?.totales?.entregas || 0}</strong></p>
                </div>
            </section>

            {/* Gráficos del período: una barra por día con órdenes e ingresos. */}
            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>EMPRESA</span>
                        <h2>Ingresos del período</h2>
                    </div>
                </header>
                <GraficoBarras
                    titulo={`Órdenes, ${tituloPeriodo}`}
                    unidad="órdenes"
                    datos={(informe?.serie || []).map((item) => ({ nombre: item.dia, valor: item.ordenes }))}
                />
                <GraficoBarras
                    titulo={`Ingresos, ${tituloPeriodo}`}
                    formato={formatearCLP}
                    datos={(informe?.serie || []).map((item) => ({ nombre: item.dia, valor: Math.round(item.ingresos || 0) }))}
                />
            </section>

            {/* Camiones: todos o una patente. Solo manifiestos con cada OT entregada o rechazada. */}
            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>CAMIONES</span>
                        <h2>{camionElegido ? `${camionElegido.patente} · ${camionElegido.camion}` : `Total del ${nombresPeriodo[periodo] || "mes"}`}</h2>
                    </div>
                    <div className="mx-acciones">
                        <select
                            className="w-auto min-w-52"
                            value={camionInforme}
                            aria-label="Camión del informe"
                            onChange={(event) => setCamionInforme(event.target.value)}
                        >
                            <option value="">Todos los camiones</option>
                            {camionesPeriodo.map((item) => (
                                <option key={item.patente} value={item.patente}>
                                    {item.patente} · {item.camion}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => descargarExcelCamiones(informe, tituloPeriodo, camionInforme)}
                        >
                            Excel
                        </button>
                    </div>
                </header>
                <p className="mx-note">
                    {camionElegido
                        ? "Manifiestos de este camión que ya están cerrados: todas las órdenes entregadas o rechazadas."
                        : "Total de camiones con manifiestos cerrados. No entran los que están en creación ni los que siguen pendientes."}
                </p>
                <div className="mx-ciudad-info">
                    <p><span>Vueltas</span><strong>{resumenCamion.vueltas || 0}</strong></p>
                    <p><span>Manifiestos</span><strong>{resumenCamion.manifiestos || resumenCamion.vueltas || 0}</strong></p>
                    <p><span>Órdenes</span><strong>{resumenCamion.ordenes || 0}</strong></p>
                    <p><span>Kilos</span><strong>{textoMedida(resumenCamion.kilos, 2)}</strong></p>
                    <p><span>m³</span><strong>{textoMedida(resumenCamion.m3, 3)}</strong></p>
                </div>
                {camionElegido ? (
                    <div className="mx-table-wrap">
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Manifiesto</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Conductor</th>
                                    <th>Peoneta</th>
                                    <th>Órdenes</th>
                                    <th>Kilos</th>
                                    <th>m³</th>
                                </tr>
                            </thead>
                            <tbody>
                                {manifiestosCamion.length === 0 ? (
                                    <tr><td colSpan={8} className="mx-empty">Este camión no tiene manifiestos cerrados en el período.</td></tr>
                                ) : manifiestosCamion.map((item) => (
                                    <tr key={item.manifiesto}>
                                        <td>{item.manifiesto}</td>
                                        <td>{formatearFechaHora(item.fecha)}</td>
                                        <td>{item.estado}</td>
                                        <td>{item.conductor}</td>
                                        <td>{item.peoneta || "Sin peoneta"}</td>
                                        <td>{(item.ordenesDetalle || []).map((orden) => `${orden.numeroOT} · ${orden.resultado || "Pendiente"}`).join(", ") || item.ordenes}</td>
                                        <td>{textoMedida(item.kilos, 2)}</td>
                                        <td>{textoMedida(item.m3, 3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="mx-table-wrap">
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Patente</th>
                                    <th>Camión</th>
                                    <th>Vueltas</th>
                                    <th>Manifiestos</th>
                                    <th>Órdenes</th>
                                    <th>Kilos</th>
                                    <th>m³</th>
                                </tr>
                            </thead>
                            <tbody>
                                {camionesPeriodo.length === 0 ? (
                                    <tr><td colSpan={7} className="mx-empty">No hay manifiestos cerrados en este período.</td></tr>
                                ) : camionesPeriodo.map((item) => (
                                    <tr key={item.patente}>
                                        <td>{item.patente}</td>
                                        <td>{item.camion}</td>
                                        <td>{item.vueltas}</td>
                                        <td>{item.manifiestos || item.vueltas}</td>
                                        <td>{item.ordenes}</td>
                                        <td>{textoMedida(item.kilos, 2)}</td>
                                        <td>{textoMedida(item.m3, 3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Qué clientes aportaron ingresos en el período. */}
            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>CLIENTES</span>
                        <h2>Rentabilidad {periodo === "dia" ? "diaria" : periodo === "semana" ? "semanal" : periodo === "anio" ? "anual" : "mensual"}</h2>
                    </div>
                </header>
                <GraficoBarras
                    titulo="Ingresos por cliente"
                    formato={formatearCLP}
                    datos={(informe?.clientes || []).slice(0, 8).map((item) => ({
                        nombre: item.cliente,
                        valor: Math.round(item.ingresos)
                    }))}
                />
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Órdenes</th>
                                <th>Ingresos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(informe?.clientes || []).length === 0 ? (
                                <tr><td colSpan={3} className="mx-empty">No hay órdenes activas en este período.</td></tr>
                            ) : informe.clientes.map((item) => (
                                <tr key={item.cliente}>
                                    <td>{item.cliente}</td>
                                    <td>{item.ordenes}</td>
                                    <td>{formatearCLP(item.ingresos)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Resultado de cada entrega, exportable a Excel o PDF. */}
            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>ENTREGAS</span>
                        <h2>Resultado de entregas</h2>
                    </div>
                    <div className="mx-acciones">
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => descargarExcel(`entregas-${informe?.etiqueta || fecha}`, columnasEntregas, entregas)}
                        >
                            Excel
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => descargarPdf(`Entregas ${tituloPeriodo}`, columnasEntregas, entregas)}
                        >
                            PDF
                        </button>
                    </div>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>OT</th>
                                <th>Cliente</th>
                                <th>Resultado</th>
                                <th>Receptor</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entregas.length === 0 ? (
                                <tr><td colSpan={6} className="mx-empty">No hay entregas registradas en este período.</td></tr>
                            ) : entregas.map((item) => (
                                <tr key={`${item.numeroOT}-${item.fecha}`}>
                                    <td>{item.fechaTexto}</td>
                                    <td>{item.numeroOT}</td>
                                    <td>{item.cliente}</td>
                                    <td>{item.resultado}</td>
                                    <td>{item.receptor}</td>
                                    <td>{item.valorTexto}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

import { useEffect, useState } from "react";
import { Link } from "react-router";
import Message from "../../components/Message.jsx";
import { etiquetaComuna, formatearCLP, formatearKg, formatearM3 } from "../../utils.js";
import { useCliente } from "./clienteContexto.jsx";
import { cotizar, obtenerComunas } from "./clienteDatos.js";

const tipos = ["Bulto", "Pallet", "Saco"];
const bultoVacio = { tipo: "Bulto", cantidad: "1", pesoUnitario: "", largoCm: "", anchoCm: "", altoCm: "" };

const volumenDe = (b) => (Number(b.largoCm) * Number(b.anchoCm) * Number(b.altoCm) * Number(b.cantidad)) / 1000000;

export default function CotizarPage() {
    const { modoEjemplo } = useCliente();
    const [comunas, setComunas] = useState([]);
    const [ruta, setRuta] = useState({ idComunaOrigen: "", idComunaDestino: "", tipoServicio: "NORMAL" });
    const [bulto, setBulto] = useState(bultoVacio);
    const [bultos, setBultos] = useState([]);
    const [resultado, setResultado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");

    useEffect(() => {
        let vigente = true;
        obtenerComunas()
            .then(({ datos }) => vigente && setComunas(datos))
            .catch((error) => vigente && setMensaje(error.message));
        return () => {
            vigente = false;
        };
    }, []);

    const aviso = (texto, clase = "info") => {
        setMensaje(texto);
        setTipo(clase);
    };

    // Cualquier cambio en los datos invalida el valor calculado
    const cambiarRuta = (campo, valor) => {
        setRuta((prev) => ({ ...prev, [campo]: valor }));
        setResultado(null);
    };

    const anadirBulto = () => {
        const valido = Number(bulto.cantidad) >= 1 && Number(bulto.pesoUnitario) > 0
            && Number(bulto.largoCm) > 0 && Number(bulto.anchoCm) > 0 && Number(bulto.altoCm) > 0;
        if (!valido) {
            aviso("Completa cantidad, peso y las tres medidas del bulto (mayores a 0).", "error");
            return;
        }
        setBultos((prev) => [...prev, bulto]);
        setBulto(bultoVacio);
        setResultado(null);
        aviso("");
    };

    const pesoTotal = bultos.reduce((s, b) => s + Number(b.pesoUnitario) * Number(b.cantidad), 0);
    const volumenTotal = bultos.reduce((s, b) => s + volumenDe(b), 0);
    const cantidadTotal = bultos.reduce((s, b) => s + Number(b.cantidad), 0);
    const listo = ruta.idComunaOrigen && ruta.idComunaDestino && bultos.length > 0;
    const comunaPorId = (id) => comunas.find((c) => String(c.idComuna) === String(id));

    const calcular = async () => {
        setCargando(true);
        aviso("");
        try {
            const { datos } = await cotizar(
                {
                    idComunaOrigen: Number(ruta.idComunaOrigen),
                    idComunaDestino: Number(ruta.idComunaDestino),
                    tipoServicio: ruta.tipoServicio,
                    bultos: bultos.map((b) => ({
                        tipo: b.tipo,
                        cantidad: Number(b.cantidad),
                        pesoUnitario: Number(b.pesoUnitario),
                        largoCm: Number(b.largoCm),
                        anchoCm: Number(b.anchoCm),
                        altoCm: Number(b.altoCm)
                    }))
                },
                comunas
            );
            setResultado(datos);
            aviso(`Cotización ${datos.numero} guardada en Mis cotizaciones.`, "success");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const nueva = () => {
        setRuta({ idComunaOrigen: "", idComunaDestino: "", tipoServicio: "NORMAL" });
        setBultos([]);
        setResultado(null);
        aviso("");
    };

    return (
        <section className="ot-layout">
            <div className="ot-contenido">
                <Message texto={mensaje} tipo={tipo} />

                <section className="ot-seccion abierta">
                    <div className="ot-seccion-body">
                        <h3>1. Ruta y servicio</h3>
                        <div className="ot-grid">
                            <div className="field">
                                <label htmlFor="cot-origen">Comuna de origen *</label>
                                <select id="cot-origen" value={ruta.idComunaOrigen} onChange={(e) => cambiarRuta("idComunaOrigen", e.target.value)}>
                                    <option value="">Seleccione comuna</option>
                                    {comunas.map((c) => (
                                        <option key={c.idComuna} value={c.idComuna}>{etiquetaComuna(c)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="cot-destino">Comuna de destino *</label>
                                <select id="cot-destino" value={ruta.idComunaDestino} onChange={(e) => cambiarRuta("idComunaDestino", e.target.value)}>
                                    <option value="">Seleccione comuna</option>
                                    {comunas.map((c) => (
                                        <option key={c.idComuna} value={c.idComuna}>{etiquetaComuna(c)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="cot-servicio">Tipo de servicio</label>
                                <select id="cot-servicio" value={ruta.tipoServicio} onChange={(e) => cambiarRuta("tipoServicio", e.target.value)}>
                                    <option value="NORMAL">Normal</option>
                                    <option value="EXPRESS">Express</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="ot-seccion abierta">
                    <div className="ot-seccion-body">
                        <h3>2. Carga</h3>
                        <div className="ot-bulto-form">
                            <div className="ot-grid">
                                <div className="field">
                                    <label htmlFor="cot-tipo">Tipo</label>
                                    <select id="cot-tipo" value={bulto.tipo} onChange={(e) => setBulto({ ...bulto, tipo: e.target.value })}>
                                        {tipos.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="field">
                                    <label htmlFor="cot-cantidad">Cantidad</label>
                                    <input id="cot-cantidad" type="number" min="1" value={bulto.cantidad} onChange={(e) => setBulto({ ...bulto, cantidad: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label htmlFor="cot-peso">Peso unitario (kg)</label>
                                    <input id="cot-peso" type="number" min="0" step="0.1" value={bulto.pesoUnitario} onChange={(e) => setBulto({ ...bulto, pesoUnitario: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label htmlFor="cot-largo">Largo (cm)</label>
                                    <input id="cot-largo" type="number" min="0" value={bulto.largoCm} onChange={(e) => setBulto({ ...bulto, largoCm: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label htmlFor="cot-ancho">Ancho (cm)</label>
                                    <input id="cot-ancho" type="number" min="0" value={bulto.anchoCm} onChange={(e) => setBulto({ ...bulto, anchoCm: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label htmlFor="cot-alto">Alto (cm)</label>
                                    <input id="cot-alto" type="number" min="0" value={bulto.altoCm} onChange={(e) => setBulto({ ...bulto, altoCm: e.target.value })} />
                                </div>
                                <div className="mx-form-actions">
                                    <button type="button" className="button-secondary" onClick={anadirBulto}>Añadir bulto</button>
                                </div>
                            </div>
                        </div>

                        <div className="mx-table-wrap">
                            <table className="mx-table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Cant.</th>
                                        <th>Peso unit.</th>
                                        <th>Medidas</th>
                                        <th>Volumen</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bultos.length === 0 ? (
                                        <tr><td colSpan={6} className="mx-empty">Aún no hay bultos. Completa el formulario y pulsa Añadir bulto.</td></tr>
                                    ) : bultos.map((b, indice) => (
                                        <tr key={`${b.tipo}-${indice}`}>
                                            <td>{b.tipo}</td>
                                            <td>{b.cantidad}</td>
                                            <td>{formatearKg(b.pesoUnitario)}</td>
                                            <td>{b.largoCm} × {b.anchoCm} × {b.altoCm} cm</td>
                                            <td>{formatearM3(volumenDe(b))}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="button-danger"
                                                    onClick={() => {
                                                        setBultos((prev) => prev.filter((_, i) => i !== indice));
                                                        setResultado(null);
                                                    }}
                                                >
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <div className="mx-form-actions">
                    <button type="button" className="button-primary" onClick={calcular} disabled={!listo || cargando}>
                        {cargando ? "Calculando..." : "Calcular cotización"}
                    </button>
                    <button type="button" className="button-secondary" onClick={nueva} disabled={cargando}>
                        Nueva cotización
                    </button>
                </div>
            </div>

            <aside className="ot-resumen">
                <h2>Resumen</h2>
                <p>{resultado ? `Cotización ${resultado.numero}` : "Completa la ruta y la carga para cotizar."}</p>
                <div className="ot-resumen-bloque">
                    <h3>Ruta</h3>
                    <span>Origen</span><strong>{comunaPorId(ruta.idComunaOrigen)?.nombreComuna || "—"}</strong>
                    <span>Destino</span><strong>{comunaPorId(ruta.idComunaDestino)?.nombreComuna || "—"}</strong>
                    <span>Servicio</span><strong>{ruta.tipoServicio === "EXPRESS" ? "Express" : "Normal"}</strong>
                </div>
                <div className="ot-resumen-bloque">
                    <h3>Carga</h3>
                    <span>Bultos</span><strong>{cantidadTotal}</strong>
                    <span>Peso total</span><strong>{formatearKg(pesoTotal)}</strong>
                    <span>Volumen</span><strong>{formatearM3(volumenTotal)}</strong>
                </div>
                {resultado ? (
                    <>
                        <div className="ot-resumen-bloque">
                            <h3>Valor</h3>
                            <span>Neto</span><strong>{formatearCLP(resultado.valorNeto)}</strong>
                            <span>IVA (19%)</span><strong>{formatearCLP(resultado.valorIva)}</strong>
                            <span>Válida hasta</span><strong>{new Intl.DateTimeFormat("es-CL", { dateStyle: "short" }).format(new Date(resultado.validaHasta))}</strong>
                            <div className="ot-resumen-total">
                                <span>Total</span>
                                <strong>{formatearCLP(resultado.valorTotal)}</strong>
                            </div>
                        </div>
                        {modoEjemplo ? (
                            <p className="mx-note">Valor referencial de ejemplo: el precio real lo calculará el backend con tu tarifario.</p>
                        ) : null}
                        <Link className="button-secondary mt-3 w-full" to="/cliente/cotizaciones">Ver mis cotizaciones</Link>
                    </>
                ) : null}
            </aside>
        </section>
    );
}

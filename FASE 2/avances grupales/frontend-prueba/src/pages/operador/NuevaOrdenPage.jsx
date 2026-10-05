import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import { etiquetaComuna, formatearCLP, formatearKg, formatearM3, textoResumenTipos, etiquetaTipoCarga } from "../../utils.js";
import Message from "../../components/Message.jsx";
import AltaClienteForm from "../../components/AltaClienteForm.jsx";
import AltaDestinatarioForm from "../../components/AltaDestinatarioForm.jsx";
import DocumentosEmision from "../../components/DocumentosEmision.jsx";

const cargaVacia = () => ({
    id: crypto.randomUUID(),
    idTipoBulto: "",
    descripcion: "",
    cantidad: 1,
    pesoUnitario: "",
    largoCm: "",
    anchoCm: "",
    altoCm: ""
});

const volumenDeCarga = (carga) => {
    const cantidad = Number(carga.cantidad) || 0;
    const largo = Number(carga.largoCm) || 0;
    const ancho = Number(carga.anchoCm) || 0;
    const alto = Number(carga.altoCm) || 0;
    return (largo * ancho * alto * cantidad) / 1000000;
};

const pesoDeCarga = (carga) =>
    (Number(carga.pesoUnitario) || 0) * (Number(carga.cantidad) || 0);

const consolidarCargas = (lista) => {
    if (lista.length === 0) {
        return [];
    }

    const piezas = lista.reduce((total, item) => total + (Number(item.cantidad) || 0), 0);
    const pesoTotal = lista.reduce((total, item) => total + pesoDeCarga(item), 0);
    const volumenTotal = lista.reduce((total, item) => total + volumenDeCarga(item), 0);
    const ladoCm = volumenTotal > 0 ? Math.cbrt(volumenTotal * 1000000) : 0;
    const descripcion = lista
        .map((item) => `${item.cantidad}× ${item.descripcion || "bulto"}`)
        .join("; ");

    return [{
        idTipoBulto: Number(lista[0].idTipoBulto),
        descripcion: `Carga consolidada (${piezas} piezas): ${descripcion}`,
        cantidad: 1,
        pesoUnitario: pesoTotal,
        largoCm: Number(ladoCm.toFixed(1)),
        anchoCm: Number(ladoCm.toFixed(1)),
        altoCm: Number(ladoCm.toFixed(1))
    }];
};

const mismoId = (a, b) => String(a ?? "") === String(b ?? "");

const extraerLista = (datos, clave) => {
    if (Array.isArray(datos)) {
        return datos;
    }
    if (Array.isArray(datos?.[clave])) {
        return datos[clave];
    }
    return [];
};

const idTarifaDeCliente = (cliente) =>
    Number(cliente?.idTarifa || cliente?.tarifa?.idTarifa) || 0;

export default function NuevaOrdenPage() {
    const [paso, setPaso] = useState(0);
    const [clientes, setClientes] = useState([]);
    const [comunas, setComunas] = useState([]);
    const [destinatarios, setDestinatarios] = useState([]);
    const [tiposBulto, setTiposBulto] = useState([]);
    const [cuenta, setCuenta] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("info");
    const [cargando, setCargando] = useState(false);
    const [cotizacion, setCotizacion] = useState(null);
    const [datosCotizados, setDatosCotizados] = useState(null);
    const [altaRemitente, setAltaRemitente] = useState(false);
    const [altaDestinatario, setAltaDestinatario] = useState(false);
    const [ordenCreada, setOrdenCreada] = useState(null);
    const [tarifarios, setTarifarios] = useState([]);
    const [bultoForm, setBultoForm] = useState(cargaVacia());
    const [consolidarCarga, setConsolidarCarga] = useState(false);

    const [formulario, setFormulario] = useState({
        idCliente: "",
        idDestinatario: "",
        idComunaOrigen: "",
        idComunaDestino: "",
        direccionOrigen: "",
        direccionDestino: "",
        contactoOrigen: "",
        telefonoOrigen: "",
        contactoDestino: "",
        telefonoDestino: "",
        referenciaEntrega: "",
        tipoZona: "URBANA",
        tipoServicio: "NORMAL",
        tipoDocumento: "SIN_DOCUMENTO",
        numeroDocumento: "",
        requiereRetiro: "NO",
        fechaRetiro: "",
        direccionRetiro: "",
        valorRetiro: "0",
        tipoRetiro: "PEQUENO",
        aplicaRecargo: "NO",
        descripcionRecargo: "",
        valorRecargo: "0",
        pagadoPor: "",
        tipoPago: "",
        metodoPago: "",
        idCuenta: ""
    });
    const [cargas, setCargas] = useState([]);

    const setCampo = (campo, valor) => {
        setFormulario((prev) => ({ ...prev, [campo]: valor }));
        setCotizacion(null);
        setDatosCotizados(null);
    };

    useEffect(() => {
        Promise.all([
            api("/clientes"),
            api("/comunas"),
            api("/destinatarios"),
            api("/bultos/tipos"),
            api("/maestros/tarifas")
        ])
            .then(([listaClientes, listaComunas, dest, tipos, listaTarifas]) => {
                setClientes(extraerLista(listaClientes, "clientes"));
                setComunas(extraerLista(listaComunas, "comunas"));
                setDestinatarios(dest?.destinatarios || extraerLista(dest, "destinatarios"));
                setTiposBulto(tipos?.tipos || extraerLista(tipos, "tipos"));
                setTarifarios(extraerLista(listaTarifas, "tarifas").filter((item) => item.estado !== false));
            })
            .catch((error) => {
                setMensaje(error.message);
                setTipoMensaje("error");
            });
    }, []);

    const clienteSeleccionado = useMemo(
        () => clientes.find((item) => mismoId(item.idCliente, formulario.idCliente)),
        [clientes, formulario.idCliente]
    );
    const tarifaPorDefecto = useMemo(() => {
        const porNombre = (predicado) =>
            tarifarios.find((item) => predicado(String(item.nombreTarifa || "").toLowerCase()));
        return porNombre((nombre) => nombre.includes("puerto montt") || nombre.includes("osorno"))
            || porNombre((nombre) => nombre.includes("chiloe") || nombre.includes("chiloé"))
            || porNombre((nombre) => nombre.includes("kv") || nombre.includes("k/v"))
            || porNombre((nombre) => nombre.includes("normal"))
            || tarifarios[0]
            || null;
    }, [tarifarios]);
    const idTarifaActual = idTarifaDeCliente(clienteSeleccionado) || Number(tarifaPorDefecto?.idTarifa) || 0;

    useEffect(() => {
        if (!formulario.idCliente) {
            setCuenta(null);
            return;
        }

        api(`/clientes/${formulario.idCliente}/cuenta-corriente`)
            .then(setCuenta)
            .catch((error) => {
                if (error.status === 404) {
                    setCuenta(null);
                    return;
                }
                setMensaje(error.message);
                setTipoMensaje("error");
            });
    }, [formulario.idCliente]);

    const aplicarCliente = (cliente) => {
        if (!cliente) {
            return;
        }

        setFormulario((prev) => ({
            ...prev,
            idCliente: String(cliente.idCliente),
            direccionOrigen: cliente.direccion || "",
            telefonoOrigen: cliente.telefono || "",
            contactoOrigen: cliente.razonSocial || "",
            idComunaOrigen: cliente.idComuna ? String(cliente.idComuna) : prev.idComunaOrigen,
            idCuenta: cliente.cuenta_corriente?.idCuenta
                ? String(cliente.cuenta_corriente.idCuenta)
                : ""
        }));
        setCotizacion(null);
        setDatosCotizados(null);
    };

    const seleccionarCliente = (idCliente) => {
        const cliente = clientes.find((item) => mismoId(item.idCliente, idCliente));
        if (!cliente) {
            setFormulario((prev) => ({
                ...prev,
                idCliente,
                idCuenta: ""
            }));
            return;
        }
        aplicarCliente(cliente);
    };

    const aplicarDestinatario = (dest) => {
        if (!dest) {
            return;
        }

        setFormulario((prev) => ({
            ...prev,
            idDestinatario: String(dest.idDestinatario),
            contactoDestino: dest.nombreRazonSocial || "",
            direccionDestino: dest.direccion || "",
            telefonoDestino: dest.telefono || "",
            referenciaEntrega: dest.referencia || prev.referenciaEntrega,
            idComunaDestino: dest.idComuna ? String(dest.idComuna) : prev.idComunaDestino
        }));
        setCotizacion(null);
        setDatosCotizados(null);
    };

    const seleccionarDestinatario = (idDestinatario) => {
        const dest = destinatarios.find(
            (item) => String(item.idDestinatario) === String(idDestinatario)
        );
        if (!dest) {
            setFormulario((prev) => ({ ...prev, idDestinatario }));
            return;
        }
        aplicarDestinatario(dest);
    };

    const asignarTarifario = async (idTarifa) => {
        if (!idTarifa) {
            return;
        }

        if (!formulario.idCliente) {
            setMensaje("Selecciona primero el cliente y después el tarifario.");
            setTipoMensaje("error");
            return;
        }

        setCargando(true);
        try {
            const resultado = await api(`/clientes/${formulario.idCliente}/tarifa`, {
                method: "PUT",
                body: JSON.stringify({ idTarifa: Number(idTarifa) })
            });
            const cliente = resultado.cliente || resultado;
            const tarifa = cliente.tarifa
                || tarifarios.find((item) => mismoId(item.idTarifa, idTarifa));
            const actualizado = {
                ...cliente,
                idCliente: cliente.idCliente ?? Number(formulario.idCliente),
                idTarifa: Number(cliente.idTarifa || idTarifa),
                tarifa
            };

            setClientes((prev) => {
                const existe = prev.some((item) => mismoId(item.idCliente, actualizado.idCliente));
                if (!existe) {
                    return [actualizado, ...prev];
                }
                return prev.map((item) => (
                    mismoId(item.idCliente, actualizado.idCliente)
                        ? { ...item, ...actualizado }
                        : item
                ));
            });
            setCotizacion(null);
            setDatosCotizados(null);
            setMensaje("Tarifario asignado al cliente.");
            setTipoMensaje("success");
        } catch (error) {
            setMensaje(error.message);
            setTipoMensaje("error");
        } finally {
            setCargando(false);
        }
    };

    const volumenCarga = volumenDeCarga;

    const totalesCarga = useMemo(() => {
        const porTipo = {};
        let piezas = 0;
        let peso = 0;
        let volumen = 0;
        for (const item of cargas) {
            const cantidad = Number(item.cantidad) || 0;
            const tipo = etiquetaTipoCarga(
                tiposBulto.find((t) => mismoId(t.idTipoBulto, item.idTipoBulto))?.nombreTipo
            );
            porTipo[tipo] = (porTipo[tipo] || 0) + cantidad;
            piezas += cantidad;
            peso += pesoDeCarga(item);
            volumen += volumenDeCarga(item);
        }
        return { piezas, peso, volumen, porTipo };
    }, [cargas, tiposBulto]);

    const setBultoCampo = (campo, valor) => {
        setBultoForm((prev) => ({ ...prev, [campo]: valor }));
    };

    const anadirBulto = () => {
        if (!bultoForm.idTipoBulto) {
            setMensaje("Selecciona el tipo de bulto antes de añadirlo.");
            setTipoMensaje("error");
            return;
        }

        if (!Number(bultoForm.cantidad) || Number(bultoForm.cantidad) <= 0) {
            setMensaje("La cantidad del bulto debe ser mayor a 0.");
            setTipoMensaje("error");
            return;
        }

        setCargas((prev) => [
            ...prev,
            {
                ...bultoForm,
                id: crypto.randomUUID(),
                cantidad: Number(bultoForm.cantidad) || 1
            }
        ]);
        setBultoForm({
            ...cargaVacia(),
            idTipoBulto: bultoForm.idTipoBulto
        });
        setCotizacion(null);
        setDatosCotizados(null);
        setMensaje("Bulto añadido a la carga.");
        setTipoMensaje("success");
    };

    const consolidarBultosAgregados = () => {
        if (cargas.length < 2) {
            setMensaje("Agrega al menos dos líneas de bultos para consolidar.");
            setTipoMensaje("error");
            return;
        }

        const consolidada = consolidarCargas(cargas)[0];
        setCargas([{ ...consolidada, id: crypto.randomUUID() }]);
        setConsolidarCarga(true);
        setCotizacion(null);
        setDatosCotizados(null);
        setMensaje("Carga consolidada en un solo bulto.");
        setTipoMensaje("success");
    };

    const armarPayload = () => {
        const recargos = formulario.aplicaRecargo === "SI"
            ? [{
                descripcion: formulario.descripcionRecargo,
                monto: Number(formulario.valorRecargo) || 0
            }]
            : [];

        const datos = {
            direccionOrigen: formulario.direccionOrigen,
            direccionDestino: formulario.direccionDestino,
            idCliente: Number(formulario.idCliente),
            idDestinatario: Number(formulario.idDestinatario) || null,
            idComunaOrigen: Number(formulario.idComunaOrigen),
            idComunaDestino: Number(formulario.idComunaDestino),
            idTarifa: idTarifaDeCliente(clienteSeleccionado) || Number(tarifaPorDefecto?.idTarifa) || undefined,
            tipoZona: formulario.tipoZona,
            requiereRetiro: formulario.requiereRetiro === "SI",
            cargas: consolidarCarga
                ? consolidarCargas(cargas)
                : cargas.map((carga) => ({
                    idTipoBulto: Number(carga.idTipoBulto),
                    descripcion: carga.descripcion,
                    cantidad: Number(carga.cantidad),
                    pesoUnitario: Number(carga.pesoUnitario) || 0,
                    largoCm: Number(carga.largoCm) || 0,
                    anchoCm: Number(carga.anchoCm) || 0,
                    altoCm: Number(carga.altoCm) || 0
                })),
            recargos
        };

        if (datos.requiereRetiro) {
            datos.retiro = {
                fechaProgramada: formulario.fechaRetiro || null,
                direccionRetiro: formulario.direccionRetiro,
                tipoRetiro: formulario.tipoRetiro || "PEQUENO"
            };
        }

        return datos;
    };

    const calcular = async () => {
        setMensaje("");
        const datos = armarPayload();

        if (
            !datos.direccionOrigen ||
            !datos.direccionDestino ||
            !datos.idCliente ||
            !datos.idComunaOrigen ||
            !datos.idComunaDestino ||
            datos.cargas.length === 0
        ) {
            setMensaje("Completa remitente, destinatario, comunas y al menos una carga.");
            setTipoMensaje("error");
            return;
        }

        if (datos.cargas.some((carga) => !carga.idTipoBulto)) {
            setMensaje("Cada carga debe tener un tipo de bulto.");
            setTipoMensaje("error");
            setPaso(2);
            return;
        }

        setCargando(true);
        try {
            const resultado = await api("/ordenes-transporte/calcular", {
                method: "POST",
                body: JSON.stringify(datos)
            });
            setCotizacion(resultado.calculo);
            setDatosCotizados(datos);
            setMensaje("Cotización calculada. Revisa el resumen y confirma la OT.");
            setTipoMensaje("success");
            setPaso(4);
        } catch (error) {
            setCotizacion(null);
            setDatosCotizados(null);
            setMensaje(error.message);
            setTipoMensaje("error");
        } finally {
            setCargando(false);
        }
    };

    const confirmar = async () => {
        if (!datosCotizados) {
            setMensaje("Primero debes calcular la cotización.");
            setTipoMensaje("error");
            return;
        }

        if (formulario.tipoDocumento !== "SIN_DOCUMENTO" && !formulario.numeroDocumento.trim()) {
            setMensaje("Debes ingresar el número del documento.");
            setTipoMensaje("error");
            return;
        }

        if (!formulario.pagadoPor || !formulario.tipoPago) {
            setMensaje("Debes indicar quién paga y el tipo de pago.");
            setTipoMensaje("error");
            return;
        }

        if (formulario.tipoPago === "CONTADO" && !formulario.metodoPago) {
            setMensaje("Debes seleccionar el método de pago.");
            setTipoMensaje("error");
            return;
        }

        if (formulario.tipoPago === "CUENTA_CORRIENTE" && !formulario.idCuenta) {
            setMensaje("Debes seleccionar una cuenta corriente.");
            setTipoMensaje("error");
            return;
        }

        setCargando(true);
        setMensaje("");

        try {
            const resultado = await api("/ordenes-transporte", {
                method: "POST",
                body: JSON.stringify({
                    ...datosCotizados,
                    tipoServicio: formulario.tipoServicio,
                    tipoDocumento: formulario.tipoDocumento,
                    numeroDocumento: formulario.numeroDocumento.trim() || null,
                    contactoOrigen: formulario.contactoOrigen || null,
                    telefonoOrigen: formulario.telefonoOrigen || null,
                    contactoDestino: formulario.contactoDestino || null,
                    telefonoDestino: formulario.telefonoDestino || null,
                    referenciaEntrega: formulario.referenciaEntrega || null,
                    pagadoPor: formulario.pagadoPor,
                    tipoPago: formulario.tipoPago,
                    metodoPago: formulario.tipoPago === "CONTADO" ? formulario.metodoPago : null,
                    idCuenta: formulario.tipoPago === "CUENTA_CORRIENTE"
                        ? Number(formulario.idCuenta)
                        : null
                })
            });

            const ordenCreada = resultado.orden || resultado;
            let orden = ordenCreada;
            if (ordenCreada?.numeroOT) {
                try {
                    orden = await api(`/ordenes-transporte/numero/${encodeURIComponent(ordenCreada.numeroOT)}`);
                } catch {
                    orden = ordenCreada;
                }
            }
            setOrdenCreada(orden);
            setMensaje(`Orden creada correctamente${orden?.numeroOT ? `: ${orden.numeroOT}` : ""}. Imprime la OT y luego las etiquetas.`);
            setTipoMensaje("success");
            setCotizacion(null);
            setDatosCotizados(null);
        } catch (error) {
            setMensaje(error.message);
            setTipoMensaje("error");
        } finally {
            setCargando(false);
        }
    };

    const pasos = ["Remitente", "Destinatario", "Carga", "Servicio", "Resumen"];

    return (
        <section className="ot-layout">
            <div className="ot-contenido">
            <div className="ot-pasos">
                {pasos.map((nombre, indice) => (
                    <button
                        key={nombre}
                        type="button"
                        className={`ot-paso${paso === indice ? " activo" : ""}`}
                        onClick={() => setPaso(indice)}
                    >
                        {nombre}
                    </button>
                ))}
            </div>

            <Message texto={mensaje} tipo={tipoMensaje} />

            {paso === 0 && (
                <section className="ot-seccion abierta">
                    <div className="ot-seccion-body">
                        <div className="mx-toolbar">
                            <p className="mx-note">Selecciona un cliente existente o registra uno nuevo para esta OT.</p>
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={() => setAltaRemitente((prev) => !prev)}
                            >
                                {altaRemitente ? "Cerrar alta" : "Nuevo remitente"}
                            </button>
                        </div>
                        {altaRemitente ? (
                            <AltaClienteForm
                                comunas={comunas}
                                ocultarValoresTarifa
                                onCancelar={() => setAltaRemitente(false)}
                                onCreado={(cliente) => {
                                    setClientes((prev) => [
                                        cliente,
                                        ...prev.filter((item) => item.idCliente !== cliente.idCliente)
                                    ]);
                                    aplicarCliente(cliente);
                                    setAltaRemitente(false);
                                    setMensaje("Remitente creado y seleccionado.");
                                    setTipoMensaje("success");
                                }}
                            />
                        ) : null}
                        <div className="ot-grid">
                            <div className="field">
                                <label>Cliente</label>
                                <select
                                    value={formulario.idCliente}
                                    onChange={(e) => seleccionarCliente(e.target.value)}
                                >
                                    <option value="">Seleccione cliente</option>
                                    {clientes.map((cliente) => (
                                        <option key={cliente.idCliente} value={cliente.idCliente}>
                                            {cliente.razonSocial} - {cliente.rut}
                                            {cliente.cuenta_corriente ? " (Cta. cte.)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Tarifario del cliente</label>
                                <select
                                    value={idTarifaActual || ""}
                                    disabled={cargando || !formulario.idCliente}
                                    onChange={(e) => asignarTarifario(e.target.value)}
                                >
                                    <option value="">
                                        {formulario.idCliente
                                            ? "Asignar tarifario para poder cotizar"
                                            : "Seleccione primero un cliente"}
                                    </option>
                                    {tarifarios.map((tarifa) => (
                                        <option key={tarifa.idTarifa} value={tarifa.idTarifa}>
                                            {tarifa.nombreTarifa}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>RUT origen</label>
                                <input value={clienteSeleccionado?.rut || ""} readOnly />
                            </div>
                            <div className="field">
                                <label>Contacto origen</label>
                                <input
                                    value={formulario.contactoOrigen}
                                    onChange={(e) => setCampo("contactoOrigen", e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label>Teléfono origen</label>
                                <input
                                    value={formulario.telefonoOrigen}
                                    onChange={(e) => setCampo("telefonoOrigen", e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label>Dirección origen</label>
                                <input
                                    value={formulario.direccionOrigen}
                                    onChange={(e) => setCampo("direccionOrigen", e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label>Comuna origen</label>
                                <select
                                    value={formulario.idComunaOrigen}
                                    onChange={(e) => setCampo("idComunaOrigen", e.target.value)}
                                >
                                    <option value="">Seleccione comuna</option>
                                    {comunas.map((comuna) => (
                                        <option key={comuna.idComuna} value={comuna.idComuna}>
                                            {etiquetaComuna(comuna)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {paso === 1 && (
                <section className="ot-seccion abierta">
                    <div className="ot-seccion-body">
                        <div className="mx-toolbar">
                            <p className="mx-note">Selecciona un destinatario o créalo ahora con sus datos de entrega.</p>
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={() => setAltaDestinatario((prev) => !prev)}
                            >
                                {altaDestinatario ? "Cerrar alta" : "Nuevo destinatario"}
                            </button>
                        </div>
                        {altaDestinatario ? (
                            <AltaDestinatarioForm
                                comunas={comunas}
                                onCancelar={() => setAltaDestinatario(false)}
                                onCreado={async (dest) => {
                                    setDestinatarios((prev) => [
                                        dest,
                                        ...prev.filter((item) => item.idDestinatario !== dest.idDestinatario)
                                    ]);
                                    aplicarDestinatario(dest);
                                    setAltaDestinatario(false);
                                    setMensaje("Destinatario creado y seleccionado.");
                                    setTipoMensaje("success");
                                    try {
                                        const listaClientes = await api("/clientes");
                                        setClientes(Array.isArray(listaClientes) ? listaClientes : []);
                                    } catch {
                                        /* El destinatario ya quedó creado. */
                                    }
                                }}
                            />
                        ) : null}
                        <div className="ot-grid">
                            <div className="field">
                                <label>Destinatario</label>
                                <select
                                    value={formulario.idDestinatario}
                                    onChange={(e) => seleccionarDestinatario(e.target.value)}
                                >
                                    <option value="">Seleccione destinatario</option>
                                    {destinatarios.map((dest) => (
                                        <option key={dest.idDestinatario} value={dest.idDestinatario}>
                                            {dest.nombreRazonSocial}
                                            {dest.rut ? ` - ${dest.rut}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Contacto destino</label>
                                <input
                                    value={formulario.contactoDestino}
                                    onChange={(e) => setCampo("contactoDestino", e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label>Teléfono destino</label>
                                <input
                                    value={formulario.telefonoDestino}
                                    onChange={(e) => setCampo("telefonoDestino", e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label>Dirección destino</label>
                                <input
                                    value={formulario.direccionDestino}
                                    onChange={(e) => setCampo("direccionDestino", e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label>Comuna destino</label>
                                <select
                                    value={formulario.idComunaDestino}
                                    onChange={(e) => setCampo("idComunaDestino", e.target.value)}
                                >
                                    <option value="">Seleccione comuna</option>
                                    {comunas.map((comuna) => (
                                        <option key={comuna.idComuna} value={comuna.idComuna}>
                                            {etiquetaComuna(comuna)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Referencia de entrega</label>
                                <input
                                    value={formulario.referenciaEntrega}
                                    onChange={(e) => setCampo("referenciaEntrega", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {paso === 2 && (
                <section className="ot-seccion abierta">
                    <div className="ot-seccion-body">
                        <div className="mx-toolbar">
                            <p className="mx-note">
                                Completa los datos del bulto y pulsa Añadir bulto. Puedes repetir para armar la carga.
                            </p>
                        </div>
                        <div className="ot-bulto-form">
                            <div className="ot-grid">
                                <div className="field">
                                    <label>Tipo de bulto</label>
                                    <select
                                        value={bultoForm.idTipoBulto}
                                        onChange={(e) => setBultoCampo("idTipoBulto", e.target.value)}
                                    >
                                        <option value="">Seleccione tipo</option>
                                        {tiposBulto.map((tipo) => (
                                            <option key={tipo.idTipoBulto} value={tipo.idTipoBulto}>
                                                {tipo.nombreTipo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Descripción</label>
                                    <input
                                        value={bultoForm.descripcion}
                                        onChange={(e) => setBultoCampo("descripcion", e.target.value)}
                                        placeholder="Ej. Caja documentos"
                                    />
                                </div>
                                <div className="field">
                                    <label>Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bultoForm.cantidad}
                                        onChange={(e) => setBultoCampo("cantidad", e.target.value)}
                                    />
                                </div>
                                <div className="field">
                                    <label>Peso unitario (kg)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={bultoForm.pesoUnitario}
                                        onChange={(e) => setBultoCampo("pesoUnitario", e.target.value)}
                                    />
                                </div>
                                <div className="field">
                                    <label>Largo (cm)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bultoForm.largoCm}
                                        onChange={(e) => setBultoCampo("largoCm", e.target.value)}
                                    />
                                </div>
                                <div className="field">
                                    <label>Ancho (cm)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bultoForm.anchoCm}
                                        onChange={(e) => setBultoCampo("anchoCm", e.target.value)}
                                    />
                                </div>
                                <div className="field">
                                    <label>Alto (cm)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bultoForm.altoCm}
                                        onChange={(e) => setBultoCampo("altoCm", e.target.value)}
                                    />
                                </div>
                                <div className="field">
                                    <label>Volumen de esta línea</label>
                                    <input value={`${volumenCarga(bultoForm).toFixed(3)} m³`} readOnly />
                                </div>
                            </div>
                            <div className="mx-form-actions">
                                <button type="button" className="button-primary" onClick={anadirBulto}>
                                    Añadir bulto
                                </button>
                                <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={consolidarBultosAgregados}
                                    disabled={cargas.length < 2}
                                >
                                    Consolidar carga
                                </button>
                            </div>
                        </div>
                        <label className="ot-consolidar">
                            <input
                                type="checkbox"
                                checked={consolidarCarga}
                                onChange={(e) => {
                                    setConsolidarCarga(e.target.checked);
                                    setCotizacion(null);
                                    setDatosCotizados(null);
                                }}
                            />
                            <span>
                                Cotizar como carga consolidada (un solo bulto con el peso y volumen total).
                                {totalesCarga.piezas
                                    ? ` ${textoResumenTipos(totalesCarga.porTipo)} · ${totalesCarga.peso.toFixed(2)} kg · ${totalesCarga.volumen.toFixed(3)} m³.`
                                    : ""}
                            </span>
                        </label>
                        <div className="mx-table-wrap">
                            <table className="mx-table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Descripción</th>
                                        <th>Cant.</th>
                                        <th>Peso</th>
                                        <th>Largo</th>
                                        <th>Ancho</th>
                                        <th>Alto</th>
                                        <th>Volumen</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargas.length === 0 ? (
                                        <tr>
                                            <td colSpan={9}>Aún no hay bultos. Completa el formulario y pulsa Añadir bulto.</td>
                                        </tr>
                                    ) : cargas.map((carga) => (
                                        <tr key={carga.id}>
                                            <td>
                                                {tiposBulto.find((tipo) => mismoId(tipo.idTipoBulto, carga.idTipoBulto))?.nombreTipo
                                                    || carga.idTipoBulto}
                                            </td>
                                            <td>{carga.descripcion || "—"}</td>
                                            <td>{carga.cantidad}</td>
                                            <td>{carga.pesoUnitario || 0} kg</td>
                                            <td>{carga.largoCm || 0}</td>
                                            <td>{carga.anchoCm || 0}</td>
                                            <td>{carga.altoCm || 0}</td>
                                            <td>{volumenCarga(carga).toFixed(3)} m³</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="button-danger"
                                                    onClick={() => {
                                                        setCargas((prev) => prev.filter((item) => item.id !== carga.id));
                                                        setCotizacion(null);
                                                        setDatosCotizados(null);
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
            )}

            {paso === 3 && (
                <section className="ot-seccion abierta">
                    <div className="ot-seccion-body">
                        <div className="ot-grid">
                            <div className="field">
                                <label>Tarifario aplicado</label>
                                <input
                                    value={
                                        clienteSeleccionado?.tarifa
                                            ? clienteSeleccionado.tarifa.nombreTarifa
                                            : idTarifaActual
                                                ? `Tarifario #${idTarifaActual}`
                                                : "Asigna un tarifario al cliente"
                                    }
                                    readOnly
                                />
                            </div>
                            <div className="field">
                                <label>Tipo de zona</label>
                                <select
                                    value={formulario.tipoZona}
                                    onChange={(e) => setCampo("tipoZona", e.target.value)}
                                >
                                    <option value="URBANA">Urbana</option>
                                    <option value="LEJANA">Lejana</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Tipo de servicio</label>
                                <select
                                    value={formulario.tipoServicio}
                                    onChange={(e) => setCampo("tipoServicio", e.target.value)}
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="EXPRESS">Express</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Documento</label>
                                <select
                                    value={formulario.tipoDocumento}
                                    onChange={(e) => setCampo("tipoDocumento", e.target.value)}
                                >
                                    <option value="SIN_DOCUMENTO">Sin documento</option>
                                    <option value="FACTURA">Factura</option>
                                    <option value="BOLETA">Boleta</option>
                                    <option value="GUIA">Guía</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Número documento</label>
                                <input
                                    value={formulario.numeroDocumento}
                                    onChange={(e) => setCampo("numeroDocumento", e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label>Requiere retiro</label>
                                <select
                                    value={formulario.requiereRetiro}
                                    onChange={(e) => setCampo("requiereRetiro", e.target.value)}
                                >
                                    <option value="NO">No</option>
                                    <option value="SI">Sí</option>
                                </select>
                            </div>
                            {formulario.requiereRetiro === "SI" && (
                                <>
                                    <div className="field">
                                        <label>Fecha de retiro</label>
                                        <input
                                            type="date"
                                            value={formulario.fechaRetiro}
                                            onChange={(e) => setCampo("fechaRetiro", e.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Dirección de retiro</label>
                                        <input
                                            value={formulario.direccionRetiro}
                                            onChange={(e) => setCampo("direccionRetiro", e.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Tipo de retiro</label>
                                        <select
                                            value={formulario.tipoRetiro}
                                            onChange={(e) => setCampo("tipoRetiro", e.target.value)}
                                        >
                                            <option value="PEQUENO">Urbano pequeño</option>
                                            <option value="MEDIANO">Urbano mediano</option>
                                            <option value="GRANDE">Urbano grande</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            <div className="field">
                                <label>Aplica recargo</label>
                                <select
                                    value={formulario.aplicaRecargo}
                                    onChange={(e) => setCampo("aplicaRecargo", e.target.value)}
                                >
                                    <option value="NO">No</option>
                                    <option value="SI">Sí</option>
                                </select>
                            </div>
                            {formulario.aplicaRecargo === "SI" && (
                                <>
                                    <div className="field">
                                        <label>Motivo recargo</label>
                                        <input
                                            value={formulario.descripcionRecargo}
                                            onChange={(e) => setCampo("descripcionRecargo", e.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Valor recargo</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formulario.valorRecargo}
                                            onChange={(e) => setCampo("valorRecargo", e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="field">
                                <label>Quién paga</label>
                                <select
                                    value={formulario.pagadoPor}
                                    onChange={(e) => setCampo("pagadoPor", e.target.value)}
                                >
                                    <option value="">Seleccione</option>
                                    <option value="REMITENTE">Remitente</option>
                                    <option value="DESTINATARIO">Destinatario</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Tipo de pago</label>
                                <select
                                    value={formulario.tipoPago}
                                    onChange={(e) => setCampo("tipoPago", e.target.value)}
                                >
                                    <option value="">Seleccione</option>
                                    <option value="CONTADO">Contado</option>
                                    <option value="POR_PAGAR">Por pagar</option>
                                    <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
                                </select>
                            </div>
                            {formulario.tipoPago === "CONTADO" && (
                                <div className="field">
                                    <label>Método de pago</label>
                                    <select
                                        value={formulario.metodoPago}
                                        onChange={(e) => setCampo("metodoPago", e.target.value)}
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="TARJETA">Tarjeta</option>
                                    </select>
                                </div>
                            )}
                            {formulario.tipoPago === "CUENTA_CORRIENTE" && (
                                <div className="field">
                                    <label>Cuenta corriente</label>
                                    <select
                                        value={formulario.idCuenta}
                                        onChange={(e) => setCampo("idCuenta", e.target.value)}
                                    >
                                        <option value="">Seleccione cuenta</option>
                                        {cuenta?.estado ? (
                                            <option value={cuenta.idCuenta}>
                                                Cuenta #{cuenta.idCuenta} - Disponible: {
                                                    formatearCLP(
                                                        (Number(cuenta.limiteCredito) || 0)
                                                        - (Number(cuenta.saldoActual) || 0)
                                                    )
                                                }
                                            </option>
                                        ) : null}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {paso === 4 && (
                <section className="ot-seccion abierta">
                    <div className="ot-seccion-body">
                        <p className="mx-note">
                            Revisa los valores calculados en el panel derecho
                            y confirma la orden.
                        </p>
                    </div>
                </section>
            )}

            <div className="mx-form-actions">
                <button type="button" className="button-secondary" onClick={calcular} disabled={cargando}>
                    {cargando ? "Calculando..." : "Calcular cotización"}
                </button>
                <button type="button" className="button-primary" onClick={confirmar} disabled={cargando || !cotizacion}>
                    {cargando ? "Creando OT..." : "Confirmar y crear OT"}
                </button>
            </div>
            </div>

            <aside className="ot-resumen">
                <h2>Resumen</h2>
                <p>Valores de la cotización actual.</p>
                <div className="ot-resumen-bloque">
                    <span>Cliente</span>
                    <strong>{clienteSeleccionado?.razonSocial || "Sin asignar"}</strong>
                </div>
                <div className="ot-resumen-bloque">
                    <span>Tarifario</span>
                    <strong>
                        {cotizacion?.nombreTarifa
                            || clienteSeleccionado?.tarifa?.nombreTarifa
                            || (idTarifaActual ? `Tarifa #${idTarifaActual}` : "Sin asignar")}
                    </strong>
                </div>
                <div className="ot-resumen-bloque">
                    <span>Carga</span>
                    <strong>
                        {totalesCarga.piezas
                            ? textoResumenTipos(totalesCarga.porTipo)
                            : "Sin bultos"}
                    </strong>
                </div>
                <div className="ot-resumen-bloque">
                    <span>Kilaje</span>
                    <strong>{formatearKg(totalesCarga.peso)}</strong>
                </div>
                <div className="ot-resumen-bloque">
                    <span>Volumen</span>
                    <strong>{formatearM3(totalesCarga.volumen)}</strong>
                </div>
                <div className="ot-resumen-bloque">
                    <span>Consolidada</span>
                    <strong>{consolidarCarga ? "Sí" : "No"}</strong>
                </div>
                <div className="ot-resumen-bloque">
                    <span>Cobro</span>
                    <strong>
                        {cotizacion?.tipoCobro === "VOLUMEN"
                            ? "Por m³"
                            : cotizacion?.tipoCobro === "PESO"
                                ? "Por kilos"
                                : "Pendiente"}
                    </strong>
                </div>
                <div className="ot-resumen-bloque">
                    <span>Neto</span>
                    <strong>{formatearCLP(cotizacion?.valorNeto)}</strong>
                </div>
                <div className="ot-resumen-bloque">
                    <span>IVA</span>
                    <strong>{formatearCLP(cotizacion?.valorIva)}</strong>
                </div>
                <div className="ot-resumen-total">
                    <span>Total</span>
                    <strong>{formatearCLP(cotizacion?.valorTotal)}</strong>
                </div>
            </aside>
            {ordenCreada ? (
                <DocumentosEmision
                    orden={ordenCreada}
                    onCerrar={() => setOrdenCreada(null)}
                />
            ) : null}
        </section>
    );
}

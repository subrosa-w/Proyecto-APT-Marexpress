import prisma from "../../config/prisma.js";
import { fechaHoyChile } from "../../common/utils/fechaChile.js";
import { calcularOrdenTransporte } from "../ordenes/ordenesTransporte.service.js";
import { pagoPendienteCuenta } from "../pagos/pagos.service.js";

/*
 * ============================================================
 * MAREXPRESS - PORTAL CLIENTE
 * ============================================================
 * La empresa del usuario se obtiene SIEMPRE desde el JWT:
 * usuario → cliente_usuario (activo) → cliente.
 * Nunca se recibe un idCliente desde la URL ni desde el body.
 *
 * - Cliente normal: sin cuenta corriente activa. Ve sus OT.
 * - Cliente con cuenta corriente: además paga pendientes y cotiza.
 * ============================================================
 */

export class ErrorPortal extends Error {
    constructor(mensaje, status = 400) {
        super(mensaje);
        this.status = status;
    }
}

// Plazo de pago de las OT cargadas a la cuenta corriente
export const DIAS_CREDITO = 30;
const DIAS_VALIDEZ_COTIZACION = 15;
const MAX_BULTOS_COTIZACION = 30;
const DIA_MS = 24 * 60 * 60 * 1000;

const comunaConRegion = {
    select: {
        idComuna: true,
        nombreComuna: true,
        region: { select: { nombreRegion: true } }
    }
};

// Los eventos que ve el cliente no incluyen al usuario interno que los registró
const eventoParaCliente = {
    select: {
        idSeguimiento: true,
        fechaHora: true,
        descripcion: true,
        ubicacion: true,
        estado_ot: { select: { nombreEstado: true } }
    }
};

const historialParaCliente = {
    select: {
        idHistorial: true,
        fechaHora: true,
        descripcion: true,
        estado_ot: { select: { nombreEstado: true } }
    }
};

const cargaParaCliente = {
    select: {
        idDetalleCarga: true,
        descripcion: true,
        cantidad: true,
        pesoUnitario: true,
        pesoTotal: true,
        largoCm: true,
        anchoCm: true,
        altoCm: true,
        volumenM3: true,
        tipo_bulto: { select: { nombreTipo: true } }
    }
};

const pagoParaCliente = {
    orderBy: { idPago: "desc" },
    select: {
        idPago: true,
        monto: true,
        fechaPago: true,
        tipoPago: true,
        metodoPago: true,
        estadoPago: true
    }
};

// Lo que necesita el portal para clasificar una OT (en curso, entregada, rechazada...)
const entregasParaCliente = {
    entrega_ot: {
        orderBy: { fechaEntrega: "desc" },
        select: { fechaEntrega: true, resultadoEntrega: true, motivoResultado: true }
    },
    manifiesto_ot: {
        select: {
            manifiesto: { select: { estado: true } },
            entrega_ot: { select: { fechaEntrega: true, resultadoEntrega: true, motivoResultado: true } }
        }
    }
};

const camposOrden = {
    idOrden: true,
    numeroOT: true,
    fechaCreacion: true,
    fechaEntregaEstimada: true,
    direccionOrigen: true,
    direccionDestino: true,
    contactoDestino: true,
    telefonoDestino: true,
    tipoServicio: true,
    tipoDocumento: true,
    numeroDocumento: true,
    pesoTotal: true,
    volumenTotalM3: true,
    valorNeto: true,
    valorIva: true,
    valorTotal: true,
    estado_ot: { select: { nombreEstado: true } },
    comuna_orden_transporte_idComunaOrigenTocomuna: comunaConRegion,
    comuna_orden_transporte_idComunaDestinoTocomuna: comunaConRegion
};

const validarIdPositivo = (valor, mensaje) => {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
        throw new ErrorPortal(mensaje);
    }
    return id;
};

const cuentaParaCliente = (cuenta) => {
    if (!cuenta?.estado) {
        return null;
    }

    const limiteCredito = Number(cuenta.limiteCredito) || 0;
    const saldoActual = Number(cuenta.saldoActual) || 0;

    return {
        idCuenta: cuenta.idCuenta,
        estado: cuenta.estado,
        fechaApertura: cuenta.fechaApertura,
        limiteCredito,
        saldoActual,
        disponible: Math.max(0, limiteCredito - saldoActual),
        diasCredito: DIAS_CREDITO
    };
};

/*
 * Contexto del usuario CLIENTE autenticado: su empresa y su cuenta corriente.
 * Si el usuario aún no está asociado a una empresa, cliente y cuenta vienen en null.
 */
export const obtenerContextoCliente = async (idUsuario) => {
    const usuarioId = validarIdPositivo(idUsuario, "Usuario inválido");

    const usuario = await prisma.usuario.findUnique({
        where: { idUsuario: usuarioId },
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            rut: true,
            correo: true,
            telefono: true,
            nombreUsuario: true
        }
    });

    if (!usuario) {
        throw new ErrorPortal("Usuario no encontrado", 404);
    }

    const vinculo = await prisma.cliente_usuario.findFirst({
        where: {
            idUsuario: usuarioId,
            estado: true,
            cliente: { estado: true }
        },
        orderBy: { fechaAsignacion: "desc" },
        select: {
            cliente: {
                select: {
                    idCliente: true,
                    rut: true,
                    razonSocial: true,
                    nombreFantasia: true,
                    giro: true,
                    direccion: true,
                    telefono: true,
                    correo: true,
                    comuna: comunaConRegion,
                    cuenta_corriente: true
                }
            }
        }
    });

    const { cuenta_corriente: cuenta, ...cliente } = vinculo?.cliente || {};

    return {
        usuario,
        cliente: vinculo ? cliente : null,
        cuentaCorriente: vinculo ? cuentaParaCliente(cuenta) : null
    };
};

export const exigirCuentaCorriente = (contexto) => {
    if (!contexto.cliente || !contexto.cuentaCorriente) {
        throw new ErrorPortal("Esta opción es solo para clientes con cuenta corriente", 403);
    }
};

// =========================================================
// ÓRDENES DEL CLIENTE
// =========================================================

export const listarOrdenesCliente = async (contexto) => {
    if (!contexto.cliente) {
        return [];
    }

    return prisma.orden_transporte.findMany({
        where: { idCliente: contexto.cliente.idCliente },
        select: {
            ...camposOrden,
            detalle_carga: cargaParaCliente,
            pago: pagoParaCliente,
            ...entregasParaCliente
        },
        orderBy: { fechaCreacion: "desc" }
    });
};

export const obtenerOrdenCliente = async (contexto, idOrden) => {
    const id = validarIdPositivo(idOrden, "Orden inválida");

    // Si la OT no es de su empresa responde lo mismo que si no existiera
    const orden = contexto.cliente
        ? await prisma.orden_transporte.findFirst({
            where: { idOrden: id, idCliente: contexto.cliente.idCliente },
            select: {
                ...camposOrden,
                detalle_carga: cargaParaCliente,
                pago: pagoParaCliente,
                ...entregasParaCliente,
                seguimiento_ot: { orderBy: { fechaHora: "desc" }, ...eventoParaCliente },
                historial_ot: { orderBy: { fechaHora: "desc" }, ...historialParaCliente }
            }
        })
        : null;

    if (!orden) {
        throw new ErrorPortal("Orden de transporte no encontrada", 404);
    }

    return orden;
};

// =========================================================
// PENDIENTES DE PAGO (CUENTA CORRIENTE)
// =========================================================

// Días calendario de Chile entre dos fechas (sin considerar la hora)
const diaChile = (fecha) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(fecha);

const diasEntre = (desde, hasta) =>
    Math.round((new Date(diaChile(hasta)) - new Date(diaChile(desde))) / DIA_MS);

export const listarPendientesCliente = async (contexto) => {
    exigirCuentaCorriente(contexto);

    const ordenes = await prisma.orden_transporte.findMany({
        where: {
            idCliente: contexto.cliente.idCliente,
            pago: { some: { tipoPago: "CUENTA_CORRIENTE", estadoPago: "PENDIENTE" } }
        },
        select: {
            idOrden: true,
            numeroOT: true,
            fechaCreacion: true,
            valorTotal: true,
            estado_ot: { select: { nombreEstado: true } },
            comuna_orden_transporte_idComunaDestinoTocomuna: { select: { nombreComuna: true } },
            pago: { orderBy: { idPago: "desc" } }
        },
        orderBy: { fechaCreacion: "asc" }
    });

    const hoy = new Date();

    return ordenes
        .filter((orden) => pagoPendienteCuenta(orden))
        .map((orden) => {
            const vence = new Date(new Date(orden.fechaCreacion).getTime() + DIAS_CREDITO * DIA_MS);
            const diasAtraso = Math.max(0, diasEntre(vence, hoy));

            return {
                idOrden: orden.idOrden,
                numeroOT: orden.numeroOT,
                destino: orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || null,
                estadoOt: orden.estado_ot?.nombreEstado || null,
                fechaEmision: orden.fechaCreacion,
                fechaVencimiento: vence,
                monto: Math.round(Number(orden.valorTotal) || 0),
                diasAtraso,
                atrasada: diasAtraso > 0
            };
        });
};

// =========================================================
// COTIZACIONES (CUENTA CORRIENTE)
// =========================================================

const incluirCotizacion = {
    comuna_origen: comunaConRegion,
    comuna_destino: comunaConRegion,
    orden_transporte: { select: { numeroOT: true } },
    cotizacion_detalle: {
        include: { tipo_bulto: { select: { idTipoBulto: true, nombreTipo: true } } }
    }
};

// Misma forma que usa la vista: numero, fecha, comunaOrigen, comunaDestino...
const cotizacionParaCliente = (cotizacion) => ({
    idCotizacion: cotizacion.idCotizacion,
    numero: cotizacion.numeroCotizacion,
    fecha: cotizacion.fechaCreacion,
    validaHasta: cotizacion.validaHasta,
    estado: cotizacion.estado,
    tipoServicio: cotizacion.tipoServicio,
    comunaOrigen: cotizacion.comuna_origen,
    comunaDestino: cotizacion.comuna_destino,
    cantidadBultos: cotizacion.cantidadBultos,
    pesoTotal: Number(cotizacion.pesoTotal),
    volumenM3: Number(cotizacion.volumenTotalM3),
    tipoCobro: cotizacion.tipoCobro,
    valorNeto: Number(cotizacion.valorNeto),
    valorIva: Number(cotizacion.valorIva),
    valorTotal: Number(cotizacion.valorTotal),
    numeroOT: cotizacion.orden_transporte?.numeroOT || null,
    bultos: cotizacion.cotizacion_detalle.map((detalle) => ({
        idTipoBulto: detalle.idTipoBulto,
        tipo: detalle.tipo_bulto?.nombreTipo || "",
        cantidad: detalle.cantidad,
        pesoUnitario: Number(detalle.pesoUnitario),
        largoCm: Number(detalle.largoCm),
        anchoCm: Number(detalle.anchoCm),
        altoCm: Number(detalle.altoCm)
    }))
});

const numeroPositivo = (valor, campo) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0 || numero > 100000) {
        throw new ErrorPortal(`${campo} debe ser un número mayor a 0`);
    }
    return Number(numero.toFixed(2));
};

const validarSolicitudCotizacion = async (datos) => {
    const idComunaOrigen = validarIdPositivo(datos?.idComunaOrigen, "Selecciona la comuna de origen");
    const idComunaDestino = validarIdPositivo(datos?.idComunaDestino, "Selecciona la comuna de destino");

    if (!Array.isArray(datos?.bultos) || datos.bultos.length === 0) {
        throw new ErrorPortal("Agrega al menos un bulto");
    }
    if (datos.bultos.length > MAX_BULTOS_COTIZACION) {
        throw new ErrorPortal(`Puedes cotizar hasta ${MAX_BULTOS_COTIZACION} líneas de bultos`);
    }

    const tipos = await prisma.tipo_bulto.findMany({ select: { idTipoBulto: true } });
    const tiposValidos = new Set(tipos.map((tipo) => tipo.idTipoBulto));

    const bultos = datos.bultos.map((bulto) => {
        const cantidad = Number(bulto?.cantidad);
        if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 1000) {
            throw new ErrorPortal("La cantidad de cada bulto debe ser un entero mayor a 0");
        }

        const idTipoBulto = Number(bulto?.idTipoBulto);
        if (!tiposValidos.has(idTipoBulto)) {
            throw new ErrorPortal("Tipo de bulto inválido");
        }

        return {
            idTipoBulto,
            cantidad,
            pesoUnitario: numeroPositivo(bulto.pesoUnitario, "El peso"),
            largoCm: numeroPositivo(bulto.largoCm, "El largo"),
            anchoCm: numeroPositivo(bulto.anchoCm, "El ancho"),
            altoCm: numeroPositivo(bulto.altoCm, "El alto")
        };
    });

    const comunas = await prisma.comuna.count({
        where: { idComuna: { in: [idComunaOrigen, idComunaDestino] }, estado: true }
    });
    if (comunas !== new Set([idComunaOrigen, idComunaDestino]).size) {
        throw new ErrorPortal("Comuna inválida");
    }

    return { idComunaOrigen, idComunaDestino, bultos };
};

/*
 * Cotiza con el mismo cálculo que usa el operador al crear una OT
 * (tarifario de la ruta o del cliente, tramos de peso, m³ e IVA) y la guarda.
 */
export const crearCotizacion = async (contexto, datos, idUsuario) => {
    exigirCuentaCorriente(contexto);

    const solicitud = await validarSolicitudCotizacion(datos);

    let calculo;
    try {
        calculo = await calcularOrdenTransporte({
            idCliente: contexto.cliente.idCliente,
            idComunaOrigen: solicitud.idComunaOrigen,
            idComunaDestino: solicitud.idComunaDestino,
            direccionOrigen: "Cotización",
            direccionDestino: "Cotización",
            tipoZona: "URBANA",
            requiereRetiro: false,
            cargas: solicitud.bultos.map((bulto) => ({
                idTipoBulto: bulto.idTipoBulto,
                cantidad: bulto.cantidad,
                pesoUnitario: bulto.pesoUnitario,
                largoCm: bulto.largoCm,
                anchoCm: bulto.anchoCm,
                altoCm: bulto.altoCm
            }))
        });
    } catch (error) {
        throw new ErrorPortal(error.message || "No fue posible calcular la cotización");
    }

    const validaHasta = new Date(fechaHoyChile().getTime() + DIAS_VALIDEZ_COTIZACION * DIA_MS);

    const cotizacion = await prisma.$transaction(async (tx) => {
        const creada = await tx.cotizacion.create({
            data: {
                validaHasta,
                estado: "VIGENTE",
                tipoServicio: "NORMAL",
                cantidadBultos: solicitud.bultos.reduce((total, bulto) => total + bulto.cantidad, 0),
                pesoTotal: calculo.pesoTotal,
                volumenTotalM3: calculo.volumenTotalM3,
                tipoCobro: calculo.tipoCobro,
                valorNeto: calculo.valorNeto,
                valorIva: calculo.valorIva,
                valorTotal: calculo.valorTotal,
                idCliente: contexto.cliente.idCliente,
                idUsuario: Number(idUsuario),
                idComunaOrigen: solicitud.idComunaOrigen,
                idComunaDestino: solicitud.idComunaDestino,
                idTarifa: calculo.idTarifa,
                cotizacion_detalle: { create: solicitud.bultos }
            }
        });

        return tx.cotizacion.update({
            where: { idCotizacion: creada.idCotizacion },
            data: { numeroCotizacion: `COT-${String(creada.idCotizacion).padStart(6, "0")}` },
            include: incluirCotizacion
        });
    });

    return cotizacionParaCliente(cotizacion);
};

export const listarCotizacionesCliente = async (contexto) => {
    exigirCuentaCorriente(contexto);

    const cotizaciones = await prisma.cotizacion.findMany({
        where: { idCliente: contexto.cliente.idCliente },
        include: incluirCotizacion,
        orderBy: { fechaCreacion: "desc" }
    });

    return cotizaciones.map(cotizacionParaCliente);
};

export const listarTiposBulto = () =>
    prisma.tipo_bulto.findMany({
        select: { idTipoBulto: true, nombreTipo: true, descripcion: true },
        orderBy: { idTipoBulto: "asc" }
    });

import transbankSdk from "transbank-sdk";

import prisma from "../../config/prisma.js";
import { registrarEventoOt } from "../ordenes/ordenesTransporte.service.js";

const {
    IntegrationApiKeys,
    IntegrationCommerceCodes,
    WebpayPlus
} = transbankSdk;

export class ErrorPago extends Error {
    constructor(mensaje, status = 400) {
        super(mensaje);
        this.status = status;
    }
}

const transaccionIntegracion = () =>
    WebpayPlus.Transaction.buildForIntegration(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY
    );

const urlFrontend = () =>
    String(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const urlApiPublica = () =>
    String(
        process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`
    ).replace(/\/$/, "");

const montoCLP = (valor) => Math.round(Number(valor) || 0);

const nombreEstado = (orden) =>
    String(orden?.estado_ot?.nombreEstado || "").toUpperCase();

const ultimoPago = (orden) => {
    const lista = Array.isArray(orden?.pago) ? orden.pago : [];
    return lista.slice().sort((a, b) => Number(b.idPago) - Number(a.idPago))[0] || null;
};

const resumenDesdeOrden = (orden) => {
    const pago = ultimoPago(orden);
    const estadoPago = String(pago?.estadoPago || "SIN_REGISTRO").toUpperCase();
    const tipoPago = String(pago?.tipoPago || "").toUpperCase();
    const pagada = estadoPago === "PAGADO";
    const cuentaCorriente = tipoPago === "CUENTA_CORRIENTE";
    const monto = montoCLP(orden.valorTotal);

    return {
        idOrden: orden.idOrden,
        numeroOT: orden.numeroOT,
        cliente: orden.cliente?.razonSocial || "",
        idComunaOrigen: orden.idComunaOrigen,
        estadoOt: orden.estado_ot?.nombreEstado || "",
        monto,
        valorTotal: orden.valorTotal,
        pagada,
        cuentaCorriente,
        puedePagar: !pagada && !cuentaCorriente && monto >= 1 && !["ANULADA", "CANCELADA"].includes(nombreEstado(orden)),
        pago: pago
            ? {
                idPago: pago.idPago,
                estadoPago: pago.estadoPago,
                tipoPago: pago.tipoPago,
                metodoPago: pago.metodoPago,
                referencia: pago.referencia,
                observacion: pago.observacion,
                fechaPago: pago.fechaPago
            }
            : null
    };
};

const buscarOrden = async ({ idOrden, numeroOT }) => {
    const id = Number(idOrden);
    const numero = String(numeroOT || "").trim();

    const where = Number.isInteger(id) && id > 0
        ? { idOrden: id }
        : numero
            ? { numeroOT: numero }
            : null;

    if (!where) {
        throw new ErrorPago("Indica el número de OT");
    }

    const orden = await prisma.orden_transporte.findFirst({
        where,
        include: {
            cliente: { select: { razonSocial: true, rut: true } },
            estado_ot: true,
            pago: { orderBy: { idPago: "desc" } }
        }
    });

    if (!orden) {
        throw new ErrorPago("No se encontró la OT", 404);
    }

    return orden;
};

export const ambienteWebpay = () => ({
    ambiente: "integración",
    comercio: IntegrationCommerceCodes.WEBPAY_PLUS,
    tarjetas: [
        {
            resultado: "Aprobada",
            marca: "Visa",
            numero: "4051885600446623",
            cvv: "123",
            vencimiento: "cualquier fecha futura",
            rut: "11.111.111-1",
            clave: "123"
        },
        {
            resultado: "Rechazada",
            marca: "Mastercard",
            numero: "5186030681465354",
            cvv: "123",
            vencimiento: "cualquier fecha futura",
            rut: "11.111.111-1",
            clave: "123"
        }
    ]
});

export const consultarPagoOt = async (filtro) =>
    resumenDesdeOrden(await buscarOrden(filtro));

export const listarOtsPendientesPago = async () => {
    const ordenes = await prisma.orden_transporte.findMany({
        where: {
            estado_ot: {
                nombreEstado: {
                    notIn: ["ANULADA", "CANCELADA"]
                }
            }
        },
        include: {
            cliente: { select: { razonSocial: true } },
            estado_ot: true,
            pago: { orderBy: { idPago: "desc" } }
        },
        orderBy: { fechaCreacion: "desc" },
        take: 80
    });

    return ordenes.map(resumenDesdeOrden).filter((item) => item.puedePagar);
};

export const iniciarWebpayOt = async ({ idOrden, numeroOT, idUsuario }) => {
    const usuarioId = Number(idUsuario);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw new ErrorPago("Usuario no autenticado", 401);
    }

    const orden = await buscarOrden({ idOrden, numeroOT });
    const resumen = resumenDesdeOrden(orden);

    if (["ANULADA", "CANCELADA"].includes(nombreEstado(orden))) {
        throw new ErrorPago("No se puede pagar una OT anulada");
    }
    if (resumen.pagada) {
        throw new ErrorPago("Esta OT ya está pagada");
    }
    if (resumen.cuentaCorriente) {
        throw new ErrorPago("Esta OT se cobra por cuenta corriente");
    }
    if (resumen.monto < 1) {
        throw new ErrorPago("El monto de la OT debe ser al menos $1");
    }

    let pago = ultimoPago(orden);
    if (!pago) {
        pago = await prisma.pago.create({
            data: {
                monto: orden.valorTotal,
                pagadoPor: "REMITENTE",
                tipoPago: "CONTADO",
                metodoPago: "TARJETA",
                estadoPago: "PENDIENTE",
                idOrden: orden.idOrden,
                idUsuario: usuarioId
            }
        });
    } else {
        pago = await prisma.pago.update({
            where: { idPago: pago.idPago },
            data: {
                metodoPago: "TARJETA",
                monto: orden.valorTotal
            }
        });
    }

    const buyOrder = `MX${pago.idPago}${Date.now()}`.slice(0, 26);
    const sessionId = String(orden.idOrden).slice(0, 61);
    const returnUrl = `${urlApiPublica()}/api/pagos/webpay/retorno`;

    const creada = await transaccionIntegracion().create(
        buyOrder,
        sessionId,
        resumen.monto,
        returnUrl
    );

    await prisma.pago.update({
        where: { idPago: pago.idPago },
        data: {
            referencia: String(creada.token).slice(0, 100),
            observacion: `Webpay ${buyOrder}`.slice(0, 200)
        }
    });

    return {
        url: creada.url,
        token: creada.token,
        buyOrder,
        monto: resumen.monto,
        numeroOT: orden.numeroOT
    };
};

const redirigirFrontend = (params) => {
    const query = new URLSearchParams(params);
    return `${urlFrontend()}/operador/pagos?${query.toString()}`;
};

const marcarPagado = async (pago, resultado) => {
    const actualizado = await prisma.pago.update({
        where: { idPago: pago.idPago },
        data: {
            estadoPago: "PAGADO",
            metodoPago: "TARJETA",
            fechaPago: new Date(),
            observacion: `Webpay ${resultado.authorizationCode || ""} ${resultado.buyOrder || ""}`.slice(0, 200)
        }
    });

    const orden = await prisma.orden_transporte.findUnique({
        where: { idOrden: pago.idOrden },
        include: { estado_ot: true }
    });

    if (orden) {
        await registrarEventoOt({
            idOrden: orden.idOrden,
            idEstado: orden.idEstado,
            idUsuario: pago.idUsuario,
            descripcion: `Pago Webpay autorizado. Código ${resultado.authorizationCode || "s/n"}`
        });
    }

    return { actualizado, orden };
};

export const finalizarRetornoWebpay = async ({ tokenWs, tbkToken }) => {
    if (tbkToken && !tokenWs) {
        const pagoAbortado = await prisma.pago.findFirst({
            where: { referencia: String(tbkToken).slice(0, 100) }
        });
        const orden = pagoAbortado
            ? await prisma.orden_transporte.findUnique({
                where: { idOrden: pagoAbortado.idOrden },
                select: { numeroOT: true }
            })
            : null;
        return redirigirFrontend({
            estado: "anulado",
            ot: orden?.numeroOT || ""
        });
    }

    if (!tokenWs) {
        return redirigirFrontend({ estado: "error", detalle: "sin-token" });
    }

    const token = String(tokenWs);
    const pago = await prisma.pago.findFirst({
        where: { referencia: token.slice(0, 100) }
    });

    if (!pago) {
        return redirigirFrontend({ estado: "error", detalle: "pago-no-encontrado" });
    }

    const ordenBase = await prisma.orden_transporte.findUnique({
        where: { idOrden: pago.idOrden },
        select: { numeroOT: true }
    });

    if (String(pago.estadoPago || "").toUpperCase() === "PAGADO") {
        return redirigirFrontend({ estado: "ok", ot: ordenBase?.numeroOT || "" });
    }

    try {
        const resultado = await transaccionIntegracion().commit(token);
        const autorizado =
            Number(resultado.responseCode) === 0 ||
            String(resultado.status || "").toUpperCase() === "AUTHORIZED";

        if (!autorizado) {
            await prisma.pago.update({
                where: { idPago: pago.idPago },
                data: {
                    estadoPago: "PENDIENTE",
                    observacion: `Webpay rechazado ${resultado.responseCode ?? resultado.status}`.slice(0, 200)
                }
            });
            return redirigirFrontend({
                estado: "rechazado",
                ot: ordenBase?.numeroOT || ""
            });
        }

        await marcarPagado(pago, resultado);
        return redirigirFrontend({ estado: "ok", ot: ordenBase?.numeroOT || "" });
    } catch (error) {
        try {
            const estado = await transaccionIntegracion().status(token);
            const autorizado =
                Number(estado.responseCode) === 0 ||
                String(estado.status || "").toUpperCase() === "AUTHORIZED";
            if (autorizado) {
                await marcarPagado(pago, estado);
                return redirigirFrontend({ estado: "ok", ot: ordenBase?.numeroOT || "" });
            }
        } catch {
            /* se informa el error original */
        }

        return redirigirFrontend({
            estado: "error",
            ot: ordenBase?.numeroOT || "",
            detalle: "commit"
        });
    }
};

// =========================================================
// PORTAL CLIENTE: pago de OT de cuenta corriente con Webpay
// =========================================================

const MAX_OT_POR_PAGO = 50;

// El SDK devuelve la respuesta de Transbank tal cual (snake_case)
const campoWebpay = (resultado, snake, camel) => resultado?.[snake] ?? resultado?.[camel];

const esAutorizado = (resultado) =>
    Number(campoWebpay(resultado, "response_code", "responseCode")) === 0 ||
    String(resultado?.status || "").toUpperCase() === "AUTHORIZED";

const redirigirCliente = (params) =>
    `${urlFrontend()}/cliente/pagos?${new URLSearchParams(params).toString()}`;

// OT de cuenta corriente con su último pago todavía pendiente
export const pagoPendienteCuenta = (orden) => {
    const pago = ultimoPago(orden);
    const pendiente =
        pago &&
        String(pago.tipoPago || "").toUpperCase() === "CUENTA_CORRIENTE" &&
        String(pago.estadoPago || "").toUpperCase() === "PENDIENTE" &&
        !["ANULADA", "CANCELADA"].includes(nombreEstado(orden));

    return pendiente ? pago : null;
};

const validarIdsOrden = (idOrdenes) => {
    if (!Array.isArray(idOrdenes) || idOrdenes.length === 0) {
        throw new ErrorPago("Selecciona al menos una OT para pagar");
    }

    const ids = [...new Set(idOrdenes.map(Number))];

    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
        throw new ErrorPago("Hay OT inválidas en la selección");
    }
    if (ids.length > MAX_OT_POR_PAGO) {
        throw new ErrorPago(`Puedes pagar hasta ${MAX_OT_POR_PAGO} OT a la vez`);
    }

    return ids;
};

/*
 * El cliente paga varias OT de su cuenta corriente en una sola transacción.
 * Todas las OT deben ser de su empresa y estar pendientes de pago.
 * El token de Webpay queda en pago.referencia de cada OT.
 */
export const iniciarWebpayCliente = async ({ idCliente, idCuenta, idUsuario, idOrdenes }) => {
    const ids = validarIdsOrden(idOrdenes);

    const ordenes = await prisma.orden_transporte.findMany({
        where: { idOrden: { in: ids }, idCliente: Number(idCliente) },
        include: {
            estado_ot: true,
            pago: { orderBy: { idPago: "desc" } }
        }
    });

    if (ordenes.length !== ids.length) {
        throw new ErrorPago("Alguna OT no existe o no pertenece a tu empresa", 404);
    }

    const pagos = ordenes.map((orden) => {
        const pago = pagoPendienteCuenta(orden);
        if (!pago) {
            throw new ErrorPago(`La OT ${orden.numeroOT} no está pendiente de pago`);
        }
        return pago;
    });

    const monto = ordenes.reduce((total, orden) => total + montoCLP(orden.valorTotal), 0);
    if (monto < 1) {
        throw new ErrorPago("El monto a pagar debe ser al menos $1");
    }

    const buyOrder = `MXC${idCuenta}${Date.now()}`.slice(0, 26);
    // El usuario que paga viaja en el sessionId para registrarlo al confirmar
    const sessionId = `C${idCliente}-U${idUsuario}`.slice(0, 61);
    const returnUrl = `${urlApiPublica()}/api/pagos/webpay/retorno-cliente`;

    const creada = await transaccionIntegracion().create(buyOrder, sessionId, monto, returnUrl);

    await prisma.pago.updateMany({
        where: { idPago: { in: pagos.map((pago) => pago.idPago) } },
        data: {
            referencia: String(creada.token).slice(0, 100),
            observacion: `Webpay ${buyOrder}`.slice(0, 200)
        }
    });

    return {
        url: creada.url,
        token: creada.token,
        buyOrder,
        monto,
        ordenes: ordenes.map((orden) => orden.numeroOT)
    };
};

const usuarioDeSesion = (sessionId) => {
    const coincidencia = String(sessionId || "").match(/-U(\d+)$/);
    return coincidencia ? Number(coincidencia[1]) : null;
};

/*
 * Pago autorizado: marca las OT como pagadas, registra un ABONO por OT
 * y descuenta la deuda de la cuenta corriente, todo en una transacción.
 * La cuenta se bloquea con FOR UPDATE para que un retorno repetido no abone dos veces.
 */
const abonarPagosCuenta = async (token, resultado) => {
    await prisma.$transaction(async (tx) => {
        const pagos = await tx.pago.findMany({
            where: { referencia: token, tipoPago: "CUENTA_CORRIENTE" },
            include: { orden_transporte: { select: { idOrden: true, numeroOT: true, idEstado: true, idCliente: true } } }
        });
        if (!pagos.length) {
            return;
        }

        const cuenta = await tx.cuenta_corriente.findUnique({
            where: { idCliente: pagos[0].orden_transporte.idCliente }
        });
        if (!cuenta) {
            throw new Error("La cuenta corriente del cliente no existe");
        }

        await tx.$queryRaw`
            SELECT idCuenta FROM cuenta_corriente WHERE idCuenta = ${cuenta.idCuenta} FOR UPDATE
        `;

        // Se vuelve a leer con la cuenta bloqueada: solo se abonan los que siguen pendientes
        const pendientes = await tx.pago.findMany({
            where: { idPago: { in: pagos.map((pago) => pago.idPago) }, estadoPago: { not: "PAGADO" } },
            include: { orden_transporte: { select: { idOrden: true, numeroOT: true, idEstado: true } } }
        });
        if (!pendientes.length) {
            return;
        }

        const codigo = campoWebpay(resultado, "authorization_code", "authorizationCode") || "s/n";
        const ordenCompra = campoWebpay(resultado, "buy_order", "buyOrder") || "";
        const idUsuarioPago = usuarioDeSesion(campoWebpay(resultado, "session_id", "sessionId"));
        let totalAbonado = 0;

        for (const pago of pendientes) {
            const monto = Number(pago.monto) || 0;
            const idUsuario = idUsuarioPago || pago.idUsuario;
            totalAbonado += monto;

            await tx.pago.update({
                where: { idPago: pago.idPago },
                data: {
                    estadoPago: "PAGADO",
                    metodoPago: "TARJETA",
                    fechaPago: new Date(),
                    idCuenta: cuenta.idCuenta,
                    observacion: `Webpay ${codigo} ${ordenCompra}`.slice(0, 200)
                }
            });

            await tx.movimiento_cuenta.create({
                data: {
                    tipoMovimiento: "ABONO",
                    monto,
                    descripcion: `Pago Webpay ${pago.orden_transporte.numeroOT} (código ${codigo})`.slice(0, 200),
                    idCuenta: cuenta.idCuenta,
                    idOrden: pago.orden_transporte.idOrden,
                    idUsuario
                }
            });

            await registrarEventoOt({
                db: tx,
                idOrden: pago.orden_transporte.idOrden,
                idEstado: pago.orden_transporte.idEstado,
                idUsuario,
                descripcion: `Pago Webpay de cuenta corriente autorizado. Código ${codigo}`
            });
        }

        const saldoActual = Number(cuenta.saldoActual) || 0;
        await tx.cuenta_corriente.update({
            where: { idCuenta: cuenta.idCuenta },
            data: { saldoActual: Math.max(0, Number((saldoActual - totalAbonado).toFixed(2))) }
        });
    });
};

export const finalizarRetornoWebpayCliente = async ({ tokenWs, tbkToken }) => {
    // El cliente anuló el pago en el formulario de Webpay
    if (tbkToken && !tokenWs) {
        return redirigirCliente({ estado: "anulado" });
    }
    if (!tokenWs) {
        return redirigirCliente({ estado: "error", detalle: "sin-token" });
    }

    const token = String(tokenWs).slice(0, 100);
    const pagos = await prisma.pago.findMany({
        where: { referencia: token, tipoPago: "CUENTA_CORRIENTE" }
    });

    if (!pagos.length) {
        return redirigirCliente({ estado: "error", detalle: "pago-no-encontrado" });
    }
    if (pagos.every((pago) => String(pago.estadoPago || "").toUpperCase() === "PAGADO")) {
        return redirigirCliente({ estado: "ok", cantidad: pagos.length });
    }

    let resultado;
    try {
        resultado = await transaccionIntegracion().commit(token);
    } catch {
        try {
            resultado = await transaccionIntegracion().status(token);
        } catch {
            return redirigirCliente({ estado: "error", detalle: "commit" });
        }
    }

    if (!esAutorizado(resultado)) {
        await prisma.pago.updateMany({
            where: { referencia: token, estadoPago: { not: "PAGADO" } },
            data: {
                observacion: `Webpay rechazado ${campoWebpay(resultado, "response_code", "responseCode") ?? resultado.status}`.slice(0, 200)
            }
        });
        return redirigirCliente({ estado: "rechazado" });
    }

    await abonarPagosCuenta(token, resultado);
    return redirigirCliente({ estado: "ok", cantidad: pagos.length });
};

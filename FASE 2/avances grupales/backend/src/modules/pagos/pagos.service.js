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

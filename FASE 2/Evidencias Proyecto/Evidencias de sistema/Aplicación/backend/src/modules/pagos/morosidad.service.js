import prisma from "../../config/prisma.js";

/*
 * ============================================================
 * MAREXPRESS - Morosidad
 * ============================================================
 *
 * Un solo cálculo para las alertas de morosidad y para el
 * reporte. Devuelve dos listas:
 *
 * a) OT impagas: entregadas hace más de DIAS_GRACIA_OT_IMPAGA
 *    días, cuyo último pago no está PAGADO y no es de cuenta
 *    corriente. Las anuladas y canceladas no cuentan.
 * b) Cuentas sobre el límite: cuenta corriente activa con
 *    límite de crédito mayor que 0 y saldo mayor que el límite.
 * ============================================================
 */

// Días que pueden pasar desde la entrega antes de considerar morosa una OT impaga.
export const DIAS_GRACIA_OT_IMPAGA = 7;

const ESTADOS_OT_ENTREGADA = ["ENTREGADA", "ENTREGADO"];
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const montoCLP = (valor) => Math.round(Number(valor) || 0);

// Mismo criterio que resumenDesdeOrden (pagos.service.js): manda el último pago de la OT.
const lecturaUltimoPago = (orden) => {
    const pago = (orden.pago || []).slice().sort((a, b) => Number(b.idPago) - Number(a.idPago))[0] || null;
    const estadoPago = String(pago?.estadoPago || "SIN_REGISTRO").toUpperCase();
    const tipoPago = String(pago?.tipoPago || "").toUpperCase();
    return {
        estadoPago,
        pagada: estadoPago === "PAGADO",
        cuentaCorriente: tipoPago === "CUENTA_CORRIENTE"
    };
};

const otImpagas = async (ahora) => {
    const limite = new Date(ahora.getTime() - DIAS_GRACIA_OT_IMPAGA * MS_POR_DIA);
    const entregadas = await prisma.orden_transporte.findMany({
        where: {
            estado_ot: { nombreEstado: { in: ESTADOS_OT_ENTREGADA } },
            entrega_ot: { some: { resultadoEntrega: { in: ESTADOS_OT_ENTREGADA } } }
        },
        select: {
            idOrden: true,
            numeroOT: true,
            valorTotal: true,
            idCliente: true,
            cliente: { select: { razonSocial: true, rut: true } },
            pago: { select: { idPago: true, estadoPago: true, tipoPago: true } },
            entrega_ot: {
                where: { resultadoEntrega: { in: ESTADOS_OT_ENTREGADA } },
                orderBy: { fechaEntrega: "desc" },
                take: 1,
                select: { fechaEntrega: true }
            }
        },
        orderBy: { idOrden: "asc" }
    });

    const impagas = [];
    for (const orden of entregadas) {
        const fechaEntrega = orden.entrega_ot[0]?.fechaEntrega;
        const pago = lecturaUltimoPago(orden);
        const monto = montoCLP(orden.valorTotal);
        if (!fechaEntrega || fechaEntrega >= limite || pago.pagada || pago.cuentaCorriente || monto < 1) {
            continue;
        }
        impagas.push({
            idOrden: orden.idOrden,
            numeroOT: orden.numeroOT,
            idCliente: orden.idCliente,
            cliente: orden.cliente?.razonSocial || "Sin nombre",
            rut: orden.cliente?.rut || "—",
            fechaEntrega,
            diasDesdeEntrega: Math.floor((ahora.getTime() - fechaEntrega.getTime()) / MS_POR_DIA),
            estadoPago: pago.estadoPago,
            monto
        });
    }
    return impagas;
};

// Misma regla que "Deuda sobre el límite" en clientes.service.js.
const cuentasSobreLimite = async () => {
    const cuentas = await prisma.cuenta_corriente.findMany({
        where: { estado: true },
        select: {
            idCuenta: true,
            idCliente: true,
            saldoActual: true,
            limiteCredito: true,
            cliente: { select: { razonSocial: true, rut: true } }
        },
        orderBy: { idCuenta: "asc" }
    });

    return cuentas
        .map((cuenta) => ({
            idCuenta: cuenta.idCuenta,
            idCliente: cuenta.idCliente,
            cliente: cuenta.cliente?.razonSocial || "Sin nombre",
            rut: cuenta.cliente?.rut || "—",
            saldo: montoCLP(cuenta.saldoActual),
            limite: montoCLP(cuenta.limiteCredito)
        }))
        .filter((cuenta) => cuenta.limite > 0 && cuenta.saldo > cuenta.limite)
        .map((cuenta) => ({ ...cuenta, exceso: cuenta.saldo - cuenta.limite }));
};

export const calcularMorosidad = async () => {
    const ahora = new Date();
    const [impagas, sobreLimite] = await Promise.all([
        otImpagas(ahora),
        cuentasSobreLimite()
    ]);
    return {
        diasGracia: DIAS_GRACIA_OT_IMPAGA,
        otImpagas: impagas,
        cuentasSobreLimite: sobreLimite
    };
};

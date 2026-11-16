import prisma from "../../config/prisma.js";
import { calcularMorosidad } from "../pagos/morosidad.service.js";

// Una misma cuenta sobre el límite no vuelve a generar alerta antes de estos días.
const DIAS_ENTRE_ALERTAS_CUENTA = 30;

const ESTADOS_CERRADOS = ["ENTREGADA", "ENTREGADO", "ANULADA", "CANCELADA"];

let tablaLista = null;

const asegurarTablaAlerta = async () => {
    if (tablaLista) {
        return tablaLista;
    }

    tablaLista = prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS alerta (
            idAlerta INT NOT NULL AUTO_INCREMENT,
            tipo VARCHAR(40) NOT NULL,
            titulo VARCHAR(150) NOT NULL,
            mensaje VARCHAR(300) NOT NULL,
            fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            leida TINYINT(1) NOT NULL DEFAULT 0,
            idOrden INT NULL,
            idUsuario INT NULL,
            PRIMARY KEY (idAlerta),
            KEY fk_alerta_orden (idOrden),
            KEY fk_alerta_usuario (idUsuario),
            KEY idx_alerta_leida_fecha (leida, fechaCreacion),
            CONSTRAINT fk_alerta_orden FOREIGN KEY (idOrden) REFERENCES orden_transporte (idOrden),
            CONSTRAINT fk_alerta_usuario FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario)
        )
    `).catch((error) => {
        tablaLista = null;
        throw error;
    });

    await tablaLista;
    return tablaLista;
};

const diaChile = (fecha = new Date()) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(fecha);

const textoFecha = (fecha) => {
    if (!fecha) {
        return "sin fecha";
    }
    return new Intl.DateTimeFormat("es-CL", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(new Date(fecha));
};

const crearAlerta = async ({ tipo, titulo, mensaje, idOrden = null, idUsuario = null }) => {
    await asegurarTablaAlerta();
    return prisma.alerta.create({
        data: {
            tipo,
            titulo: String(titulo).slice(0, 150),
            mensaje: String(mensaje).slice(0, 300),
            idOrden: idOrden ? Number(idOrden) : null,
            idUsuario: idUsuario ? Number(idUsuario) : null
        }
    });
};

export const registrarAlertaSeguridad = async ({ ip, ruta, campo }) => {
    return crearAlerta({
        tipo: "INTENTO_INTRUSION",
        titulo: "Intento de intrusión bloqueado",
        mensaje: `IP ${ip}. Ruta ${ruta}. Campo ${campo}.`
    });
};

export const registrarAlertaOrdenCreada = async (orden, idUsuario) => {
    if (!orden?.idOrden) {
        return null;
    }

    await asegurarTablaAlerta();
    const existente = await prisma.alerta.findFirst({
        where: {
            tipo: "OT_CREADA",
            idOrden: orden.idOrden
        }
    });
    if (existente) {
        return existente;
    }

    const cliente = orden.cliente?.razonSocial || "un cliente";
    const destino = orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna
        || orden.direccionDestino
        || "destino por confirmar";

    return crearAlerta({
        tipo: "OT_CREADA",
        titulo: `OT ${orden.numeroOT} creada`,
        mensaje: `Se registró una orden de ${cliente} con destino ${destino}.`,
        idOrden: orden.idOrden,
        idUsuario
    });
};

export const sincronizarCargaAtrasada = async () => {
    await asegurarTablaAlerta();
    const limite = new Date(`${diaChile()}T00:00:00`);
    const atrasadas = await prisma.orden_transporte.findMany({
        where: {
            fechaEntregaEstimada: { lt: limite },
            estado_ot: {
                nombreEstado: { notIn: ESTADOS_CERRADOS }
            }
        },
        select: {
            idOrden: true,
            numeroOT: true,
            fechaEntregaEstimada: true,
            cliente: { select: { razonSocial: true } },
            estado_ot: { select: { nombreEstado: true } }
        }
    });

    const ids = atrasadas.map((orden) => orden.idOrden);
    await prisma.alerta.updateMany({
        where: {
            tipo: "CARGA_ATRASADA",
            leida: false,
            ...(ids.length ? { idOrden: { notIn: ids } } : {})
        },
        data: { leida: true }
    });

    if (!ids.length) {
        return;
    }

    const abiertas = await prisma.alerta.findMany({
        where: {
            tipo: "CARGA_ATRASADA",
            leida: false,
            idOrden: { in: ids }
        },
        select: { idOrden: true }
    });
    const yaAvisadas = new Set(abiertas.map((item) => item.idOrden));

    for (const orden of atrasadas) {
        if (yaAvisadas.has(orden.idOrden)) {
            continue;
        }
        await crearAlerta({
            tipo: "CARGA_ATRASADA",
            titulo: `Carga atrasada ${orden.numeroOT}`,
            mensaje: `La entrega estimada de ${orden.cliente?.razonSocial || "la OT"} era el ${textoFecha(orden.fechaEntregaEstimada)} y sigue en ${orden.estado_ot?.nombreEstado || "proceso"}.`,
            idOrden: orden.idOrden
        });
    }
};

const pesos = (valor) =>
    new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(Number(valor) || 0);

// Día de una fecha con hora (la entrega), en hora de Chile.
const textoDiaChile = (fecha) =>
    new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(new Date(fecha));

// Las alertas de cuenta no tienen OT: se reconocen por este título.
const tituloCuentaSobreLimite = (cuenta) => `Cuenta corriente N° ${cuenta.idCuenta} sobre el límite`;

/*
 * Alertas de morosidad (tipo MOROSIDAD):
 * - Una por OT impaga (con idOrden) y una por cuenta sobre el límite (sin idOrden, por título).
 * - Cuando la deuda se paga, la alerta abierta se marca como leída.
 * - Si el administrador la marcó como leída, no se vuelve a crear:
 *   una sola vez por OT y, para una misma cuenta, no antes de 30 días.
 */
export const sincronizarMorosidad = async () => {
    await asegurarTablaAlerta();
    const { otImpagas, cuentasSobreLimite, diasGracia } = await calcularMorosidad();

    // --- OT impagas ---
    const idsImpagas = otImpagas.map((orden) => orden.idOrden);
    await prisma.alerta.updateMany({
        where: {
            tipo: "MOROSIDAD",
            leida: false,
            idOrden: idsImpagas.length ? { not: null, notIn: idsImpagas } : { not: null }
        },
        data: { leida: true }
    });

    if (idsImpagas.length) {
        const previas = await prisma.alerta.findMany({
            where: { tipo: "MOROSIDAD", idOrden: { in: idsImpagas } },
            select: { idOrden: true }
        });
        const yaAvisadas = new Set(previas.map((item) => item.idOrden));
        for (const orden of otImpagas) {
            if (yaAvisadas.has(orden.idOrden)) {
                continue;
            }
            await crearAlerta({
                tipo: "MOROSIDAD",
                titulo: `OT impaga ${orden.numeroOT}`,
                mensaje: `${orden.cliente} debe ${pesos(orden.monto)}. Se entregó el ${textoDiaChile(orden.fechaEntrega)}, hace ${orden.diasDesdeEntrega} días (el plazo es de ${diasGracia}).`,
                idOrden: orden.idOrden
            });
        }
    }

    // --- Cuentas sobre el límite ---
    const titulosVigentes = cuentasSobreLimite.map(tituloCuentaSobreLimite);
    await prisma.alerta.updateMany({
        where: {
            tipo: "MOROSIDAD",
            leida: false,
            idOrden: null,
            ...(titulosVigentes.length ? { titulo: { notIn: titulosVigentes } } : {})
        },
        data: { leida: true }
    });

    const desde = new Date(Date.now() - DIAS_ENTRE_ALERTAS_CUENTA * 24 * 60 * 60 * 1000);
    for (const cuenta of cuentasSobreLimite) {
        const titulo = tituloCuentaSobreLimite(cuenta);
        const reciente = await prisma.alerta.findFirst({
            where: {
                tipo: "MOROSIDAD",
                idOrden: null,
                titulo,
                OR: [
                    { leida: false },
                    { fechaCreacion: { gte: desde } }
                ]
            },
            select: { idAlerta: true }
        });
        if (reciente) {
            continue;
        }
        await crearAlerta({
            tipo: "MOROSIDAD",
            titulo,
            mensaje: `${cuenta.cliente} (${cuenta.rut}) debe ${pesos(cuenta.saldo)} y su límite de crédito es ${pesos(cuenta.limite)}. Excede en ${pesos(cuenta.exceso)}.`
        });
    }
};

export const listarAlertas = async () => {
    await sincronizarCargaAtrasada();
    // Si la morosidad falla, las demás alertas se siguen mostrando igual que antes.
    try {
        await sincronizarMorosidad();
    } catch (error) {
        console.error("Error al sincronizar alertas de morosidad:", error);
    }
    return prisma.alerta.findMany({
        where: { leida: false },
        orderBy: { fechaCreacion: "desc" },
        take: 40,
        include: {
            orden_transporte: {
                select: { numeroOT: true }
            }
        }
    });
};

export const marcarAlertaLeida = async (idAlerta) => {
    await asegurarTablaAlerta();
    const id = Number(idAlerta);
    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error("La alerta no es válida");
        error.status = 400;
        throw error;
    }

    const alerta = await prisma.alerta.findUnique({ where: { idAlerta: id } });
    if (!alerta) {
        const error = new Error("Alerta no encontrada");
        error.status = 404;
        throw error;
    }

    return prisma.alerta.update({
        where: { idAlerta: id },
        data: { leida: true }
    });
};

export const marcarAlertasLeidas = async () => {
    await asegurarTablaAlerta();
    await prisma.alerta.updateMany({
        where: { leida: false },
        data: { leida: true }
    });
};

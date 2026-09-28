import prisma from "../config/prisma.js";

export async function trasladarBultoEntreSucursales({
    idBulto,
    idSucursalOrigen,
    idSucursalDestino,
    idUsuario,
    observacion = null
}) {
    return prisma.$transaction(async (tx) => {
        const bulto = await tx.bulto.findUnique({
            where: {
                idBulto: Number(idBulto)
            }
        });

        if (!bulto) {
            throw new Error("Bulto no encontrado");
        }

        const sucursalOrigen = await tx.sucursal.findFirst({
            where: {
                idSucursal: Number(idSucursalOrigen),
                estado: true
            }
        });

        if (!sucursalOrigen) {
            throw new Error("Sucursal de origen no encontrada o inactiva");
        }

        const sucursalDestino = await tx.sucursal.findFirst({
            where: {
                idSucursal: Number(idSucursalDestino),
                estado: true
            }
        });

        if (!sucursalDestino) {
            throw new Error("Sucursal de destino no encontrada o inactiva");
        }

        const movimiento = await tx.movimiento_bulto.create({
            data: {
                idBulto: Number(idBulto),
                idSucursalOrigen: Number(idSucursalOrigen),
                idSucursalDestino: Number(idSucursalDestino),
                tipoMovimiento: "TRASLADO",
                observacion,
                idUsuario: Number(idUsuario)
            }
        });

        return movimiento;
    });
}

export async function obtenerBultosPorSucursal(idSucursal) {
    const sucursalId = Number(idSucursal);

    if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
        throw new Error("El ID de sucursal debe ser un entero positivo");
    }

    const sucursal = await prisma.sucursal.findUnique({
        where: {
            idSucursal: sucursalId
        }
    });

    if (!sucursal) {
        throw new Error("Sucursal no encontrada");
    }

    return prisma.bulto.findMany({
        where: {
            idSucursalActual: sucursalId
        },
        include: {
            sucursal: {
                select: {
                    idSucursal: true,
                    nombreSucursal: true
                }
            },
            detalle_carga: {
                include: {
                    tipo_bulto: true,
                    orden_transporte: {
                        select: {
                            idOrden: true,
                            numeroOT: true
                        }
                    }
                }
            }
        },
        orderBy: {
            idBulto: "desc"
        }
    });
}

export async function recibirBultoEnSucursal({
    idBulto,
    idSucursal,
    idUsuario,
    observacion = null
}) {
    const bultoId = Number(idBulto);
    const sucursalId = Number(idSucursal);
    const usuarioId = Number(idUsuario);

    for (const [nombre, valor] of [
        ["idBulto", bultoId],
        ["idSucursal", sucursalId],
        ["idUsuario", usuarioId]
    ]) {
        if (!Number.isInteger(valor) || valor <= 0) {
            throw new Error(`${nombre} debe ser un entero positivo`);
        }
    }

    if (
        observacion !== null &&
        (typeof observacion !== "string" || observacion.length > 200)
    ) {
        throw new Error(
            "La observación debe ser texto de máximo 200 caracteres"
        );
    }

    return prisma.$transaction(async (tx) => {
        // Bloquea el bulto durante la recepción para evitar
        // que dos solicitudes lo reciban simultáneamente.
        const filas = await tx.$queryRaw`
            SELECT idBulto, estado, idSucursalActual
            FROM bulto
            WHERE idBulto = ${bultoId}
            FOR UPDATE
        `;

        const bulto = filas[0];

        if (!bulto) {
            throw new Error("Bulto no encontrado");
        }

        const sucursal = await tx.sucursal.findFirst({
            where: {
                idSucursal: sucursalId,
                estado: true
            }
        });

        if (!sucursal) {
            throw new Error("Sucursal no encontrada o inactiva");
        }

        const usuario = await tx.usuario.findFirst({
            where: {
                idUsuario: usuarioId,
                estado: true
            }
        });

        if (!usuario) {
            throw new Error("Usuario no encontrado o inactivo");
        }

        if (
            bulto.estado === "EN_BODEGA" &&
            bulto.idSucursalActual !== null
        ) {
            throw new Error(
                bulto.idSucursalActual === sucursalId
                    ? "El bulto ya está recibido en esta sucursal"
                    : "El bulto está en otra sucursal; debe trasladarse primero"
            );
        }

        if (
            bulto.estado !== "EN_BODEGA" &&
            bulto.estado !== "EN_TRASLADO"
        ) {
            throw new Error(
                `No se puede recibir un bulto con estado ${bulto.estado}`
            );
        }

        const movimiento = await tx.movimiento_bulto.create({
            data: {
                idBulto: bultoId,
                idSucursal: sucursalId,
                tipoMovimiento: "ENTRADA_BODEGA",
                idUsuario: usuarioId,
                observacion
            }
        });

        // El trigger ya actualizó el estado y la ubicación.
        const bultoActualizado = await tx.bulto.findUnique({
            where: {
                idBulto: bultoId
            }
        });

        return {
            movimiento,
            bulto: bultoActualizado
        };
    });
}

export async function obtenerTiposBulto() {
    return prisma.tipo_bulto.findMany({
        orderBy: {
            nombreTipo: "asc"
        }
    });
}
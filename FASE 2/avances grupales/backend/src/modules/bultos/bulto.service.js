import prisma from "../../config/prisma.js";

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

export async function obtenerSucursalesBodega() {
    return prisma.sucursal.findMany({
        where: { estado: true },
        include: {
            comuna: {
                include: { region: true }
            }
        },
        orderBy: {
            nombreSucursal: "asc"
        }
    });
}

export async function obtenerInventarioBodega({ estado, idSucursal, busqueda } = {}) {
    const where = {};

    if (estado && estado !== "TODAS") {
        where.estado = String(estado).trim().toUpperCase();
    }

    if (idSucursal === "sin") {
        where.idSucursalActual = null;
        where.estado = where.estado || "EN_BODEGA";
    } else if (idSucursal) {
        where.idSucursalActual = Number(idSucursal);
    }

    if (busqueda?.trim()) {
        const texto = busqueda.trim();
        where.OR = [
            { codigoBulto: { contains: texto } },
            {
                detalle_carga: {
                    is: {
                        orden_transporte: {
                            is: {
                                numeroOT: { contains: texto }
                            }
                        }
                    }
                }
            }
        ];
    }

    const bultos = await prisma.bulto.findMany({
        where,
        include: {
            sucursal: {
                select: {
                    idSucursal: true,
                    nombreSucursal: true,
                    comuna: {
                        select: { nombreComuna: true }
                    }
                }
            },
            detalle_carga: {
                include: {
                    tipo_bulto: true,
                    orden_transporte: {
                        select: {
                            idOrden: true,
                            numeroOT: true,
                            direccionDestino: true,
                            cliente: {
                                select: {
                                    razonSocial: true,
                                    rut: true
                                }
                            },
                            estado_ot: {
                                select: {
                                    nombreEstado: true
                                }
                            },
                            comuna_orden_transporte_idComunaDestinoTocomuna: {
                                select: {
                                    nombreComuna: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            fechaCreacion: "desc"
        }
    });

    const [total, enBodega, enTraslado, sinUbicacion] = await Promise.all([
        prisma.bulto.count(),
        prisma.bulto.count({ where: { estado: "EN_BODEGA" } }),
        prisma.bulto.count({ where: { estado: "EN_TRASLADO" } }),
        prisma.bulto.count({ where: { estado: "EN_BODEGA", idSucursalActual: null } })
    ]);

    return {
        resumen: { total, enBodega, enTraslado, sinUbicacion },
        bultos
    };
}

const milisegundosDia = 24 * 60 * 60 * 1000;

const diasDesde = (fecha) => {
    const inicio = new Date(fecha);
    if (Number.isNaN(inicio.getTime())) {
        return 0;
    }
    return Math.floor((Date.now() - inicio.getTime()) / milisegundosDia);
};

export async function obtenerProntoDespacho({ diasMinimos = 3 } = {}) {
    const umbral = Number(diasMinimos);
    const minimo = Number.isFinite(umbral) && umbral > 0 ? umbral : 3;
    const corte = new Date(Date.now() - minimo * milisegundosDia);

    const bultos = await prisma.bulto.findMany({
        where: {
            estado: "EN_BODEGA",
            detalle_carga: {
                orden_transporte: {
                    estado_ot: {
                        nombreEstado: {
                            notIn: ["ANULADA", "CANCELADA", "ENTREGADA", "ENTREGADO"]
                        }
                    }
                }
            }
        },
        include: {
            sucursal: {
                select: {
                    idSucursal: true,
                    nombreSucursal: true
                }
            },
            movimiento_bulto: {
                where: { tipoMovimiento: "ENTRADA_BODEGA" },
                orderBy: { fechaMovimiento: "asc" },
                take: 1,
                select: { fechaMovimiento: true }
            },
            detalle_carga: {
                include: {
                    tipo_bulto: true,
                    orden_transporte: {
                        select: {
                            idOrden: true,
                            numeroOT: true,
                            direccionDestino: true,
                            fechaCreacion: true,
                            cliente: {
                                select: { razonSocial: true }
                            },
                            estado_ot: {
                                select: { nombreEstado: true }
                            },
                            comuna_orden_transporte_idComunaDestinoTocomuna: {
                                select: { nombreComuna: true }
                            }
                        }
                    }
                }
            }
        }
    });

    const conAntiguedad = bultos
        .map((bulto) => {
            const desde = bulto.movimiento_bulto?.[0]?.fechaMovimiento || bulto.fechaCreacion;
            return {
                ...bulto,
                fechaIngresoBodega: desde,
                diasEnBodega: diasDesde(desde)
            };
        })
        .filter((bulto) => new Date(bulto.fechaIngresoBodega) <= corte)
        .sort((a, b) => b.diasEnBodega - a.diasEnBodega || new Date(a.fechaIngresoBodega) - new Date(b.fechaIngresoBodega));

    const grupos = new Map();
    for (const bulto of conAntiguedad) {
        const orden = bulto.detalle_carga?.orden_transporte;
        const clave = orden?.idOrden || `bulto-${bulto.idBulto}`;
        if (!grupos.has(clave)) {
            grupos.set(clave, {
                idOrden: orden?.idOrden || null,
                numeroOT: orden?.numeroOT || "Sin OT",
                cliente: orden?.cliente?.razonSocial || "—",
                destino: orden?.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna
                    || orden?.direccionDestino
                    || "—",
                estado: orden?.estado_ot?.nombreEstado || "EN_BODEGA",
                diasEnBodega: bulto.diasEnBodega,
                fechaIngresoBodega: bulto.fechaIngresoBodega,
                bultos: []
            });
        }
        const grupo = grupos.get(clave);
        grupo.bultos.push({
            idBulto: bulto.idBulto,
            codigoBulto: bulto.codigoBulto,
            tipo: bulto.detalle_carga?.tipo_bulto?.nombreTipo || "Bulto",
            peso: bulto.peso,
            idSucursal: bulto.idSucursalActual,
            sucursal: bulto.sucursal?.nombreSucursal || "Sin ubicación",
            fechaIngresoBodega: bulto.fechaIngresoBodega,
            diasEnBodega: bulto.diasEnBodega
        });
        if (bulto.diasEnBodega > grupo.diasEnBodega) {
            grupo.diasEnBodega = bulto.diasEnBodega;
            grupo.fechaIngresoBodega = bulto.fechaIngresoBodega;
        }
    }

    const ordenes = [...grupos.values()].sort((a, b) => b.diasEnBodega - a.diasEnBodega);

    return {
        diasMinimos: minimo,
        resumen: {
            ordenes: ordenes.length,
            bultos: conAntiguedad.length,
            diasMaximo: ordenes[0]?.diasEnBodega || 0
        },
        ordenes
    };
}
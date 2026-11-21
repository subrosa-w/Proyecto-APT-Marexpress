import prisma from "../../config/prisma.js";

const TIPOS_UBICACION = [
    "CASA_MATRIZ",
    "SUCURSAL",
    "BODEGA",
    "CENTRO_DISTRIBUCION",
    "OTRA"
];

const validarId = (valor, nombre = "ID") => {
    const id = Number(valor);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`${nombre} inválido`);
    }

    return id;
};


/*
 * ============================================================
 * LISTAR UBICACIONES DE UN CLIENTE
 * ============================================================
 */
export const listarUbicacionesCliente = async (
    idCliente
) => {
    const clienteId = validarId(
        idCliente,
        "Cliente"
    );

    const cliente = await prisma.cliente.findUnique({
        where: {
            idCliente: clienteId
        },
        select: {
            idCliente: true
        }
    });

    if (!cliente) {
        throw new Error(
            "Cliente no encontrado"
        );
    }

    return await prisma.cliente_ubicacion.findMany({
        where: {
            idCliente: clienteId
        },
        orderBy: [
            {
                esPrincipal: "desc"
            },
            {
                nombre: "asc"
            }
        ],
        include: {
            comuna: {
                include: {
                    region: true
                }
            }
        }
    });
};


/*
 * ============================================================
 * CREAR UBICACIÓN
 * ============================================================
 */
export const crearUbicacionCliente = async (
    idCliente,
    datos
) => {
    const clienteId = validarId(
        idCliente,
        "Cliente"
    );

    const comunaId = validarId(
        datos.idComuna,
        "Comuna"
    );

    const nombre = String(
        datos.nombre ?? ""
    ).trim();

    const direccion = String(
        datos.direccion ?? ""
    ).trim();

    const tipoUbicacion = String(
        datos.tipoUbicacion ?? ""
    )
        .trim()
        .toUpperCase();

    if (!nombre) {
        throw new Error(
            "El nombre de la ubicación es obligatorio"
        );
    }

    if (!direccion) {
        throw new Error(
            "La dirección es obligatoria"
        );
    }

    if (
        !TIPOS_UBICACION.includes(
            tipoUbicacion
        )
    ) {
        throw new Error(
            "Tipo de ubicación inválido"
        );
    }

    const [cliente, comuna] = await Promise.all([
        prisma.cliente.findUnique({
            where: {
                idCliente: clienteId
            },
            select: {
                idCliente: true
            }
        }),

        prisma.comuna.findUnique({
            where: {
                idComuna: comunaId
            },
            select: {
                idComuna: true,
                estado: true
            }
        })
    ]);

    if (!cliente) {
        throw new Error(
            "Cliente no encontrado"
        );
    }

    if (!comuna || !comuna.estado) {
        throw new Error(
            "Comuna no disponible"
        );
    }

    const esPrincipal =
        datos.esPrincipal === true;

    return await prisma.$transaction(
        async (tx) => {

            /*
             * Una empresa puede tener muchas ubicaciones,
             * pero solo una marcada como principal.
             */
            if (esPrincipal) {
                await tx.cliente_ubicacion.updateMany({
                    where: {
                        idCliente: clienteId,
                        esPrincipal: true
                    },
                    data: {
                        esPrincipal: false
                    }
                });
            }

            return await tx.cliente_ubicacion.create({
                data: {
                    idCliente: clienteId,
                    idComuna: comunaId,

                    nombre,
                    tipoUbicacion,
                    direccion,

                    referencia:
                        datos.referencia
                            ? String(
                                  datos.referencia
                              ).trim()
                            : null,

                    nombreContacto:
                        datos.nombreContacto
                            ? String(
                                  datos.nombreContacto
                              ).trim()
                            : null,

                    telefonoContacto:
                        datos.telefonoContacto
                            ? String(
                                  datos.telefonoContacto
                              ).trim()
                            : null,

                    correoContacto:
                        datos.correoContacto
                            ? String(
                                  datos.correoContacto
                              )
                                  .trim()
                                  .toLowerCase()
                            : null,

                    esPrincipal,

                    permiteRetiro:
                        datos.permiteRetiro !== false,

                    permiteEntrega:
                        datos.permiteEntrega !== false,

                    estado: true
                }
            });
        }
    );
};


/*
 * ============================================================
 * MODIFICAR UBICACIÓN
 * ============================================================
 */
export const modificarUbicacionCliente = async (
    idUbicacion,
    datos
) => {
    const ubicacionId = validarId(
        idUbicacion,
        "Ubicación"
    );

    const actual =
        await prisma.cliente_ubicacion.findUnique({
            where: {
                idClienteUbicacion:
                    ubicacionId
            }
        });

    if (!actual) {
        throw new Error(
            "Ubicación no encontrada"
        );
    }

    const cambios = {};

    if (datos.nombre !== undefined) {
        const nombre = String(
            datos.nombre
        ).trim();

        if (!nombre) {
            throw new Error(
                "El nombre de la ubicación es obligatorio"
            );
        }

        cambios.nombre = nombre;
    }

    if (datos.direccion !== undefined) {
        const direccion = String(
            datos.direccion
        ).trim();

        if (!direccion) {
            throw new Error(
                "La dirección es obligatoria"
            );
        }

        cambios.direccion = direccion;
    }

    if (datos.tipoUbicacion !== undefined) {
        const tipo = String(
            datos.tipoUbicacion
        )
            .trim()
            .toUpperCase();

        if (!TIPOS_UBICACION.includes(tipo)) {
            throw new Error(
                "Tipo de ubicación inválido"
            );
        }

        cambios.tipoUbicacion = tipo;
    }

    if (datos.idComuna !== undefined) {
        const comunaId = validarId(
            datos.idComuna,
            "Comuna"
        );

        const comuna =
            await prisma.comuna.findUnique({
                where: {
                    idComuna: comunaId
                },
                select: {
                    estado: true
                }
            });

        if (!comuna || !comuna.estado) {
            throw new Error(
                "Comuna no disponible"
            );
        }

        cambios.idComuna = comunaId;
    }

    if (datos.referencia !== undefined) {
        cambios.referencia =
            datos.referencia
                ? String(
                      datos.referencia
                  ).trim()
                : null;
    }

    if (datos.nombreContacto !== undefined) {
        cambios.nombreContacto =
            datos.nombreContacto
                ? String(
                      datos.nombreContacto
                  ).trim()
                : null;
    }

    if (datos.telefonoContacto !== undefined) {
        cambios.telefonoContacto =
            datos.telefonoContacto
                ? String(
                      datos.telefonoContacto
                  ).trim()
                : null;
    }

    if (datos.correoContacto !== undefined) {
        cambios.correoContacto =
            datos.correoContacto
                ? String(
                      datos.correoContacto
                  )
                      .trim()
                      .toLowerCase()
                : null;
    }

    if (datos.permiteRetiro !== undefined) {
        cambios.permiteRetiro =
            datos.permiteRetiro === true;
    }

    if (datos.permiteEntrega !== undefined) {
        cambios.permiteEntrega =
            datos.permiteEntrega === true;
    }

    if (datos.estado !== undefined) {
        cambios.estado =
            datos.estado === true;
    }

    const marcarPrincipal =
        datos.esPrincipal === true;

    if (datos.esPrincipal !== undefined) {
        cambios.esPrincipal =
            marcarPrincipal;
    }

    return await prisma.$transaction(
        async (tx) => {

            if (marcarPrincipal) {
                await tx.cliente_ubicacion.updateMany({
                    where: {
                        idCliente:
                            actual.idCliente,
                        esPrincipal: true,
                        NOT: {
                            idClienteUbicacion:
                                ubicacionId
                        }
                    },
                    data: {
                        esPrincipal: false
                    }
                });
            }

            return await tx.cliente_ubicacion.update({
                where: {
                    idClienteUbicacion:
                        ubicacionId
                },
                data: cambios
            });
        }
    );
};
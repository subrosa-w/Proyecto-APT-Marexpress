import prisma from "../../config/prisma.js";

const incluirManifiesto = {
    vehiculo: true,
    conductor: true,
    comuna: {
        include: {
            region: true,
            sucursal: {
                where: { estado: true },
                select: {
                    idSucursal: true,
                    nombreSucursal: true,
                    direccion: true,
                    telefono: true
                }
            }
        }
    },
    manifiesto_usuario: {
        include: {
            usuario: {
                select: {
                    idUsuario: true,
                    nombre: true,
                    apellido: true,
                    nombreUsuario: true,
                    rol: {
                        select: { nombreRol: true }
                    }
                }
            }
        }
    },
    manifiesto_ot: {
        include: {
            orden_transporte: {
                include: {
                    cliente: {
                        select: { razonSocial: true, rut: true }
                    },
                    destinatario: {
                        select: { nombreRazonSocial: true }
                    },
                    estado_ot: true,
                    comuna_orden_transporte_idComunaDestinoTocomuna: {
                        select: { nombreComuna: true }
                    }
                }
            },
            manifiesto_carga: {
                include: {
                    detalle_carga: {
                        include: { tipo_bulto: true }
                    },
                    manifiesto_bulto: {
                        include: { bulto: true },
                        orderBy: { idManifiestoBulto: "asc" }
                    }
                }
            }
        }
    }
};

const errorHttp = (mensaje, status = 400) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const idEntero = (valor, campo) => {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        throw errorHttp(`${campo} no es válido`);
    }
    return id;
};

const estadosAnulados = ["ANULADA", "CANCELADA"];

export const obtenerManifiestos = async () => {
    return prisma.manifiesto.findMany({
        include: incluirManifiesto,
        orderBy: { fechaCreacion: "desc" }
    });
};

export const obtenerManifiestoPorId = async (idManifiesto) => {
    const manifiesto = await prisma.manifiesto.findUnique({
        where: { idManifiesto: idEntero(idManifiesto, "Manifiesto") },
        include: incluirManifiesto
    });
    if (!manifiesto) {
        throw errorHttp("Manifiesto no encontrado", 404);
    }
    return manifiesto;
};

const asignarPeonetas = async (tx, idManifiesto, idsPeoneta) => {
    const ids = [...new Set((idsPeoneta || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
    await tx.manifiesto_usuario.deleteMany({ where: { idManifiesto } });
    if (!ids.length) {
        return;
    }

    const peonetas = await tx.usuario.findMany({
        where: {
            idUsuario: { in: ids },
            estado: true,
            rol: { nombreRol: "PEONETA" }
        }
    });

    if (peonetas.length !== ids.length) {
        throw errorHttp("Uno o más peonetas no son válidos");
    }

    await tx.manifiesto_usuario.createMany({
        data: ids.map((idUsuario) => ({ idManifiesto, idUsuario }))
    });
};

const parseFecha = (valor, campo) => {
    if (!valor) {
        throw errorHttp(`La ${campo} es obligatoria`);
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
        throw errorHttp(`La ${campo} no es válida`);
    }
    return fecha;
};

export const crearManifiesto = async (datos) => {
    if (!datos.idVehiculo || !datos.idConductor) {
        throw errorHttp("Debe asignar camión y conductor");
    }
    if (!Array.isArray(datos.idsPeoneta) || !datos.idsPeoneta.length) {
        throw errorHttp("Debe asignar un peoneta");
    }

    const idVehiculo = idEntero(datos.idVehiculo, "Camión");
    const idConductor = idEntero(datos.idConductor, "Conductor");
    const idComuna = idEntero(datos.idComuna, "Ciudad");
    const fechaSalidaProgramada = parseFecha(datos.fechaSalidaProgramada, "fecha de salida a ruta");

    const [vehiculo, conductor, comuna] = await Promise.all([
        prisma.vehiculo.findFirst({ where: { idVehiculo, estado: true } }),
        prisma.conductor.findFirst({ where: { idConductor, estado: true } }),
        prisma.comuna.findFirst({
            where: { idComuna, estado: true },
            include: { region: true }
        })
    ]);

    if (!vehiculo) {
        throw errorHttp("El camión no existe o está inactivo");
    }
    if (!conductor) {
        throw errorHttp("El conductor no existe o está inactivo");
    }
    if (!comuna) {
        throw errorHttp("La ciudad no existe o está inactiva");
    }

    return prisma.$transaction(async (tx) => {
        const creado = await tx.manifiesto.create({
            data: {
                numeroManifiesto: `TMP-${Date.now()}`,
                estado: "PREPARACION",
                observacion: datos.observacion?.trim() || null,
                idVehiculo,
                idConductor,
                idComuna,
                fechaSalidaProgramada
            }
        });

        const numeroManifiesto = `MAN-${String(creado.idManifiesto).padStart(6, "0")}`;
        await tx.manifiesto.update({
            where: { idManifiesto: creado.idManifiesto },
            data: { numeroManifiesto }
        });

        await asignarPeonetas(tx, creado.idManifiesto, datos.idsPeoneta);

        return tx.manifiesto.findUnique({
            where: { idManifiesto: creado.idManifiesto },
            include: incluirManifiesto
        });
    });
};

export const actualizarManifiesto = async (idManifiesto, datos) => {
    const manifiesto = await obtenerManifiestoPorId(idManifiesto);
    if (manifiesto.estado !== "PREPARACION") {
        throw errorHttp("Solo se puede editar un manifiesto en preparación");
    }

    const idVehiculo = datos.idVehiculo ? idEntero(datos.idVehiculo, "Camión") : manifiesto.idVehiculo;
    const idConductor = datos.idConductor ? idEntero(datos.idConductor, "Conductor") : manifiesto.idConductor;

    return prisma.$transaction(async (tx) => {
        await tx.manifiesto.update({
            where: { idManifiesto: manifiesto.idManifiesto },
            data: {
                idVehiculo,
                idConductor,
                idComuna: datos.idComuna ? idEntero(datos.idComuna, "Ciudad") : manifiesto.idComuna,
                fechaSalidaProgramada: datos.fechaSalidaProgramada
                    ? parseFecha(datos.fechaSalidaProgramada, "fecha de salida a ruta")
                    : manifiesto.fechaSalidaProgramada,
                observacion: datos.observacion !== undefined
                    ? (datos.observacion?.trim() || null)
                    : manifiesto.observacion
            }
        });

        if (datos.idsPeoneta) {
            await asignarPeonetas(tx, manifiesto.idManifiesto, datos.idsPeoneta);
        }

        return tx.manifiesto.findUnique({
            where: { idManifiesto: manifiesto.idManifiesto },
            include: incluirManifiesto
        });
    });
};

const sincronizarCargaManifiesto = async (tx, carga, pesoQuitado = 0) => {
    const quedan = await tx.manifiesto_bulto.count({
        where: { idManifiestoCarga: carga.idManifiestoCarga }
    });
    if (quedan) {
        const pesoRestante = Number(carga.pesoEnviado || 0) - Number(pesoQuitado || 0);
        await tx.manifiesto_carga.update({
            where: { idManifiestoCarga: carga.idManifiestoCarga },
            data: {
                cantidadEnviada: quedan,
                pesoEnviado: pesoRestante > 0 ? pesoRestante : 0
            }
        });
        return;
    }

    const idManifiestoOT = carga.idManifiestoOT;
    await tx.manifiesto_carga.delete({
        where: { idManifiestoCarga: carga.idManifiestoCarga }
    });
    const cargas = await tx.manifiesto_carga.count({ where: { idManifiestoOT } });
    if (!cargas) {
        await tx.manifiesto_ot.delete({ where: { idManifiestoOT } });
    }
};

const liberarCargasVaciasEnPreparacion = async (tx, idDetalleCarga) => {
    const vacias = await tx.manifiesto_carga.findMany({
        where: {
            idDetalleCarga,
            manifiesto_bulto: { none: {} },
            manifiesto_ot: {
                manifiesto: { estado: "PREPARACION" }
            }
        }
    });
    for (const carga of vacias) {
        await sincronizarCargaManifiesto(tx, carga);
    }
};

const agregarBultoAlManifiesto = async (tx, manifiesto, bulto, idUsuario) => {
    const orden = bulto.detalle_carga?.orden_transporte;
    if (!orden) {
        throw errorHttp("El bulto no está asociado a una OT");
    }

    const estadoOt = String(orden.estado_ot?.nombreEstado || "").toUpperCase();
    if (estadosAnulados.includes(estadoOt)) {
        throw errorHttp(`No se puede cargar ${bulto.codigoBulto}: la OT está ${estadoOt.toLowerCase()}`);
    }

    if (bulto.estado !== "EN_BODEGA") {
        throw errorHttp(`${bulto.codigoBulto} no está en bodega (estado ${bulto.estado})`);
    }

    const yaEnEste = await tx.manifiesto_bulto.findFirst({
        where: {
            idBulto: bulto.idBulto,
            manifiesto_carga: { manifiesto_ot: { idManifiesto: manifiesto.idManifiesto } }
        }
    });
    if (yaEnEste) {
        throw errorHttp(`${bulto.codigoBulto} ya está en este manifiesto`);
    }

    const enOtro = await tx.manifiesto_bulto.findFirst({
        where: {
            idBulto: bulto.idBulto,
            manifiesto_carga: {
                manifiesto_ot: {
                    manifiesto: {
                        estado: { in: ["PREPARACION", "EN_RUTA", "EN_TRANSITO"] }
                    }
                }
            }
        }
    });
    if (enOtro) {
        throw errorHttp(`${bulto.codigoBulto} ya está asignado a otro manifiesto`);
    }

    await liberarCargasVaciasEnPreparacion(tx, bulto.idDetalleCarga);

    let manifiestoOt = await tx.manifiesto_ot.findUnique({
        where: {
            idManifiesto_idOrden: {
                idManifiesto: manifiesto.idManifiesto,
                idOrden: orden.idOrden
            }
        }
    });
    if (!manifiestoOt) {
        manifiestoOt = await tx.manifiesto_ot.create({
            data: {
                idManifiesto: manifiesto.idManifiesto,
                idOrden: orden.idOrden
            }
        });
    }

    let carga = await tx.manifiesto_carga.findFirst({
        where: {
            idManifiestoOT: manifiestoOt.idManifiestoOT,
            idDetalleCarga: bulto.idDetalleCarga
        }
    });

    if (!carga) {
        carga = await tx.manifiesto_carga.create({
            data: {
                idManifiestoOT: manifiestoOt.idManifiestoOT,
                idDetalleCarga: bulto.idDetalleCarga,
                cantidadEnviada: 1,
                pesoEnviado: bulto.peso
            }
        });
    } else {
        const bultosYaCargados = await tx.manifiesto_bulto.count({
            where: { idManifiestoCarga: carga.idManifiestoCarga }
        });
        const debeReservar = bultosYaCargados >= Number(carga.cantidadEnviada || 0);
        await tx.manifiesto_carga.update({
            where: { idManifiestoCarga: carga.idManifiestoCarga },
            data: {
                cantidadEnviada: debeReservar
                    ? { increment: 1 }
                    : carga.cantidadEnviada,
                pesoEnviado: Number(carga.pesoEnviado || 0) + Number(bulto.peso || 0)
            }
        });
    }

    await tx.manifiesto_bulto.create({
        data: {
            idManifiestoCarga: carga.idManifiestoCarga,
            idBulto: bulto.idBulto
        }
    });

    await tx.bulto.update({
        where: { idBulto: bulto.idBulto },
        data: { estado: "ASIGNADO_MANIFIESTO" }
    });

    try {
        await tx.movimiento_bulto.create({
            data: {
                idBulto: bulto.idBulto,
                idSucursal: bulto.idSucursalActual,
                idManifiesto: manifiesto.idManifiesto,
                tipoMovimiento: "ASIGNACION_MANIFIESTO",
                idUsuario,
                observacion: `Escaneo ${bulto.codigoBulto}`
            }
        });
    } catch {
        /* el tipo de movimiento puede estar restringido */
    }

    return bulto;
};

const bultoConOrden = {
    detalle_carga: {
        include: {
            tipo_bulto: true,
            orden_transporte: {
                include: { estado_ot: true }
            }
        }
    }
};

export const escanearCodigoManifiesto = async (idManifiesto, codigoRaw, idUsuario, idsBulto = [], listar = false) => {
    const codigo = String(codigoRaw || "").trim();
    if (!codigo) {
        throw errorHttp("Escanea un código de bulto u OT");
    }

    const manifiesto = await obtenerManifiestoPorId(idManifiesto);
    if (manifiesto.estado !== "PREPARACION") {
        throw errorHttp("Solo se puede escanear sobre un manifiesto en preparación");
    }

    const idsElegidos = (Array.isArray(idsBulto) ? idsBulto : [])
        .map((item) => Number(item))
        .filter((id) => Number.isInteger(id) && id > 0);

    const mapearBultoSeleccion = (bulto) => ({
        idBulto: bulto.idBulto,
        codigoBulto: bulto.codigoBulto,
        peso: bulto.peso,
        largoCm: bulto.largoCm,
        anchoCm: bulto.anchoCm,
        altoCm: bulto.altoCm,
        tipo: bulto.detalle_carga?.tipo_bulto?.nombreTipo || "Bulto"
    });

    const porCodigo = await prisma.bulto.findUnique({
        where: { codigoBulto: codigo },
        include: bultoConOrden
    });

    if (!porCodigo) {
        const orden = await prisma.orden_transporte.findUnique({
            where: { numeroOT: codigo },
            include: { estado_ot: true }
        });
        if (!orden) {
            throw errorHttp(`No se encontró el código ${codigo}`);
        }
        const estadoOt = String(orden.estado_ot?.nombreEstado || "").toUpperCase();
        if (estadosAnulados.includes(estadoOt)) {
            throw errorHttp(`No se puede cargar la ${codigo}: está ${estadoOt.toLowerCase()}`);
        }

        const disponibles = await prisma.bulto.findMany({
            where: {
                estado: "EN_BODEGA",
                detalle_carga: { idOrden: orden.idOrden }
            },
            include: bultoConOrden,
            orderBy: { numeroBulto: "asc" }
        });

        const enEsteManifiesto = await prisma.bulto.findMany({
            where: {
                detalle_carga: { idOrden: orden.idOrden },
                manifiesto_bulto: {
                    some: {
                        manifiesto_carga: {
                            manifiesto_ot: { idManifiesto: manifiesto.idManifiesto }
                        }
                    }
                }
            },
            include: bultoConOrden,
            orderBy: { numeroBulto: "asc" }
        });

        if (listar) {
            const idsEnEste = new Set(enEsteManifiesto.map((item) => item.idBulto));
            return {
                listar: true,
                numeroOT: orden.numeroOT,
                bultos: [
                    ...enEsteManifiesto.map((item) => ({
                        ...mapearBultoSeleccion(item),
                        enManifiesto: true
                    })),
                    ...disponibles
                        .filter((item) => !idsEnEste.has(item.idBulto))
                        .map((item) => ({
                            ...mapearBultoSeleccion(item),
                            enManifiesto: false
                        }))
                ]
            };
        }

        if (!disponibles.length) {
            throw errorHttp(
                enEsteManifiesto.length
                    ? `La ${codigo} ya está en este manifiesto. Elige la OT para quitar bultos.`
                    : `La ${codigo} no tiene bultos en bodega para cargar`
            );
        }

        const permitidos = new Set(disponibles.map((item) => item.idBulto));
        const elegidos = idsElegidos.length
            ? idsElegidos.filter((id) => permitidos.has(id))
            : disponibles.map((item) => item.idBulto);
        if (!elegidos.length) {
            throw errorHttp("Selecciona al menos un bulto de la OT que siga en bodega");
        }

        return prisma.$transaction(async (tx) => {
            const agregados = [];
            for (const id of elegidos) {
                const bulto = disponibles.find((item) => item.idBulto === id);
                await agregarBultoAlManifiesto(tx, manifiesto, bulto, idUsuario);
                agregados.push(bulto.codigoBulto);
            }
            const actualizado = await tx.manifiesto.findUnique({
                where: { idManifiesto: manifiesto.idManifiesto },
                include: incluirManifiesto
            });
            return { manifiesto: actualizado, agregados, numeroOT: orden.numeroOT };
        });
    }

    return prisma.$transaction(async (tx) => {
        await agregarBultoAlManifiesto(tx, manifiesto, porCodigo, idUsuario);
        const actualizado = await tx.manifiesto.findUnique({
            where: { idManifiesto: manifiesto.idManifiesto },
            include: incluirManifiesto
        });
        return { manifiesto: actualizado, agregados: [porCodigo.codigoBulto] };
    });
};

export const quitarBultoDelManifiesto = async (idManifiesto, idBulto) => {
    const manifiesto = await obtenerManifiestoPorId(idManifiesto);
    if (manifiesto.estado !== "PREPARACION") {
        throw errorHttp("Solo se puede quitar carga de un manifiesto en preparación");
    }

    const id = idEntero(idBulto, "Bulto");

    return prisma.$transaction(async (tx) => {
        const item = await tx.manifiesto_bulto.findFirst({
            where: {
                idBulto: id,
                manifiesto_carga: { manifiesto_ot: { idManifiesto: manifiesto.idManifiesto } }
            },
            include: { manifiesto_carga: true }
        });

        if (!item) {
            throw errorHttp("El bulto no está en este manifiesto", 404);
        }

        const bultoFila = await tx.bulto.findUnique({
            where: { idBulto: id },
            select: { peso: true }
        });

        await tx.manifiesto_bulto.delete({
            where: { idManifiestoBulto: item.idManifiestoBulto }
        });

        await sincronizarCargaManifiesto(tx, item.manifiesto_carga, bultoFila?.peso);

        await tx.bulto.update({
            where: { idBulto: id },
            data: { estado: "EN_BODEGA" }
        });

        return tx.manifiesto.findUnique({
            where: { idManifiesto: manifiesto.idManifiesto },
            include: incluirManifiesto
        });
    });
};

export const sacarManifiestoARuta = async (idManifiesto, idUsuario) => {
    const manifiesto = await obtenerManifiestoPorId(idManifiesto);
    if (manifiesto.estado !== "PREPARACION") {
        throw errorHttp("El manifiesto ya salió a ruta o no está en preparación");
    }
    if (!manifiesto.idVehiculo) {
        throw errorHttp("Debe asignar un camión antes de salir a ruta");
    }
    if (!manifiesto.idConductor) {
        throw errorHttp("Debe asignar un conductor antes de salir a ruta");
    }
    if (!manifiesto.manifiesto_usuario.length) {
        throw errorHttp("Debe asignar al menos un peoneta");
    }

    const bultos = manifiesto.manifiesto_ot.flatMap((ot) =>
        ot.manifiesto_carga.flatMap((carga) => carga.manifiesto_bulto)
    );
    if (!bultos.length) {
        throw errorHttp("Debe escanear al menos un bulto");
    }

    const estadoTransito = await prisma.estado_ot.findFirst({
        where: { nombreEstado: "EN_TRANSITO" }
    });

    return prisma.$transaction(async (tx) => {
        await tx.manifiesto.update({
            where: { idManifiesto: manifiesto.idManifiesto },
            data: {
                estado: "EN_RUTA",
                fechaSalida: new Date()
            }
        });

        await tx.bulto.updateMany({
            where: { idBulto: { in: bultos.map((item) => item.idBulto) } },
            data: { estado: "EN_TRANSITO" }
        });

        if (estadoTransito) {
            const idsOrden = manifiesto.manifiesto_ot.map((item) => item.idOrden);
            await tx.orden_transporte.updateMany({
                where: { idOrden: { in: idsOrden } },
                data: { idEstado: estadoTransito.idEstado }
            });
            for (const idOrden of idsOrden) {
                await tx.historial_ot.create({
                    data: {
                        descripcion: `OT despachada en manifiesto ${manifiesto.numeroManifiesto}`,
                        idOrden,
                        idEstado: estadoTransito.idEstado,
                        idUsuario: Number(idUsuario)
                    }
                });
            }
        }

        for (const item of bultos) {
            try {
                await tx.movimiento_bulto.create({
                    data: {
                        idBulto: item.idBulto,
                        idManifiesto: manifiesto.idManifiesto,
                        tipoMovimiento: "SALIDA_MANIFIESTO",
                        idUsuario: Number(idUsuario),
                        observacion: "Salida a ruta"
                    }
                });
            } catch {
                /* unique o check de tipo */
            }
        }

        return tx.manifiesto.findUnique({
            where: { idManifiesto: manifiesto.idManifiesto },
            include: incluirManifiesto
        });
    });
};

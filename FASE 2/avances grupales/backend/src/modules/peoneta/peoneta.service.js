import prisma from "../../config/prisma.js";

const validarUsuario = (valor) => {
    const idUsuario = Number(valor);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        throw new Error("Usuario inválido");
    }
    return idUsuario;
};

const mapearBultos = (manifiestoOt) =>
    (manifiestoOt.manifiesto_carga || []).flatMap((carga) =>
        (carga.manifiesto_bulto || []).map((item) => {
            const bulto = item.bulto || {};
            const detalle = carga.detalle_carga;
            return {
                codigoBulto: bulto.codigoBulto,
                tipo: detalle?.tipo_bulto?.nombreTipo || "Bulto",
                pesoKg: bulto.peso ?? null,
                largoCm: bulto.largoCm ?? null,
                anchoCm: bulto.anchoCm ?? null,
                altoCm: bulto.altoCm ?? null,
                estado: bulto.estado || null
            };
        })
    );

const mapearEntrega = (manifiestoOt) => {
    const orden = manifiestoOt.orden_transporte || {};
    const destino = orden.comuna_orden_transporte_idComunaDestinoTocomuna;
    const entrega = manifiestoOt.entrega_ot;
    return {
        numeroOT: orden.numeroOT,
        estado: orden.estado_ot?.nombreEstado || "SIN_ESTADO",
        destinatario: orden.destinatario?.nombreRazonSocial || orden.contactoDestino || "Destinatario",
        direccion: orden.direccionDestino || "",
        comuna: destino?.nombreComuna || "",
        region: destino?.region?.nombreRegion || "",
        contacto: orden.contactoDestino || "",
        telefono: orden.telefonoDestino || "",
        referencia: orden.referenciaEntrega || "",
        bultos: mapearBultos(manifiestoOt),
        resultado: entrega
            ? {
                fechaEntrega: entrega.fechaEntrega,
                resultadoEntrega: entrega.resultadoEntrega,
                nombreReceptor: entrega.nombreReceptor,
                observacion: entrega.observacion
            }
            : null
    };
};

const mapearManifiesto = (asignacion) => {
    const manifiesto = asignacion.manifiesto || {};
    const conductor = manifiesto.conductor;
    return {
        idManifiesto: manifiesto.idManifiesto,
        numeroManifiesto: manifiesto.numeroManifiesto,
        estado: manifiesto.estado,
        observacion: manifiesto.observacion,
        fechaSalidaProgramada: manifiesto.fechaSalidaProgramada,
        fechaSalida: manifiesto.fechaSalida,
        ciudad: manifiesto.comuna?.nombreComuna || "",
        region: manifiesto.comuna?.region?.nombreRegion || "",
        camion: manifiesto.vehiculo
            ? `${manifiesto.vehiculo.patente} · ${manifiesto.vehiculo.marca} ${manifiesto.vehiculo.modelo}`
            : "",
        conductor: conductor ? `${conductor.nombre} ${conductor.apellido}`.trim() : "",
        entregas: (manifiesto.manifiesto_ot || []).map(mapearEntrega)
    };
};

export const obtenerManifiestosPeoneta = async (idUsuario) => {
    const usuarioId = validarUsuario(idUsuario);

    const asignaciones = await prisma.manifiesto_usuario.findMany({
        where: { idUsuario: usuarioId },
        orderBy: { fechaAsignacion: "desc" },
        select: {
            manifiesto: {
                select: {
                    idManifiesto: true,
                    numeroManifiesto: true,
                    fechaSalidaProgramada: true,
                    fechaSalida: true,
                    estado: true,
                    observacion: true,
                    vehiculo: {
                        select: { patente: true, marca: true, modelo: true }
                    },
                    conductor: {
                        select: { nombre: true, apellido: true }
                    },
                    comuna: {
                        select: {
                            nombreComuna: true,
                            region: { select: { nombreRegion: true } }
                        }
                    },
                    manifiesto_ot: {
                        select: {
                            entrega_ot: {
                                select: {
                                    fechaEntrega: true,
                                    resultadoEntrega: true,
                                    nombreReceptor: true,
                                    observacion: true
                                }
                            },
                            manifiesto_carga: {
                                select: {
                                    detalle_carga: {
                                        select: {
                                            tipo_bulto: { select: { nombreTipo: true } }
                                        }
                                    },
                                    manifiesto_bulto: {
                                        select: {
                                            bulto: {
                                                select: {
                                                    codigoBulto: true,
                                                    peso: true,
                                                    largoCm: true,
                                                    anchoCm: true,
                                                    altoCm: true,
                                                    estado: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            orden_transporte: {
                                select: {
                                    numeroOT: true,
                                    direccionDestino: true,
                                    contactoDestino: true,
                                    telefonoDestino: true,
                                    referenciaEntrega: true,
                                    estado_ot: { select: { nombreEstado: true } },
                                    destinatario: { select: { nombreRazonSocial: true } },
                                    comuna_orden_transporte_idComunaDestinoTocomuna: {
                                        select: {
                                            nombreComuna: true,
                                            region: { select: { nombreRegion: true } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return asignaciones.map(mapearManifiesto);
};

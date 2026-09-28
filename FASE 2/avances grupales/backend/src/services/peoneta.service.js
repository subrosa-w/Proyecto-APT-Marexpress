import prisma from "../config/prisma.js";

/*
 * ============================================================
 * MAREXPRESS - SERVICIO PEONETA
 * ============================================================
 *
 * REGLA DE SEGURIDAD:
 * El idUsuario siempre proviene del JWT autenticado.
 *
 * Un peoneta solamente puede consultar manifiestos que estén
 * asignados a él mediante manifiesto_usuario.
 *
 * NO se exponen:
 * - Tarifas internas
 * - valorKg
 * - valorM3
 * - márgenes
 * - configuraciones comerciales
 * - información de otros clientes/manifiestos
 * ============================================================
 */

const validarUsuario = (valor) => {
    const idUsuario = Number(valor);

    if (
        !Number.isInteger(idUsuario) ||
        idUsuario <= 0
    ) {
        throw new Error("Usuario inválido");
    }

    return idUsuario;
};


/*
 * ============================================================
 * OBTENER MANIFIESTOS ASIGNADOS AL PEONETA
 * ============================================================
 */
export const obtenerManifiestosPeoneta = async (
    idUsuario
) => {
    const usuarioId = validarUsuario(idUsuario);

    return await prisma.manifiesto_usuario.findMany({
        where: {
            idUsuario: usuarioId
        },

        orderBy: {
            fechaAsignacion: "desc"
        },

        select: {
            fechaAsignacion: true,

            manifiesto: {
                select: {
                    idManifiesto: true,
                    numeroManifiesto: true,
                    fechaCreacion: true,
                    fechaSalida: true,
                    estado: true,
                    observacion: true,

                    vehiculo: {
                        select: {
                            patente: true,
                            marca: true,
                            modelo: true
                        }
                    },

                    manifiesto_ot: {
                        select: {
                            idManifiestoOT: true,
                            fechaAsignacion: true,

                            orden_transporte: {
                                select: {
                                    idOrden: true,
                                    numeroOT: true,

                                    /*
                                     * DESTINO REAL DE LA CARGA.
                                     * No depende de cliente_ubicacion.
                                     */
                                    direccionDestino: true,
                                    contactoDestino: true,
                                    telefonoDestino: true,

                                    tipoDocumento: true,
                                    numeroDocumento: true,

                                    valorTotal: true,

                                    estado_ot: {
                                        select: {
                                            nombreEstado: true
                                        }
                                    },

                                    comuna_orden_transporte_idComunaDestinoTocomuna: {
                                        select: {
                                            idComuna: true,
                                            nombreComuna: true,

                                            region: {
                                                select: {
                                                    nombreRegion: true
                                                }
                                            }
                                        }
                                    },

                                    /*
                                     * BULTOS GENERALES DE LA OT
                                     */
                                    detalle_carga: {
                                        select: {
                                            idDetalleCarga: true,
                                            descripcion: true,
                                            cantidad: true,
                                            pesoTotal: true,

                                            tipo_bulto: {
                                                select: {
                                                    nombreTipo: true
                                                }
                                            }
                                        }
                                    },

                                    /*
                                     * ESTADO DE PAGO.
                                     *
                                     * Solo mostramos información necesaria
                                     * para la entrega. No exponemos
                                     * configuraciones internas de tarifas.
                                     */
                                    pago: {
                                        select: {
                                            idPago: true,
                                            fechaPago: true,
                                            monto: true,
                                            metodoPago: true,
                                            estadoPago: true,
                                            referencia: true
                                        },

                                        orderBy: {
                                            fechaPago: "desc"
                                        }
                                    }
                                }
                            },

                            /*
                             * CARGA QUE REALMENTE VA EN ESTE MANIFIESTO.
                             *
                             * Esto es importante porque una OT puede
                             * enviarse parcialmente en distintos viajes.
                             */
                            manifiesto_carga: {
                                select: {
                                    idManifiestoCarga: true,
                                    cantidadEnviada: true,
                                    pesoEnviado: true,
                                    observacion: true,

                                    detalle_carga: {
                                        select: {
                                            idDetalleCarga: true,
                                            descripcion: true,

                                            tipo_bulto: {
                                                select: {
                                                    nombreTipo: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },

                            /*
                             * Si ya existe una entrega registrada,
                             * mostramos su resultado.
                             */
                            entrega_ot: {
                                select: {
                                    idEntrega: true,
                                    fechaEntrega: true,
                                    resultadoEntrega: true,
                                    motivoResultado: true,
                                    nombreReceptor: true,
                                    observacion: true,
                                    evidencia: true,

                                    entrega_carga: {
                                        select: {
                                            idDetalleCarga: true,
                                            cantidadEntregada: true,
                                            pesoEntregado: true,
                                            observacion: true
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
};
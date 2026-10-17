import prisma from "../../config/prisma.js";
import { candidatosCodigo } from "../../common/utils/codigoOt.js";
import { registrarEventoOt } from "../ordenes/ordenesTransporte.service.js";

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
        idManifiestoOT: manifiestoOt.idManifiestoOT,
        numeroOT: orden.numeroOT,
        estado: orden.estado_ot?.nombreEstado || "SIN_ESTADO",
        valor: orden.valorTotal ?? null,
        pago: (orden.pago || [])[0]
            ? {
                estadoPago: orden.pago[0].estadoPago,
                metodoPago: orden.pago[0].metodoPago,
                tipoPago: orden.pago[0].tipoPago
            }
            : null,
        destinatario: orden.destinatario?.nombreRazonSocial || orden.contactoDestino || "Destinatario",
        direccion: orden.direccionDestino || "",
        comuna: destino?.nombreComuna || "",
        region: destino?.region?.nombreRegion || "",
        contacto: orden.contactoDestino || "",
        telefono: orden.telefonoDestino || "",
        referencia: orden.referenciaEntrega || "",
        bultos: mapearBultos(manifiestoOt),
        resultado: entrega && entrega.resultadoEntrega !== "EN_PROCESO"
            ? {
                fechaEntrega: entrega.fechaEntrega,
                resultadoEntrega: entrega.resultadoEntrega,
                nombreReceptor: entrega.nombreReceptor,
                observacion: entrega.observacion,
                motivoResultado: entrega.motivoResultado
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
                            idManifiestoOT: true,
                            entrega_ot: {
                                select: {
                                    fechaEntrega: true,
                                    resultadoEntrega: true,
                                    nombreReceptor: true,
                                    observacion: true,
                                    motivoResultado: true
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
                                    valorTotal: true,
                                    pago: {
                                        orderBy: { idPago: "desc" },
                                        take: 1,
                                        select: { estadoPago: true, metodoPago: true, tipoPago: true }
                                    },
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

const errorDatos = (mensaje, status = 400) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const METODOS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "TRANSBANK", "CHEQUE"];

const estadoDeResultado = async (db, resultado) => {
    const nombres = resultado === "ENTREGADA"
        ? ["ENTREGADA", "ENTREGADO"]
        : ["RECHAZADA", "RECHAZADO"];
    const existente = await db.estado_ot.findFirst({
        where: { nombreEstado: { in: nombres } }
    });
    if (existente) {
        return existente;
    }
    return db.estado_ot.create({
        data: {
            nombreEstado: resultado,
            descripcion: resultado === "ENTREGADA"
                ? "Orden entregada en destino"
                : "Orden rechazada en destino"
        }
    });
};

export const registrarEntregaPeoneta = async ({
    idUsuario,
    numeroOT,
    resultado,
    observacion,
    nombreReceptor,
    metodoPago
}) => {
    const usuarioId = validarUsuario(idUsuario);
    const numero = String(numeroOT || "").trim();
    const resultadoLimpio = String(resultado || "").trim().toUpperCase();
    const nota = String(observacion || "").trim();
    const receptor = String(nombreReceptor || "").trim();
    const metodo = String(metodoPago || "").trim().toUpperCase();

    if (!numero) {
        throw errorDatos("Indica la orden de transporte");
    }
    if (!["ENTREGADA", "RECHAZADA"].includes(resultadoLimpio)) {
        throw errorDatos("El resultado debe ser entregada o rechazada");
    }
    if (resultadoLimpio === "ENTREGADA" && !receptor) {
        throw errorDatos("Indica quién recibió la carga");
    }
    if (resultadoLimpio === "RECHAZADA" && nota.length < 3) {
        throw errorDatos("El rechazo necesita una observación");
    }
    if (resultadoLimpio === "ENTREGADA" && !METODOS_PAGO.includes(metodo)) {
        throw errorDatos("Selecciona el método de pago: efectivo, transferencia, Transbank o cheque");
    }

    const asignacion = await prisma.manifiesto_ot.findFirst({
        where: {
            orden_transporte: { numeroOT: { in: candidatosCodigo(numero) } },
            manifiesto: {
                manifiesto_usuario: { some: { idUsuario: usuarioId } }
            }
        },
        include: {
            entrega_ot: true,
            manifiesto_carga: {
                include: {
                    manifiesto_bulto: {
                        select: {
                            idBulto: true,
                            bulto: { select: { idDetalleCarga: true, peso: true } }
                        }
                    }
                }
            },
            orden_transporte: {
                include: {
                    pago: { orderBy: { idPago: "desc" }, take: 1 },
                    estado_ot: true
                }
            }
        }
    });

    if (!asignacion) {
        throw errorDatos("Esa orden no está en un manifiesto tuyo", 404);
    }
    if (asignacion.entrega_ot && asignacion.entrega_ot.resultadoEntrega !== "EN_PROCESO") {
        throw errorDatos("Esta orden ya tiene un resultado de entrega");
    }

    const piezas = [...new Map(
        asignacion.manifiesto_carga.flatMap((carga) =>
            carga.manifiesto_bulto.map((item) => [
                item.idBulto,
                {
                    idBulto: item.idBulto,
                    idDetalleCarga: item.bulto?.idDetalleCarga,
                    peso: Number(item.bulto?.peso) || 0
                }
            ])
        )
    ).values()];
    if (!piezas.length) {
        throw errorDatos("Esta orden no tiene bultos cargados en el manifiesto");
    }

    const estado = await estadoDeResultado(prisma, resultadoLimpio);
    const texto = (
        resultadoLimpio === "ENTREGADA"
            ? `Entregada a ${receptor}. Pago ${metodo}.${nota ? ` ${nota}` : ""}`
            : `Rechazada. ${nota}`
    ).slice(0, 250);
    const estadoBulto = resultadoLimpio === "ENTREGADA" ? "ENTREGADO" : "RECHAZADO";

    try {
    await prisma.$transaction(async (tx) => {
        const entrega = asignacion.entrega_ot?.resultadoEntrega === "EN_PROCESO"
            ? asignacion.entrega_ot
            : await tx.entrega_ot.create({
                data: {
                    resultadoEntrega: "EN_PROCESO",
                    nombreReceptor: receptor || null,
                    observacion: nota.slice(0, 250) || null,
                    idOrden: asignacion.idOrden,
                    idManifiestoOT: asignacion.idManifiestoOT,
                    idUsuario: usuarioId
                }
            });

        if (resultadoLimpio === "ENTREGADA") {
            const grupos = new Map();
            for (const pieza of piezas) {
                const grupo = grupos.get(pieza.idDetalleCarga) || { cantidad: 0, peso: 0 };
                grupo.cantidad += 1;
                grupo.peso += pieza.peso;
                grupos.set(pieza.idDetalleCarga, grupo);
            }
            await tx.entrega_carga.createMany({
                data: [...grupos.entries()].map(([idDetalleCarga, grupo]) => ({
                    idEntrega: entrega.idEntrega,
                    idDetalleCarga,
                    cantidadEntregada: grupo.cantidad,
                    pesoEntregado: grupo.peso > 0 ? grupo.peso : null,
                    observacion: nota.slice(0, 200) || null
                }))
            });
        }

        await tx.entrega_bulto.createMany({
            data: piezas.map((pieza) => ({
                idEntrega: entrega.idEntrega,
                idBulto: pieza.idBulto,
                estadoEntrega: estadoBulto,
                observacion: nota.slice(0, 200) || null
            }))
        });

        await tx.entrega_ot.update({
            where: { idEntrega: entrega.idEntrega },
            data: {
                resultadoEntrega: resultadoLimpio,
                motivoResultado: resultadoLimpio === "RECHAZADA" ? nota.slice(0, 250) : null,
                nombreReceptor: receptor || null,
                observacion: nota.slice(0, 250) || null
            }
        });

        await tx.orden_transporte.update({
            where: { idOrden: asignacion.idOrden },
            data: { idEstado: estado.idEstado }
        });

        if (resultadoLimpio === "ENTREGADA") {
            const pago = asignacion.orden_transporte.pago?.[0];
            if (pago && String(pago.estadoPago || "").toUpperCase() !== "PAGADO" && pago.tipoPago !== "CUENTA_CORRIENTE") {
                await tx.pago.update({
                    where: { idPago: pago.idPago },
                    data: {
                        metodoPago: metodo,
                        estadoPago: "PAGADO",
                        tipoPago: pago.tipoPago || "CONTADO",
                        observacion: `Cobrado en destino: ${metodo}`.slice(0, 200)
                    }
                });
            }
        }

        await registrarEventoOt({
            db: tx,
            idOrden: asignacion.idOrden,
            idEstado: estado.idEstado,
            idUsuario: usuarioId,
            descripcion: texto,
            ubicacion: "Entrega en destino"
        });
    });
    } catch (error) {
        const textoError = String(error?.message || "");
        const mensaje = textoError.match(/Message: `([^`]+)`/)?.[1];
        if (mensaje) {
            throw errorDatos(mensaje);
        }
        throw error;
    }

    return obtenerManifiestosPeoneta(usuarioId);
};

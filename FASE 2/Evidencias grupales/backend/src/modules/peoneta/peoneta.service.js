import prisma from "../../config/prisma.js";
import { candidatosCodigo } from "../../common/utils/codigoOt.js";
import { registrarEventoOt } from "../ordenes/ordenesTransporte.service.js";
import { guardarComprobante, leerComprobante } from "../../common/utils/comprobante.js";

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
                motivoResultado: entrega.motivoResultado,
                idEntrega: entrega.idEntrega,
                tieneComprobante: Boolean(entrega.evidencia)
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
        tipo: manifiesto.tipo || "REPARTO",
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
                    tipo: true,
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
                                    idEntrega: true,
                                    fechaEntrega: true,
                                    resultadoEntrega: true,
                                    nombreReceptor: true,
                                    observacion: true,
                                    motivoResultado: true,
                                    evidencia: true
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
    metodoPago,
    comprobante
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
            manifiesto: { select: { tipo: true } },
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
                    estado_ot: true,
                    comuna_orden_transporte_idComunaDestinoTocomuna: { select: { nombreComuna: true } }
                }
            }
        }
    });

    if (!asignacion) {
        throw errorDatos("Esa orden no está en un manifiesto tuyo", 404);
    }
    if (asignacion.manifiesto?.tipo === "TRASPASO") {
        throw errorDatos("Este viaje es un traspaso entre bodegas. No se entrega ni se cobra en la puerta.");
    }
    if (asignacion.entrega_ot && asignacion.entrega_ot.resultadoEntrega !== "EN_PROCESO") {
        throw errorDatos("Esta orden ya tiene un resultado de entrega");
    }
    const estadoActual = String(asignacion.orden_transporte.estado_ot?.nombreEstado || "").toUpperCase();
    if (estadoActual === "DEVOLUCION_SOLICITADA" || estadoActual === "DEVUELTA") {
        throw errorDatos("El cliente pidió la devolución. Regresa la carga a la oficina, no la entregues.");
    }
    const enReparto = ["EN_REPARTO", "EN_DESTINO", "EN_ENTREGA"].includes(estadoActual)
        || asignacion.entrega_ot?.resultadoEntrega === "EN_PROCESO";
    if (!enReparto) {
        throw errorDatos("Primero indica que la carga está en el camión para iniciar el reparto");
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
    const ciudad = asignacion.orden_transporte.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || "Destino";
    const texto = (
        resultadoLimpio === "ENTREGADA"
            ? `Entrega realizada a ${receptor}`
            : `Entrega rechazada. Motivo: ${nota}`
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
                const evidencia = comprobante?.datos
                    ? guardarComprobante(comprobante)
                    : null;
                await tx.pago.update({
                    where: { idPago: pago.idPago },
                    data: {
                        metodoPago: metodo,
                        estadoPago: "POR_CUADRAR",
                        tipoPago: pago.tipoPago || "POR_PAGAR",
                        observacion: `Declarado en destino: ${metodo}`.slice(0, 200)
                    }
                });
                if (evidencia) {
                    await tx.entrega_ot.update({
                        where: { idEntrega: entrega.idEntrega },
                        data: { evidencia }
                    });
                }
            }
        }

        await registrarEventoOt({
            db: tx,
            idOrden: asignacion.idOrden,
            idEstado: estado.idEstado,
            idUsuario: usuarioId,
            descripcion: texto,
            ubicacion: ciudad
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

const estadoReparto = async (db) => {
    const existente = await db.estado_ot.findFirst({
        where: { nombreEstado: "EN_REPARTO" }
    });
    if (existente) {
        return existente;
    }
    return db.estado_ot.create({
        data: {
            nombreEstado: "EN_REPARTO",
            descripcion: "La carga está en el camión y va en reparto"
        }
    });
};

// El peoneta confirma que la carga ya va en el camión. Hasta ese momento la orden sigue en tránsito.
export const iniciarRepartoPeoneta = async ({ idUsuario, numeroOT, idManifiesto }) => {
    const usuarioId = validarUsuario(idUsuario);
    const numero = String(numeroOT || "").trim();
    const manifiestoId = Number(idManifiesto);
    if (!numero && !Number.isInteger(manifiestoId)) {
        throw errorDatos("Indica la orden o el manifiesto");
    }

    const asignaciones = await prisma.manifiesto_ot.findMany({
        where: {
            ...(numero ? { orden_transporte: { numeroOT: { in: candidatosCodigo(numero) } } } : {}),
            ...(Number.isInteger(manifiestoId) && manifiestoId > 0 ? { idManifiesto: manifiestoId } : {}),
            manifiesto: {
                estado: { in: ["EN_RUTA", "EN_TRANSITO"] },
                manifiesto_usuario: { some: { idUsuario: usuarioId } }
            }
        },
        include: {
            entrega_ot: true,
            manifiesto_carga: {
                include: {
                    manifiesto_bulto: { select: { idBulto: true } }
                }
            },
            orden_transporte: {
                include: {
                    estado_ot: true,
                    comuna_orden_transporte_idComunaDestinoTocomuna: { select: { nombreComuna: true } }
                }
            }
        }
    });

    if (!asignaciones.length) {
        throw errorDatos("Esa orden no está en un manifiesto cerrado tuyo", 404);
    }
    const tipos = await prisma.manifiesto.findMany({
        where: { idManifiesto: { in: [...new Set(asignaciones.map((item) => item.idManifiesto))] } },
        select: { tipo: true }
    });
    if (tipos.some((item) => item.tipo === "TRASPASO")) {
        throw errorDatos("Este viaje es un traspaso entre bodegas. No se inicia reparto.");
    }

    if (numero && asignaciones.some((item) => String(item.orden_transporte.estado_ot?.nombreEstado || "").toUpperCase() === "DEVOLUCION_SOLICITADA")) {
        throw errorDatos("El cliente pidió la devolución. Regresa la carga a la oficina.");
    }

    const terminadas = ["ENTREGADA", "ENTREGADO", "RECHAZADA", "RECHAZADO", "ANULADA", "CANCELADA", "DEVOLUCION_SOLICITADA", "DEVUELTA"];
    const pendientes = asignaciones.filter((item) => {
        const nombre = String(item.orden_transporte.estado_ot?.nombreEstado || "").toUpperCase();
        if (terminadas.includes(nombre) || nombre === "EN_REPARTO") {
            return false;
        }
        return !item.entrega_ot || item.entrega_ot.resultadoEntrega === "EN_PROCESO";
    });
    if (!pendientes.length) {
        throw errorDatos("Esas órdenes ya están en reparto o tienen un resultado");
    }

    const estado = await estadoReparto(prisma);
    await prisma.$transaction(async (tx) => {
        for (const asignacion of pendientes) {
            await tx.orden_transporte.update({
                where: { idOrden: asignacion.idOrden },
                data: { idEstado: estado.idEstado }
            });
            const idsBulto = asignacion.manifiesto_carga.flatMap((carga) =>
                carga.manifiesto_bulto.map((item) => item.idBulto)
            );
            if (idsBulto.length) {
                await tx.bulto.updateMany({
                    where: { idBulto: { in: idsBulto } },
                    data: { estado: "EN_REPARTO" }
                });
            }
            if (!asignacion.entrega_ot) {
                await tx.entrega_ot.create({
                    data: {
                        resultadoEntrega: "EN_PROCESO",
                        idOrden: asignacion.idOrden,
                        idManifiestoOT: asignacion.idManifiestoOT,
                        idUsuario: usuarioId
                    }
                });
            }
            const ciudad = asignacion.orden_transporte.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || "Camión";
            await registrarEventoOt({
                db: tx,
                idOrden: asignacion.idOrden,
                idEstado: estado.idEstado,
                idUsuario: usuarioId,
                descripcion: "En reparto. La carga va en el camión.",
                ubicacion: ciudad
            });
        }
    });

    return obtenerManifiestosPeoneta(usuarioId);
};

export const obtenerComprobanteEntrega = async ({ idUsuario, rol, idEntrega }) => {
    const id = Number(idEntrega);
    if (!Number.isInteger(id) || id <= 0) {
        throw errorDatos("El comprobante no es válido", 404);
    }
    const entrega = await prisma.entrega_ot.findUnique({
        where: { idEntrega: id },
        select: { evidencia: true, idUsuario: true }
    });
    if (!entrega?.evidencia) {
        throw errorDatos("Esta entrega no tiene comprobante", 404);
    }
    if (rol === "PEONETA" && Number(entrega.idUsuario) !== Number(idUsuario)) {
        throw errorDatos("No puedes ver este comprobante", 403);
    }
    if (!["ADMINISTRADOR", "OPERADOR", "PEONETA"].includes(rol)) {
        throw errorDatos("No puedes ver este comprobante", 403);
    }
    return leerComprobante(entrega.evidencia);
};

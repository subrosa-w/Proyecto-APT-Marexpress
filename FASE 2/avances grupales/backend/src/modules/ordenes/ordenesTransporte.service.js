import { randomUUID } from "node:crypto";
import prisma from "../../config/prisma.js";
import { asegurarTarifaCliente } from "../clientes/clientes.service.js";
import {
    cobroPorTramoPeso,
    resolverTarifaPorZona,
    valorRetiroOficial,
    zonaTarifaria
} from "../tarifas/tarifaOficial.js";

const incluirOrdenCompleta = {
    cliente: {
        include: {
            comuna: {
                include: {
                    region: true
                }
            }
        }
    },
    destinatario: true,
    comuna_orden_transporte_idComunaOrigenTocomuna: {
        include: {
            region: true
        }
    },
    comuna_orden_transporte_idComunaDestinoTocomuna: {
        include: {
            region: true
        }
    },
    estado_ot: true,
    tarifa: {
        include: {
            tipo_tarifa: true
        }
    },
    tarifa_trayecto: true,
    detalle_carga: {
        include: {
            tipo_bulto: true,
            bulto: {
                orderBy: {
                    numeroBulto: "asc"
                }
            }
        }
    },
    retiro: true,
    recargo: true,
    pago: true,
    entrega_ot: {
        orderBy: {
            fechaEntrega: "desc"
        }
    },
    manifiesto_ot: {
        include: {
            manifiesto: {
                select: {
                    numeroManifiesto: true,
                    estado: true
                }
            },
            entrega_ot: true
        }
    },
    observacion_ot: {
        orderBy: {
            fechaHora: "desc"
        },
        take: 5
    },
    historial_ot: {
        orderBy: {
            fechaHora: "desc"
        },
        include: {
            estado_ot: true,
            usuario: {
                select: {
                    nombre: true,
                    apellido: true,
                    nombreUsuario: true
                }
            }
        }
    },
    seguimiento_ot: {
        orderBy: {
            fechaHora: "desc"
        },
        include: {
            estado_ot: true,
            usuario: {
                select: {
                    nombre: true,
                    apellido: true,
                    nombreUsuario: true
                }
            }
        }
    }
};

export const registrarEventoOt = async ({
    db = prisma,
    idOrden,
    idEstado,
    idUsuario,
    descripcion,
    ubicacion = null
}) => {
    const usuarioId = Number(idUsuario);
    const ordenId = Number(idOrden);
    const estadoId = Number(idEstado);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0 || !Number.isInteger(ordenId) || !Number.isInteger(estadoId)) {
        return;
    }

    const texto = String(descripcion || "Evento de OT").slice(0, 250);
    const reciente = await db.seguimiento_ot.findFirst({
        where: {
            idOrden: ordenId,
            idUsuario: usuarioId,
            descripcion: texto
        },
        orderBy: { fechaHora: "desc" }
    });
    if (reciente && Date.now() - new Date(reciente.fechaHora).getTime() < 60000) {
        return;
    }

    await db.historial_ot.create({
        data: {
            descripcion: texto,
            idOrden: ordenId,
            idEstado: estadoId,
            idUsuario: usuarioId
        }
    });
    await db.seguimiento_ot.create({
        data: {
            descripcion: texto,
            ubicacion: ubicacion ? String(ubicacion).slice(0, 150) : null,
            idOrden: ordenId,
            idEstado: estadoId,
            idUsuario: usuarioId
        }
    });
};

const esRechazoTexto = (valor) => {
    const texto = String(valor || "").toUpperCase();
    return ["RECHAZ", "NO_ENTREG", "NO ENTREG", "FALLID", "DEVUEL", "REHUS"].some((clave) => texto.includes(clave));
};

const motivoDeRechazo = (orden) => {
    const entregas = [
        ...(orden?.entrega_ot || []),
        ...(orden?.manifiesto_ot || []).map((item) => item.entrega_ot).filter(Boolean)
    ];
    const rechazo = entregas.find((item) => esRechazoTexto(item.resultadoEntrega));
    return rechazo?.motivoResultado || rechazo?.observacion || (orden?.observacion_ot || [])[0]?.observacion || "Rechazo en destino";
};

const asegurarBultosDeOrden = async (idOrden, numeroOT, db) => {
    const detalles = await db.detalle_carga.findMany({
        where: { idOrden: Number(idOrden) },
        include: { bulto: true }
    });

    let correlativo = await db.bulto.count({
        where: {
            detalle_carga: {
                idOrden: Number(idOrden)
            }
        }
    });

    for (const detalle of detalles) {
        const cantidad = Number(detalle.cantidad) || 0;
        if (detalle.bulto.length >= cantidad) {
            continue;
        }

        for (let numeroBulto = detalle.bulto.length + 1; numeroBulto <= cantidad; numeroBulto += 1) {
            correlativo += 1;
            await db.bulto.create({
                data: {
                    codigoBulto: `${numeroOT}-${String(correlativo).padStart(3, "0")}`,
                    numeroBulto,
                    idDetalleCarga: detalle.idDetalleCarga,
                    peso: detalle.pesoUnitario,
                    largoCm: detalle.largoCm,
                    anchoCm: detalle.anchoCm,
                    altoCm: detalle.altoCm,
                    estado: "EN_BODEGA"
                }
            });
        }
    }
};

const tieneValor = (valor) => {
    return (
        valor !== undefined &&
        valor !== null &&
        valor !== ""
    );
};

const numeroNoNegativo = (valor, campo) => {
    const numero = Number(valor);

    if (!Number.isFinite(numero) || numero < 0) {
        throw new Error(
            `${campo} debe ser un número válido mayor o igual a 0`
        );
    }

    return numero;
};


// =========================================================
// LISTAR ÓRDENES
// =========================================================

export const obtenerOrdenesTransporte = async () => {

    return await prisma.orden_transporte.findMany({

        include: {

            cliente: true,

            comuna_orden_transporte_idComunaOrigenTocomuna: true,

            comuna_orden_transporte_idComunaDestinoTocomuna: true,

            estado_ot: true,

            pago: {
                orderBy: { idPago: "desc" }
            },

            tarifa: {
                include: {
                    tipo_tarifa: true
                }
            },

            detalle_carga: {
                include: {
                    tipo_bulto: true,
                    bulto: {
                        select: {
                            idBulto: true,
                            estado: true,
                            idSucursalActual: true
                        }
                    }
                }
            },

            manifiesto_ot: {
                select: {
                    manifiesto: {
                        select: {
                            numeroManifiesto: true,
                            estado: true,
                            idComuna: true
                        }
                    },
                    entrega_ot: {
                        select: {
                            fechaEntrega: true,
                            resultadoEntrega: true,
                            motivoResultado: true,
                            nombreReceptor: true,
                            observacion: true
                        }
                    }
                }
            },

            entrega_ot: {
                orderBy: {
                    fechaEntrega: "desc"
                },
                select: {
                    fechaEntrega: true,
                    resultadoEntrega: true,
                    motivoResultado: true,
                    nombreReceptor: true,
                    observacion: true
                }
            },

            destinatario: {
                select: {
                    nombreRazonSocial: true,
                    telefono: true
                }
            },

            observacion_ot: {
                orderBy: {
                    fechaHora: "desc"
                },
                take: 5,
                select: {
                    fechaHora: true,
                    observacion: true
                }
            },

            historial_ot: {
                orderBy: { fechaHora: "desc" },
                take: 15,
                include: {
                    estado_ot: true,
                    usuario: {
                        select: { nombre: true, apellido: true, nombreUsuario: true }
                    }
                }
            },

            seguimiento_ot: {
                orderBy: { fechaHora: "desc" },
                take: 15,
                include: {
                    estado_ot: true,
                    usuario: {
                        select: { nombre: true, apellido: true, nombreUsuario: true }
                    }
                }
            }
        },

        orderBy: {
            fechaCreacion: "desc"
        }
    });
};


// =========================================================
// OBTENER OT POR ID
// =========================================================

export const obtenerOrdenTransportePorId = async (idOrden, opciones = {}) => {
    const orden = await prisma.orden_transporte.findUnique({
        where: { idOrden: Number(idOrden) },
        select: { idOrden: true, numeroOT: true }
    });

    if (!orden) {
        return null;
    }

    await asegurarBultosDeOrden(orden.idOrden, orden.numeroOT, prisma);

    const completa = await prisma.orden_transporte.findUnique({
        where: { idOrden: orden.idOrden },
        include: incluirOrdenCompleta
    });

    if (opciones.registrarRecepcion && completa) {
        await registrarConsultaRecepcion(completa, opciones);
    }

    return prisma.orden_transporte.findUnique({
        where: { idOrden: orden.idOrden },
        include: incluirOrdenCompleta
    });
};

export const obtenerOrdenTransportePorNumero = async (numeroOT, opciones = {}) => {
    const orden = await prisma.orden_transporte.findUnique({
        where: { numeroOT: numeroOT.trim() },
        select: { idOrden: true, numeroOT: true }
    });

    if (!orden) {
        return null;
    }

    await asegurarBultosDeOrden(orden.idOrden, orden.numeroOT, prisma);

    const completa = await prisma.orden_transporte.findUnique({
        where: { idOrden: orden.idOrden },
        include: incluirOrdenCompleta
    });

    if (opciones.registrarRecepcion && completa) {
        await registrarConsultaRecepcion(completa, opciones);
    }

    return prisma.orden_transporte.findUnique({
        where: { idOrden: orden.idOrden },
        include: incluirOrdenCompleta
    });
};

const registrarConsultaRecepcion = async (orden, opciones) => {
    const rechazo = esRechazoTexto(orden.estado_ot?.nombreEstado)
        || [...(orden.entrega_ot || []), ...(orden.manifiesto_ot || []).map((item) => item.entrega_ot).filter(Boolean)]
            .some((item) => esRechazoTexto(item.resultadoEntrega));
    const motivo = rechazo ? motivoDeRechazo(orden) : "";
    const descripcion = rechazo
        ? `Recepción: documento escaneado. OT rechazada. Motivo: ${motivo}`.slice(0, 250)
        : `Recepción: documento ${orden.numeroOT} escaneado`;

    await registrarEventoOt({
        idOrden: orden.idOrden,
        idEstado: orden.idEstado,
        idUsuario: opciones.idUsuario,
        descripcion,
        ubicacion: opciones.ubicacion || "Recepción"
    });
};

const calcularValoresOrden = async (datos, db) => {

    if (!datos.direccionOrigen?.trim()) {
        throw new Error(
            "El campo direccionOrigen es obligatorio"
        );
    }

    if (!datos.direccionDestino?.trim()) {
        throw new Error(
            "El campo direccionDestino es obligatorio"
        );
    }

    if (!datos.idCliente) {
        throw new Error(
            "El campo idCliente es obligatorio"
        );
    }

    if (!datos.idComunaOrigen) {
        throw new Error(
            "El campo idComunaOrigen es obligatorio"
        );
    }

    if (!datos.idComunaDestino) {
        throw new Error(
            "El campo idComunaDestino es obligatorio"
        );
    }

    if (
        !Array.isArray(datos.cargas) ||
        datos.cargas.length === 0
    ) {
        throw new Error(
            "La OT debe contener al menos una carga"
        );
    }


    // =====================================================
    // ZONA
    // =====================================================

    const tipoZona = datos.tipoZona
        ? String(datos.tipoZona)
            .trim()
            .toUpperCase()
        : null;

    if (
        !["URBANA", "LEJANA"].includes(tipoZona)
    ) {
        throw new Error(
            "El campo tipoZona debe ser URBANA o LEJANA"
        );
    }


    // =====================================================
    // RETIRO
    // =====================================================

    const requiereRetiro =
        datos.requiereRetiro === true ||
        datos.requiereRetiro === "true";

    if (requiereRetiro) {

        if (
            !datos.retiro ||
            typeof datos.retiro !== "object"
        ) {
            throw new Error(
                "Debe ingresar los datos del retiro"
            );
        }

        if (
            !datos.retiro.direccionRetiro?.trim()
        ) {
            throw new Error(
                "La dirección de retiro es obligatoria"
            );
        }
    }


    // =====================================================
    // TARIFA
    // =====================================================

    const cliente = await asegurarTarifaCliente(datos.idCliente, db);

    if (!cliente) {
        throw new Error("El cliente indicado no existe");
    }

    const [comunaOrigen, comunaDestino] = await Promise.all([
        db.comuna.findUnique({
            where: { idComuna: Number(datos.idComunaOrigen) },
            include: { region: true }
        }),
        db.comuna.findUnique({
            where: { idComuna: Number(datos.idComunaDestino) },
            include: { region: true }
        })
    ]);

    const zonaRuta = zonaTarifaria(comunaOrigen, comunaDestino);
    const tarifaRuta = await resolverTarifaPorZona(db, zonaRuta);
    let tarifa = tarifaRuta || cliente.tarifa;

    if (tarifa && !tarifa.tarifa_tramo) {
        tarifa = await db.tarifa.findUnique({
            where: { idTarifa: tarifa.idTarifa },
            include: { tarifa_tramo: true, tipo_tarifa: true }
        });
    }

    if (!tarifa?.estado) {
        throw new Error("El tarifario del cliente está inactivo");
    }


    // =====================================================
    // PESO Y VOLUMEN
    // =====================================================

    let pesoTotalCalculado = 0;
    let volumenTotalM3 = 0;

    for (const carga of datos.cargas) {

        const cantidad =
            Number(carga.cantidad);

        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {
            throw new Error(
                "La cantidad de cada carga debe ser mayor que 0"
            );
        }


        let pesoCarga = 0;

        if (
            tieneValor(
                carga.pesoTotal
            )
        ) {

            pesoCarga =
                Number(
                    carga.pesoTotal
                );

        } else if (
            tieneValor(
                carga.pesoUnitario
            )
        ) {

            pesoCarga =
                Number(
                    carga.pesoUnitario
                ) * cantidad;
        }


        if (
            !Number.isFinite(pesoCarga) ||
            pesoCarga < 0
        ) {
            throw new Error(
                "El peso de la carga no es válido"
            );
        }

        pesoTotalCalculado +=
            pesoCarga;


        const largoCm =
            tieneValor(carga.largoCm)
                ? Number(carga.largoCm)
                : 0;

        const anchoCm =
            tieneValor(carga.anchoCm)
                ? Number(carga.anchoCm)
                : 0;

        const altoCm =
            tieneValor(carga.altoCm)
                ? Number(carga.altoCm)
                : 0;


        if (
            !Number.isFinite(largoCm) ||
            !Number.isFinite(anchoCm) ||
            !Number.isFinite(altoCm) ||
            largoCm < 0 ||
            anchoCm < 0 ||
            altoCm < 0
        ) {
            throw new Error(
                "Las dimensiones de la carga no son válidas"
            );
        }


        if (
            largoCm > 0 &&
            anchoCm > 0 &&
            altoCm > 0
        ) {

            volumenTotalM3 +=
                (
                    largoCm *
                    anchoCm *
                    altoCm *
                    cantidad
                ) / 1000000;
        }
    }


    pesoTotalCalculado =
        Number(
            pesoTotalCalculado.toFixed(2)
        );

    volumenTotalM3 =
        Number(
            volumenTotalM3.toFixed(4)
        );


    // =====================================================
    // ZONA
    // =====================================================

    let valorZonaSugerido = 0;

    if (tipoZona === "URBANA") {
        valorZonaSugerido =
            Number(
                tarifa.valorZonaUrbana ??
                0
            );
    }

    if (tipoZona === "LEJANA") {
        valorZonaSugerido =
            Number(
                tarifa.valorZonaLejana ??
                0
            );
    }


    // =====================================================
    // VALORES APLICADOS
    // =====================================================

    const valorBase =
        tieneValor(
            datos.valorBaseAplicado
        )
            ? numeroNoNegativo(
                datos.valorBaseAplicado,
                "valorBaseAplicado"
            )
            : Number(
                tarifa.valorBase ??
                0
            );


    const valorKg =
        tieneValor(
            datos.valorKgAplicado
        )
            ? numeroNoNegativo(
                datos.valorKgAplicado,
                "valorKgAplicado"
            )
            : Number(
                tarifa.valorKg ??
                0
            );


    const valorM3 =
        tieneValor(
            datos.valorM3Aplicado
        )
            ? numeroNoNegativo(
                datos.valorM3Aplicado,
                "valorM3Aplicado"
            )
            : Number(
                tarifa.valorM3 ??
                0
            );


    const valorZona =
        tieneValor(
            datos.valorZonaAplicado
        )
            ? numeroNoNegativo(
                datos.valorZonaAplicado,
                "valorZonaAplicado"
            )
            : valorZonaSugerido;


    const valorRetiro =
        requiereRetiro
            ? (
                tieneValor(
                    datos.retiro?.valorRetiro
                ) && Number(datos.retiro.valorRetiro) > 0
                    ? numeroNoNegativo(
                        datos.retiro.valorRetiro,
                        "valorRetiro"
                    )
                    : valorRetiroOficial(datos.retiro?.tipoRetiro, tarifa)
            )
            : 0;


    // =====================================================
    // RECARGOS
    // =====================================================

    const recargos =
        Array.isArray(datos.recargos)
            ? datos.recargos
            : [];

    let totalRecargos = 0;

    for (const recargo of recargos) {

        if (
            !recargo.descripcion?.trim()
        ) {
            throw new Error(
                "Cada recargo debe tener una descripción"
            );
        }

        const monto =
            Number(
                recargo.monto
            );

        if (
            !Number.isFinite(monto) ||
            monto <= 0
        ) {
            throw new Error(
                "El monto de cada recargo debe ser mayor a 0"
            );
        }

        totalRecargos +=
            monto;
    }

    totalRecargos =
        Number(
            totalRecargos.toFixed(2)
        );


    // =====================================================
    // CÁLCULO
    // =====================================================

    const tramos = tarifa.tarifa_tramo || [];
    const cobroPeso = cobroPorTramoPeso(pesoTotalCalculado, tramos);

    const precioPesoAplicado = cobroPeso.tramo
        ? cobroPeso.precio
        : Number(
            (
                pesoTotalCalculado *
                valorKg
            ).toFixed(2)
        );


    const precioVolumenAplicado =
        Number(
            (
                volumenTotalM3 *
                valorM3
            ).toFixed(2)
        );


    const tipoCobro =
        precioVolumenAplicado >
            precioPesoAplicado
            ? "VOLUMEN"
            : "PESO";


    const valorCargaAplicado =
        tipoCobro === "VOLUMEN"
            ? precioVolumenAplicado
            : precioPesoAplicado;


    const valorNeto =
        Number(
            (
                valorBase +
                valorCargaAplicado +
                valorZona +
                valorRetiro +
                totalRecargos
            ).toFixed(2)
        );


    const valorIva =
        Number(
            (
                valorNeto *
                0.19
            ).toFixed(2)
        );


    const valorTotal =
        Number(
            (
                valorNeto +
                valorIva
            ).toFixed(2)
        );


    return {
        tarifa,
        tarifaTrayecto: null,
        zonaRuta,
        tramoPeso: cobroPeso.tramo
            ? {
                kgDesde: Number(cobroPeso.tramo.kgDesde),
                kgHasta: Number(cobroPeso.tramo.kgHasta),
                valorFijo: cobroPeso.tramo.valorFijo != null ? Number(cobroPeso.tramo.valorFijo) : null,
                valorKg: cobroPeso.tramo.valorKg != null ? Number(cobroPeso.tramo.valorKg) : null
            }
            : null,

        tipoZona,
        requiereRetiro,

        pesoTotalCalculado,
        volumenTotalM3,

        valorBase,
        valorKg,
        valorM3,
        valorZona,
        valorRetiro,

        recargos,
        totalRecargos,

        precioPesoAplicado,
        precioVolumenAplicado,
        tipoCobro,
        valorCargaAplicado,

        valorNeto,
        valorIva,
        valorTotal
    };
};

// =========================================================
// CALCULAR OT SIN GUARDAR
// =========================================================

export const calcularOrdenTransporte = async (datos) => {

    const calculo =
        await calcularValoresOrden(
            datos,
            prisma
        );

    return {
        idTarifa:
            calculo.tarifa.idTarifa,

        nombreTarifa:
            calculo.tarifa.nombreTarifa,

        zonaRuta:
            calculo.zonaRuta,

        tramoPeso:
            calculo.tramoPeso,

        idTarifaTrayecto: null,

        tipoZona:
            calculo.tipoZona,

        requiereRetiro:
            calculo.requiereRetiro,

        pesoTotal:
            calculo.pesoTotalCalculado,

        volumenTotalM3:
            calculo.volumenTotalM3,

        valorBaseAplicado:
            calculo.valorBase,

        valorKgAplicado:
            calculo.valorKg,

        valorM3Aplicado:
            calculo.valorM3,

        valorZonaAplicado:
            calculo.valorZona,

        valorRetiroAplicado:
            calculo.valorRetiro,

        totalRecargos:
            calculo.totalRecargos,

        precioPesoAplicado:
            calculo.precioPesoAplicado,

        precioVolumenAplicado:
            calculo.precioVolumenAplicado,

        tipoCobro:
            calculo.tipoCobro,

        valorCargaAplicado:
            calculo.valorCargaAplicado,

        valorNeto:
            calculo.valorNeto,

        valorIva:
            calculo.valorIva,

        valorTotal:
            calculo.valorTotal
    };
};

// =========================================================
// CREAR ORDEN DE TRANSPORTE
// =========================================================

export const crearOrdenTransporte = async (datos, idUsuario) => {

    return await prisma.$transaction(async (tx) => {
                // =========================================================
        // CALCULAR Y VALIDAR OT
        // =========================================================

        const calculo =
            await calcularValoresOrden(
                datos,
                tx
            );

        const {
            tarifa,
            tipoZona,
            requiereRetiro,
            pesoTotalCalculado,
            volumenTotalM3,
            valorBase,
            valorKg,
            valorM3,
            valorZona,
            valorRetiro,
            recargos,
            totalRecargos,
            precioPesoAplicado,
            precioVolumenAplicado,
            tipoCobro,
            valorCargaAplicado,
            valorNeto,
            valorIva,
            valorTotal
        } = calculo;

        

        // =========================================================
        // 17. CREAR OT CON NÚMERO TEMPORAL
        // =========================================================
        //
        // Evitamos usar "última OT + 1".
        //
        // Primero MySQL crea el idOrden.
        // Luego generamos OT-000001 usando ese ID.
        // =========================================================

        const numeroTemporal =
            `TMP-${randomUUID()
                .replaceAll("-", "")
                .slice(0, 20)}`;



        let orden =
            await tx.orden_transporte.create({

                data: {


                    numeroOT:
                        numeroTemporal,


                    // -------------------------------------------------
                    // FECHAS
                    // -------------------------------------------------

                    fechaRetiro:
                        datos.fechaRetiro
                            ? new Date(
                                datos.fechaRetiro
                            )
                            : null,


                    fechaEntregaEstimada:
                        datos.fechaEntregaEstimada
                            ? new Date(
                                datos.fechaEntregaEstimada
                            )
                            : null,



                    // -------------------------------------------------
                    // ORIGEN
                    // -------------------------------------------------

                    direccionOrigen:
                        datos.direccionOrigen.trim(),


                    contactoOrigen:
                        datos.contactoOrigen?.trim() ||
                        null,


                    telefonoOrigen:
                        datos.telefonoOrigen?.trim() ||
                        null,



                    // -------------------------------------------------
                    // DESTINO
                    // -------------------------------------------------

                    direccionDestino:
                        datos.direccionDestino.trim(),


                    contactoDestino:
                        datos.contactoDestino?.trim() ||
                        null,


                    telefonoDestino:
                        datos.telefonoDestino?.trim() ||
                        null,


                    referenciaEntrega:
                        datos.referenciaEntrega?.trim() ||
                        null,



                    // -------------------------------------------------
                    // PESO Y VOLUMEN
                    // -------------------------------------------------

                    pesoTotal:
                        pesoTotalCalculado,


                    pesoReal:
                        pesoTotalCalculado,


                    volumenTotalM3,

                    // -------------------------------------------------
                    // CÁLCULO
                    // -------------------------------------------------

                    precioPesoAplicado,


                    precioVolumenAplicado,


                    tipoCobro,


                    valorCargaAplicado,



                    // -------------------------------------------------
                    // TOTALES
                    // -------------------------------------------------

                    valorNeto,


                    valorIva,


                    valorTotal,



                    // -------------------------------------------------
                    // VALORES APLICADOS
                    // -------------------------------------------------

                    valorBaseAplicado:
                        valorBase,


                    valorKgAplicado:
                        valorKg,


                    valorM3Aplicado:
                        valorM3,


                    valorZonaAplicado:
                        valorZona,


                    valorRetiroAplicado:
                        valorRetiro,


                    tipoZona,


                    requiereRetiro,



                    // -------------------------------------------------
                    // RELACIONES
                    // -------------------------------------------------

                    idCliente:

                        Number(
                            datos.idCliente
                        ),

                    idDestinatario:
                        datos.idDestinatario
                            ? Number(
                                datos.idDestinatario
                            )
                            : null,


                    idComunaOrigen:
                        Number(
                            datos.idComunaOrigen
                        ),


                    idComunaDestino:
                        Number(
                            datos.idComunaDestino
                        ),


                    idEstado:
                        1,


                    idTarifa:
                        tarifa.idTarifa,


                    idTarifaTrayecto:
                        null,



                    // -------------------------------------------------
                    // DOCUMENTO
                    // -------------------------------------------------

                    tipoDocumento:
                        datos.tipoDocumento ??
                        "SIN_DOCUMENTO",


                    numeroDocumento:
                        datos.numeroDocumento?.trim() ||
                        null,



                    // -------------------------------------------------
                    // SERVICIO
                    // -------------------------------------------------

                    tipoServicio:
                        datos.tipoServicio ??
                        "NORMAL"
                }
            });



        // =========================================================
        // 18. GENERAR NÚMERO OT DEFINITIVO
        // =========================================================

        const numeroOT =
            `OT-${String(
                orden.idOrden
            ).padStart(
                6,
                "0"
            )}`;



        orden =
            await tx.orden_transporte.update({

                where: {
                    idOrden:
                        orden.idOrden
                },

                data: {
                    numeroOT
                }
            });



        // =========================================================
        // 19. CREAR RETIRO
        // =========================================================

        if (
            requiereRetiro
        ) {

            await tx.retiro.create({

                data: {


                    fechaProgramada:
                        datos.retiro
                            .fechaProgramada

                            ? new Date(
                                datos.retiro
                                    .fechaProgramada
                            )

                            : null,


                    direccionRetiro:
                        datos.retiro
                            .direccionRetiro
                            .trim(),


                    contacto:
                        datos.retiro
                            .contacto
                            ?.trim() ||
                        null,


                    telefono:
                        datos.retiro
                            .telefono
                            ?.trim() ||
                        null,


                    observacion:
                        datos.retiro
                            .observacion
                            ?.trim() ||
                        null,


                    valorRetiro,


                    estado:
                        "PENDIENTE",


                    idOrden:
                        orden.idOrden
                }
            });
        }



        // =========================================================
        // 20. CREAR RECARGOS
        // =========================================================

        for (
            const recargo of recargos
        ) {

            await tx.recargo.create({

                data: {


                    descripcion:
                        recargo.descripcion
                            .trim(),


                    monto:
                        Number(
                            recargo.monto
                        ),


                    estado:
                        true,


                    idOrden:
                        orden.idOrden
                }
            });
        }



        // =========================================================
        // 21. DETALLE DE CARGA Y BULTOS
        // =========================================================

        let correlativoBulto = 0;

        for (
            const carga of datos.cargas
        ) {


            const cantidad =
                Number(
                    carga.cantidad
                );


            let pesoUnitario =
                null;


            let pesoTotalCarga =
                null;



            if (
                tieneValor(
                    carga.pesoUnitario
                )
            ) {

                pesoUnitario =
                    Number(
                        carga.pesoUnitario
                    );
            }



            if (
                tieneValor(
                    carga.pesoTotal
                )
            ) {

                pesoTotalCarga =
                    Number(
                        carga.pesoTotal
                    );

            } else if (
                pesoUnitario !== null
            ) {

                pesoTotalCarga =
                    Number(
                        (
                            pesoUnitario *
                            cantidad
                        ).toFixed(2)
                    );
            }



            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                throw new Error("La cantidad de cada carga debe ser mayor a 0");
            }

            const bultos = [];
            for (let numeroBulto = 1; numeroBulto <= cantidad; numeroBulto += 1) {
                correlativoBulto += 1;
                bultos.push({
                    codigoBulto: `${numeroOT}-${String(correlativoBulto).padStart(3, "0")}`,
                    numeroBulto,
                    peso: pesoUnitario,
                    largoCm: tieneValor(carga.largoCm) ? Number(carga.largoCm) : null,
                    anchoCm: tieneValor(carga.anchoCm) ? Number(carga.anchoCm) : null,
                    altoCm: tieneValor(carga.altoCm) ? Number(carga.altoCm) : null,
                    estado: "EN_BODEGA"
                });
            }

            await tx.detalle_carga.create({

                data: {


                    descripcion:
                        carga.descripcion
                            ?.trim() || "Sin descripción",


                    cantidad,


                    pesoUnitario,


                    pesoTotal:
                        pesoTotalCarga,


                    largoCm:
                        tieneValor(
                            carga.largoCm
                        )
                            ? Number(
                                carga.largoCm
                            )
                            : null,


                    anchoCm:
                        tieneValor(
                            carga.anchoCm
                        )
                            ? Number(
                                carga.anchoCm
                            )
                            : null,


                    altoCm:
                        tieneValor(
                            carga.altoCm
                        )
                            ? Number(
                                carga.altoCm
                            )
                            : null,


                    valorDeclarado:
                        tieneValor(
                            carga.valorDeclarado
                        )
                            ? Number(
                                carga.valorDeclarado
                            )
                            : null,


                    observacion:
                        carga.observacion
                            ?.trim() ||
                        null,


                    orden_transporte: {
                        connect: {
                            idOrden:
                                orden.idOrden
                        }
                    },

                    tipo_bulto: {
                        connect: {
                            idTipoBulto:
                                Number(
                                    carga.idTipoBulto
                                )
                        }
                    },

                    bulto: {
                        create: bultos
                    }
                }
            });
        }
        // =========================================================
        // 22. CREAR PAGO
        // =========================================================

        const pagadoPor = String(datos.pagadoPor || "").trim().toUpperCase();
        const tipoPago = String(datos.tipoPago || "").trim().toUpperCase();
        let metodoPago = String(datos.metodoPago || "").trim().toUpperCase() || null;

        if (!["REMITENTE", "DESTINATARIO"].includes(pagadoPor)) {
            throw new Error("Debe indicar quién paga (remitente o destinatario)");
        }

        if (!["CONTADO", "POR_PAGAR", "CUENTA_CORRIENTE"].includes(tipoPago)) {
            throw new Error("Tipo de pago no válido");
        }

        if (metodoPago === "CREDITO" || metodoPago === "DEBITO") {
            metodoPago = "TARJETA";
        }

        let estadoPago = "PENDIENTE";
        let idCuentaPago = null;

        if (tipoPago === "CONTADO") {
            if (!["EFECTIVO", "TRANSFERENCIA", "TARJETA"].includes(metodoPago)) {
                throw new Error("Debe seleccionar un método de pago válido");
            }
            estadoPago = "PAGADO";
        }

        if (tipoPago === "POR_PAGAR") {
            metodoPago = null;
        }

        if (tipoPago === "CUENTA_CORRIENTE") {
            metodoPago = null;
            idCuentaPago = Number(datos.idCuenta);
            if (!Number.isInteger(idCuentaPago) || idCuentaPago <= 0) {
                throw new Error("Debe seleccionar una cuenta corriente.");
            }
        }

        await tx.pago.create({
            data: {
                monto:
                    valorTotal,

                pagadoPor,

                tipoPago,

                metodoPago,

                estadoPago,

                referencia:
                    datos.referenciaPago?.trim() ||
                    null,

                observacion:
                    datos.observacionPago?.trim() ||
                    null,

                idCuenta: idCuentaPago,

                idOrden:
                    orden.idOrden,

                idUsuario:
                    Number(idUsuario)
            }
        });
        // =========================================================
// 23. CARGAR MONTO A CUENTA CORRIENTE
// =========================================================

if (tipoPago === "CUENTA_CORRIENTE") {

    const idCuenta =
        Number(datos.idCuenta);

    if (!idCuenta) {
        throw new Error(
            "Debe seleccionar una cuenta corriente."
        );
    }


    // Buscar y validar la cuenta
    const cuenta =
        await tx.cuenta_corriente.findUnique({
            where: {
                idCuenta
            }
        });


    if (!cuenta) {
        throw new Error(
            "La cuenta corriente seleccionada no existe."
        );
    }


    if (!cuenta.estado) {
        throw new Error(
            "La cuenta corriente seleccionada está inactiva."
        );
    }


    // La cuenta debe pertenecer al cliente de la OT
    if (
        Number(cuenta.idCliente) !==
        Number(datos.idCliente)
    ) {
        throw new Error(
            "La cuenta corriente no pertenece al cliente seleccionado."
        );
    }


    const limiteCredito =
        Number(cuenta.limiteCredito) || 0;

    const saldoActual =
        Number(cuenta.saldoActual) || 0;

    const nuevoSaldo =
        saldoActual + Number(valorTotal);

    const disponible =
        limiteCredito - saldoActual;


    // Validar cupo disponible
    if (
        Number(valorTotal) >
        disponible
    ) {
        throw new Error(
            `La cuenta corriente no tiene crédito suficiente. Disponible: ${disponible}`
        );
    }


    // Actualizar deuda utilizada
    await tx.cuenta_corriente.update({
        where: {
            idCuenta
        },

        data: {
            saldoActual:
                nuevoSaldo
        }
    });


    // Registrar movimiento para trazabilidad
    await tx.movimiento_cuenta.create({
        data: {

            tipoMovimiento:
                "CARGO",

            monto:
                valorTotal,

            descripcion:
                `Cargo por ${orden.numeroOT}`,

            cuenta_corriente: {
                connect: {
                    idCuenta
                }
            },

            orden_transporte: {
                connect: {
                    idOrden:
                        orden.idOrden
                }
            },

            usuario: {
                connect: {
                    idUsuario:
                        Number(idUsuario)
                    }
                }
            }
        });
    }

        // =========================================================
        // 22. HISTORIAL
        // =========================================================

        await tx.historial_ot.create({

            data: {


                descripcion:
                    `Orden de transporte creada - cálculo aplicado: ${tipoCobro}`,


                idOrden:
                    orden.idOrden,


                idEstado:
                    1,


                // Temporal.
                // Después lo conectamos al usuario autenticado.
                idUsuario:
                    Number(idUsuario)
            }
        });



        // =========================================================
        // 23. DEVOLVER OT COMPLETA
        // =========================================================

        await asegurarBultosDeOrden(orden.idOrden, numeroOT, tx);

        return tx.orden_transporte.findUnique({
            where: {
                idOrden: orden.idOrden
            },
            include: incluirOrdenCompleta
        });
    });
};

const ESTADOS_ANULACION = ["ANULADA", "CANCELADA"];

const nombreEstado = (orden) =>
    String(orden?.estado_ot?.nombreEstado || "").trim().toUpperCase();

const estaAnulada = (orden) => ESTADOS_ANULACION.includes(nombreEstado(orden));

const errorHttp = (mensaje, status) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const obtenerEstadoAnulacion = async () => {
    const estados = await prisma.estado_ot.findMany();
    const cancelada = estados.find((item) =>
        ESTADOS_ANULACION.includes(String(item.nombreEstado || "").toUpperCase())
    );

    if (cancelada) {
        return cancelada;
    }

    return prisma.estado_ot.create({
        data: {
            nombreEstado: "CANCELADA",
            descripcion: "Orden de transporte cancelada. El registro se conserva."
        }
    });
};

export const actualizarOrdenTransporte = async (idOrden, datos, idUsuario) => {
    const orden = await prisma.orden_transporte.findUnique({
        where: { idOrden: Number(idOrden) },
        include: { estado_ot: true }
    });

    if (!orden) {
        throw errorHttp("Orden de transporte no encontrada", 404);
    }

    if (estaAnulada(orden)) {
        throw errorHttp("No se puede editar una orden anulada", 400);
    }

    if (!datos.direccionOrigen?.trim() || !datos.direccionDestino?.trim()) {
        throw errorHttp("Las direcciones de origen y destino son obligatorias", 400);
    }

    if (!datos.idComunaOrigen || !datos.idComunaDestino) {
        throw errorHttp("Las comunas de origen y destino son obligatorias", 400);
    }

    await prisma.orden_transporte.update({
        where: { idOrden: orden.idOrden },
        data: {
            direccionOrigen: datos.direccionOrigen.trim(),
            contactoOrigen: datos.contactoOrigen?.trim() || null,
            telefonoOrigen: datos.telefonoOrigen?.trim() || null,
            direccionDestino: datos.direccionDestino.trim(),
            contactoDestino: datos.contactoDestino?.trim() || null,
            telefonoDestino: datos.telefonoDestino?.trim() || null,
            referenciaEntrega: datos.referenciaEntrega?.trim() || null,
            idComunaOrigen: Number(datos.idComunaOrigen),
            idComunaDestino: Number(datos.idComunaDestino),
            idDestinatario: datos.idDestinatario
                ? Number(datos.idDestinatario)
                : null,
            tipoDocumento: datos.tipoDocumento || orden.tipoDocumento,
            numeroDocumento: datos.numeroDocumento !== undefined
                ? (datos.numeroDocumento?.trim() || null)
                : orden.numeroDocumento,
            tipoServicio: datos.tipoServicio || orden.tipoServicio,
            tipoZona: datos.tipoZona || orden.tipoZona
        }
    });

    await prisma.historial_ot.create({
        data: {
            descripcion: `Orden de transporte ${orden.numeroOT} editada`,
            idOrden: orden.idOrden,
            idEstado: orden.idEstado,
            idUsuario: Number(idUsuario)
        }
    });

    return obtenerOrdenTransportePorId(orden.idOrden);
};

export const anularOrdenTransporte = async (idOrden, idUsuario) => {
    const orden = await prisma.orden_transporte.findUnique({
        where: { idOrden: Number(idOrden) },
        include: { estado_ot: true }
    });

    if (!orden) {
        throw errorHttp("Orden de transporte no encontrada", 404);
    }

    if (estaAnulada(orden)) {
        throw errorHttp("La orden ya está anulada", 400);
    }

    const estado = await obtenerEstadoAnulacion();

    await prisma.orden_transporte.update({
        where: { idOrden: orden.idOrden },
        data: { idEstado: estado.idEstado }
    });

    try {
        await prisma.historial_ot.create({
            data: {
                descripcion: `Orden de transporte ${orden.numeroOT} anulada. El registro se conserva.`,
                idOrden: orden.idOrden,
                idEstado: estado.idEstado,
                idUsuario: Number(idUsuario)
            }
        });
    } catch (error) {
        console.error("No se pudo registrar historial de anulación:", error);
    }

    const actualizada = await prisma.orden_transporte.findUnique({
        where: { idOrden: orden.idOrden },
        include: {
            cliente: true,
            destinatario: true,
            comuna_orden_transporte_idComunaOrigenTocomuna: true,
            comuna_orden_transporte_idComunaDestinoTocomuna: true,
            estado_ot: true,
            tarifa: true
        }
    });

    return actualizada;
};

const ordenFueRechazada = (orden) => {
    if (esRechazoTexto(orden?.estado_ot?.nombreEstado)) {
        return true;
    }
    const entregas = [
        ...(orden?.entrega_ot || []),
        ...(orden?.manifiesto_ot || []).map((item) => item.entrega_ot).filter(Boolean)
    ];
    return entregas.some((item) => esRechazoTexto(item.resultadoEntrega));
};

export const reingresarOtRechazadaEnBodega = async ({ codigo, idSucursal, idUsuario }) => {
    const codigoLimpio = String(codigo || "").trim();
    const sucursalId = Number(idSucursal);
    const usuarioId = Number(idUsuario);

    if (!codigoLimpio) {
        throw errorHttp("Escanea el número de OT o el código del bulto", 400);
    }
    if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
        throw errorHttp("Debe indicar la sucursal de ingreso", 400);
    }
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw errorHttp("Usuario no autenticado", 401);
    }

    const sucursal = await prisma.sucursal.findFirst({
        where: { idSucursal: sucursalId, estado: true }
    });
    if (!sucursal) {
        throw errorHttp("La sucursal no existe o está inactiva", 400);
    }

    const bultoEscaneado = await prisma.bulto.findUnique({
        where: { codigoBulto: codigoLimpio },
        select: { idBulto: true, idDetalleCarga: true }
    });

    let idOrden = null;
    if (bultoEscaneado) {
        const detalle = await prisma.detalle_carga.findUnique({
            where: { idDetalleCarga: bultoEscaneado.idDetalleCarga },
            select: { idOrden: true }
        });
        idOrden = detalle?.idOrden || null;
    } else {
        const ordenPorNumero = await prisma.orden_transporte.findUnique({
            where: { numeroOT: codigoLimpio },
            select: { idOrden: true }
        });
        idOrden = ordenPorNumero?.idOrden || null;
    }

    if (!idOrden) {
        throw errorHttp(`No se encontró la OT o el bulto ${codigoLimpio}`, 404);
    }

    const orden = await prisma.orden_transporte.findUnique({
        where: { idOrden },
        include: {
            estado_ot: true,
            entrega_ot: true,
            observacion_ot: {
                orderBy: { fechaHora: "desc" },
                take: 3
            },
            manifiesto_ot: {
                include: { entrega_ot: true }
            },
            detalle_carga: {
                include: { bulto: true }
            }
        }
    });

    if (!ordenFueRechazada(orden)) {
        throw errorHttp("Esta OT no está marcada como rechazada. El reingreso aplica solo a rechazos.", 400);
    }

    if (estaAnulada(orden)) {
        throw errorHttp("Una OT anulada no puede reingresar a bodega", 400);
    }

    const todos = orden.detalle_carga.flatMap((detalle) => detalle.bulto);
    const bultos = bultoEscaneado
        ? todos.filter((item) => item.idBulto === bultoEscaneado.idBulto)
        : todos;

    if (!bultos.length) {
        throw errorHttp("La OT no tiene bultos para ingresar", 400);
    }

    const estadoBodega = await prisma.estado_ot.findFirst({
        where: {
            nombreEstado: { in: ["EN_BODEGA", "RECEPCIONADA", "EN_ORIGEN"] }
        }
    });

    const motivo = motivoDeRechazo(orden).slice(0, 180);
    const ingresados = [];

    await prisma.$transaction(async (tx) => {
        for (const bulto of bultos) {
            if (bulto.estado === "EN_BODEGA" && Number(bulto.idSucursalActual) === sucursalId) {
                continue;
            }

            await tx.bulto.update({
                where: { idBulto: bulto.idBulto },
                data: {
                    estado: "EN_BODEGA",
                    idSucursalActual: sucursalId,
                    observacion: `Reingreso por rechazo: ${motivo}`.slice(0, 200)
                }
            });

            try {
                await tx.movimiento_bulto.create({
                    data: {
                        idBulto: bulto.idBulto,
                        idSucursal: sucursalId,
                        tipoMovimiento: "ENTRADA_BODEGA",
                        idUsuario: usuarioId,
                        observacion: `Reingreso OT ${orden.numeroOT} por rechazo`.slice(0, 200)
                    }
                });
            } catch (error) {
                console.error("No se pudo registrar movimiento de reingreso:", error);
            }

            ingresados.push(bulto.codigoBulto);
        }

        const quedanFuera = await tx.bulto.count({
            where: {
                detalle_carga: { idOrden: orden.idOrden },
                NOT: { estado: "EN_BODEGA" }
            }
        });

        const descripcionReingreso = `OT ${orden.numeroOT} reingresada a bodega por rechazo. Motivo: ${motivo}`.slice(0, 250);
        if (estadoBodega && quedanFuera === 0) {
            await tx.orden_transporte.update({
                where: { idOrden: orden.idOrden },
                data: { idEstado: estadoBodega.idEstado }
            });
        }
        await registrarEventoOt({
            db: tx,
            idOrden: orden.idOrden,
            idEstado: estadoBodega?.idEstado || orden.idEstado,
            idUsuario: usuarioId,
            descripcion: descripcionReingreso,
            ubicacion: sucursal.nombreSucursal
        });
    });

    if (!ingresados.length) {
        throw errorHttp("Los bultos de esta OT ya están en la sucursal seleccionada", 400);
    }

    const actualizada = await prisma.orden_transporte.findUnique({
        where: { idOrden: orden.idOrden },
        include: incluirOrdenCompleta
    });

    return {
        orden: actualizada,
        ingresados,
        sucursal: sucursal.nombreSucursal,
        motivo
    };
};

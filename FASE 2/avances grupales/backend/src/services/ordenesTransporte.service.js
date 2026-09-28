import { randomUUID } from "node:crypto";
import prisma from "../config/prisma.js";

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

            tarifa: {
                include: {
                    tipo_tarifa: true
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

export const obtenerOrdenTransportePorId = async (idOrden) => {

    return await prisma.orden_transporte.findUnique({

        where: {
            idOrden: Number(idOrden)
        },

        include: {

            cliente: {
                include: {
                    comuna: {
                        include: {
                            region: true
                        }
                    }
                }
            },

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
                    tipo_bulto: true
                }
            },

            retiro: true,

            recargo: true
        }
    });
};

export const obtenerOrdenTransportePorNumero = async (numeroOT) => {

    return await prisma.orden_transporte.findUnique({

        where: {
            numeroOT: numeroOT.trim()
        },

        include: {

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

            detalle_carga: {
                include: {
                    tipo_bulto: true
                }
            },

            pago: true
        }
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

    if (!datos.idTarifa) {
        throw new Error(
            "El campo idTarifa es obligatorio"
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

    const tarifa =
        await db.tarifa.findUnique({

            where: {
                idTarifa:
                    Number(datos.idTarifa)
            }
        });

    if (!tarifa) {
        throw new Error(
            "La tarifa indicada no existe"
        );
    }

    if (!tarifa.estado) {
        throw new Error(
            "La tarifa indicada está inactiva"
        );
    }


    // =====================================================
    // TARIFA TRAYECTO
    // =====================================================

    const tarifaTrayecto =
        await db.tarifa_trayecto.findFirst({

            where: {

                idTarifa:
                    Number(datos.idTarifa),

                idComunaOrigen:
                    Number(datos.idComunaOrigen),

                idComunaDestino:
                    Number(datos.idComunaDestino),

                estado:
                    true
            }
        });

    if (!tarifaTrayecto) {
        throw new Error(
            "No existe una tarifa activa para el trayecto indicado"
        );
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
                tarifaTrayecto.valorFijo ??
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
                tarifaTrayecto.valorKg ??
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
                tarifaTrayecto.valorM3 ??
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
                )
                    ? numeroNoNegativo(
                        datos.retiro.valorRetiro,
                        "valorRetiro"
                    )
                    : Number(
                        tarifa.valorRetiro ??
                        0
                    )
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

    const precioPesoAplicado =
        Number(
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
        tarifaTrayecto,

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

        idTarifaTrayecto:
            calculo.tarifaTrayecto.idTarifaTrayecto,

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
            tarifaTrayecto,
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
                        Number(
                            datos.idTarifa
                        ),


                    idTarifaTrayecto:
                        tarifaTrayecto
                            .idTarifaTrayecto,



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
        // 21. DETALLE DE CARGA
        // =========================================================

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


                    // volumenM3 lo calcula MySQL automáticamente.


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
                    }
                }
            });
        }
        // =========================================================
        // 22. CREAR PAGO
        // =========================================================

        const tipoPago =
            datos.tipoPago?.trim() || null;

        const metodoPago =
            datos.metodoPago?.trim() || null;

        const pagadoPor =
            datos.pagadoPor?.trim() || null;

        let estadoPago =
            "PENDIENTE";

        if (
            tipoPago === "CONTADO" &&
            ["EFECTIVO", "CREDITO", "DEBITO"].includes(metodoPago)
        ) {
            estadoPago = "PAGADO";
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

                idCuenta:
                    datos.idCuenta
                        ? Number(datos.idCuenta)
                        : null,

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

        return await tx.orden_transporte.findUnique({

            where: {
                idOrden:
                    orden.idOrden
            },

            include: {


                cliente:
                    true,

                destinatario: 
                    true,

                comuna_orden_transporte_idComunaOrigenTocomuna: {
                    include: {
                        region:
                            true
                    }
                },


                comuna_orden_transporte_idComunaDestinoTocomuna: {
                    include: {
                        region:
                            true
                    }
                },


                estado_ot:
                    true,


                tarifa: {
                    include: {
                        tipo_tarifa:
                            true
                    }
                },


                tarifa_trayecto:
                    true,


                detalle_carga: {
                    include: {
                        tipo_bulto:
                            true
                    }
                },


                retiro:
                    true,


                recargo:
                    true
            }
        });
    });
};
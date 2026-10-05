export const validarNuevaOrdenTransporte = (
    req,
    res,
    next
) => {

    const datos =
        req.body;



    // =========================================================
    // CAMPOS OBLIGATORIOS
    // =========================================================

    const obligatorios = [

        "direccionOrigen",

        "direccionDestino",

        "idCliente",

        "idComunaOrigen",

        "idComunaDestino"
    ];



    for (
        const campo of obligatorios
    ) {

        if (
            datos[campo] === undefined ||
            datos[campo] === null ||
            datos[campo] === ""
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        `El campo ${campo} es obligatorio`
                });
        }
    }



    // =========================================================
    // IDS
    // =========================================================

    const ids = [

        "idCliente",

        "idComunaOrigen",

        "idComunaDestino"
    ];



    for (
        const campo of ids
    ) {

        if (
            !Number.isInteger(
                Number(
                    datos[campo]
                )
            ) ||

            Number(
                datos[campo]
            ) <= 0
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        `${campo} debe ser un número válido`
                });
        }
    }

// =========================================================
// DESTINATARIO OPCIONAL
// =========================================================

    if (
        datos.idDestinatario !== undefined &&
        datos.idDestinatario !== null &&
        datos.idDestinatario !== ""
    ) {

        if (
            !Number.isInteger(
                Number(datos.idDestinatario)
            ) ||
            Number(datos.idDestinatario) <= 0
        ) {

            return res
                .status(400)
                .json({
                    mensaje:
                        "idDestinatario debe ser un número válido"
                });
        }
    }


    // =========================================================
    // ZONA
    // =========================================================

    const tipoZona =
        datos.tipoZona

            ? String(
                datos.tipoZona
            )
                .trim()
                .toUpperCase()

            : null;



    if (
        ![
            "URBANA",
            "LEJANA"
        ].includes(
            tipoZona
        )
    ) {

        return res
            .status(400)
            .json({

                mensaje:
                    "El campo tipoZona debe ser URBANA o LEJANA"
            });
    }



    // =========================================================
    // DOCUMENTOS
    // =========================================================

    const documentosValidos = [

        "FACTURA",
        "BOLETA",
        "GUIA",
        "OT_MANUAL",
        "SIN_DOCUMENTO"
    ];



    const tipoDocumento =
        datos.tipoDocumento ??
        "SIN_DOCUMENTO";



    if (
        !documentosValidos.includes(
            tipoDocumento
        )
    ) {

        return res
            .status(400)
            .json({

                mensaje:
                    "Tipo de documento no válido"
            });
    }



    if (
        [
            "FACTURA",
            "BOLETA",
            "GUIA",
            "OT_MANUAL"
        ].includes(
            tipoDocumento
        ) &&

        !datos.numeroDocumento
            ?.trim()
    ) {

        return res
            .status(400)
            .json({

                mensaje:
                    "El número de documento es obligatorio para el tipo de documento seleccionado"
            });
    }



    if (
        tipoDocumento ===
            "SIN_DOCUMENTO" &&

        datos.numeroDocumento
            ?.trim()
    ) {

        return res
            .status(400)
            .json({

                mensaje:
                    "Una OT SIN_DOCUMENTO no debe tener número de documento"
            });
    }



    // =========================================================
    // SERVICIO
    // =========================================================

    const serviciosValidos = [
        "NORMAL",
        "EXPRESS",
        "URGENTE",
        "PRIORITARIO"
    ];

    if (datos.tipoServicio) {
        datos.tipoServicio = String(datos.tipoServicio).trim().toUpperCase();
    }

    if (
        datos.tipoServicio &&
        !serviciosValidos.includes(datos.tipoServicio)
    ) {

        return res
            .status(400)
            .json({

                mensaje:
                    "Tipo de servicio no válido"
            });
    }



    // =========================================================
    // REFERENCIA ENTREGA
    // =========================================================

    if (
        datos.referenciaEntrega !==
            undefined &&

        datos.referenciaEntrega !==
            null &&

        String(
            datos.referenciaEntrega
        ).length > 255
    ) {

        return res
            .status(400)
            .json({

                mensaje:
                    "La referencia de entrega no puede superar 255 caracteres"
            });
    }



    // =========================================================
    // CARGAS
    // =========================================================

    if (
        !Array.isArray(
            datos.cargas
        ) ||

        datos.cargas.length ===
            0
    ) {

        return res
            .status(400)
            .json({

                mensaje:
                    "La orden debe contener al menos un detalle de carga"
            });
    }



    for (
        const carga of datos.cargas
    ) {

        if (
            !Number.isInteger(
                Number(
                    carga.cantidad
                )
            ) ||

            Number(
                carga.cantidad
            ) <= 0
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        "La cantidad de cada carga debe ser mayor a 0"
                });
        }



        if (
            !Number.isInteger(
                Number(
                    carga.idTipoBulto
                )
            ) ||

            Number(
                carga.idTipoBulto
            ) <= 0
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        "Cada carga debe tener un tipo de bulto válido"
                });
        }



        const positivos = [

            "pesoUnitario",

            "pesoTotal",

            "largoCm",

            "anchoCm",

            "altoCm"
        ];



        for (
            const campo of positivos
        ) {

            if (
                carga[campo] !==
                    undefined &&

                carga[campo] !==
                    null &&

                carga[campo] !==
                    "" &&

                (
                    !Number.isFinite(
                        Number(
                            carga[campo]
                        )
                    ) ||

                    Number(
                        carga[campo]
                    ) <= 0
                )
            ) {

                return res
                    .status(400)
                    .json({

                        mensaje:
                            `${campo} debe ser mayor a 0`
                    });
            }
        }



        if (
            carga.valorDeclarado !==
                undefined &&

            carga.valorDeclarado !==
                null &&

            carga.valorDeclarado !==
                "" &&

            (
                !Number.isFinite(
                    Number(
                        carga.valorDeclarado
                    )
                ) ||

                Number(
                    carga.valorDeclarado
                ) < 0
            )
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        "El valor declarado no puede ser negativo"
                });
        }
    }



    // =========================================================
    // TARIFA EDITABLE
    // =========================================================

    const valoresEditables = [

        "valorBaseAplicado",

        "valorKgAplicado",

        "valorM3Aplicado",

        "valorZonaAplicado"
    ];



    for (
        const campo of valoresEditables
    ) {

        if (
            datos[campo] !==
                undefined &&

            datos[campo] !==
                null &&

            datos[campo] !==
                ""
        ) {


            const valor =
                Number(
                    datos[campo]
                );


            if (
                !Number.isFinite(
                    valor
                ) ||

                valor < 0
            ) {

                return res
                    .status(400)
                    .json({

                        mensaje:
                            `${campo} debe ser un número válido mayor o igual a 0`
                    });
            }
        }
    }



    // =========================================================
    // RETIRO OPCIONAL
    // =========================================================

    const requiereRetiro =

        datos.requiereRetiro ===
            true ||

        datos.requiereRetiro ===
            "true";



    if (
        requiereRetiro
    ) {


        if (
            !datos.retiro ||

            typeof datos.retiro !==
                "object" ||

            Array.isArray(
                datos.retiro
            )
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        "Debe ingresar los datos del retiro"
                });
        }



        if (
            !datos.retiro
                .direccionRetiro
                ?.trim()
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        "La dirección de retiro es obligatoria"
                });
        }



        if (
            datos.retiro
                .valorRetiro !==
                undefined &&

            datos.retiro
                .valorRetiro !==
                null &&

            datos.retiro
                .valorRetiro !==
                ""
        ) {


            const valorRetiro =
                Number(
                    datos.retiro
                        .valorRetiro
                );


            if (
                !Number.isFinite(
                    valorRetiro
                ) ||

                valorRetiro < 0
            ) {

                return res
                    .status(400)
                    .json({

                        mensaje:
                            "El valor del retiro no puede ser negativo"
                    });
            }
        }



        if (
            datos.retiro
                .fechaProgramada &&

            Number.isNaN(
                new Date(
                    datos.retiro
                        .fechaProgramada
                ).getTime()
            )
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        "La fecha programada del retiro no es válida"
                });
        }
    }



    // =========================================================
    // RECARGOS OPCIONALES
    // =========================================================

    if (
        datos.recargos !==
        undefined
    ) {


        if (
            !Array.isArray(
                datos.recargos
            )
        ) {

            return res
                .status(400)
                .json({

                    mensaje:
                        "Los recargos deben enviarse como una lista"
                });
        }



        for (
            const recargo of datos.recargos
        ) {


            if (
                !recargo.descripcion
                    ?.trim()
            ) {

                return res
                    .status(400)
                    .json({

                        mensaje:
                            "Cada recargo debe tener una descripción"
                    });
            }



            const monto =
                Number(
                    recargo.monto
                );


            if (
                !Number.isFinite(
                    monto
                ) ||

                monto <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        mensaje:
                            "El monto de cada recargo debe ser mayor a 0"
                    });
            }
        }
    }



    next();
};
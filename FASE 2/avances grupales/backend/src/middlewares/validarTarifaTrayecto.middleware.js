export const validarTarifaTrayecto = (req, res, next) => {
    const {
        idTarifa,
        idComunaOrigen,
        idComunaDestino,
        valorFijo,
        valorKg,
        valorM3
    } = req.body;

    const idTarifaNum = Number(idTarifa);
    const idOrigenNum = Number(idComunaOrigen);
    const idDestinoNum = Number(idComunaDestino);

    if (
        !Number.isInteger(idTarifaNum) || idTarifaNum <= 0 ||
        !Number.isInteger(idOrigenNum) || idOrigenNum <= 0 ||
        !Number.isInteger(idDestinoNum) || idDestinoNum <= 0
    ) {
        return res.status(400).json({
            mensaje: "Tarifa, comuna de origen y comuna de destino son obligatorias y deben ser válidas"
        });
    }


    const valores = { valorFijo, valorKg, valorM3 };

    for (const [campo, valor] of Object.entries(valores)) {
        const numero = Number(valor);

        if (valor === undefined || valor === null || valor === "" ||
            !Number.isFinite(numero) || numero < 0) {
            return res.status(400).json({
                mensaje: `${campo} debe ser un número válido mayor o igual a 0`
            });
        }
    }

    next();
};
export const validarActualizacionTarifaTrayecto = (req, res, next) => {
    const {
        valorFijo,
        valorKg,
        valorM3
    } = req.body;

    const valores = { valorFijo, valorKg, valorM3 };

    for (const [campo, valor] of Object.entries(valores)) {
        const numero = Number(valor);

        if (
            valor === undefined ||
            valor === null ||
            valor === "" ||
            !Number.isFinite(numero) ||
            numero < 0
        ) {
            return res.status(400).json({
                mensaje: `${campo} debe ser un número válido mayor o igual a 0`
            });
        }
    }

    next();
};
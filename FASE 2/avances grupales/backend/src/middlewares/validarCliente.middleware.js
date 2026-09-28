import { validarRut } from "../utils/rut.js";

export const validarCliente = (req, res, next) => {
    const {
        rut,
        razonSocial,
        direccion,
        idComuna
    } = req.body;

    if (!rut || !razonSocial || !direccion || !idComuna) {
        return res.status(400).json({
            mensaje: "RUT, razón social, dirección e idComuna son obligatorios"
        });
    }

    if (!validarRut(rut)) {
        return res.status(400).json({
            mensaje: "El RUT ingresado no es válido"
        });
    }

    if (!Number.isInteger(Number(idComuna)) || Number(idComuna) <= 0) {
        return res.status(400).json({
            mensaje: "idComuna debe ser un número válido"
        });
    }

    req.body.idComuna = Number(idComuna);

    next();
};

import { formatearRut, validarRut } from "../../common/utils/rut.js";
import { correoValido, normalizarTelefono } from "../../common/utils/contacto.js";

const texto = (valor, maximo) => {
    if (valor === undefined || valor === null) {
        return "";
    }

    return String(valor).trim().slice(0, maximo);
};

export const validarCliente = (req, res, next) => {
    const cuerpo = req.body && typeof req.body === "object" ? req.body : {};

    const rut = texto(cuerpo.rut, 12);
    const razonSocial = texto(cuerpo.razonSocial, 150);
    const direccion = texto(cuerpo.direccion, 200);
    const idComuna = Number(cuerpo.idComuna);

    if (!rut || !razonSocial || !direccion) {
        return res.status(400).json({
            ok: false,
            mensaje: "RUT, razón social y dirección son obligatorios"
        });
    }

    if (!validarRut(rut)) {
        return res.status(400).json({
            ok: false,
            mensaje: "El RUT no es válido"
        });
    }

    if (!Number.isInteger(idComuna) || idComuna <= 0) {
        return res.status(400).json({
            ok: false,
            mensaje: "Debe indicar una comuna válida"
        });
    }

    const idTarifa = Number(cuerpo.idTarifa);
    if (cuerpo.idTarifa && (!Number.isInteger(idTarifa) || idTarifa <= 0)) {
        return res.status(400).json({
            ok: false,
            mensaje: "Debe seleccionar un tarifario válido"
        });
    }

    const correo = texto(cuerpo.correo, 150).toLowerCase();
    if (correo && !correoValido(correo)) {
        return res.status(400).json({
            ok: false,
            mensaje: "El correo no tiene un formato válido"
        });
    }

    const telefono = normalizarTelefono(cuerpo.telefono);
    if (telefono === "") {
        return res.status(400).json({
            ok: false,
            mensaje: "El teléfono debe incluir un código conocido, por ejemplo +569"
        });
    }

    const crearCuentaCorriente = [true, "true", "SI", "si", "1", 1].includes(
        cuerpo.crearCuentaCorriente
    );

    let limiteCredito = Number(cuerpo.limiteCredito);
    if (!Number.isFinite(limiteCredito) || limiteCredito < 0) {
        limiteCredito = 0;
    }

    req.body = {
        rut: formatearRut(rut),
        razonSocial,
        nombreFantasia: texto(cuerpo.nombreFantasia, 150) || null,
        giro: texto(cuerpo.giro, 150) || null,
        direccion,
        telefono,
        correo: correo || null,
        idComuna,
        idTarifa: Number.isInteger(idTarifa) && idTarifa > 0 ? idTarifa : null,
        crearCuentaCorriente,
        limiteCredito
    };

    next();
};

import {
    obtenerDestinatarios,
    crearDestinatario
} from "./destinatarios.service.js";


// =========================================================
// LISTAR DESTINATARIOS
// =========================================================

export const listarDestinatarios = async (req, res) => {

    try {

        const destinatarios =
            await obtenerDestinatarios();

        return res.status(200).json({
            ok: true,
            total: destinatarios.length,
            destinatarios
        });

    } catch (error) {

        console.error(
            "Error al listar destinatarios:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible obtener los destinatarios"
        });
    }
};


// =========================================================
// CREAR DESTINATARIO
// =========================================================

export const guardarDestinatario = async (req, res) => {

    try {

        const destinatario =
            await crearDestinatario(
                req.body
            );

        return res.status(201).json({
            ok: true,
            mensaje:
                "Destinatario creado correctamente",
            destinatario
        });

    } catch (error) {

        console.error(
            "Error al crear destinatario:",
            error
        );

        return res.status(400).json({
            ok: false,
            mensaje:
                error.message ||
                "No fue posible crear el destinatario"
        });
    }
};
import nodemailer from "nodemailer";
import "dotenv/config";

/*
 * ============================================================
 * MAREXPRESS - Configuración de correo electrónico
 * Logística & Distribución
 * ============================================================
 *
 * Servicio central de correo del sistema MAREXPRESS.
 *
 * - Conexión SMTP segura mediante Titan Email.
 * - Credenciales almacenadas únicamente en .env.
 * - Soporte para HTML.
 * - Soporte para texto alternativo.
 * - Soporte para imágenes embebidas mediante CID.
 *
 * Nunca registrar contraseñas, códigos OTP ni credenciales.
 *
 * © 2026 MAREXPRESS. Todos los derechos reservados.
 * ============================================================
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Envía un correo electrónico desde MAREXPRESS.
 */
export const enviarCorreo = async ({
    destinatario,
    asunto,
    html,
    texto,
    attachments = []
}) => {
    if (!destinatario) {
        throw new Error(
            "No se especificó un destinatario"
        );
    }

    if (!asunto) {
        throw new Error(
            "No se especificó el asunto del correo"
        );
    }

    return await transporter.sendMail({
        from:
            `"MAREXPRESS | Logística & Distribución" <${process.env.MAIL_FROM}>`,

        to: destinatario,

        subject: asunto,

        text: texto,

        html,

        // Permite incrustar el logo de MAREXPRESS
        // mediante CID sin depender de una URL externa.
        attachments
    });
};

/**
 * Comprueba la conexión con el servidor SMTP.
 *
 * Esta función NO envía ningún correo.
 */
export const verificarConexionCorreo = async () => {
    await transporter.verify();

    return true;
};

export default transporter;
import { enviarCodigoOtp } from "../src/modules/auth/correoOtp.service.js";

try {
    await enviarCodigoOtp({
        destinatario: "crodriguez@transportesmarexpress.cl",
        codigo: "483921",
        nombre: "Carlos Rodriguez chupalo este es el programa haciendo cositas"
    });

    console.log(
        "✅ Correo corporativo MAREXPRESS enviado correctamente."
    );
} catch (error) {
    console.error(
        "❌ Error al enviar el correo MAREXPRESS:"
    );

    console.error(error.message);
}
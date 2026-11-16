import { rateLimit } from "express-rate-limit";

const crearLimitador = (limit, mensaje) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        message: {
            ok: false,
            mensaje
        }
    });
};

// Hasta 10 solicitudes de inicio de sesión por IP en 15 minutos.
export const limitarLogin = crearLimitador(
    10,
    "Demasiadas solicitudes de inicio de sesión. Intenta nuevamente más tarde."
);

// Hasta 5 solicitudes de registro por IP en 15 minutos.
export const limitarRegistro = crearLimitador(
    5,
    "Demasiadas solicitudes de registro. Intenta nuevamente más tarde."
);

// Hasta 20 verificaciones OTP por IP en 15 minutos.
// Cada desafío conserva además su máximo de 5 intentos.
export const limitarVerificacionOtp = crearLimitador(
    20,
    "Demasiadas solicitudes de verificación. Intenta nuevamente más tarde."
);

// Hasta 5 solicitudes de reenvío por IP en 15 minutos.
export const limitarReenvioOtp = crearLimitador(
    5,
    "Demasiadas solicitudes de reenvío. Intenta nuevamente más tarde."
);
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import { enviarCodigoOtp } from "./correoOtp.service.js";

const PROPOSITOS_PERMITIDOS = [
    "LOGIN",
    "REGISTRO",
    "ACCESO_SENSIBLE"
];

const DURACION_OTP_MS = 5 * 60 * 1000;
const MAX_INTENTOS = 5;

const validarProposito = (proposito) => {
    if (typeof proposito !== "string") {
        throw new Error("Propósito de verificación inválido");
    }

    const valor = proposito.trim().toUpperCase();

    if (!PROPOSITOS_PERMITIDOS.includes(valor)) {
        throw new Error("Propósito de verificación inválido");
    }

    return valor;
};

const validarUsuarioId = (idUsuario) => {
    if (
        typeof idUsuario !== "number" &&
        typeof idUsuario !== "string"
    ) {
        throw new Error("Usuario inválido");
    }

    if (
        typeof idUsuario === "string" &&
        !/^[1-9]\d*$/.test(idUsuario.trim())
    ) {
        throw new Error("Usuario inválido");
    }

    const valor = Number(idUsuario);

    if (
        !Number.isSafeInteger(valor) ||
        valor <= 0 ||
        valor > 2147483647
    ) {
        throw new Error("Usuario inválido");
    }

    return valor;
};

const usuarioPuedeVerificar = (usuario, proposito) => {
    if (!usuario || !usuario.correo) {
        return false;
    }

    if (proposito === "REGISTRO") {
        return (
            usuario.estado === false &&
            usuario.registroPendiente === true &&
            usuario.correoVerificadoEn === null &&
            usuario.rol?.nombreRol === "CLIENTE"
        );
    }

    return (
        usuario.estado === true &&
        usuario.registroPendiente === false
    );
};

const seleccionarUsuario = {
    idUsuario: true,
    nombre: true,
    correo: true,
    estado: true,
    registroPendiente: true,
    correoVerificadoEn: true,
    rol: {
        select: {
            nombreRol: true
        }
    }
};

/*
 * Se bloquea primero el usuario en ambas operaciones.
 * Esto serializa la generación y validación de sus OTP.
 */
const bloquearUsuario = async (tx, idUsuario) => {
    const filas = await tx.$queryRaw`
        SELECT idUsuario
        FROM usuario
        WHERE idUsuario = ${idUsuario}
        FOR UPDATE
    `;

    return filas.length === 1;
};

export const generarCodigoAcceso = async (
    idUsuario,
    proposito = "LOGIN"
) => {
    const usuarioId = validarUsuarioId(idUsuario);
    const propositoNormalizado = validarProposito(proposito);

    const codigo = crypto.randomInt(100000, 1000000).toString();
    const codigoHash = await bcrypt.hash(codigo, 10);
    const challengeId = crypto.randomBytes(32).toString("hex");

    const resultado = await prisma.$transaction(async (tx) => {
        const existe = await bloquearUsuario(tx, usuarioId);

        if (!existe) {
            throw new Error("Usuario no disponible");
        }

        const usuario = await tx.usuario.findUnique({
            where: {
                idUsuario: usuarioId
            },
            select: seleccionarUsuario
        });

        if (!usuarioPuedeVerificar(usuario, propositoNormalizado)) {
            throw new Error("Usuario no disponible");
        }

        // Invalida los desafíos anteriores del mismo propósito.
        await tx.verificacion_acceso.updateMany({
            where: {
                idUsuario: usuarioId,
                proposito: propositoNormalizado,
                usado: false
            },
            data: {
                usado: true
            }
        });

        const expiraEn = new Date(Date.now() + DURACION_OTP_MS);

        const verificacion = await tx.verificacion_acceso.create({
            data: {
                idUsuario: usuarioId,
                proposito: propositoNormalizado,
                challengeId,
                codigoHash,
                expiraEn,
                intentos: 0,
                usado: false
            },
            select: {
                idVerificacion: true,
                challengeId: true,
                expiraEn: true
            }
        });

        return {
            verificacion,
            correo: usuario.correo,
            nombre: usuario.nombre
        };
    });

    // El correo se envía fuera de la transacción.
    try {
        await enviarCodigoOtp({
            destinatario: resultado.correo,
            codigo,
            nombre: resultado.nombre
        });
    } catch {
        try {
            // Solo invalida el desafío cuyo envío falló.
            await prisma.verificacion_acceso.updateMany({
                where: {
                    idVerificacion:
                        resultado.verificacion.idVerificacion,
                    usado: false
                },
                data: {
                    usado: true
                }
            });
        } catch {
            console.error(
                "No se pudo invalidar el desafío tras fallar el envío OTP"
            );
        }

        throw new Error(
            "No fue posible enviar el código de verificación"
        );
    }

    // Nunca devuelve el OTP, su hash ni el ID del usuario.
    return {
        enviado: true,
        challengeId: resultado.verificacion.challengeId,
        expiraEn: resultado.verificacion.expiraEn
    };
};

export const validarCodigoAcceso = async (
    challengeId,
    codigo,
    proposito = "LOGIN"
) => {
    const propositoNormalizado = validarProposito(proposito);

    if (typeof challengeId !== "string") {
        throw new Error("Solicitud de verificación inválida");
    }

    const challengeNormalizado = challengeId.trim();

    if (!/^[a-f0-9]{64}$/.test(challengeNormalizado)) {
        throw new Error("Solicitud de verificación inválida");
    }

    if (
        typeof codigo !== "string" &&
        typeof codigo !== "number"
    ) {
        throw new Error("Código de verificación inválido");
    }

    const codigoIngresado = String(codigo).trim();

    if (!/^\d{6}$/.test(codigoIngresado)) {
        throw new Error("Código de verificación inválido");
    }

    // Esta lectura solo identifica al usuario que se bloqueará.
    // El desafío se vuelve a comprobar dentro de la transacción.
    const referencia = await prisma.verificacion_acceso.findFirst({
        where: {
            challengeId: challengeNormalizado,
            proposito: propositoNormalizado
        },
        select: {
            idUsuario: true
        }
    });

    if (!referencia) {
        throw new Error("Solicitud de verificación inválida");
    }

    const resultado = await prisma.$transaction(async (tx) => {
        const existe = await bloquearUsuario(
            tx,
            referencia.idUsuario
        );

        if (!existe) {
            return {
                error: "Solicitud de verificación inválida"
            };
        }

        // Lectura bloqueada del desafío: evita consumos simultáneos.
        const filas = await tx.$queryRaw`
            SELECT
                idVerificacion,
                idUsuario,
                codigoHash,
                expiraEn,
                intentos,
                usado
            FROM verificacion_acceso
            WHERE challengeId = ${challengeNormalizado}
              AND proposito = ${propositoNormalizado}
            FOR UPDATE
        `;

        const verificacion = filas[0];

        if (!verificacion || Boolean(verificacion.usado)) {
            return {
                error: "Solicitud de verificación inválida"
            };
        }

        const invalidarDesafio = async () => {
            await tx.verificacion_acceso.update({
                where: {
                    idVerificacion: verificacion.idVerificacion
                },
                data: {
                    usado: true
                }
            });
        };

        if (verificacion.expiraEn <= new Date()) {
            await invalidarDesafio();

            return {
                error: "El código ha expirado"
            };
        }

        if (verificacion.intentos >= MAX_INTENTOS) {
            await invalidarDesafio();

            return {
                error: "Se excedió el número máximo de intentos"
            };
        }

        const usuario = await tx.usuario.findUnique({
            where: {
                idUsuario: referencia.idUsuario
            },
            select: seleccionarUsuario
        });

        if (!usuarioPuedeVerificar(usuario, propositoNormalizado)) {
            await invalidarDesafio();

            return {
                error: "Solicitud de verificación inválida"
            };
        }

        const coincide = await bcrypt.compare(
            codigoIngresado,
            verificacion.codigoHash
        );

        // Se comprueba nuevamente después de comparar el hash.
        const ahora = new Date();

        if (verificacion.expiraEn <= ahora) {
            await invalidarDesafio();

            return {
                error: "El código ha expirado"
            };
        }

        if (!coincide) {
            const nuevosIntentos = verificacion.intentos + 1;
            const agotado = nuevosIntentos >= MAX_INTENTOS;

            await tx.verificacion_acceso.update({
                where: {
                    idVerificacion: verificacion.idVerificacion
                },
                data: {
                    intentos: nuevosIntentos,
                    usado: agotado
                }
            });

            /*
             * Devolvemos el error para confirmar el incremento.
             * Lanzarlo aquí revertiría los intentos registrados.
             */
            return {
                error: agotado
                    ? "Se excedió el número máximo de intentos"
                    : "Código de verificación incorrecto"
            };
        }

        await tx.verificacion_acceso.update({
            where: {
                idVerificacion: verificacion.idVerificacion
            },
            data: {
                usado: true
            }
        });

        if (propositoNormalizado === "REGISTRO") {
            const activado = await tx.usuario.updateMany({
                where: {
                    idUsuario: referencia.idUsuario,
                    estado: false,
                    registroPendiente: true,
                    correoVerificadoEn: null,
                    rol: {
                        nombreRol: "CLIENTE"
                    }
                },
                data: {
                    estado: true,
                    registroPendiente: false,
                }
            });

            if (activado.count !== 1) {
                // Revierte también el consumo del OTP.
                throw new Error(
                    "Solicitud de verificación inválida"
                );
            }
            await tx.$executeRaw`
                UPDATE usuario
                SET correoVerificadoEn = NOW()
                WHERE idUsuario = ${referencia.idUsuario}
                AND correoVerificadoEn IS NULL
            `;
        }

        return {
            valido: true,
            idUsuario: referencia.idUsuario
        };
    }, {
        maxWait: 5000,
        timeout: 15000
    });

    if (resultado.error) {
        throw new Error(resultado.error);
    }

    return resultado;
};
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

export const registrarCliente = async (datos = {}) => {
    const {
        nombre,
        apellido,
        rut,
        correo,
        telefono,
        nombreUsuario,
        password
    } = datos;

    const camposTexto = {
        nombre,
        apellido,
        rut,
        correo,
        nombreUsuario,
        password
    };

    for (const [campo, valor] of Object.entries(camposTexto)) {
        if (typeof valor !== "string" || !valor.trim()) {
            throw new Error(`El campo ${campo} es obligatorio`);
        }
    }

    if (
        telefono !== undefined &&
        telefono !== null &&
        typeof telefono !== "string"
    ) {
        throw new Error("El teléfono debe ser texto");
    }

    const nombreNormalizado = nombre.trim();
    const apellidoNormalizado = apellido.trim();
    const correoNormalizado = correo.trim().toLowerCase();
    const usuarioNormalizado = nombreUsuario.trim().toLowerCase();
    const telefonoNormalizado = telefono?.trim() || null;

    const rutLimpio = rut
        .trim()
        .replace(/\./g, "")
        .replace(/-/g, "")
        .toUpperCase();

    if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
        throw new Error("El RUT no es válido");
    }

    const cuerpo = rutLimpio.slice(0, -1);
    const dvIngresado = rutLimpio.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resultado = 11 - (suma % 11);

    const dvCalculado =
        resultado === 11 ? "0" :
        resultado === 10 ? "K" :
        String(resultado);

    if (dvIngresado !== dvCalculado) {
        throw new Error("El RUT no es válido");
    }

    const rutNormalizado = `${cuerpo}-${dvIngresado}`;

    if (
        nombreNormalizado.length > 100 ||
        apellidoNormalizado.length > 100
    ) {
        throw new Error(
            "Nombre y apellido admiten máximo 100 caracteres"
        );
    }

    if (
        correoNormalizado.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)
    ) {
        throw new Error("El correo electrónico no es válido");
    }

    if (
        usuarioNormalizado.length < 4 ||
        usuarioNormalizado.length > 50
    ) {
        throw new Error(
            "El nombre de usuario debe tener entre 4 y 50 caracteres"
        );
    }

    if (
        telefonoNormalizado &&
        telefonoNormalizado.length > 20
    ) {
        throw new Error("El teléfono admite máximo 20 caracteres");
    }

    const passwordValida =
        password.length >= 10 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

    if (!passwordValida) {
        throw new Error(
            "La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
        );
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
        throw new Error("La contraseña supera el máximo de 72 bytes");
    }

    const rolCliente = await prisma.rol.findUnique({
        where: {
            nombreRol: "CLIENTE"
        },
        select: {
            idRol: true
        }
    });

    if (!rolCliente) {
        throw new Error("No fue posible preparar el registro");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
        return await prisma.$transaction(async (tx) => {
            // Reconoce también formatos históricos del RUT.
            const existentes = await tx.$queryRaw`
                SELECT idUsuario
                FROM usuario
                WHERE REPLACE(
                    REPLACE(UPPER(TRIM(rut)), '.', ''),
                    '-', ''
                ) = ${rutLimpio}
                   OR correo = ${correoNormalizado}
                   OR nombreUsuario = ${usuarioNormalizado}
                LIMIT 1
            `;

            if (existentes.length > 0) {
                throw new Error(
                    "No fue posible registrar la cuenta con los datos proporcionados"
                );
            }

            return await tx.usuario.create({
                data: {
                    nombre: nombreNormalizado,
                    apellido: apellidoNormalizado,
                    rut: rutNormalizado,
                    correo: correoNormalizado,
                    telefono: telefonoNormalizado,
                    nombreUsuario: usuarioNormalizado,
                    password: passwordHash,

                    // Pendiente de verificar el correo.
                    estado: false,
                    correoVerificadoEn: null,
                    registroPendiente: true,

                    // El registro público siempre crea un CLIENTE.
                    idRol: rolCliente.idRol
                },
                select: {
                    idUsuario: true,
                    nombre: true,
                    apellido: true,
                    correo: true,
                    nombreUsuario: true,
                    estado: true,
                    correoVerificadoEn: true,
                    registroPendiente: true
                }
            });
        });
    } catch (error) {
        if (error?.code === "P2002") {
            throw new Error(
                "No fue posible registrar la cuenta con los datos proporcionados"
            );
        }

        throw error;
    }
};
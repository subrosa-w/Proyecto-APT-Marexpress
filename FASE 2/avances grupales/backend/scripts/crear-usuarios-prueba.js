import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

/*
 * Crea (o actualiza) los usuarios de prueba del equipo:
 * - Un OPERADOR.
 * - Un CLIENTE vinculado a la empresa con cuenta corriente (cliente_usuario).
 *
 * La contraseña NO va en el código: se lee de CLAVE_USUARIOS_PRUEBA en el .env.
 * Ejecutar: npx tsx scripts/crear-usuarios-prueba.js
 * Se puede repetir: si el correo ya existe, actualiza el usuario.
 */

// RUT de la empresa con cuenta corriente a la que se vincula el cliente
const RUT_EMPRESA_CUENTA_CORRIENTE = "76.123.456-0";

const usuarios = [
    {
        nombre: "Benjamín",
        apellido: "Sandoval",
        rut: "30111222-K",
        correo: "ben.sandovalv@duocuc.cl",
        nombreUsuario: "operador.benjamin",
        rol: "OPERADOR"
    },
    {
        nombre: "Benjamín",
        apellido: "Sandoval",
        rut: "30222333-5",
        correo: "benja.sandoval.05@gmail.com",
        nombreUsuario: "cliente.cuentacorriente",
        rol: "CLIENTE",
        empresaCuentaCorriente: true
    }
];

// Misma política que el registro: 10+ caracteres con mayúscula, minúscula, número y símbolo
const claveValida = (clave) =>
    typeof clave === "string" &&
    clave.length >= 10 &&
    Buffer.byteLength(clave, "utf8") <= 72 &&
    /[a-z]/.test(clave) &&
    /[A-Z]/.test(clave) &&
    /\d/.test(clave) &&
    /[^A-Za-z0-9]/.test(clave);

const guardarUsuario = async (datos, passwordHash) => {
    const rol = await prisma.rol.findUnique({ where: { nombreRol: datos.rol } });
    if (!rol) {
        throw new Error(`No existe el rol ${datos.rol}`);
    }

    const campos = {
        nombre: datos.nombre,
        apellido: datos.apellido,
        rut: datos.rut,
        nombreUsuario: datos.nombreUsuario,
        password: passwordHash,
        estado: true,
        registroPendiente: false,
        correoVerificadoEn: new Date(),
        idRol: rol.idRol
    };

    const existente = await prisma.usuario.findUnique({ where: { correo: datos.correo } });

    return existente
        ? prisma.usuario.update({ where: { idUsuario: existente.idUsuario }, data: campos })
        : prisma.usuario.create({ data: { ...campos, correo: datos.correo } });
};

const vincularEmpresaCuentaCorriente = async (usuario) => {
    const empresa = await prisma.cliente.findUnique({
        where: { rut: RUT_EMPRESA_CUENTA_CORRIENTE },
        include: { cuenta_corriente: true }
    });

    if (!empresa?.cuenta_corriente?.estado) {
        throw new Error(`La empresa ${RUT_EMPRESA_CUENTA_CORRIENTE} no tiene una cuenta corriente activa`);
    }

    await prisma.cliente_usuario.upsert({
        where: {
            idCliente_idUsuario: {
                idCliente: empresa.idCliente,
                idUsuario: usuario.idUsuario
            }
        },
        update: { estado: true },
        create: { idCliente: empresa.idCliente, idUsuario: usuario.idUsuario, estado: true }
    });

    return empresa.razonSocial;
};

try {
    const clave = process.env.CLAVE_USUARIOS_PRUEBA;
    if (!claveValida(clave)) {
        throw new Error(
            "Define CLAVE_USUARIOS_PRUEBA en el .env (10+ caracteres con mayúscula, minúscula, número y símbolo)"
        );
    }

    const passwordHash = await bcrypt.hash(clave, 12);

    for (const datos of usuarios) {
        const usuario = await guardarUsuario(datos, passwordHash);
        let detalle = "";

        if (datos.empresaCuentaCorriente) {
            detalle = ` · vinculado a ${await vincularEmpresaCuentaCorriente(usuario)}`;
        }

        console.log(`✅ ${datos.rol} ${datos.nombreUsuario} (${datos.correo}) listo${detalle}`);
    }

    console.log("La contraseña de ambos es CLAVE_USUARIOS_PRUEBA del .env.");
} catch (error) {
    console.error("❌ No se pudieron crear los usuarios de prueba:", error.message);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}

import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

/*
 * Crea (o actualiza) los usuarios de prueba de Benjamín, uno por rol,
 * con alias del mismo correo (ben.sandovalv+rol@duocuc.cl), igual que los de Raúl.
 * - ADMINISTRADOR, OPERADOR y PEONETA.
 * - CLIENTE normal: vinculado a una empresa SIN cuenta corriente.
 * - CLIENTE con cuenta corriente: vinculado a una empresa CON cuenta corriente.
 *
 * La contraseña NO va en el código: se lee de CLAVE_USUARIOS_PRUEBA en el .env.
 * Ejecutar: npx tsx scripts/crear-usuarios-prueba.js
 * Se puede repetir: si el correo ya existe, actualiza el usuario.
 * Los usuarios no se borran: tienen historial (OT, pagos, movimientos) que debe conservarse.
 */

// Empresas a las que se vinculan los clientes (por RUT)
const EMPRESA_SIN_CUENTA_CORRIENTE = "26.666.666-7"; // Cliente Prueba MAREXPRESS SpA
const EMPRESA_CON_CUENTA_CORRIENTE = "76.123.456-0"; // Cliente Prueba SpA

const usuarios = [
    {
        nombre: "Benjamín",
        apellido: "Sandoval",
        rut: "30333444-0",
        correo: "ben.sandovalv+admin@duocuc.cl",
        nombreUsuario: "admin.benjamin",
        rol: "ADMINISTRADOR"
    },
    {
        nombre: "Benjamín",
        apellido: "Sandoval",
        rut: "30111222-K",
        correo: "ben.sandovalv+operador@duocuc.cl",
        // Este operador antes usaba el correo sin alias: se le cambia el correo y conserva su historial
        correoAnterior: "ben.sandovalv@duocuc.cl",
        nombreUsuario: "operador.benjamin",
        rol: "OPERADOR"
    },
    {
        nombre: "Benjamín",
        apellido: "Sandoval",
        rut: "30444555-6",
        correo: "ben.sandovalv+peoneta@duocuc.cl",
        nombreUsuario: "peoneta.benjamin",
        rol: "PEONETA"
    },
    {
        nombre: "Benjamín",
        apellido: "Sandoval",
        rut: "30555666-1",
        correo: "ben.sandovalv+cliente@duocuc.cl",
        nombreUsuario: "cliente.benjamin",
        rol: "CLIENTE",
        empresa: { rut: EMPRESA_SIN_CUENTA_CORRIENTE, cuentaCorriente: false }
    },
    {
        nombre: "Benjamín",
        apellido: "Sandoval",
        rut: "30222333-5",
        correo: "benja.sandoval.05@gmail.com",
        nombreUsuario: "cliente.cuentacorriente",
        rol: "CLIENTE",
        empresa: { rut: EMPRESA_CON_CUENTA_CORRIENTE, cuentaCorriente: true }
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

const buscarExistente = async (datos) =>
    (await prisma.usuario.findUnique({ where: { correo: datos.correo } })) ||
    (datos.correoAnterior
        ? await prisma.usuario.findUnique({ where: { correo: datos.correoAnterior } })
        : null);

const guardarUsuario = async (datos, passwordHash) => {
    const rol = await prisma.rol.findUnique({ where: { nombreRol: datos.rol } });
    if (!rol) {
        throw new Error(`No existe el rol ${datos.rol}`);
    }

    const campos = {
        nombre: datos.nombre,
        apellido: datos.apellido,
        rut: datos.rut,
        correo: datos.correo,
        nombreUsuario: datos.nombreUsuario,
        password: passwordHash,
        estado: true,
        registroPendiente: false,
        correoVerificadoEn: new Date(),
        idRol: rol.idRol
    };

    const existente = await buscarExistente(datos);

    return existente
        ? prisma.usuario.update({ where: { idUsuario: existente.idUsuario }, data: campos })
        : prisma.usuario.create({ data: campos });
};

const vincularEmpresa = async (usuario, { rut, cuentaCorriente }) => {
    const empresa = await prisma.cliente.findUnique({
        where: { rut },
        include: { cuenta_corriente: true }
    });

    if (!empresa) {
        throw new Error(`No existe la empresa con RUT ${rut}`);
    }

    // El portal se decide por la cuenta de la empresa: hay que vincular a la empresa correcta
    const tieneCuenta = Boolean(empresa.cuenta_corriente?.estado);
    if (tieneCuenta !== cuentaCorriente) {
        throw new Error(
            `La empresa ${rut} ${tieneCuenta ? "tiene" : "no tiene"} cuenta corriente activa; no sirve para este cliente`
        );
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

        if (datos.empresa) {
            const tipo = datos.empresa.cuentaCorriente ? "con cuenta corriente" : "sin cuenta corriente";
            detalle = ` · vinculado a ${await vincularEmpresa(usuario, datos.empresa)} (${tipo})`;
        }

        console.log(`✅ ${datos.rol.padEnd(13)} ${datos.nombreUsuario.padEnd(24)} ${datos.correo}${detalle}`);
    }

    console.log("La contraseña de todos es CLAVE_USUARIOS_PRUEBA del .env.");
} catch (error) {
    console.error("❌ No se pudieron crear los usuarios de prueba:", error.message);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}

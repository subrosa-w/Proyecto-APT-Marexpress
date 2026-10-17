import prisma from "../../config/prisma.js";
import { validarRut } from "../../common/utils/rut.js";
import {
    crearTarifa as crearTarifario,
    obtenerTarifas as listarTarifarios
} from "../tarifas/tarifario.service.js";

export const obtenerTarifas = listarTarifarios;
export const crearTarifa = crearTarifario;

export const obtenerConductores = async () => {
    return prisma.conductor.findMany({
        orderBy: [
            { apellido: "asc" },
            { nombre: "asc" }
        ]
    });
};

export const obtenerVehiculos = async () => {
    return prisma.vehiculo.findMany({
        orderBy: {
            patente: "asc"
        }
    });
};

export const obtenerUsuarios = async () => {
    return prisma.usuario.findMany({
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            rut: true,
            correo: true,
            telefono: true,
            nombreUsuario: true,
            estado: true,
            registroPendiente: true,
            correoVerificadoEn: true,
            rol: {
                select: {
                    idRol: true,
                    nombreRol: true
                }
            }
        },
        orderBy: {
            idUsuario: "desc"
        }
    });
};

export const obtenerPeonetas = async () => {
    return prisma.usuario.findMany({
        where: {
            estado: true,
            rol: {
                nombreRol: "PEONETA"
            }
        },
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            nombreUsuario: true,
            rut: true,
            telefono: true
        },
        orderBy: [
            { apellido: "asc" },
            { nombre: "asc" }
        ]
    });
};

export const ROLES_SISTEMA = [
    { nombreRol: "ADMINISTRADOR", descripcion: "Acceso total al sistema" },
    { nombreRol: "OPERADOR", descripcion: "Operación de bodega, órdenes y despacho" },
    { nombreRol: "CLIENTE CUENTA CORRIENTE", descripcion: "Cliente con cuenta corriente" },
    { nombreRol: "CLIENTE NORMAL", descripcion: "Cliente de pago contado" },
    { nombreRol: "PEONETA", descripcion: "Entregas en ruta" }
];

const errorDatos = (mensaje) => {
    const error = new Error(mensaje);
    error.status = 400;
    return error;
};

export const asegurarRoles = async () => {
    for (const rol of ROLES_SISTEMA) {
        await prisma.rol.upsert({
            where: { nombreRol: rol.nombreRol },
            update: { descripcion: rol.descripcion },
            create: rol
        });
    }
    return prisma.rol.findMany({
        where: { nombreRol: { in: ROLES_SISTEMA.map((rol) => rol.nombreRol) } },
        orderBy: { idRol: "asc" }
    });
};

export const cambiarRolUsuario = async (idUsuario, idRol) => {
    const usuarioId = Number(idUsuario);
    const rolId = Number(idRol);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw errorDatos("El usuario no es válido");
    }
    const roles = await asegurarRoles();
    const rol = roles.find((item) => item.idRol === rolId);
    if (!rol) {
        throw errorDatos("Ese rol no está permitido");
    }

    const usuario = await prisma.usuario.findUnique({
        where: { idUsuario: usuarioId },
        include: { rol: true }
    });
    if (!usuario) {
        const error = new Error("Usuario no encontrado");
        error.status = 404;
        throw error;
    }

    if (usuario.rol?.nombreRol === "ADMINISTRADOR" && rol.nombreRol !== "ADMINISTRADOR") {
        const admins = await prisma.usuario.count({
            where: { estado: true, rol: { nombreRol: "ADMINISTRADOR" } }
        });
        if (admins <= 1) {
            throw errorDatos("Debe quedar al menos un administrador activo");
        }
    }

    return prisma.usuario.update({
        where: { idUsuario: usuarioId },
        data: { idRol: rol.idRol },
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            nombreUsuario: true,
            correo: true,
            estado: true,
            rol: { select: { idRol: true, nombreRol: true } }
        }
    });
};

const rutGuardado = (rut) => {
    const limpio = String(rut || "").replace(/\./g, "").replace(/-/g, "").toUpperCase();
    return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
};

export const crearConductor = async (datos) => {
    const rut = String(datos?.rut || "").trim();
    const nombre = String(datos?.nombre || "").trim();
    const apellido = String(datos?.apellido || "").trim();
    const licencia = String(datos?.licencia || "").trim().toUpperCase();
    if (!validarRut(rut)) {
        throw errorDatos("El RUT del conductor no es válido. Usa el formato 12.345.678-9");
    }
    if (!nombre || !apellido) {
        throw errorDatos("Nombre y apellido son obligatorios");
    }
    if (!licencia) {
        throw errorDatos("La licencia es obligatoria");
    }

    try {
        return await prisma.conductor.create({
            data: {
                rut: rutGuardado(rut),
                nombre,
                apellido,
                licencia: licencia.slice(0, 20),
                telefono: String(datos?.telefono || "").trim() || null,
                vencimientoLicencia: datos?.vencimientoLicencia
                    ? new Date(datos.vencimientoLicencia)
                    : null
            }
        });
    } catch (error) {
        if (error?.code === "P2002") {
            throw errorDatos("Ya existe un conductor con ese RUT");
        }
        throw error;
    }
};

export const crearVehiculo = async (datos) => {
    const patente = String(datos?.patente || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const marca = String(datos?.marca || "").trim();
    const modelo = String(datos?.modelo || "").trim();
    if (!/^[A-Z]{2,4}\d{2}$/.test(patente)) {
        throw errorDatos("La patente debe tener 2 a 4 letras y 2 números. Ejemplo: ABCD12");
    }
    if (!marca || !modelo) {
        throw errorDatos("Marca y modelo son obligatorios");
    }
    const anio = datos?.anio === "" || datos?.anio == null ? null : Number(datos.anio);
    const capacidad = datos?.capacidadKg === "" || datos?.capacidadKg == null
        ? null
        : Number(datos.capacidadKg);
    if (anio != null && (!Number.isInteger(anio) || anio < 1980 || anio > 2100)) {
        throw errorDatos("El año del camión no es válido");
    }
    if (capacidad != null && (!Number.isFinite(capacidad) || capacidad < 0)) {
        throw errorDatos("La capacidad en kilos no es válida");
    }

    try {
        return await prisma.vehiculo.create({
            data: {
                patente,
                marca: marca.slice(0, 50),
                modelo: modelo.slice(0, 50),
                anio,
                capacidadKg: capacidad
            }
        });
    } catch (error) {
        if (error?.code === "P2002") {
            throw errorDatos("Ya existe un camión con esa patente");
        }
        throw error;
    }
};

let tablaRecargo = null;

const asegurarTiposRecargo = async () => {
    if (!tablaRecargo) {
        tablaRecargo = prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS tipo_recargo (
                idTipoRecargo INT NOT NULL AUTO_INCREMENT,
                nombre VARCHAR(80) NOT NULL,
                monto DECIMAL(12,2) NOT NULL,
                estado TINYINT(1) NOT NULL DEFAULT 1,
                PRIMARY KEY (idTipoRecargo),
                UNIQUE KEY uq_tipo_recargo_nombre (nombre)
            )
        `).catch((error) => {
            tablaRecargo = null;
            throw error;
        });
    }
    await tablaRecargo;
};

const mapearTipoRecargo = (fila) => ({
    idTipoRecargo: Number(fila.idTipoRecargo),
    nombre: fila.nombre,
    monto: Number(String(fila.monto)),
    estado: Boolean(fila.estado)
});

export const listarTiposRecargo = async () => {
    await asegurarTiposRecargo();
    const filas = await prisma.$queryRaw`
        SELECT idTipoRecargo, nombre, monto, estado
        FROM tipo_recargo
        ORDER BY nombre ASC
    `;
    return filas.map(mapearTipoRecargo);
};

export const crearTipoRecargo = async ({ nombre, monto }) => {
    await asegurarTiposRecargo();
    const titulo = String(nombre || "").trim();
    const valor = Number(monto);
    if (titulo.length < 2) {
        throw errorDatos("El recargo necesita un nombre");
    }
    if (!Number.isFinite(valor) || valor <= 0) {
        throw errorDatos("El valor del recargo debe ser mayor a 0");
    }
    const repetido = await prisma.$queryRaw`
        SELECT idTipoRecargo FROM tipo_recargo WHERE nombre = ${titulo.slice(0, 80)} LIMIT 1
    `;
    if (repetido.length) {
        throw errorDatos("Ya existe un recargo con ese nombre");
    }
    await prisma.$executeRaw`
        INSERT INTO tipo_recargo (nombre, monto, estado)
        VALUES (${titulo.slice(0, 80)}, ${valor}, 1)
    `;
    const filas = await prisma.$queryRaw`
        SELECT idTipoRecargo, nombre, monto, estado
        FROM tipo_recargo
        WHERE nombre = ${titulo.slice(0, 80)}
        LIMIT 1
    `;
    return mapearTipoRecargo(filas[0]);
};

export const editarTipoRecargo = async (id, { nombre, monto, estado }) => {
    await asegurarTiposRecargo();
    const idTipo = Number(id);
    if (!Number.isInteger(idTipo) || idTipo <= 0) {
        throw errorDatos("El recargo no es válido");
    }
    const titulo = String(nombre || "").trim();
    const valor = Number(monto);
    if (titulo.length < 2) {
        throw errorDatos("El recargo necesita un nombre");
    }
    if (!Number.isFinite(valor) || valor <= 0) {
        throw errorDatos("El valor del recargo debe ser mayor a 0");
    }
    const activo = estado === false || estado === 0 || estado === "0" || estado === "false" ? 0 : 1;
    await prisma.$executeRaw`
        UPDATE tipo_recargo
        SET nombre = ${titulo.slice(0, 80)}, monto = ${valor}, estado = ${activo}
        WHERE idTipoRecargo = ${idTipo}
    `;
    const filas = await prisma.$queryRaw`
        SELECT idTipoRecargo, nombre, monto, estado
        FROM tipo_recargo
        WHERE idTipoRecargo = ${idTipo}
        LIMIT 1
    `;
    if (!filas[0]) {
        const error = new Error("El recargo no existe");
        error.status = 404;
        throw error;
    }
    return mapearTipoRecargo(filas[0]);
};

export const obtenerRegiones = async () => {
    return prisma.region.findMany({
        where: {
            estado: true
        },
        include: {
            comuna: {
                where: {
                    estado: true
                },
                orderBy: {
                    nombreComuna: "asc"
                }
            }
        },
        orderBy: {
            nombreRegion: "asc"
        }
    });
};

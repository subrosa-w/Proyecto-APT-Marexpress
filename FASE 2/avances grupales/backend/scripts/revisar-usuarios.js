import prisma from "../src/config/prisma.js";

try {
    const usuarios = await prisma.usuario.findMany({
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            rut: true,
            correo: true,
            estado: true,
            idRol: true,
            password: true
        },
        orderBy: {
            idUsuario: "asc"
        }
    });

    const resultado = usuarios.map(u => ({
        idUsuario: u.idUsuario,
        nombre: `${u.nombre} ${u.apellido}`,
        rut: u.rut,
        correo: u.correo,
        estado: u.estado,
        idRol: u.idRol,
        passwordHash: u.password ? u.password.substring(0, 20) + "..." : null
    }));

    console.table(resultado);
} finally {
    await prisma.$disconnect();
}
import prisma from "../src/config/prisma.js";

const usuarios = await prisma.usuario.findMany({
    select: {
        idUsuario: true,
        nombre: true,
        apellido: true,
        correo: true,
        estado: true,
        rol: {
            select: {
                nombreRol: true
            }
        }
    }
});

console.table(usuarios);

await prisma.$disconnect();

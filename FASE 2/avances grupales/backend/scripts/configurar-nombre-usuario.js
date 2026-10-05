import prisma from "../src/config/prisma.js";

try {
    await prisma.usuario.update({
        where: {
            idUsuario: 1
        },
        data: {
            nombreUsuario: "admin"
        }
    });

    await prisma.$executeRawUnsafe(`
        ALTER TABLE usuario
        ADD CONSTRAINT uq_usuario_nombreUsuario UNIQUE (nombreUsuario)
    `);

    console.log("Usuario admin asignado y nombreUsuario protegido como UNIQUE");
} catch (error) {
    console.error(error);
} finally {
    await prisma.$disconnect();
}
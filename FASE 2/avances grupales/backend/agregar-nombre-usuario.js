import prisma from "./src/config/prisma.js";

try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE usuario
        ADD COLUMN nombreUsuario VARCHAR(50) NULL
    `);

    console.log("Campo nombreUsuario agregado correctamente");
} catch (error) {
    console.error(error);
} finally {
    await prisma.$disconnect();
}
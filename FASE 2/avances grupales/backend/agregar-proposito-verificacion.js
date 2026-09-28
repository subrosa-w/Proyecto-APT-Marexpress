import prisma from "./src/config/prisma.js";

try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE verificacion_acceso
        ADD COLUMN proposito VARCHAR(30) NOT NULL DEFAULT 'LOGIN'
        AFTER idUsuario
    `);

    console.log(
        "✅ Campo proposito agregado correctamente a verificacion_acceso."
    );
} catch (error) {
    if (
        error.message.includes("Duplicate column name") ||
        error.message.includes("proposito")
    ) {
        console.log(
            "ℹ️ El campo proposito ya existe en verificacion_acceso."
        );
    } else {
        console.error(
            "❌ Error al agregar el campo proposito:"
        );
        console.error(error.message);
    }
} finally {
    await prisma.$disconnect();
}
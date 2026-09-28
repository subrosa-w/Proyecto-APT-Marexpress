import prisma from "./src/config/prisma.js";

try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE verificacion_acceso
        ADD COLUMN challengeId VARCHAR(64) NULL AFTER proposito
    `);

    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX uq_verificacion_acceso_challenge
        ON verificacion_acceso (challengeId)
    `);

    console.log(
        "✅ challengeId agregado correctamente a verificacion_acceso."
    );
} catch (error) {
    console.error("❌ Error:");
    console.error(error.message);
} finally {
    await prisma.$disconnect();
}
import prisma from "./src/config/prisma.js";

try {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS verificacion_acceso (
            idVerificacion INT AUTO_INCREMENT PRIMARY KEY,
            idUsuario INT NOT NULL,
            codigoHash VARCHAR(255) NOT NULL,
            expiraEn DATETIME NOT NULL,
            intentos INT NOT NULL DEFAULT 0,
            usado BOOLEAN NOT NULL DEFAULT FALSE,
            fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
        )
    `);

    console.log("Tabla verificacion_acceso creada correctamente");
} catch (error) {
    console.error(error);
} finally {
    await prisma.$disconnect();
}
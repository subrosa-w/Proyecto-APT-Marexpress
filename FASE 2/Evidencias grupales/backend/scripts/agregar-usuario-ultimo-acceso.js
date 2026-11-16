import prisma from "../src/config/prisma.js";

// RF-04: guarda la fecha y hora del último inicio de sesión correcto del usuario.
const ejecutar = async (sql) => {
    try {
        await prisma.$executeRawUnsafe(sql);
        console.log("OK", sql.split("\n")[0]);
    } catch (error) {
        const texto = String(error.message || error);
        if (texto.toLowerCase().includes("duplicate") || texto.includes("1060")) {
            console.log("Ya existía");
            return;
        }
        throw error;
    }
};

await ejecutar("ALTER TABLE usuario ADD COLUMN ultimoAcceso DATETIME NULL");

console.log("Columna ultimoAcceso de usuario lista.");
await prisma.$disconnect();

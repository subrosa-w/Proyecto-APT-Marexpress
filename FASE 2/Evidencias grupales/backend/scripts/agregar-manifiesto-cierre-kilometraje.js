import prisma from "../src/config/prisma.js";

// RF-45: fecha en que el manifiesto queda FINALIZADO y kilometraje final del camión.
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

await ejecutar("ALTER TABLE manifiesto ADD COLUMN fechaCierre DATETIME NULL");
await ejecutar("ALTER TABLE manifiesto ADD COLUMN kilometrajeFinal INT NULL");

console.log("Columnas de cierre del manifiesto listas.");
await prisma.$disconnect();

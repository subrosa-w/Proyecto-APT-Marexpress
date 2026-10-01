import prisma from "../src/config/prisma.js";

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

await ejecutar("ALTER TABLE manifiesto ADD COLUMN fechaSalidaProgramada DATETIME NULL");
await ejecutar("ALTER TABLE manifiesto ADD COLUMN idComuna INT NULL");
await ejecutar(`
    ALTER TABLE manifiesto
    ADD CONSTRAINT fk_manifiesto_comuna
    FOREIGN KEY (idComuna) REFERENCES comuna(idComuna)
`);

console.log("Columnas de manifiesto listas.");
await prisma.$disconnect();

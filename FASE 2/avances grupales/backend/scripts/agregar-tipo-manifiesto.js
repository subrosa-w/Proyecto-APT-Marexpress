import crypto from "crypto";
import fs from "fs";
import prisma from "../src/config/prisma.js";

const ejecutar = async (sql) => {
    try {
        await prisma.$executeRawUnsafe(sql);
        console.log("OK");
    } catch (error) {
        const texto = String(error.message || error);
        if (texto.toLowerCase().includes("duplicate") || texto.includes("1060")) {
            console.log("Ya existía");
            return;
        }
        throw error;
    }
};

await ejecutar("ALTER TABLE manifiesto ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'REPARTO'");
try {
    await prisma.$executeRawUnsafe("ALTER TABLE bulto DROP CONSTRAINT chk_bulto_estado");
} catch (error) {
    console.log("Check de bulto no se pudo quitar", error.message?.slice(0, 120));
}
await ejecutar(`
    ALTER TABLE bulto
    ADD CONSTRAINT chk_bulto_estado
    CHECK (estado IN ('EN_BODEGA','ASIGNADO_MANIFIESTO','EN_TRANSITO','EN_TRASLADO','EN_REPARTO','ENTREGADO','RECHAZADO','DEVUELTO'))
`);

const envPath = new URL("../.env", import.meta.url);
const env = fs.readFileSync(envPath, "utf8");
if (!env.includes("COMPROBANTE_CLAVE=")) {
    fs.appendFileSync(envPath, `\nCOMPROBANTE_CLAVE=${crypto.randomBytes(32).toString("hex")}\n`);
    console.log("Clave de comprobantes creada");
} else {
    console.log("Clave de comprobantes ya estaba");
}

await prisma.$disconnect();

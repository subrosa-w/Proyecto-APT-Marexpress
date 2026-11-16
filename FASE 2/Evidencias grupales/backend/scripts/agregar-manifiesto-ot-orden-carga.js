import prisma from "../src/config/prisma.js";

// RF-41: número de orden en que cada OT se cargó al manifiesto.
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

await ejecutar("ALTER TABLE manifiesto_ot ADD COLUMN ordenCarga INT NULL");

// Relleno de los manifiestos que ya existían: se numeran según el orden en que se asignaron.
// Solo toca las filas sin número, así que se puede correr más de una vez sin renumerar nada.
const rellenadas = await prisma.$executeRawUnsafe(`
    UPDATE manifiesto_ot mo
    INNER JOIN (
        SELECT
            idManifiestoOT,
            ROW_NUMBER() OVER (
                PARTITION BY idManifiesto
                ORDER BY fechaAsignacion, idManifiestoOT
            ) AS posicion
        FROM manifiesto_ot
        WHERE ordenCarga IS NULL
    ) pendientes ON pendientes.idManifiestoOT = mo.idManifiestoOT
    INNER JOIN (
        SELECT idManifiesto, COALESCE(MAX(ordenCarga), 0) AS mayor
        FROM manifiesto_ot
        GROUP BY idManifiesto
    ) base ON base.idManifiesto = mo.idManifiesto
    SET mo.ordenCarga = base.mayor + pendientes.posicion
    WHERE mo.ordenCarga IS NULL
`);

console.log(`Columna ordenCarga lista. Filas rellenadas: ${rellenadas}.`);
await prisma.$disconnect();

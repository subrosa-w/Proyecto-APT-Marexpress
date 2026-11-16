import prisma from "../src/config/prisma.js";

try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE cliente
        ADD COLUMN idTarifa INT NULL
    `);
} catch (error) {
    if (!String(error.message).includes("Duplicate column")) {
        throw error;
    }
}

try {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE cliente
        ADD CONSTRAINT fk_cliente_tarifa
        FOREIGN KEY (idTarifa) REFERENCES tarifa(idTarifa)
    `);
} catch (error) {
    if (!String(error.message).toLowerCase().includes("duplicate")) {
        console.warn(error.message);
    }
}

const primera = await prisma.tarifa.findFirst({
    where: { estado: true },
    orderBy: { idTarifa: "asc" }
});

if (primera) {
    await prisma.cliente.updateMany({
        where: { idTarifa: null },
        data: { idTarifa: primera.idTarifa }
    });
}

console.log("Columna idTarifa lista en cliente.");
await prisma.$disconnect();

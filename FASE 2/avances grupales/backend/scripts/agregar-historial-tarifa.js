import prisma from "../src/config/prisma.js";

const intentar = async (sql) => {
    try {
        await prisma.$executeRawUnsafe(sql);
    } catch (error) {
        const texto = String(error.message || error).toLowerCase();
        if (texto.includes("duplicate") || texto.includes("1060") || texto.includes("already")) {
            return;
        }
        throw error;
    }
};

await intentar("ALTER TABLE tarifa ADD COLUMN valorRetiroMediano DECIMAL(10,2) NOT NULL DEFAULT 0");
await intentar("ALTER TABLE tarifa ADD COLUMN valorRetiroGrande DECIMAL(10,2) NOT NULL DEFAULT 0");

await intentar(`
    CREATE TABLE IF NOT EXISTS historial_tarifa (
        idHistorial INT NOT NULL AUTO_INCREMENT,
        idTarifa INT NOT NULL,
        idUsuario INT NULL,
        tipoCambio VARCHAR(40) NOT NULL,
        campo VARCHAR(80) NULL,
        valorAnterior TEXT NULL,
        valorNuevo TEXT NULL,
        variacionPct DECIMAL(10,2) NULL,
        fechaCambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (idHistorial),
        CONSTRAINT fk_historial_tarifa_tarifa FOREIGN KEY (idTarifa) REFERENCES tarifa(idTarifa),
        CONSTRAINT fk_historial_tarifa_usuario FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
    )
`);

await prisma.tarifa.updateMany({
    where: { nombreTarifa: { contains: "Puerto Montt" } },
    data: { valorRetiro: 30000, valorRetiroMediano: 60000, valorRetiroGrande: 120000 }
});
await prisma.tarifa.updateMany({
    where: { nombreTarifa: { contains: "Chilo" } },
    data: { valorRetiro: 30000, valorRetiroMediano: 60000, valorRetiroGrande: 120000 }
});

console.log("Historial y retiros de tarifario listos.");
await prisma.$disconnect();

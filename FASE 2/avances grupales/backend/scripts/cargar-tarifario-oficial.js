import prisma from "../src/config/prisma.js";
import {
    NOMBRE_TARIFA_CHILOE,
    NOMBRE_TARIFA_PM,
    RETIRO_OFICIAL
} from "../src/modules/tarifas/tarifaOficial.js";

const TRAMOS_PM = [
    [0.01, 10, 8000, null],
    [10.1, 20, 10000, null],
    [20.01, 30, 12000, null],
    [30.01, 40, 14000, null],
    [40.01, 50, 16000, null],
    [50.01, 60, 18000, null],
    [60.01, 70, 20000, null],
    [70.01, 80, 22000, null],
    [80.01, 90, 24000, null],
    [90.01, 100, 26000, null],
    [100.01, 200, 30000, null],
    [200.1, 99999, null, 155]
];

const TRAMOS_CHILOE = [
    [0.01, 10, 10000, null],
    [10.1, 20, 12500, null],
    [20.01, 30, 15000, null],
    [30.01, 40, 17500, null],
    [40.01, 50, 20000, null],
    [50.01, 60, 22500, null],
    [60.01, 70, 25000, null],
    [70.01, 80, 27500, null],
    [80.01, 90, 30000, null],
    [90.01, 100, 32500, null],
    [100.01, 200, 37500, null],
    [200.1, 99999, null, 215]
];

await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS tarifa_tramo (
        idTarifaTramo INT NOT NULL AUTO_INCREMENT,
        idTarifa INT NOT NULL,
        kgDesde DECIMAL(10,2) NOT NULL,
        kgHasta DECIMAL(10,2) NOT NULL,
        valorFijo DECIMAL(10,2) NULL,
        valorKg DECIMAL(10,2) NULL,
        PRIMARY KEY (idTarifaTramo),
        CONSTRAINT fk_tarifa_tramo_tarifa
            FOREIGN KEY (idTarifa) REFERENCES tarifa(idTarifa)
    )
`);

let tipo = await prisma.tipo_tarifa.findFirst({ orderBy: { idTipoTarifa: "asc" } });
if (!tipo) {
    tipo = await prisma.tipo_tarifa.create({
        data: { nombreTipoTarifa: "GENERAL", descripcion: "Tarifario general" }
    });
}

const upsertTarifa = async (nombre, valorKg, valorM3, tramos) => {
    let tarifa = await prisma.tarifa.findFirst({
        where: { nombreTarifa: nombre }
    });
    const data = {
        nombreTarifa: nombre,
        valorBase: 0,
        valorKg,
        valorM3,
        valorRetiro: RETIRO_OFICIAL.PEQUENO,
        valorZonaUrbana: 0,
        valorZonaLejana: 0,
        idTipoTarifa: tipo.idTipoTarifa,
        estado: true
    };
    if (tarifa) {
        tarifa = await prisma.tarifa.update({
            where: { idTarifa: tarifa.idTarifa },
            data
        });
        await prisma.tarifa_tramo.deleteMany({ where: { idTarifa: tarifa.idTarifa } });
    } else {
        tarifa = await prisma.tarifa.create({ data });
    }
    await prisma.tarifa_tramo.createMany({
        data: tramos.map(([kgDesde, kgHasta, valorFijo, valorKgTramo]) => ({
            idTarifa: tarifa.idTarifa,
            kgDesde,
            kgHasta,
            valorFijo,
            valorKg: valorKgTramo
        }))
    });
    return tarifa;
};

const tarifaPm = await upsertTarifa(NOMBRE_TARIFA_PM, 155, 38000, TRAMOS_PM);
await upsertTarifa(NOMBRE_TARIFA_CHILOE, 215, 48000, TRAMOS_CHILOE);

const actualizados = await prisma.cliente.updateMany({
    data: { idTarifa: tarifaPm.idTarifa }
});

console.log({
    tarifaPm: tarifaPm.idTarifa,
    clientesActualizados: actualizados.count
});

await prisma.$disconnect();

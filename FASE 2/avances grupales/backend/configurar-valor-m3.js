import prisma from "./src/config/prisma.js";

const tarifa = await prisma.tarifa.update({
    where: {
        idTarifa: 1
    },
    data: {
        valorM3: 80000
    }
});

console.log({
    idTarifa: tarifa.idTarifa,
    valorKg: tarifa.valorKg?.toString(),
    valorM3: tarifa.valorM3?.toString()
});

await prisma.$disconnect();

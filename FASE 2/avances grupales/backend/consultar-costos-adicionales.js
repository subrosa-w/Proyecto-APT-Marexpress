import prisma from "./src/config/prisma.js";

const recargos = await prisma.recargo.findMany({
    orderBy: { idRecargo: "asc" }
});

const retiros = await prisma.retiro.findMany({
    orderBy: { idRetiro: "asc" }
});

console.log("RECARGOS:");
console.dir(recargos, { depth: null });

console.log("\nRETIROS:");
console.dir(retiros, { depth: null });

await prisma.$disconnect();

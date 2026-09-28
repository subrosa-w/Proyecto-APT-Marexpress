import prisma from "./src/config/prisma.js";

try {
    const roles = await prisma.rol.findMany({
        select: {
            idRol: true,
            nombreRol: true,
            descripcion: true
        },
        orderBy: {
            idRol: "asc"
        }
    });

    console.table(roles);
} finally {
    await prisma.$disconnect();
}
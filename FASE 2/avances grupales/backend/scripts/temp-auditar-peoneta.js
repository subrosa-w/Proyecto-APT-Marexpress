import prisma from "../src/config/prisma.js";

const main = async () => {
    const peonetas = await prisma.usuario.findMany({
        where: {
            rol: {
                nombreRol: "PEONETA"
            }
        },
        select: {
            idUsuario: true,
            nombreUsuario: true,
            correo: true,
            estado: true,
            rol: {
                select: {
                    nombreRol: true
                }
            }
        }
    });

    const manifiestos = await prisma.manifiesto.findMany({
        select: {
            idManifiesto: true,
            numeroManifiesto: true,
            fechaSalida: true,
            estado: true
        },
        orderBy: {
            idManifiesto: "asc"
        }
    });

    const asignaciones = await prisma.manifiesto_usuario.findMany({
        select: {
            idManifiestoUsuario: true,
            idManifiesto: true,
            idUsuario: true,
            fechaAsignacion: true,
            usuario: {
                select: {
                    nombreUsuario: true,
                    rol: {
                        select: {
                            nombreRol: true
                        }
                    }
                }
            },
            manifiesto: {
                select: {
                    numeroManifiesto: true
                }
            }
        },
        orderBy: {
            idManifiestoUsuario: "asc"
        }
    });

    console.log("\n=== USUARIOS PEONETA ===");
    console.dir(peonetas, { depth: null });

    console.log("\n=== MANIFIESTOS ===");
    console.dir(manifiestos, { depth: null });

    console.log("\n=== ASIGNACIONES MANIFIESTO_USUARIO ===");
    console.dir(asignaciones, { depth: null });
};

main()
    .catch((error) => {
        console.error("Error:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
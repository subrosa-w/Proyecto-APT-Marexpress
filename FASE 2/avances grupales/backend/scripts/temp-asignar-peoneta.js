import prisma from "../src/config/prisma.js";

const main = async () => {
    const idUsuario = 2;
    const numeroManifiesto = "MAN-000004";

    /*
     * Buscar el PEONETA.
     */
    const peoneta = await prisma.usuario.findFirst({
        where: {
            idUsuario,
            estado: true,
            rol: {
                nombreRol: "PEONETA"
            }
        },
        select: {
            idUsuario: true,
            nombreUsuario: true,
            rol: {
                select: {
                    nombreRol: true
                }
            }
        }
    });

    if (!peoneta) {
        throw new Error(
            "El usuario no existe, está inactivo o no tiene rol PEONETA"
        );
    }

    /*
     * Buscar el manifiesto.
     */
    const manifiesto = await prisma.manifiesto.findFirst({
        where: {
            numeroManifiesto
        },
        select: {
            idManifiesto: true,
            numeroManifiesto: true,
            estado: true
        }
    });

    if (!manifiesto) {
        throw new Error(
            "El manifiesto indicado no existe"
        );
    }

    /*
     * Para esta prueba solo asignaremos un manifiesto
     * que esté en PREPARACION.
     */
    if (manifiesto.estado !== "PREPARACION") {
        throw new Error(
            "El manifiesto no está en estado PREPARACION"
        );
    }

    /*
     * Comprobar si esta asignación ya existe.
     */
    const asignacionExistente =
        await prisma.manifiesto_usuario.findFirst({
            where: {
                idManifiesto:
                    manifiesto.idManifiesto,
                idUsuario:
                    peoneta.idUsuario
            },
            select: {
                idManifiestoUsuario: true,
                fechaAsignacion: true
            }
        });

    if (asignacionExistente) {
        console.log(
            "\n=== ASIGNACION YA EXISTENTE ==="
        );

        console.dir(
            asignacionExistente,
            { depth: null }
        );

        return;
    }

    /*
     * Crear la asignación.
     *
     * No modificamos la OT ni el manifiesto.
     * Solamente vinculamos el PEONETA al manifiesto.
     */
    const asignacion =
        await prisma.manifiesto_usuario.create({
            data: {
                idManifiesto:
                    manifiesto.idManifiesto,

                idUsuario:
                    peoneta.idUsuario
            },
            select: {
                idManifiestoUsuario: true,
                fechaAsignacion: true,

                usuario: {
                    select: {
                        idUsuario: true,
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
                        idManifiesto: true,
                        numeroManifiesto: true,
                        estado: true
                    }
                }
            }
        });

    console.log(
        "\n=== PEONETA ASIGNADO ==="
    );

    console.dir(
        asignacion,
        { depth: null }
    );
};

main()
    .catch((error) => {
        console.error(
            "\nError:",
            error.message
        );

        process.exitCode = 1;
    })

    .finally(async () => {
        await prisma.$disconnect();
    });
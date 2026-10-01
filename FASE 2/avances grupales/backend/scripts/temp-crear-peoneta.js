import prisma from "../src/config/prisma.js";

const main = async () => {
    const idUsuarioPeoneta = 2;

    /*
     * IMPORTANTE:
     * Cambia este correo por tu correo universitario real.
     */
    const nuevoCorreo = "ra.roa@duocuc.cl";

    /*
     * Verificar que el usuario exista
     * y que realmente sea PEONETA.
     */
    const peoneta = await prisma.usuario.findFirst({
        where: {
            idUsuario: idUsuarioPeoneta,
            rol: {
                nombreRol: "PEONETA"
            }
        },
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            nombreUsuario: true,
            correo: true,
            rol: {
                select: {
                    nombreRol: true
                }
            }
        }
    });

    if (!peoneta) {
        throw new Error(
            "No existe el usuario PEONETA indicado"
        );
    }

    /*
     * Verificar que el nuevo correo
     * no pertenezca a otro usuario.
     */
    const correoEnUso = await prisma.usuario.findFirst({
        where: {
            correo: "ra.roa@duocuc.cl",
            NOT: {
                idUsuario: idUsuarioPeoneta
            }
        },
        select: {
            idUsuario: true,
            nombreUsuario: true,
            correo: true
        }
    });

    if (correoEnUso) {
        throw new Error(
            "El correo indicado ya pertenece a otro usuario"
        );
    }

    /*
     * Actualizar únicamente el correo.
     */
    const actualizado = await prisma.usuario.update({
        where: {
            idUsuario: idUsuarioPeoneta
        },
        data: {
            correo: "ra.roa@duocuc.cl"
        },
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
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

    console.log(
        "\n=== CORREO PEONETA ACTUALIZADO ==="
    );

    console.dir(
        actualizado,
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
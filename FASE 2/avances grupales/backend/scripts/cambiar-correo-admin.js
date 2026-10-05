import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import prisma from "../src/config/prisma.js";

const rl = readline.createInterface({
    input,
    output
});

try {
    const correo = (
        await rl.question(
            "Ingresa el nuevo correo del administrador: "
        )
    )
        .trim()
        .toLowerCase();

    const formatoCorreo =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(correo)) {
        throw new Error(
            "El correo ingresado no es válido"
        );
    }

    const correoEnUso =
        await prisma.usuario.findFirst({
            where: {
                correo,
                NOT: {
                    idUsuario: 1
                }
            },
            select: {
                idUsuario: true
            }
        });

    if (correoEnUso) {
        throw new Error(
            "Ese correo ya está asociado a otro usuario"
        );
    }

    await prisma.usuario.update({
        where: {
            idUsuario: 1
        },
        data: {
            correo
        }
    });

    console.log(
        "✅ Correo del administrador actualizado correctamente."
    );

} catch (error) {
    console.error(
        "❌",
        error.message
    );
} finally {
    rl.close();
    await prisma.$disconnect();
}
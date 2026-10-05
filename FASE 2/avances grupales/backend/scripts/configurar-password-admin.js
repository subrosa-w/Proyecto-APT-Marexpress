import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

try {
    const password = await rl.question("Nueva contraseña del administrador: ");

    const passwordValida =
        password.length >= 10 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

    if (!passwordValida) {
        console.log("La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial.");
        process.exitCode = 1;
    } else {
        const hash = await bcrypt.hash(password, 12);

        await prisma.usuario.update({
            where: {
                idUsuario: 1
            },
            data: {
                password: hash
            }
        });

        console.log("Contraseña del administrador hasheada correctamente.");
    }
} finally {
    rl.close();
    await prisma.$disconnect();
}
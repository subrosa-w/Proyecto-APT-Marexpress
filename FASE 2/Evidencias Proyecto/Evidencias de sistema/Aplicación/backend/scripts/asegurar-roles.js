import { asegurarRoles } from "../src/modules/maestros/maestros.service.js";
import prisma from "../src/config/prisma.js";

const roles = await asegurarRoles();
console.log(roles.map((rol) => rol.nombreRol).join(", "));
await prisma.$disconnect();

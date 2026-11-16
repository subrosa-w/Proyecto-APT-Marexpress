import crypto from "crypto";
import fs from "fs";
import path from "path";

const carpeta = path.resolve("storage/comprobantes");
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const TOPE = 2 * 1024 * 1024;

const clave = () => {
    const texto = String(process.env.COMPROBANTE_CLAVE || "").trim();
    if (!/^[a-f0-9]{64}$/i.test(texto)) {
        const error = new Error("Falta la clave para guardar comprobantes");
        error.status = 500;
        throw error;
    }
    return Buffer.from(texto, "hex");
};

export const guardarComprobante = ({ datos, tipo }) => {
    const mime = String(tipo || "").toLowerCase();
    if (!TIPOS.has(mime)) {
        const error = new Error("El comprobante debe ser una foto JPG, PNG, WEBP o un PDF");
        error.status = 400;
        throw error;
    }
    const limpio = String(datos || "").replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(limpio, "base64");
    if (!buffer.length || buffer.length > TOPE) {
        const error = new Error("El comprobante debe pesar menos de 2 MB");
        error.status = 400;
        throw error;
    }
    const iv = crypto.randomBytes(12);
    const cifrador = crypto.createCipheriv("aes-256-gcm", clave(), iv);
    const cifrado = Buffer.concat([cifrador.update(buffer), cifrador.final()]);
    const nombre = crypto.randomBytes(16).toString("hex");
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(path.join(carpeta, nombre), Buffer.concat([iv, cifrador.getAuthTag(), cifrado]));
    return `${nombre}|${mime}`;
};

export const leerComprobante = (referencia) => {
    const [nombre, mime] = String(referencia || "").split("|");
    if (!/^[a-f0-9]{32}$/i.test(nombre || "") || !TIPOS.has(mime)) {
        const error = new Error("El comprobante no está disponible");
        error.status = 404;
        throw error;
    }
    const archivo = path.join(carpeta, nombre);
    if (!fs.existsSync(archivo)) {
        const error = new Error("El comprobante no está disponible");
        error.status = 404;
        throw error;
    }
    const raw = fs.readFileSync(archivo);
    const iv = raw.subarray(0, 12);
    const etiqueta = raw.subarray(12, 28);
    const cifrado = raw.subarray(28);
    const descifrador = crypto.createDecipheriv("aes-256-gcm", clave(), iv);
    descifrador.setAuthTag(etiqueta);
    return {
        mime,
        buffer: Buffer.concat([descifrador.update(cifrado), descifrador.final()])
    };
};

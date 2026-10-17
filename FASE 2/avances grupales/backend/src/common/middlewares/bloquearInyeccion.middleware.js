import { registrarAlertaSeguridad } from "../../modules/alertas/alertas.service.js";

const patrones = [
    /\bunion\b[\s\S]{0,40}\bselect\b/i,
    /\bdrop\b\s+\b(table|database)\b/i,
    /\binsert\b\s+\binto\b/i,
    /\bdelete\b\s+\bfrom\b/i,
    /\bupdate\b\s+\w+\s+\bset\b/i,
    /\binformation_schema\b/i,
    /\b(sleep|benchmark|pg_sleep)\s*\(/i,
    /\bxp_\w+/i,
    /('\s*or\s+'|"\s*or\s+")/i,
    /\bor\b\s+\d+\s*=\s*\d+/i,
    /;\s*(drop|delete|insert|update|select)\b/i,
    /\/\*|\*\//
];

const camposSensibles = ["password", "clave", "token", "codigo", "authorization", "confirmarpassword"];

const ipDe = (req) => {
    const directa = req.socket?.remoteAddress || req.ip || "desconocida";
    const informada = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (informada && informada !== directa) {
        return `${directa} (cabecera ${informada})`;
    }
    return directa;
};

const revisarValor = (valor, campo, profundidad) => {
    if (profundidad > 6 || valor == null) {
        return null;
    }
    if (typeof valor === "string") {
        const texto = valor.slice(0, 2000);
        if (patrones.some((patron) => patron.test(texto))) {
            return campo || "dato";
        }
        return null;
    }
    if (Array.isArray(valor)) {
        for (const item of valor.slice(0, 40)) {
            const hallazgo = revisarValor(item, campo, profundidad + 1);
            if (hallazgo) {
                return hallazgo;
            }
        }
        return null;
    }
    if (typeof valor === "object") {
        for (const [clave, item] of Object.entries(valor)) {
            const hallazgo = revisarValor(item, clave, profundidad + 1);
            if (hallazgo) {
                return hallazgo;
            }
        }
    }
    return null;
};

export const bloquearInyeccion = async (req, res, next) => {
    const campo = revisarValor(req.body, "body", 0)
        || revisarValor(req.query, "query", 0)
        || revisarValor(req.params, "params", 0);

    if (!campo) {
        return next();
    }

    const ruta = `${req.method} ${req.originalUrl}`;
    const ip = ipDe(req);
    const visible = camposSensibles.includes(String(campo).toLowerCase())
        ? "dato sensible"
        : campo;

    try {
        await registrarAlertaSeguridad({ ip, ruta, campo: visible });
    } catch (error) {
        console.error("No se pudo guardar la alerta de intrusión:", error);
    }

    console.error(`Intento de intrusión bloqueado. IP ${ip}. Ruta ${ruta}. Campo ${visible}.`);

    return res.status(400).json({
        mensaje: "La solicitud contiene texto no permitido y fue bloqueada.",
        ruta
    });
};

import { bandejaSeguimiento } from "../../utils.js";

// Texto amigable para el cliente de cada estado de OT que maneja el backend
const textos = {
    REGISTRADA: "Registrada",
    EN_ORIGEN: "En origen",
    RECEPCIONADA: "Recepcionada",
    EN_BODEGA: "En bodega",
    EN_TRANSITO: "En tránsito",
    EN_RUTA: "En ruta de entrega",
    DESPACHADA: "Despachada",
    ENTREGADA: "Entregada",
    ENTREGADO: "Entregada",
    DEVOLUCION_SOLICITADA: "Devolución pedida",
    DEVUELTA: "Devuelta al cliente",
    RECHAZADA: "Rechazada",
    ANULADA: "Anulada",
    CANCELADA: "Anulada"
};

export const estadoDe = (orden) => String(orden?.estado_ot?.nombreEstado || "").toUpperCase();

export const textoEstadoOt = (estado) => {
    const clave = String(estado || "").toUpperCase();
    if (textos[clave]) {
        return textos[clave];
    }
    const texto = clave.replace(/_/g, " ").toLowerCase();
    return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "Sin estado";
};

// Historial = OT terminadas: entregadas, anuladas o devueltas al cliente.
export const esHistorial = (orden) =>
    estadoDe(orden) === "DEVUELTA"
    || ["entregadas", "anulada"].includes(bandejaSeguimiento(orden));

// Colores de la insignia según la bandeja de la OT
export const tonoEstado = (orden) => {
    const bandeja = bandejaSeguimiento(orden);
    if (bandeja === "entregadas") return "border-green-200 bg-green-50 text-green-700";
    if (bandeja === "anulada") return "border-slate-200 bg-slate-100 text-slate-500";
    if (bandeja === "rechazadas") return "border-red-200 bg-red-50 text-red-700";
    if (bandeja === "enCurso") return "border-blue-200 bg-blue-50 text-blue-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
};

export const estadoPagoDe = (orden) => String(orden?.pago?.[0]?.estadoPago || "").toUpperCase();

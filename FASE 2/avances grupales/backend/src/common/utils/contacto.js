// Teléfono guardado como +56912345678, sin espacios.
// El prefijo más largo va primero para no confundir +569 con +56.
export const PREFIJOS_TELEFONO = ["+569", "+598", "+595", "+593", "+591", "+57", "+56", "+54", "+51"];

export const normalizarTelefono = (valor) => {
    const compacto = String(valor || "").replace(/[\s()-]/g, "");
    if (!compacto) {
        return null;
    }
    if (!/^\+\d{8,15}$/.test(compacto)) {
        return "";
    }
    const conocido = PREFIJOS_TELEFONO.some((prefijo) => compacto.startsWith(prefijo));
    return conocido ? compacto : "";
};

export const correoValido = (valor) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || "").trim());

// Teléfono guardado como +56912345678, sin espacios.
// El prefijo más largo va primero para no confundir +569 con +56.
export const PREFIJOS_TELEFONO = ["+569", "+598", "+595", "+593", "+591", "+57", "+56", "+54", "+51"];

// Números chilenos guardados sin código: 912345678 o 56912345678 pasan a +56912345678.
const completarCodigoChile = (compacto) => {
    if (/^\d{9}$/.test(compacto)) {
        return `+56${compacto}`;
    }
    if (/^56\d{9}$/.test(compacto)) {
        return `+${compacto}`;
    }
    return compacto;
};

export const normalizarTelefono = (valor) => {
    const compacto = completarCodigoChile(String(valor || "").replace(/[\s()-]/g, ""));
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

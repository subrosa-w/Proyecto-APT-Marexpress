export const validarRut = (rut) => {
    if (typeof rut !== "string") return false;

    const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

    if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
        return false;
    }

    const cuerpo = rutLimpio.slice(0, -1);
    const dvIngresado = rutLimpio.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);

    let dvCalculado;

    if (resto === 11) {
        dvCalculado = "0";
    } else if (resto === 10) {
        dvCalculado = "K";
    } else {
        dvCalculado = String(resto);
    }

    return dvIngresado === dvCalculado;
};

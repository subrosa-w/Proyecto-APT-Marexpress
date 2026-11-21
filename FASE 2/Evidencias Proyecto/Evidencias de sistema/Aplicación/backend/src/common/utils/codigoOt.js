export const candidatosCodigo = (codigo) => {
    const texto = String(codigo || "").trim().toUpperCase().replace(/\s+/g, "");
    const lista = [];
    const agregar = (valor) => {
        if (valor && !lista.includes(valor)) {
            lista.push(valor);
        }
    };

    agregar(texto);
    const cuerpo = texto.replace(/^OT-/, "");

    if (/^\d+$/.test(cuerpo)) {
        agregar(`OT-${cuerpo.padStart(6, "0")}`);
    }

    const bulto = cuerpo.match(/^(\d+)-(\d+)$/);
    if (bulto) {
        agregar(`OT-${bulto[1].padStart(6, "0")}-${bulto[2].padStart(3, "0")}`);
    }

    return lista;
};

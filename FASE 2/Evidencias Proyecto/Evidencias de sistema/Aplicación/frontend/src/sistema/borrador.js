const claveDe = (nombre) => `marexpress_borrador_${nombre}`;

export const leerBorrador = (nombre) => {
    try {
        const texto = sessionStorage.getItem(claveDe(nombre));
        return texto ? JSON.parse(texto) : null;
    } catch {
        return null;
    }
};

export const guardarBorrador = (nombre, valor) => {
    try {
        sessionStorage.setItem(claveDe(nombre), JSON.stringify(valor));
    } catch {
        /* el navegador puede rechazar el guardado si está lleno */
    }
};

export const borrarBorrador = (nombre) => {
    sessionStorage.removeItem(claveDe(nombre));
};

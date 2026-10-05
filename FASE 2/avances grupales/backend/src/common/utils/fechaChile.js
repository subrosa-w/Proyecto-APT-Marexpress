const ZONA_HORARIA_CHILE = "America/Santiago";

export const formatearFechaHoraChile = (fecha) => {
    if (!fecha) {
        return null;
    }

    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA_CHILE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).formatToParts(new Date(fecha));

    const valores = {};

    for (const parte of partes) {
        if (parte.type !== "literal") {
            valores[parte.type] = parte.value;
        }
    }

    return `${valores.year}-${valores.month}-${valores.day} ${valores.hour}:${valores.minute}:${valores.second}`;
};

export const fechaHoraChileISO = (fecha) => {
    if (!fecha) {
        return null;
    }

    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA_CHILE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).formatToParts(new Date(fecha));

    const valores = {};

    for (const parte of partes) {
        if (parte.type !== "literal") {
            valores[parte.type] = parte.value;
        }
    }

    return `${valores.year}-${valores.month}-${valores.day}T${valores.hour}:${valores.minute}:${valores.second}`;
};

export const fechaHoyChile = () => {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA_CHILE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const valores = {};

    for (const parte of partes) {
        if (parte.type !== "literal") {
            valores[parte.type] = parte.value;
        }
    }

    return new Date(`${valores.year}-${valores.month}-${valores.day}T12:00:00`);
};
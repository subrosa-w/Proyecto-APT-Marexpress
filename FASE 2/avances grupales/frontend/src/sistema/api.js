const API_BASE = "/api";

export async function api(ruta, opciones = {}) {
    const token = sessionStorage.getItem("marexpress_token");
    const encabezados = {
        ...(opciones.body ? { "Content-Type": "application/json" } : {}),
        ...(opciones.headers || {})
    };

    if (token) {
        encabezados.Authorization = `Bearer ${token}`;
    }

    const respuesta = await fetch(`${API_BASE}${ruta}`, {
        ...opciones,
        headers: encabezados
    });

    let datos = null;
    const texto = await respuesta.text();

    if (texto) {
        try {
            datos = JSON.parse(texto);
        } catch {
            datos = { mensaje: texto };
        }
    }

    if (!respuesta.ok) {
        if (
            respuesta.status === 401 &&
            !ruta.startsWith("/auth/")
        ) {
            sessionStorage.removeItem("marexpress_token");
            sessionStorage.removeItem("marexpress_usuario");
            if (window.location.pathname !== "/acceso") {
                window.location.assign("/acceso");
            }
        }

        let mensaje = datos?.mensaje || "No fue posible completar la solicitud";
        if (typeof mensaje === "string" && mensaje.includes("<pre>")) {
            const coincidencia = mensaje.match(/Cannot\s+\w+\s+[^<]+/i);
            mensaje = coincidencia
                ? "El servidor no tiene actualizada esa acción. Reinicia el backend y recarga."
                : "No fue posible completar la solicitud";
        }

        const error = new Error(mensaje);
        error.status = respuesta.status;
        error.datos = datos;
        throw error;
    }

    return datos;
}

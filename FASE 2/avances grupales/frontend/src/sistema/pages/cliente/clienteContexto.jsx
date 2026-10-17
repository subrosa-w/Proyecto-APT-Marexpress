import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { obtenerPerfil } from "./clienteDatos.js";

/*
  Contexto del portal cliente: carga el perfil de la empresa del usuario
  y decide qué tipo de cliente es.
  - Cliente normal: sin cuenta corriente → ve sus órdenes y su historial.
  - Cliente con cuenta corriente → además paga pendientes, cotiza y ve sus cotizaciones.
*/

const ClienteContext = createContext(null);

export function ClienteProvider({ children }) {
    const [version, setVersion] = useState(0);
    const [estado, setEstado] = useState({ version: -1, perfil: null, error: "" });

    useEffect(() => {
        let vigente = true;
        obtenerPerfil()
            .then((perfil) => vigente && setEstado({ version, perfil, error: "" }))
            .catch((error) => vigente && setEstado({ version, perfil: null, error: error.message }));
        return () => {
            vigente = false;
        };
    }, [version]);

    // Vuelve a pedir el perfil (por ejemplo, después de pagar: cambia el crédito disponible)
    const recargarPerfil = useCallback(() => setVersion((v) => v + 1), []);

    const cuenta = estado.perfil?.cuentaCorriente || null;

    const valor = {
        // Solo la primera carga bloquea el portal; al recargar se mantiene lo anterior
        cargando: estado.version === -1,
        error: estado.error,
        perfil: estado.perfil,
        cliente: estado.perfil?.cliente || null,
        cuentaCorriente: cuenta,
        tieneCuentaCorriente: Boolean(cuenta?.estado),
        recargarPerfil
    };

    return <ClienteContext.Provider value={valor}>{children}</ClienteContext.Provider>;
}

export function useCliente() {
    const contexto = useContext(ClienteContext);
    if (!contexto) {
        throw new Error("useCliente debe usarse dentro de ClienteProvider");
    }
    return contexto;
}

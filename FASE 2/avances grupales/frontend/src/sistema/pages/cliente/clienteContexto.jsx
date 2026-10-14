import { createContext, useContext, useEffect, useState } from "react";
import { obtenerPerfil } from "./clienteDatos.js";

/*
  Contexto del portal cliente: carga una vez el perfil de la empresa del usuario
  y decide qué tipo de cliente es.
  - Cliente normal: sin cuenta corriente → ve sus órdenes y su historial.
  - Cliente con cuenta corriente → además paga pendientes, cotiza y ve sus cotizaciones.
*/

const ClienteContext = createContext(null);

// Solo en modo ejemplo (sin backend) se puede elegir qué tipo de cliente simular
const CLAVE_TIPO = "marexpress_cliente_ejemplo";

export function ClienteProvider({ children }) {
    const [tipoEjemplo, setTipoEjemplo] = useState(
        () => sessionStorage.getItem(CLAVE_TIPO) || "normal"
    );
    const [estado, setEstado] = useState({ clave: null, perfil: null, ejemplo: false, error: "" });

    useEffect(() => {
        let vigente = true;
        obtenerPerfil(tipoEjemplo)
            .then(({ datos, ejemplo }) => vigente && setEstado({ clave: tipoEjemplo, perfil: datos, ejemplo, error: "" }))
            .catch((error) => vigente && setEstado({ clave: tipoEjemplo, perfil: null, ejemplo: false, error: error.message }));
        return () => {
            vigente = false;
        };
    }, [tipoEjemplo]);

    const cambiarTipoEjemplo = (tipo) => {
        sessionStorage.setItem(CLAVE_TIPO, tipo);
        setTipoEjemplo(tipo);
    };

    const cuenta = estado.perfil?.cuentaCorriente || null;

    const valor = {
        cargando: estado.clave !== tipoEjemplo,
        error: estado.error,
        perfil: estado.perfil,
        cuentaCorriente: cuenta,
        tieneCuentaCorriente: Boolean(cuenta?.estado),
        modoEjemplo: estado.ejemplo,
        tipoEjemplo,
        cambiarTipoEjemplo
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

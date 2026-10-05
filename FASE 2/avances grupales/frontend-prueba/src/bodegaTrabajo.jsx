import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { useAuth } from "./auth.jsx";

const BodegaTrabajoContext = createContext(null);
const ROLES_BODEGA = new Set(["OPERADOR", "ADMINISTRADOR"]);
const CLAVE = "marexpress_bodega";

const extraerLista = (datos, clave) => {
    if (Array.isArray(datos)) {
        return datos;
    }
    if (Array.isArray(datos?.[clave])) {
        return datos[clave];
    }
    return [];
};

export const idComunaBodega = (sucursal) =>
    Number(sucursal?.idComuna || sucursal?.comuna?.idComuna) || null;

export const ordenDeBodega = (orden, sucursal) => {
    if (!sucursal) {
        return false;
    }
    const idSucursal = Number(sucursal.idSucursal);
    const idComuna = idComunaBodega(sucursal);
    const bultos = (orden?.detalle_carga || []).flatMap((detalle) => detalle.bulto || []);
    const ubicados = bultos.filter((bulto) => Number(bulto.idSucursalActual) > 0);
    if (ubicados.length > 0) {
        return ubicados.some((bulto) => Number(bulto.idSucursalActual) === idSucursal);
    }
    if (idComuna && Number(orden?.idComunaOrigen) === idComuna) {
        return true;
    }
    return (orden?.manifiesto_ot || []).some(
        (item) => idComuna && Number(item.manifiesto?.idComuna) === idComuna
    );
};

export const manifiestoDeBodega = (manifiesto, sucursal) => {
    const idComuna = idComunaBodega(sucursal);
    return Boolean(idComuna && Number(manifiesto?.idComuna) === idComuna);
};

export function BodegaTrabajoProvider({ children }) {
    const { usuario, autenticado } = useAuth();
    const habilitado = Boolean(autenticado && ROLES_BODEGA.has(usuario?.rol));
    const [sucursales, setSucursales] = useState([]);
    const [idSeleccionado, setIdSeleccionado] = useState(
        () => sessionStorage.getItem(CLAVE) || ""
    );

    useEffect(() => {
        if (!habilitado) {
            setSucursales([]);
            return;
        }
        api("/bultos/sucursales")
            .then((datos) => setSucursales(extraerLista(datos, "sucursales")))
            .catch(() => setSucursales([]));
    }, [habilitado]);

    const seleccionarBodega = (id) => {
        const valor = String(id || "");
        if (valor) {
            sessionStorage.setItem(CLAVE, valor);
        } else {
            sessionStorage.removeItem(CLAVE);
        }
        setIdSeleccionado(valor);
    };

    useEffect(() => {
        if (!habilitado || sucursales.length === 0) {
            return;
        }
        const existe = sucursales.some(
            (item) => String(item.idSucursal) === String(idSeleccionado)
        );
        if (!existe) {
            seleccionarBodega(sucursales[0].idSucursal);
        }
    }, [habilitado, sucursales, idSeleccionado]);

    const sucursal = sucursales.find(
        (item) => String(item.idSucursal) === String(idSeleccionado)
    ) || null;

    const valor = useMemo(
        () => ({
            habilitado,
            sucursales,
            sucursal,
            idSucursal: sucursal?.idSucursal || null,
            idComuna: idComunaBodega(sucursal),
            nombreBodega: sucursal?.nombreSucursal || sucursal?.comuna?.nombreComuna || "",
            seleccionarBodega,
            ordenDeBodega: (orden) => ordenDeBodega(orden, sucursal),
            manifiestoDeBodega: (manifiesto) => manifiestoDeBodega(manifiesto, sucursal)
        }),
        [habilitado, sucursales, sucursal]
    );

    return (
        <BodegaTrabajoContext.Provider value={valor}>
            {children}
        </BodegaTrabajoContext.Provider>
    );
}

export function useBodegaTrabajo() {
    const contexto = useContext(BodegaTrabajoContext);
    if (!contexto) {
        throw new Error("useBodegaTrabajo debe usarse dentro de BodegaTrabajoProvider");
    }
    return contexto;
}

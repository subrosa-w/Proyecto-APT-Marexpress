import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";

export default function AdminInicioPage() {
    const { ordenDeBodega, nombreBodega } = useBodegaTrabajo();
    const [ordenes, setOrdenes] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        Promise.all([
            api("/ordenes-transporte").catch(() => []),
            api("/clientes").catch(() => []),
            api("/maestros/usuarios").catch(() => [])
        ]).then(([listaOt, listaClientes, listaUsuarios]) => {
            setOrdenes(Array.isArray(listaOt) ? listaOt : []);
            setClientes(Array.isArray(listaClientes) ? listaClientes : []);
            setUsuarios(Array.isArray(listaUsuarios) ? listaUsuarios : []);
        });
    }, []);

    const ordenesBodega = useMemo(
        () => ordenes.filter((orden) => ordenDeBodega(orden)),
        [ordenes, ordenDeBodega]
    );

    return (
        <>
            <section className="admin-kpis">
                <article className="admin-kpi">
                    <span>OT de esta bodega</span>
                    <strong>{ordenesBodega.length}</strong>
                    <small>{nombreBodega || "Selecciona una bodega"}</small>
                </article>
                <article className="admin-kpi">
                    <span>Clientes</span>
                    <strong>{clientes.length}</strong>
                    <small>Empresas maestras</small>
                </article>
                <article className="admin-kpi">
                    <span>Usuarios</span>
                    <strong>{usuarios.length}</strong>
                    <small>Accesos al sistema</small>
                </article>
            </section>
        </>
    );
}

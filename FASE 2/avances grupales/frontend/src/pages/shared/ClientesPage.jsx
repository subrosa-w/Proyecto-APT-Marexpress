import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Message from "../../components/Message.jsx";
import AltaClienteForm from "../../components/AltaClienteForm.jsx";
import { etiquetaComuna } from "../../utils.js";

export default function ClientesPage() {
    const [clientes, setClientes] = useState([]);
    const [comunas, setComunas] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");

    const cargar = async () => {
        const [lista, listaComunas] = await Promise.all([
            api("/clientes"),
            api("/comunas")
        ]);
        setClientes(Array.isArray(lista) ? lista : []);
        setComunas(Array.isArray(listaComunas) ? listaComunas : []);
    };

    useEffect(() => {
        cargar().catch((error) => {
            setMensaje(error.message);
            setTipo("error");
        });
    }, []);

    return (
        <>
            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>MAESTROS</span>
                        <h2>Registrar cliente</h2>
                    </div>
                </header>
                <Message texto={mensaje} tipo={tipo} />
                <AltaClienteForm
                    comunas={comunas}
                    onCreado={async () => {
                        setMensaje("Cliente creado correctamente.");
                        setTipo("success");
                        await cargar();
                    }}
                />
            </section>

            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>LISTADO</span>
                        <h2>Clientes registrados</h2>
                    </div>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>RUT</th>
                                <th>Razón social</th>
                                <th>Comuna</th>
                                <th>Teléfono</th>
                                <th>Cuenta corriente</th>
                                <th>Tarifario</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((cliente) => (
                                <tr key={cliente.idCliente}>
                                    <td>{cliente.rut}</td>
                                    <td>{cliente.razonSocial}</td>
                                    <td>{etiquetaComuna(cliente.comuna)}</td>
                                    <td>{cliente.telefono || "—"}</td>
                                    <td>
                                        {cliente.cuenta_corriente?.estado
                                            ? `Sí (límite ${cliente.cuenta_corriente.limiteCredito})`
                                            : "No"}
                                    </td>
                                    <td>{cliente.tarifa?.nombreTarifa || "—"}</td>
                                    <td>{cliente.estado ? "Activo" : "Inactivo"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

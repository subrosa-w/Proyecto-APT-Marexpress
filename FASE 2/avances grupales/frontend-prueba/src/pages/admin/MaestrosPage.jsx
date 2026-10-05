import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Message from "../../components/Message.jsx";

export default function MaestrosPage() {
    const [conductores, setConductores] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        Promise.all([
            api("/maestros/conductores"),
            api("/maestros/vehiculos")
        ])
            .then(([listaConductores, listaVehiculos]) => {
                setConductores(Array.isArray(listaConductores) ? listaConductores : []);
                setVehiculos(Array.isArray(listaVehiculos) ? listaVehiculos : []);
            })
            .catch((error) => setMensaje(error.message));
    }, []);

    return (
        <>
            <Message texto={mensaje} tipo="error" />
            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>FLOTA</span>
                        <h2>Conductores</h2>
                    </div>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>RUT</th>
                                <th>Nombre</th>
                                <th>Licencia</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conductores.map((conductor) => (
                                <tr key={conductor.idConductor}>
                                    <td>{conductor.rut}</td>
                                    <td>{conductor.nombre} {conductor.apellido}</td>
                                    <td>{conductor.licencia}</td>
                                    <td>{conductor.estado ? "Activo" : "Inactivo"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>FLOTA</span>
                        <h2>Vehículos</h2>
                    </div>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Patente</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiculos.map((vehiculo) => (
                                <tr key={vehiculo.idVehiculo}>
                                    <td>{vehiculo.patente}</td>
                                    <td>{vehiculo.marca}</td>
                                    <td>{vehiculo.modelo}</td>
                                    <td>{vehiculo.estado ? "Activo" : "Inactivo"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

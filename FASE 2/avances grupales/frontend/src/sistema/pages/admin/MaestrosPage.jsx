/*
  VISTA: datos maestros
  RUTA: /administrador/maestros
  CSS: admin-card, mx-table, modal
  API: /api/maestros (conductores, camiones, bodegas, tipos de carga, recargos)
  FUNCIONES: mantiene los catálogos que usan las órdenes y los manifiestos
*/
import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { formatos } from "../../formatos.js";
import { CampoRut, CampoTelefono } from "../../entrada.jsx";
import Message from "../../components/Message.jsx";

// Formulario de conductor en blanco, para abrirlo y para limpiarlo después de guardar.
const conductorVacio = {
    rut: "",
    nombre: "",
    apellido: "",
    telefono: "",
    licencia: "",
    vencimientoLicencia: ""
};

// Formulario de camión en blanco.
const vehiculoVacio = {
    patente: "",
    marca: "",
    modelo: "",
    anio: "",
    capacidadKg: ""
};

export default function MaestrosPage() {
    const [conductores, setConductores] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [panel, setPanel] = useState("");
    const [conductor, setConductor] = useState(conductorVacio);
    const [vehiculo, setVehiculo] = useState(vehiculoVacio);
    const [guardando, setGuardando] = useState(false);

    // Conductores y camiones que después se asignan a un manifiesto.
    const cargar = async () => {
        const [listaConductores, listaVehiculos] = await Promise.all([
            api("/maestros/conductores"),
            api("/maestros/vehiculos")
        ]);
        setConductores(Array.isArray(listaConductores) ? listaConductores : []);
        setVehiculos(Array.isArray(listaVehiculos) ? listaVehiculos : []);
    };

    useEffect(() => {
        cargar().catch((error) => {
            setTipo("error");
            setMensaje(error.message);
        });
    }, []);

    // Aviso único de la pantalla.
    const aviso = (texto, clase = "info") => {
        setMensaje(texto);
        setTipo(clase);
    };

    // Da de alta un conductor y cierra el formulario para no dejar datos a medias.
    const guardarConductor = async (event) => {
        event.preventDefault();
        setGuardando(true);
        try {
            const resultado = await api("/maestros/conductores", {
                method: "POST",
                body: JSON.stringify(conductor)
            });
            aviso(resultado.mensaje || "Conductor añadido.", "success");
            setConductor(conductorVacio);
            setPanel("");
            await cargar();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setGuardando(false);
        }
    };

    // Da de alta un camión. La patente es la que después se elige en el manifiesto.
    const guardarVehiculo = async (event) => {
        event.preventDefault();
        setGuardando(true);
        try {
            const resultado = await api("/maestros/vehiculos", {
                method: "POST",
                body: JSON.stringify(vehiculo)
            });
            aviso(resultado.mensaje || "Camión añadido.", "success");
            setVehiculo(vehiculoVacio);
            setPanel("");
            await cargar();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <Message texto={mensaje} tipo={tipo} />
            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>FLOTA</span>
                        <h2>Conductores</h2>
                    </div>
                    <button type="button" className="button-primary" onClick={() => setPanel(panel === "conductor" ? "" : "conductor")}>
                        Añadir
                    </button>
                </header>
                {panel === "conductor" ? (
                    <form className="admin-grid-2" onSubmit={guardarConductor}>
                        <div className="field">
                            <label>RUT *</label>
                            <CampoRut value={conductor.rut} onChange={(valor) => setConductor({ ...conductor, rut: valor })} required />
                        </div>
                        <div className="field">
                            <label>Nombre *</label>
                            <input {...formatos.nombre} value={conductor.nombre} onChange={(e) => setConductor({ ...conductor, nombre: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label>Apellido *</label>
                            <input {...formatos.apellido} value={conductor.apellido} onChange={(e) => setConductor({ ...conductor, apellido: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label>Teléfono</label>
                            <CampoTelefono value={conductor.telefono} onChange={(valor) => setConductor({ ...conductor, telefono: valor })} />
                        </div>
                        <div className="field">
                            <label>Licencia *</label>
                            <input {...formatos.licencia} value={conductor.licencia} onChange={(e) => setConductor({ ...conductor, licencia: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label>Vencimiento licencia</label>
                            <input {...formatos.fecha} value={conductor.vencimientoLicencia} onChange={(e) => setConductor({ ...conductor, vencimientoLicencia: e.target.value })} />
                        </div>
                        <div className="mx-form-actions">
                            <button className="button-primary" type="submit" disabled={guardando}>
                                {guardando ? "Guardando..." : "Guardar conductor"}
                            </button>
                        </div>
                    </form>
                ) : null}
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>RUT</th>
                                <th>Nombre</th>
                                <th>Licencia</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conductores.length === 0 ? (
                                <tr><td colSpan={5} className="mx-empty">No hay conductores cargados.</td></tr>
                            ) : conductores.map((item) => (
                                <tr key={item.idConductor}>
                                    <td>{item.rut}</td>
                                    <td>{item.nombre} {item.apellido}</td>
                                    <td>{item.licencia}</td>
                                    <td>{item.telefono || "—"}</td>
                                    <td>{item.estado ? "Activo" : "Inactivo"}</td>
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
                        <h2>Camiones</h2>
                    </div>
                    <button type="button" className="button-primary" onClick={() => setPanel(panel === "camion" ? "" : "camion")}>
                        Añadir
                    </button>
                </header>
                {panel === "camion" ? (
                    <form className="admin-grid-2" onSubmit={guardarVehiculo}>
                        <div className="field">
                            <label>Patente *</label>
                            <input {...formatos.patente} value={vehiculo.patente} onChange={(e) => setVehiculo({ ...vehiculo, patente: e.target.value.toUpperCase() })} required />
                        </div>
                        <div className="field">
                            <label>Marca *</label>
                            <input {...formatos.marca} value={vehiculo.marca} onChange={(e) => setVehiculo({ ...vehiculo, marca: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label>Modelo *</label>
                            <input {...formatos.modelo} value={vehiculo.modelo} onChange={(e) => setVehiculo({ ...vehiculo, modelo: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label>Año</label>
                            <input {...formatos.anio} value={vehiculo.anio} onChange={(e) => setVehiculo({ ...vehiculo, anio: e.target.value })} />
                        </div>
                        <div className="field">
                            <label>Capacidad (kg)</label>
                            <input {...formatos.kg} value={vehiculo.capacidadKg} onChange={(e) => setVehiculo({ ...vehiculo, capacidadKg: e.target.value })} />
                        </div>
                        <div className="mx-form-actions">
                            <button className="button-primary" type="submit" disabled={guardando}>
                                {guardando ? "Guardando..." : "Guardar camión"}
                            </button>
                        </div>
                    </form>
                ) : null}
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Patente</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Año</th>
                                <th>Capacidad</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiculos.length === 0 ? (
                                <tr><td colSpan={6} className="mx-empty">No hay camiones cargados.</td></tr>
                            ) : vehiculos.map((item) => (
                                <tr key={item.idVehiculo}>
                                    <td>{item.patente}</td>
                                    <td>{item.marca}</td>
                                    <td>{item.modelo}</td>
                                    <td>{item.anio || "—"}</td>
                                    <td>{item.capacidadKg ?? "—"}</td>
                                    <td>{item.estado ? "Activo" : "Inactivo"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

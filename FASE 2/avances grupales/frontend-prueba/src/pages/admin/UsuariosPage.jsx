import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Message from "../../components/Message.jsx";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        api("/maestros/usuarios")
            .then((datos) => setUsuarios(Array.isArray(datos) ? datos : []))
            .catch((error) => setMensaje(error.message));
    }, []);

    return (
        <section className="admin-card">
            <header className="admin-card-header">
                <div>
                    <span>ACCESOS</span>
                    <h2>Usuarios del sistema</h2>
                </div>
            </header>
            <Message texto={mensaje} tipo="error" />
            <div className="mx-table-wrap">
                <table className="mx-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Usuario</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((usuario) => (
                            <tr key={usuario.idUsuario}>
                                <td>{usuario.nombre} {usuario.apellido}</td>
                                <td>{usuario.nombreUsuario || "—"}</td>
                                <td>{usuario.correo}</td>
                                <td>{usuario.rol?.nombreRol}</td>
                                <td>{usuario.estado ? "Activo" : "Inactivo"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

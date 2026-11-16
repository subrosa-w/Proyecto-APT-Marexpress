/*
  VISTA: usuarios del sistema
  RUTA: /administrador/usuarios
  CSS: admin-card, mx-table
  API: /api/maestros/usuarios y /api/maestros/roles
  FUNCIONES: alta, edición y estado de operadores, peonetas y administradores
*/
import { useEffect, useState } from "react";
import { api } from "../../api.js";
import Message from "../../components/Message.jsx";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("error");
    const [guardando, setGuardando] = useState(null);

    // Usuarios y catálogo de roles. El select de cada fila sale de ese catálogo.
    const cargar = async () => {
        const [lista, catalogo] = await Promise.all([
            api("/maestros/usuarios"),
            api("/maestros/roles")
        ]);
        setUsuarios(Array.isArray(lista) ? lista : []);
        setRoles(catalogo?.roles || []);
    };

    useEffect(() => {
        cargar().catch((error) => {
            setTipo("error");
            setMensaje(error.message);
        });
    }, []);

    // Cambia el rol en el servidor y actualiza solo esa fila, sin recargar toda la tabla.
    const cambiarRol = async (usuario, idRol) => {
        setGuardando(usuario.idUsuario);
        try {
            const resultado = await api(`/maestros/usuarios/${usuario.idUsuario}/rol`, {
                method: "PATCH",
                body: JSON.stringify({ idRol: Number(idRol) })
            });
            setUsuarios((prev) => prev.map((item) => (
                item.idUsuario === usuario.idUsuario
                    ? { ...item, rol: resultado.usuario?.rol || item.rol }
                    : item
            )));
            setTipo("success");
            setMensaje(resultado.mensaje || "Rol actualizado.");
        } catch (error) {
            setTipo("error");
            setMensaje(error.message);
        } finally {
            setGuardando(null);
        }
    };

    return (
        <section className="admin-card">
            <header className="admin-card-header">
                <div>
                    <span>ACCESOS</span>
                    <h2>Usuarios y roles</h2>
                </div>
            </header>
            <Message texto={mensaje} tipo={tipo} />
            <p className="mx-note">
                Roles disponibles: administrador, operador, cliente cuenta corriente, cliente normal y peoneta.
            </p>
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
                                <td>
                                    <select
                                        value={usuario.rol?.idRol || ""}
                                        disabled={guardando === usuario.idUsuario}
                                        onChange={(event) => cambiarRol(usuario, event.target.value)}
                                        aria-label={`Rol de ${usuario.nombre}`}
                                    >
                                        {usuario.rol && !roles.some((rol) => rol.idRol === usuario.rol.idRol) ? (
                                            <option value={usuario.rol.idRol}>{usuario.rol.nombreRol}</option>
                                        ) : null}
                                        {roles.map((rol) => (
                                            <option key={rol.idRol} value={rol.idRol}>{rol.nombreRol}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>{usuario.estado ? "Activo" : "Inactivo"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

import { useAuth } from "../../auth.jsx";
import { nombreCompleto } from "../../utils.js";

export default function PerfilPage() {
    const { usuario } = useAuth();

    return (
        <section className="admin-card operador-card cliente-card peoneta-card">
            <header className="admin-card-header">
                <div>
                    <span>CUENTA</span>
                    <h2>Datos de acceso</h2>
                </div>
            </header>
            <div className="admin-grid-2">
                <div className="field">
                    <label>Nombre</label>
                    <input value={nombreCompleto(usuario)} readOnly />
                </div>
                <div className="field">
                    <label>Usuario</label>
                    <input value={usuario?.nombreUsuario || ""} readOnly />
                </div>
                <div className="field">
                    <label>Correo</label>
                    <input value={usuario?.correo || ""} readOnly />
                </div>
                <div className="field">
                    <label>Rol</label>
                    <input value={usuario?.rol || ""} readOnly />
                </div>
            </div>
        </section>
    );
}

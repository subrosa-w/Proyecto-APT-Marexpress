export default function PlaceholderPage({ titulo, descripcion }) {
    return (
        <section className="admin-card operador-card cliente-card peoneta-card">
            <header className="admin-card-header">
                <div>
                    <span>EN CONSTRUCCIÓN</span>
                    <h2>{titulo}</h2>
                </div>
            </header>
            <p className="mx-note">
                {descripcion || "Este módulo queda preparado en la interfaz React y se conectará en la siguiente iteración del backend."}
            </p>
        </section>
    );
}

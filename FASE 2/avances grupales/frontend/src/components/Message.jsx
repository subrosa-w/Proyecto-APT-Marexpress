export default function Message({ texto, tipo = "info" }) {
    if (!texto) {
        return null;
    }

    return (
        <p className={`message ${tipo} message-${tipo}`} role="status">
            {texto}
        </p>
    );
}

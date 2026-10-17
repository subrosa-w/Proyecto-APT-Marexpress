/*
  COMPONENTE: aviso
  CSS: bloque Mensajes de sistema.css
  FUNCIONES: muestra un texto de éxito o de error
*/
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

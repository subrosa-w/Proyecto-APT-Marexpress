import { estadoDe, textoEstadoOt, tonoEstado } from "./clienteEstados.js";

// Etiqueta de color con el estado de una OT (En bodega, En tránsito, Entregada...)
export default function InsigniaOt({ orden }) {
    return (
        <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-bold ${tonoEstado(orden)}`}>
            {textoEstadoOt(estadoDe(orden))}
        </span>
    );
}

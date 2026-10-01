import { useEffect, useState } from "react";
import { api } from "../api.js";
import { etiquetaComuna } from "../utils.js";

const vacio = {
    rut: "",
    nombreRazonSocial: "",
    direccion: "",
    telefono: "",
    correo: "",
    referencia: "",
    idComuna: "",
    idTarifa: "",
    crearCuentaCorriente: false,
    limiteCredito: "0"
};

export default function AltaDestinatarioForm({ comunas, onCreado, onCancelar }) {
    const [formulario, setFormulario] = useState(vacio);
    const [tarifarios, setTarifarios] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        api("/maestros/tarifas")
            .then((lista) => setTarifarios(Array.isArray(lista) ? lista.filter((item) => item.estado) : []))
            .catch((err) => setError(err.message));
    }, []);

    const setCampo = (campo, valor) => {
        setFormulario((prev) => ({ ...prev, [campo]: valor }));
    };

    const guardar = async (event) => {
        event.preventDefault();
        setCargando(true);
        setError("");

        try {
            const resultado = await api("/destinatarios", {
                method: "POST",
                body: JSON.stringify({
                    ...formulario,
                    idComuna: Number(formulario.idComuna),
                    idTarifa: formulario.crearCuentaCorriente ? Number(formulario.idTarifa) : null,
                    crearCuentaCorriente: Boolean(formulario.crearCuentaCorriente),
                    limiteCredito: Number(formulario.limiteCredito) || 0
                })
            });
            onCreado(resultado.destinatario);
            setFormulario(vacio);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <form className="ot-alta" onSubmit={guardar}>
            <h3>Nuevo destinatario</h3>
            {error ? <p className="ot-alta-error">{error}</p> : null}
            <div className="ot-grid">
                <div className="field">
                    <label>
                        RUT {formulario.crearCuentaCorriente ? "*" : ""}
                    </label>
                    <input
                        value={formulario.rut}
                        onChange={(e) => setCampo("rut", e.target.value)}
                        required={formulario.crearCuentaCorriente}
                    />
                </div>
                <div className="field">
                    <label>Nombre o razón social *</label>
                    <input
                        value={formulario.nombreRazonSocial}
                        onChange={(e) => setCampo("nombreRazonSocial", e.target.value)}
                        required
                    />
                </div>
                <div className="field">
                    <label>Dirección *</label>
                    <input
                        value={formulario.direccion}
                        onChange={(e) => setCampo("direccion", e.target.value)}
                        required
                    />
                </div>
                <div className="field">
                    <label>Comuna *</label>
                    <select
                        value={formulario.idComuna}
                        onChange={(e) => setCampo("idComuna", e.target.value)}
                        required
                    >
                        <option value="">Seleccione comuna</option>
                        {comunas.map((comuna) => (
                            <option key={comuna.idComuna} value={comuna.idComuna}>
                                {etiquetaComuna(comuna)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Teléfono</label>
                    <input
                        value={formulario.telefono}
                        onChange={(e) => setCampo("telefono", e.target.value)}
                    />
                </div>
                <div className="field">
                    <label>Correo</label>
                    <input
                        type="email"
                        value={formulario.correo}
                        onChange={(e) => setCampo("correo", e.target.value)}
                    />
                </div>
                <div className="field">
                    <label>Referencia de entrega</label>
                    <input
                        value={formulario.referencia}
                        onChange={(e) => setCampo("referencia", e.target.value)}
                    />
                </div>
                <div className="field">
                    <label>Cuenta corriente</label>
                    <select
                        value={formulario.crearCuentaCorriente ? "SI" : "NO"}
                        onChange={(e) => setCampo("crearCuentaCorriente", e.target.value === "SI")}
                    >
                        <option value="NO">No</option>
                        <option value="SI">Sí, registrarlo también como cliente</option>
                    </select>
                </div>
                {formulario.crearCuentaCorriente ? (
                    <>
                        <div className="field">
                            <label>Tarifario *</label>
                            <select
                                value={formulario.idTarifa}
                                onChange={(e) => setCampo("idTarifa", e.target.value)}
                                required
                            >
                                <option value="">Seleccione tarifario</option>
                                {tarifarios.map((tarifa) => (
                                    <option key={tarifa.idTarifa} value={tarifa.idTarifa}>
                                        {tarifa.nombreTarifa}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label>Límite de crédito</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={formulario.limiteCredito}
                            onChange={(e) => setCampo("limiteCredito", e.target.value)}
                        />
                    </div>
                    </>
                ) : null}
            </div>
            <div className="mx-form-actions">
                {onCancelar ? (
                    <button type="button" className="button-secondary" onClick={onCancelar}>
                        Cancelar
                    </button>
                ) : null}
                <button className="button-primary" type="submit" disabled={cargando}>
                    {cargando ? "Guardando..." : "Guardar destinatario"}
                </button>
            </div>
        </form>
    );
}

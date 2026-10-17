import { formatos } from "./formatos.js";

export const PREFIJO_OT = "OT-";
export const PREFIJO_MAN = "MAN-";

export const prefijosTelefono = [
    { valor: "+569", etiqueta: "+569 Chile móvil" },
    { valor: "+598", etiqueta: "+598 Uruguay" },
    { valor: "+595", etiqueta: "+595 Paraguay" },
    { valor: "+593", etiqueta: "+593 Ecuador" },
    { valor: "+591", etiqueta: "+591 Bolivia" },
    { valor: "+56", etiqueta: "+56 Chile" },
    { valor: "+57", etiqueta: "+57 Colombia" },
    { valor: "+54", etiqueta: "+54 Argentina" },
    { valor: "+51", etiqueta: "+51 Perú" }
];

// 213103075 → 21.310.307-5 mientras se escribe.
export const formatearRutEntrada = (valor) => {
    const limpio = String(valor || "").toUpperCase().replace(/[^0-9K]/g, "").slice(0, 9);
    if (limpio.length <= 1) {
        return limpio;
    }
    const dv = limpio.slice(-1);
    const cuerpo = limpio.slice(0, -1);
    const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${conPuntos}-${dv}`;
};

export const correoValido = (valor) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || "").trim());

const partirTelefono = (valor) => {
    const compacto = String(valor || "").replace(/[\s()-]/g, "");
    const prefijo = prefijosTelefono.find((item) => compacto.startsWith(item.valor))?.valor || "+569";
    const numero = compacto.startsWith(prefijo)
        ? compacto.slice(prefijo.length).replace(/\D/g, "")
        : compacto.replace(/\D/g, "");
    return { prefijo, numero: numero.slice(0, 12) };
};

// La caja ya trae OT- o MAN-. Si la pistola pega el código completo, no se duplica el prefijo.
export const codigoConPrefijo = (valor, prefijo = PREFIJO_OT) => {
    let texto = String(valor ?? "").toUpperCase().replace(/\s+/g, "");
    const marcas = [...texto.matchAll(/OT-|MAN-/g)];
    if (marcas.length > 1) {
        texto = texto.slice(marcas[marcas.length - 1].index);
    }
    if (texto.startsWith("OT-") || texto.startsWith("MAN-")) {
        return texto.slice(0, 40);
    }
    const resto = texto.replace(/[^0-9A-Z-]/g, "");
    return (resto ? `${prefijo}${resto}` : prefijo).slice(0, 40);
};

export function CampoRut({ value, onChange, id, required = false }) {
    return (
        <input
            {...formatos.rut}
            id={id}
            value={value}
            required={required}
            onChange={(event) => onChange(formatearRutEntrada(event.target.value))}
        />
    );
}

export function CampoCorreo({ value, onChange, id, required = false }) {
    return (
        <input
            {...formatos.correo}
            id={id}
            value={value}
            required={required}
            onChange={(event) => onChange(event.target.value.trim().toLowerCase())}
            onBlur={(event) => {
                const texto = event.target.value.trim();
                event.target.setCustomValidity(texto && !correoValido(texto) ? "Escribe un correo válido, por ejemplo nombre@correo.cl" : "");
            }}
        />
    );
}

export function CampoTelefono({ value, onChange, id, required = false }) {
    const { prefijo, numero } = partirTelefono(value);
    const emitir = (siguientePrefijo, siguienteNumero) => {
        const digitos = String(siguienteNumero || "").replace(/\D/g, "").slice(0, 12);
        onChange(digitos ? `${siguientePrefijo}${digitos}` : "");
    };

    return (
        <div className="mx-telefono">
            <select
                aria-label="Código de país"
                value={prefijo}
                onChange={(event) => emitir(event.target.value, numero)}
            >
                {prefijosTelefono.map((item) => (
                    <option key={item.valor} value={item.valor}>{item.etiqueta}</option>
                ))}
            </select>
            <input
                id={id}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="1234 5678"
                title="Número sin el código de país"
                value={numero}
                required={required}
                onChange={(event) => emitir(prefijo, event.target.value)}
            />
        </div>
    );
}

/*
  COMPONENTE: gráfico de barras
  CSS: alto fijo de 120 px, eje y resumen
  FUNCIONES: dibuja un mes completo de órdenes o ingresos
*/
const ALTURA = 120;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const textoEje = (valor) => {
    const texto = String(valor ?? "");
    const dia = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dia) {
        return `${Number(dia[3])} ${MESES[Number(dia[2]) - 1]}`;
    }
    const mes = texto.match(/^(\d{4})-(\d{2})$/);
    if (mes) {
        return MESES[Number(mes[2]) - 1];
    }
    return texto.slice(0, 14);
};

const compacto = (cantidad) => {
    const numero = Number(cantidad) || 0;
    if (Math.abs(numero) >= 1000000) {
        return `${(numero / 1000000).toFixed(1)} M`;
    }
    if (Math.abs(numero) >= 1000) {
        return `${Math.round(numero / 1000)} mil`;
    }
    return String(numero);
};

export default function GraficoBarras({
    datos = [],
    valor = "valor",
    etiqueta = "nombre",
    titulo,
    formato,
    unidad = ""
}) {
    const numeros = datos.map((item) => Number(item[valor]) || 0);
    const maximo = Math.max(...numeros, 1);
    const total = numeros.reduce((suma, cantidad) => suma + cantidad, 0);
    const indiceMaximo = numeros.indexOf(Math.max(...numeros, 0));
    const promedio = datos.length ? total / datos.length : 0;
    const mostrar = (cantidad) => (formato ? formato(cantidad) : compacto(cantidad));
    const marcas = [maximo, maximo / 2, 0];

    return (
        <div>
            {titulo ? <h3 className="mb-1 text-sm font-bold text-marino">{titulo}</h3> : null}
            {datos.length === 0 ? (
                <p className="mx-empty">Sin datos en este período.</p>
            ) : (
                <>
                    <p className="mb-3 text-xs text-texto-suave">
                        Total {mostrar(total)}{unidad ? ` ${unidad}` : ""}
                        {" · "}
                        Promedio {mostrar(promedio)}
                        {numeros[indiceMaximo] > 0 ? ` · Más alto: ${textoEje(datos[indiceMaximo][etiqueta])} (${mostrar(numeros[indiceMaximo])})` : ""}
                    </p>
                    <div className="flex gap-2">
                        <div className="flex h-40 w-14 shrink-0 flex-col justify-between pb-5 text-right text-[10px] text-texto-suave">
                            {marcas.map((marca) => (
                                <span key={marca}>{mostrar(marca)}</span>
                            ))}
                        </div>
                        <div className="min-w-0 flex-1 overflow-x-auto">
                            <div className="flex h-40 items-end gap-1 border-b border-slate-200">
                                {datos.map((item, indice) => {
                                    const cantidad = numeros[indice];
                                    const alto = cantidad > 0 ? Math.max(8, (cantidad / maximo) * ALTURA) : 2;
                                    return (
                                        <div key={`${item[etiqueta]}-${indice}`} className="flex w-8 shrink-0 flex-col items-center justify-end gap-1">
                                            <div
                                                className={`w-5 rounded-t ${cantidad > 0 ? "bg-azul" : "bg-slate-200"}`}
                                                style={{ height: `${alto}px` }}
                                                title={`${textoEje(item[etiqueta])}: ${mostrar(cantidad)}${unidad ? ` ${unidad}` : ""}`}
                                            />
                                            <span className="w-8 truncate text-center text-[10px] text-texto-suave">
                                                {textoEje(item[etiqueta])}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

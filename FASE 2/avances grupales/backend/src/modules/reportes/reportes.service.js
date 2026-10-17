/*
  INFORME DEL ADMINISTRADOR
  diaChile y rango     convierten el período (día, semana, mes, año) en fechas
  serieDelPeriodo      arma la serie de los gráficos
  obtenerInforme       devuelve ingresos, órdenes, entregas y camiones
  Un manifiesto entra al informe de camiones solo si tiene órdenes y cada
  una quedó Entregada o Rechazada. La fecha que cuenta es la de salida.
*/
import prisma from "../../config/prisma.js";

const diaChile = (fecha = new Date()) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(fecha);

const dinero = (valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
};

const PERIODOS = ["dia", "semana", "mes", "anio"];

const rango = (periodo, fecha) => {
    const dia = /^\d{4}-\d{2}-\d{2}$/.test(String(fecha || "")) ? fecha : diaChile();
    if (periodo === "dia") {
        const desde = new Date(`${dia}T00:00:00`);
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 1);
        return { desde, hasta, etiqueta: dia };
    }
    if (periodo === "semana") {
        const desde = new Date(`${dia}T00:00:00`);
        const diaSemana = desde.getDay();
        const hastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        desde.setDate(desde.getDate() - hastaLunes);
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 7);
        return { desde, hasta, etiqueta: `semana ${diaChile(desde)}` };
    }
    if (periodo === "anio") {
        const anio = dia.slice(0, 4);
        const desde = new Date(`${anio}-01-01T00:00:00`);
        const hasta = new Date(`${Number(anio) + 1}-01-01T00:00:00`);
        return { desde, hasta, etiqueta: anio };
    }
    const mes = dia.slice(0, 7);
    const desde = new Date(`${mes}-01T00:00:00`);
    const hasta = new Date(desde);
    hasta.setMonth(hasta.getMonth() + 1);
    return { desde, hasta, etiqueta: mes };
};

const claveDia = (fecha) => diaChile(new Date(fecha));

const serieDelPeriodo = (modo, desde, hasta, porClave) => {
    if (modo === "anio") {
        const anio = diaChile(desde).slice(0, 4);
        return Array.from({ length: 12 }, (_, indice) => {
            const clave = `${anio}-${String(indice + 1).padStart(2, "0")}`;
            return porClave.get(clave) || { dia: clave, ordenes: 0, ingresos: 0 };
        });
    }
    const puntos = [];
    const cursor = new Date(desde);
    while (cursor < hasta) {
        const clave = diaChile(cursor);
        puntos.push(porClave.get(clave) || { dia: clave, ordenes: 0, ingresos: 0 });
        cursor.setDate(cursor.getDate() + 1);
    }
    return puntos;
};

export const obtenerInforme = async ({ periodo = "mes", fecha } = {}) => {
    const modo = PERIODOS.includes(periodo) ? periodo : "mes";
    const { desde, hasta, etiqueta } = rango(modo, fecha);
    const cerradas = ["ANULADA", "CANCELADA"];

    const [ordenes, manifiestos, entregas] = await Promise.all([
        prisma.orden_transporte.findMany({
            where: { fechaCreacion: { gte: desde, lt: hasta } },
            select: {
                idOrden: true,
                numeroOT: true,
                fechaCreacion: true,
                valorTotal: true,
                cliente: { select: { razonSocial: true } },
                estado_ot: { select: { nombreEstado: true } }
            }
        }),
        prisma.manifiesto.findMany({
            where: { fechaSalida: { gte: desde, lt: hasta } },
            select: {
                numeroManifiesto: true,
                fechaSalida: true,
                estado: true,
                vehiculo: { select: { patente: true, marca: true, modelo: true } },
                conductor: { select: { nombre: true, apellido: true } },
                manifiesto_usuario: {
                    select: {
                        usuario: { select: { nombre: true, apellido: true, nombreUsuario: true } }
                    }
                },
                manifiesto_ot: {
                    select: {
                        entrega_ot: { select: { resultadoEntrega: true } },
                        orden_transporte: {
                            select: {
                                numeroOT: true,
                                pesoTotal: true,
                                volumenTotalM3: true,
                                cliente: { select: { razonSocial: true } }
                            }
                        }
                    }
                }
            }
        }),
        prisma.entrega_ot.findMany({
            where: { fechaEntrega: { gte: desde, lt: hasta } },
            orderBy: { fechaEntrega: "desc" },
            select: {
                fechaEntrega: true,
                resultadoEntrega: true,
                nombreReceptor: true,
                motivoResultado: true,
                orden_transporte: {
                    select: {
                        numeroOT: true,
                        valorTotal: true,
                        cliente: { select: { razonSocial: true } }
                    }
                }
            }
        })
    ]);

    const activas = ordenes.filter((orden) => !cerradas.includes(String(orden.estado_ot?.nombreEstado || "").toUpperCase()));
    const porCliente = new Map();
    for (const orden of activas) {
        const nombre = orden.cliente?.razonSocial || "Sin cliente";
        const actual = porCliente.get(nombre) || { cliente: nombre, ordenes: 0, ingresos: 0 };
        actual.ordenes += 1;
        actual.ingresos += dinero(orden.valorTotal);
        porCliente.set(nombre, actual);
    }

    const nombrePersona = (persona, vacio) => {
        const nombre = `${persona?.nombre || ""} ${persona?.apellido || ""}`.trim();
        return nombre || persona?.nombreUsuario || vacio;
    };

    const peonetasDe = (manifiesto) => {
        const nombres = [...new Set((manifiesto.manifiesto_usuario || [])
            .map((item) => nombrePersona(item.usuario, ""))
            .filter(Boolean))];
        return nombres.length ? nombres.join(", ") : "Sin peoneta";
    };

    const resultadoFinal = (valor) => {
        const texto = String(valor || "").toUpperCase();
        if (texto === "ENTREGADA") return "Entregada";
        if (texto === "RECHAZADA") return "Rechazada";
        return "";
    };

    const manifiestoCerrado = (manifiesto) => {
        const asignadas = manifiesto.manifiesto_ot || [];
        return asignadas.length > 0 && asignadas.every((item) => resultadoFinal(item.entrega_ot?.resultadoEntrega));
    };

    const cargaManifiesto = (manifiesto) => {
        const asignadas = manifiesto.manifiesto_ot || [];
        return {
            ordenes: asignadas.length,
            kilos: Number(asignadas.reduce((suma, item) => suma + dinero(item.orden_transporte?.pesoTotal), 0).toFixed(2)),
            m3: Number(asignadas.reduce((suma, item) => suma + dinero(item.orden_transporte?.volumenTotalM3), 0).toFixed(3)),
            ordenesDetalle: asignadas.map((item) => ({
                numeroOT: item.orden_transporte?.numeroOT || "—",
                cliente: item.orden_transporte?.cliente?.razonSocial || "—",
                resultado: resultadoFinal(item.entrega_ot?.resultadoEntrega),
                kilos: Number(dinero(item.orden_transporte?.pesoTotal).toFixed(2)),
                m3: Number(dinero(item.orden_transporte?.volumenTotalM3).toFixed(3))
            }))
        };
    };

    const manifiestosCerrados = manifiestos.filter(manifiestoCerrado);

    const porCamion = new Map();
    for (const manifiesto of manifiestosCerrados) {
        const patente = manifiesto.vehiculo?.patente || "Sin camión";
        const carga = cargaManifiesto(manifiesto);
        const actual = porCamion.get(patente) || {
            patente,
            camion: manifiesto.vehiculo
                ? `${manifiesto.vehiculo.marca} ${manifiesto.vehiculo.modelo}`.trim()
                : "Sin asignar",
            vueltas: 0,
            manifiestos: 0,
            ordenes: 0,
            kilos: 0,
            m3: 0
        };
        actual.vueltas += 1;
        actual.manifiestos += 1;
        actual.ordenes += carga.ordenes;
        actual.kilos += carga.kilos;
        actual.m3 += carga.m3;
        porCamion.set(patente, actual);
    }

    const porDia = new Map();
    for (const orden of activas) {
        const diaCompleto = claveDia(orden.fechaCreacion);
        const dia = modo === "anio" ? diaCompleto.slice(0, 7) : diaCompleto;
        const actual = porDia.get(dia) || { dia, ordenes: 0, ingresos: 0 };
        actual.ordenes += 1;
        actual.ingresos += dinero(orden.valorTotal);
        porDia.set(dia, actual);
    }

    return {
        periodo: modo,
        etiqueta,
        desde,
        hasta,
        totales: {
            ingresos: activas.reduce((suma, orden) => suma + dinero(orden.valorTotal), 0),
            ordenes: activas.length,
            vueltas: manifiestosCerrados.length,
            manifiestos: manifiestosCerrados.length,
            kilos: Number(manifiestosCerrados.reduce((suma, item) => suma + cargaManifiesto(item).kilos, 0).toFixed(2)),
            m3: Number(manifiestosCerrados.reduce((suma, item) => suma + cargaManifiesto(item).m3, 0).toFixed(3)),
            entregas: entregas.length
        },
        serie: serieDelPeriodo(modo, desde, hasta, porDia),
        clientes: [...porCliente.values()].sort((a, b) => b.ingresos - a.ingresos),
        vueltas: [...porCamion.values()]
            .map((item) => ({
                ...item,
                kilos: Number(item.kilos.toFixed(2)),
                m3: Number(item.m3.toFixed(3))
            }))
            .sort((a, b) => b.vueltas - a.vueltas),
        detalleVueltas: manifiestosCerrados.map((item) => {
            const carga = cargaManifiesto(item);
            return {
                manifiesto: item.numeroManifiesto,
                fecha: item.fechaSalida,
                estado: item.estado,
                patente: item.vehiculo?.patente || "Sin camión",
                camion: item.vehiculo ? `${item.vehiculo.marca} ${item.vehiculo.modelo}`.trim() : "Sin asignar",
                conductor: nombrePersona(item.conductor, "Sin conductor"),
                peoneta: peonetasDe(item),
                ordenes: carga.ordenes,
                ordenesDetalle: carga.ordenesDetalle,
                kilos: carga.kilos,
                m3: carga.m3
            };
        }),
        entregas: entregas.map((item) => ({
            fecha: item.fechaEntrega,
            numeroOT: item.orden_transporte?.numeroOT || "—",
            cliente: item.orden_transporte?.cliente?.razonSocial || "—",
            resultado: item.resultadoEntrega,
            receptor: item.nombreReceptor || "—",
            motivo: item.motivoResultado || "",
            valor: dinero(item.orden_transporte?.valorTotal)
        }))
    };
};

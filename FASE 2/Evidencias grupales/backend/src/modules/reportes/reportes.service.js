/*
  INFORME DEL ADMINISTRADOR
  diaChile y rango     convierten el período (día, semana, mes, año) en fechas
  serieDelPeriodo      arma la serie de los gráficos
  obtenerInforme       devuelve ingresos, órdenes, entregas y camiones
  seccionesDePagos     pagos por método y cuadraturas del período
  seccionMorosidad     deuda por cliente al día de hoy (no depende del período)
  Un manifiesto entra al informe de camiones solo si tiene órdenes y cada
  una quedó Entregada o Rechazada. La fecha que cuenta es la de salida.
*/
import prisma from "../../config/prisma.js";
import { calcularMorosidad } from "../pagos/morosidad.service.js";

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

// Valores de pago.metodoPago (ver pagos.service.js y manifiestos.service.js).
// Webpay guarda TARJETA y deja "Webpay ..." en la observación: así se separa de la tarjeta presencial.
const NOMBRES_METODO = {
    EFECTIVO: "Efectivo",
    TRANSFERENCIA: "Transferencia",
    TARJETA: "Tarjeta presencial (caja o reparto)",
    WEBPAY: "Tarjeta por Webpay",
    CHEQUE: "Cheque",
    SIN_METODO: "Sin método registrado"
};

const claveMetodo = (pago) => {
    const metodo = String(pago.metodoPago || "").trim().toUpperCase();
    const porWebpay = String(pago.observacion || "").trim().toUpperCase().startsWith("WEBPAY");
    if (metodo === "TRANSBANK" || (metodo === "TARJETA" && porWebpay)) {
        return "WEBPAY";
    }
    return metodo || "SIN_METODO";
};

const nombreMetodo = (clave) => NOMBRES_METODO[clave] || clave;

// Pagos PAGADOS cuya fechaPago cae en el período: resumen por método y lista de cuadraturas.
const seccionesDePagos = async (desde, hasta) => {
    const pagos = await prisma.pago.findMany({
        where: {
            estadoPago: "PAGADO",
            fechaPago: { gte: desde, lt: hasta }
        },
        orderBy: { fechaPago: "desc" },
        select: {
            idPago: true,
            fechaPago: true,
            monto: true,
            metodoPago: true,
            observacion: true,
            orden_transporte: {
                select: {
                    numeroOT: true,
                    cliente: { select: { razonSocial: true } }
                }
            }
        }
    });

    const porMetodo = new Map();
    for (const pago of pagos) {
        const clave = claveMetodo(pago);
        const actual = porMetodo.get(clave) || { metodo: clave, nombre: nombreMetodo(clave), cantidad: 0, monto: 0 };
        actual.cantidad += 1;
        actual.monto += dinero(pago.monto);
        porMetodo.set(clave, actual);
    }

    // cuadrarManifiesto deja la observación "Cuadrado en MAN-000001: efectivo".
    const cuadrados = pagos
        .map((pago) => ({ pago, coincide: /^Cuadrado en (\S+?):/i.exec(String(pago.observacion || "")) }))
        .filter((item) => item.coincide)
        .map(({ pago, coincide }) => ({
            idPago: pago.idPago,
            fecha: pago.fechaPago,
            manifiesto: coincide[1],
            numeroOT: pago.orden_transporte?.numeroOT || "—",
            cliente: pago.orden_transporte?.cliente?.razonSocial || "—",
            metodo: nombreMetodo(claveMetodo(pago)),
            monto: dinero(pago.monto)
        }));

    return {
        pagos: {
            porMetodo: [...porMetodo.values()].sort((a, b) => b.monto - a.monto),
            cantidad: pagos.length,
            monto: pagos.reduce((suma, pago) => suma + dinero(pago.monto), 0)
        },
        cuadraturas: {
            detalle: cuadrados,
            cantidad: cuadrados.length,
            total: cuadrados.reduce((suma, item) => suma + item.monto, 0)
        }
    };
};

// Deuda por cliente al día de hoy, con el mismo cálculo que usan las alertas de morosidad.
const seccionMorosidad = async () => {
    const { diasGracia, otImpagas, cuentasSobreLimite } = await calcularMorosidad();
    const porCliente = new Map();
    const filaDe = (item) => {
        if (!porCliente.has(item.idCliente)) {
            porCliente.set(item.idCliente, {
                idCliente: item.idCliente,
                cliente: item.cliente,
                rut: item.rut,
                otImpagas: [],
                montoOtImpagas: 0,
                sobreLimite: false,
                saldoCuenta: 0,
                limiteCuenta: 0,
                excesoCuenta: 0,
                deudaTotal: 0
            });
        }
        return porCliente.get(item.idCliente);
    };
    for (const orden of otImpagas) {
        const fila = filaDe(orden);
        fila.otImpagas.push({
            numeroOT: orden.numeroOT,
            monto: orden.monto,
            fechaEntrega: orden.fechaEntrega,
            diasDesdeEntrega: orden.diasDesdeEntrega
        });
        fila.montoOtImpagas += orden.monto;
    }
    for (const cuenta of cuentasSobreLimite) {
        const fila = filaDe(cuenta);
        fila.sobreLimite = true;
        fila.saldoCuenta = cuenta.saldo;
        fila.limiteCuenta = cuenta.limite;
        fila.excesoCuenta = cuenta.exceso;
    }
    const clientes = [...porCliente.values()]
        .map((fila) => ({ ...fila, deudaTotal: fila.montoOtImpagas + fila.saldoCuenta }))
        .sort((a, b) => b.deudaTotal - a.deudaTotal);

    return {
        fecha: new Date(),
        diasGracia,
        clientes,
        totales: {
            clientes: clientes.length,
            otImpagas: otImpagas.length,
            montoOtImpagas: otImpagas.reduce((suma, orden) => suma + orden.monto, 0),
            cuentasSobreLimite: cuentasSobreLimite.length,
            saldoCuentasSobreLimite: cuentasSobreLimite.reduce((suma, cuenta) => suma + cuenta.saldo, 0),
            deudaTotal: clientes.reduce((suma, fila) => suma + fila.deudaTotal, 0)
        }
    };
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

    // Secciones nuevas. Si una falla, el resto del informe se entrega igual y esa sección va en null.
    const [seccionPagos, morosidad] = await Promise.all([
        seccionesDePagos(desde, hasta).catch((error) => {
            console.error("Error en la sección de pagos del informe:", error);
            return { pagos: null, cuadraturas: null };
        }),
        seccionMorosidad().catch((error) => {
            console.error("Error en la sección de morosidad del informe:", error);
            return null;
        })
    ]);

    return {
        periodo: modo,
        etiqueta,
        desde,
        hasta,
        pagos: seccionPagos.pagos,
        cuadraturas: seccionPagos.cuadraturas,
        morosidad,
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

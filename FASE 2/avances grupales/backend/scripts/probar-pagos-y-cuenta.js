import prisma from "../src/config/prisma.js";
import { crearOrdenTransporte } from "../src/modules/ordenes/ordenesTransporte.service.js";

const resultados = [];

const registrar = (nombre, ok, detalle) => {
    resultados.push({ prueba: nombre, resultado: ok ? "OK" : "FALLA", detalle });
    console.log(`${ok ? "OK" : "FALLA"}  ${nombre}${detalle ? ` — ${detalle}` : ""}`);
};

const assert = (nombre, condicion, detalle) => {
    registrar(nombre, Boolean(condicion), condicion ? detalle : (detalle || "condición falsa"));
};

const payloadBase = ({ idCliente, idComunaOrigen, idComunaDestino, idTipoBulto, extra = {} }) => ({
    direccionOrigen: "Av. Prueba 100",
    direccionDestino: "Calle Destino 200",
    idCliente,
    idComunaOrigen,
    idComunaDestino,
    tipoZona: "URBANA",
    requiereRetiro: false,
    tipoServicio: "NORMAL",
    tipoDocumento: "SIN_DOCUMENTO",
    cargas: [{
        idTipoBulto,
        descripcion: "Carga prueba pago",
        cantidad: 1,
        pesoUnitario: 1,
        largoCm: 10,
        anchoCm: 10,
        altoCm: 10
    }],
    recargos: [],
    pagadoPor: "REMITENTE",
    ...extra
});

const crearYLeerPago = async (datos, idUsuario) => {
    const orden = await crearOrdenTransporte(datos, idUsuario);
    const pago = await prisma.pago.findFirst({
        where: { idOrden: orden.idOrden },
        orderBy: { idPago: "desc" }
    });
    return { orden, pago };
};

try {
    const usuario = await prisma.usuario.findFirst({
        where: {
            estado: true,
            rol: { nombreRol: { in: ["OPERADOR", "ADMINISTRADOR"] } }
        },
        include: { rol: true }
    });
    if (!usuario) {
        throw new Error("No hay usuario operador/administrador activo");
    }

    const [comunaOrigen, comunaDestino] = await prisma.comuna.findMany({ take: 2 });
    const tipoBulto = await prisma.tipo_bulto.findFirst();
    const tarifa = await prisma.tarifa.findFirst({ where: { estado: true } });

    if (!comunaOrigen || !comunaDestino || !tipoBulto || !tarifa) {
        throw new Error("Faltan comuna, tipo de bulto o tarifario para las pruebas");
    }

    const ids = {
        idComunaOrigen: comunaOrigen.idComuna,
        idComunaDestino: comunaDestino.idComuna,
        idTipoBulto: tipoBulto.idTipoBulto
    };

    let clienteContado = await prisma.cliente.findFirst({
        where: { estado: true, idTarifa: { not: null } }
    });
    if (!clienteContado) {
        clienteContado = await prisma.cliente.create({
            data: {
                rut: "11111111-1",
                razonSocial: "Cliente prueba pagos",
                direccion: "Calle 1",
                idComuna: comunaOrigen.idComuna,
                idTarifa: tarifa.idTarifa,
                estado: true
            }
        });
    }

    let clienteCuenta = await prisma.cliente.findFirst({
        where: {
            estado: true,
            cuenta_corriente: { is: { estado: true } }
        },
        include: { cuenta_corriente: true }
    });

    if (!clienteCuenta) {
        clienteCuenta = await prisma.cliente.create({
            data: {
                rut: "22222222-2",
                razonSocial: "Cliente prueba cuenta",
                direccion: "Calle 2",
                idComuna: comunaOrigen.idComuna,
                idTarifa: tarifa.idTarifa,
                estado: true,
                cuenta_corriente: {
                    create: {
                        fechaApertura: new Date(),
                        limiteCredito: 5000000,
                        saldoActual: 0,
                        estado: true
                    }
                }
            },
            include: { cuenta_corriente: true }
        });
    } else {
        await prisma.cuenta_corriente.update({
            where: { idCuenta: clienteCuenta.cuenta_corriente.idCuenta },
            data: { estado: true, limiteCredito: 5000000 }
        });
        clienteCuenta = await prisma.cliente.findUnique({
            where: { idCliente: clienteCuenta.idCliente },
            include: { cuenta_corriente: true }
        });
    }

    let clienteAjeno = await prisma.cliente.findFirst({
        where: {
            estado: true,
            idCliente: { not: clienteCuenta.idCliente },
            idTarifa: { not: null }
        }
    });
    if (!clienteAjeno) {
        clienteAjeno = await prisma.cliente.create({
            data: {
                rut: `77${Date.now().toString().slice(-6)}-7`.slice(0, 12),
                razonSocial: "Cliente sin esa cuenta",
                direccion: "Calle 3",
                idComuna: comunaOrigen.idComuna,
                idTarifa: tarifa.idTarifa,
                estado: true
            }
        });
    }

    const idUsuario = usuario.idUsuario;
    const baseContado = { ...ids, idCliente: clienteContado.idCliente };
    const baseCuenta = { ...ids, idCliente: clienteCuenta.idCliente };
    const idCuenta = clienteCuenta.cuenta_corriente.idCuenta;

    for (const metodo of ["EFECTIVO", "TRANSFERENCIA", "TARJETA"]) {
        try {
            const { orden, pago } = await crearYLeerPago(
                payloadBase({
                    ...baseContado,
                    extra: { tipoPago: "CONTADO", metodoPago: metodo }
                }),
                idUsuario
            );
            assert(
                `Contado ${metodo}`,
                pago?.estadoPago === "PAGADO" && pago?.tipoPago === "CONTADO" && pago?.metodoPago === metodo && !pago?.idCuenta,
                `${orden.numeroOT} estado=${pago.estadoPago}`
            );
        } catch (error) {
            registrar(`Contado ${metodo}`, false, error.message);
        }
    }

    try {
        const { orden, pago } = await crearYLeerPago(
            payloadBase({
                ...baseContado,
                extra: { tipoPago: "POR_PAGAR", pagadoPor: "DESTINATARIO" }
            }),
            idUsuario
        );
        assert(
            "Por pagar",
            pago?.estadoPago === "PENDIENTE" && pago?.tipoPago === "POR_PAGAR" && !pago?.metodoPago && pago?.pagadoPor === "DESTINATARIO",
            `${orden.numeroOT} estado=${pago.estadoPago}`
        );
    } catch (error) {
        registrar("Por pagar", false, error.message);
    }

    try {
        await crearOrdenTransporte(
            payloadBase({
                ...baseContado,
                extra: { tipoPago: "CONTADO" }
            }),
            idUsuario
        );
        registrar("Contado sin método (debe fallar)", false, "se creó la OT");
    } catch (error) {
        assert("Contado sin método (debe fallar)", /método de pago/i.test(error.message), error.message);
    }

    const saldoAntes = Number(clienteCuenta.cuenta_corriente.saldoActual) || 0;
    try {
        const { orden, pago } = await crearYLeerPago(
            payloadBase({
                ...baseCuenta,
                extra: { tipoPago: "CUENTA_CORRIENTE", idCuenta }
            }),
            idUsuario
        );
        const cuentaDespues = await prisma.cuenta_corriente.findUnique({ where: { idCuenta } });
        const movimiento = await prisma.movimiento_cuenta.findFirst({
            where: { idOrden: orden.idOrden, tipoMovimiento: "CARGO" }
        });
        const saldoDespues = Number(cuentaDespues.saldoActual);
        const monto = Number(pago.monto);
        assert(
            "Cuenta corriente cargo",
            pago?.tipoPago === "CUENTA_CORRIENTE"
                && pago?.idCuenta === idCuenta
                && pago?.estadoPago === "PENDIENTE"
                && movimiento
                && Math.abs(saldoDespues - (saldoAntes + monto)) < 0.02,
            `${orden.numeroOT} saldo ${saldoAntes} → ${saldoDespues}`
        );
    } catch (error) {
        registrar("Cuenta corriente cargo", false, error.message);
    }

    try {
        await crearOrdenTransporte(
            payloadBase({
                ...baseCuenta,
                extra: { tipoPago: "CUENTA_CORRIENTE" }
            }),
            idUsuario
        );
        registrar("Cuenta corriente sin idCuenta (debe fallar)", false, "se creó la OT");
    } catch (error) {
        assert(
            "Cuenta corriente sin idCuenta (debe fallar)",
            /cuenta corriente/i.test(error.message),
            error.message
        );
    }

    try {
        await crearOrdenTransporte(
            payloadBase({
                ...ids,
                idCliente: clienteAjeno.idCliente,
                extra: { tipoPago: "CUENTA_CORRIENTE", idCuenta }
            }),
            idUsuario
        );
        registrar("Cuenta de otro cliente (debe fallar)", false, "se creó la OT");
    } catch (error) {
        assert(
            "Cuenta de otro cliente (debe fallar)",
            /no pertenece/i.test(error.message),
            error.message
        );
    }

    const limiteOriginal = Number(clienteCuenta.cuenta_corriente.limiteCredito);
    const saldoActual = Number((await prisma.cuenta_corriente.findUnique({ where: { idCuenta } })).saldoActual);
    await prisma.cuenta_corriente.update({
        where: { idCuenta },
        data: { limiteCredito: saldoActual }
    });
    try {
        await crearOrdenTransporte(
            payloadBase({
                ...baseCuenta,
                extra: { tipoPago: "CUENTA_CORRIENTE", idCuenta }
            }),
            idUsuario
        );
        registrar("Sin cupo (debe fallar)", false, "se creó la OT");
    } catch (error) {
        assert("Sin cupo (debe fallar)", /crédito suficiente|credito suficiente/i.test(error.message), error.message);
    } finally {
        await prisma.cuenta_corriente.update({
            where: { idCuenta },
            data: { limiteCredito: limiteOriginal }
        });
    }

    await prisma.cuenta_corriente.update({
        where: { idCuenta },
        data: { estado: false }
    });
    try {
        await crearOrdenTransporte(
            payloadBase({
                ...baseCuenta,
                extra: { tipoPago: "CUENTA_CORRIENTE", idCuenta }
            }),
            idUsuario
        );
        registrar("Cuenta inactiva (debe fallar)", false, "se creó la OT");
    } catch (error) {
        assert("Cuenta inactiva (debe fallar)", /inactiva/i.test(error.message), error.message);
    } finally {
        await prisma.cuenta_corriente.update({
            where: { idCuenta },
            data: { estado: true }
        });
    }

    const fallas = resultados.filter((item) => item.resultado === "FALLA");
    console.log("\nResumen");
    console.table(resultados);
    if (fallas.length) {
        process.exitCode = 1;
    }
} catch (error) {
    console.error("No se pudieron ejecutar las pruebas:", error);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}

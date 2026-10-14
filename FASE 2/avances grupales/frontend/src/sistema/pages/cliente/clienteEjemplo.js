/*
  DATOS DE EJEMPLO DEL PORTAL CLIENTE
  Se usan solo mientras el backend no tenga las rutas /api/cliente/...
  Tienen la misma forma que devuelve Prisma para una orden_transporte,
  así que cuando el backend responda, las vistas no cambian.
*/

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (dias, hora = 10) => {
    const fecha = new Date(Date.now() - dias * DIA);
    fecha.setHours(hora, 30, 0, 0);
    return fecha.toISOString();
};

const region = (nombreRegion) => ({ nombreRegion });
const comuna = (idComuna, nombreComuna, nombreRegion) => ({ idComuna, nombreComuna, region: region(nombreRegion) });

export const comunas = [
    comuna(1, "Santiago", "Metropolitana"),
    comuna(2, "Puerto Montt", "Los Lagos"),
    comuna(3, "Osorno", "Los Lagos"),
    comuna(4, "Castro", "Los Lagos"),
    comuna(5, "Ancud", "Los Lagos"),
    comuna(6, "Puerto Varas", "Los Lagos")
];
const [SANTIAGO, PUERTO_MONTT, OSORNO, CASTRO, ANCUD, PUERTO_VARAS] = comunas;

const empresa = {
    idCliente: 1,
    rut: "76.123.456-0",
    razonSocial: "Comercial Austral SpA",
    nombreFantasia: "Austral",
    direccion: "El Tepual 410",
    comuna: PUERTO_MONTT
};

// Perfil del cliente: con o sin cuenta corriente según el tipo elegido en el modo ejemplo
export const perfil = (tipo) => ({
    cliente: empresa,
    cuentaCorriente: tipo === "cuenta"
        ? { idCuenta: 1, estado: true, limiteCredito: "1500000.00", saldoActual: "412300.00", fechaApertura: "2026-01-15", diasCredito: 30 }
        : null
});

const evento = (id, dias, hora, estado, descripcion, ubicacion) => ({
    idSeguimiento: id,
    fechaHora: haceDias(dias, hora),
    descripcion,
    ubicacion,
    estado_ot: { nombreEstado: estado },
    usuario: { nombre: "Equipo", apellido: "Marexpress" }
});

const carga = (id, tipo, descripcion, cantidad, pesoTotal, medidas) => ({
    idDetalleCarga: id,
    descripcion,
    cantidad,
    pesoTotal: String(pesoTotal),
    largoCm: medidas[0],
    anchoCm: medidas[1],
    altoCm: medidas[2],
    volumenM3: String((medidas[0] * medidas[1] * medidas[2] * cantidad) / 1000000),
    tipo_bulto: { nombreTipo: tipo }
});

const orden = (datos) => ({
    direccionOrigen: "Bodega Marexpress, Av. Diego Portales 2500",
    contactoDestino: "Recepción",
    telefonoDestino: "+56 9 5555 0000",
    tipoServicio: "NORMAL",
    tipoDocumento: "FACTURA",
    ...datos,
    pesoTotal: String(datos.detalle_carga.reduce((suma, item) => suma + Number(item.pesoTotal), 0)),
    volumenTotalM3: String(datos.detalle_carga.reduce((suma, item) => suma + Number(item.volumenM3), 0))
});

export const ordenes = [
    orden({
        idOrden: 31, numeroOT: "OT-000031", fechaCreacion: haceDias(1), fechaEntregaEstimada: haceDias(-2),
        comuna_orden_transporte_idComunaOrigenTocomuna: SANTIAGO, comuna_orden_transporte_idComunaDestinoTocomuna: CASTRO,
        direccionDestino: "Galvarino Riveros 340", estado_ot: { nombreEstado: "EN_TRANSITO" }, valorTotal: "85680",
        detalle_carga: [carga(1, "BULTO", "Repuestos de motor", 3, 120.5, [60, 40, 40])],
        pago: [{ estadoPago: "PENDIENTE", tipoPago: "CUENTA_CORRIENTE", monto: "85680" }],
        seguimiento_ot: [
            evento(3, 0, 6, "EN_TRANSITO", "Salida en ruta hacia Chiloé", "Ruta 5 Sur"),
            evento(2, 1, 18, "EN_BODEGA", "Recepción en bodega", "Bodega Santiago"),
            evento(1, 1, 10, "REGISTRADA", "Orden de transporte creada", "Santiago")
        ]
    }),
    orden({
        idOrden: 29, numeroOT: "OT-000029", fechaCreacion: haceDias(3), fechaEntregaEstimada: haceDias(-1),
        comuna_orden_transporte_idComunaOrigenTocomuna: SANTIAGO, comuna_orden_transporte_idComunaDestinoTocomuna: OSORNO,
        direccionDestino: "Av. Zenteno 1890", estado_ot: { nombreEstado: "EN_BODEGA" }, valorTotal: "142800", tipoServicio: "EXPRESS",
        detalle_carga: [carga(2, "PALLET", "Insumos agrícolas", 1, 420, [120, 100, 110])],
        pago: [{ estadoPago: "PENDIENTE", tipoPago: "CUENTA_CORRIENTE", monto: "142800" }],
        seguimiento_ot: [
            evento(5, 2, 17, "EN_BODEGA", "Recepción en bodega", "Bodega Santiago"),
            evento(4, 3, 11, "REGISTRADA", "Orden de transporte creada", "Santiago")
        ]
    }),
    orden({
        idOrden: 24, numeroOT: "OT-000024", fechaCreacion: haceDias(12), fechaEntregaEstimada: haceDias(8),
        comuna_orden_transporte_idComunaOrigenTocomuna: SANTIAGO, comuna_orden_transporte_idComunaDestinoTocomuna: PUERTO_MONTT,
        direccionDestino: "Parque Industrial Alerce, lote 12", estado_ot: { nombreEstado: "ENTREGADA" }, valorTotal: "96390",
        detalle_carga: [carga(3, "BULTO", "Cajas de herramientas", 5, 98, [50, 35, 30])],
        pago: [{ estadoPago: "PENDIENTE", tipoPago: "CUENTA_CORRIENTE", monto: "96390" }],
        seguimiento_ot: [
            evento(9, 8, 15, "ENTREGADA", "Entregada a Juan Pérez", "Puerto Montt"),
            evento(8, 9, 7, "EN_TRANSITO", "Salida en ruta", "Ruta 5 Sur"),
            evento(7, 11, 16, "EN_BODEGA", "Recepción en bodega", "Bodega Santiago"),
            evento(6, 12, 10, "REGISTRADA", "Orden de transporte creada", "Santiago")
        ]
    }),
    orden({
        idOrden: 18, numeroOT: "OT-000018", fechaCreacion: haceDias(41), fechaEntregaEstimada: haceDias(37),
        comuna_orden_transporte_idComunaOrigenTocomuna: SANTIAGO, comuna_orden_transporte_idComunaDestinoTocomuna: ANCUD,
        direccionDestino: "Prat 520", estado_ot: { nombreEstado: "ENTREGADA" }, valorTotal: "61880",
        detalle_carga: [carga(4, "SACO", "Alimento para mascotas", 8, 200, [70, 45, 15])],
        pago: [{ estadoPago: "PENDIENTE", tipoPago: "CUENTA_CORRIENTE", monto: "61880" }],
        seguimiento_ot: [
            evento(12, 37, 14, "ENTREGADA", "Entregada en destino", "Ancud"),
            evento(11, 39, 18, "EN_BODEGA", "Recepción en bodega", "Bodega Santiago"),
            evento(10, 41, 9, "REGISTRADA", "Orden de transporte creada", "Santiago")
        ]
    }),
    orden({
        idOrden: 15, numeroOT: "OT-000015", fechaCreacion: haceDias(48), fechaEntregaEstimada: haceDias(44),
        comuna_orden_transporte_idComunaOrigenTocomuna: SANTIAGO, comuna_orden_transporte_idComunaDestinoTocomuna: PUERTO_VARAS,
        direccionDestino: "San José 211", estado_ot: { nombreEstado: "ENTREGADA" }, valorTotal: "53550",
        detalle_carga: [carga(5, "BULTO", "Documentación y muestras", 2, 18, [40, 30, 20])],
        pago: [{ estadoPago: "PAGADO", tipoPago: "CUENTA_CORRIENTE", monto: "53550" }],
        seguimiento_ot: [
            evento(14, 44, 12, "ENTREGADA", "Entregada en destino", "Puerto Varas"),
            evento(13, 48, 9, "REGISTRADA", "Orden de transporte creada", "Santiago")
        ]
    }),
    orden({
        idOrden: 12, numeroOT: "OT-000012", fechaCreacion: haceDias(55), fechaEntregaEstimada: haceDias(51),
        comuna_orden_transporte_idComunaOrigenTocomuna: SANTIAGO, comuna_orden_transporte_idComunaDestinoTocomuna: CASTRO,
        direccionDestino: "Blanco 155", estado_ot: { nombreEstado: "ANULADA" }, valorTotal: "0",
        detalle_carga: [carga(6, "BULTO", "Repuestos", 1, 25, [40, 40, 40])],
        pago: [],
        seguimiento_ot: [
            evento(16, 54, 10, "ANULADA", "Anulada a pedido del cliente", "Santiago"),
            evento(15, 55, 9, "REGISTRADA", "Orden de transporte creada", "Santiago")
        ]
    })
];

// Cotizaciones ya hechas por el cliente (para el informe)
export const cotizaciones = [
    {
        idCotizacion: 7, numero: "COT-000007", fecha: haceDias(2), tipoServicio: "NORMAL",
        comunaOrigen: SANTIAGO, comunaDestino: CASTRO, cantidadBultos: 3, pesoTotal: 120.5, volumenM3: 0.288,
        valorNeto: 72000, valorIva: 13680, valorTotal: 85680, validaHasta: haceDias(-13), estado: "CONVERTIDA", numeroOT: "OT-000031"
    },
    {
        idCotizacion: 6, numero: "COT-000006", fecha: haceDias(9), tipoServicio: "EXPRESS",
        comunaOrigen: SANTIAGO, comunaDestino: OSORNO, cantidadBultos: 1, pesoTotal: 420, volumenM3: 1.32,
        valorNeto: 120000, valorIva: 22800, valorTotal: 142800, validaHasta: haceDias(-6), estado: "VIGENTE"
    },
    {
        idCotizacion: 4, numero: "COT-000004", fecha: haceDias(30), tipoServicio: "NORMAL",
        comunaOrigen: SANTIAGO, comunaDestino: ANCUD, cantidadBultos: 8, pesoTotal: 200, volumenM3: 0.378,
        valorNeto: 52000, valorIva: 9880, valorTotal: 61880, validaHasta: haceDias(15), estado: "VENCIDA"
    }
];

// Cálculo REFERENCIAL de ejemplo. El precio real lo calcula el backend con los tarifarios.
export const calcularEjemplo = ({ pesoTotal, volumenM3, tipoServicio }) => {
    const pesoCobrable = Math.max(pesoTotal, volumenM3 * 250);
    const recargoExpress = tipoServicio === "EXPRESS" ? 1.3 : 1;
    const valorNeto = Math.round(((12000 + pesoCobrable * 380) * recargoExpress) / 10) * 10;
    const valorIva = Math.round(valorNeto * 0.19);
    return { valorNeto, valorIva, valorTotal: valorNeto + valorIva };
};

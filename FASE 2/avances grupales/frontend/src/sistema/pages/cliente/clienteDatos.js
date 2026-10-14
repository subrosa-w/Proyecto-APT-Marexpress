import { api } from "../../api.js";
import * as ejemplo from "./clienteEjemplo.js";

/*
  ============================================================
  PORTAL CLIENTE - Llamadas al backend
  ============================================================
  ENDPOINTS QUE EL BACKEND DEBE CREAR (módulo "cliente", solo rol CLIENTE).
  El cliente se obtiene del JWT: usuario → cliente_usuario → cliente.
  Nunca se recibe el idCliente por URL, para que un cliente no vea datos de otro.

  GET  /api/cliente/perfil
       → { cliente: {...}, cuentaCorriente: { estado, limiteCredito, saldoActual, diasCredito } | null }
         Si cuentaCorriente viene activa, el usuario ve el portal de cuenta corriente.
  GET  /api/cliente/ordenes
       → [orden_transporte] con estado_ot, comunas origen/destino, detalle_carga y pago
  GET  /api/cliente/ordenes/:id
       → orden_transporte + seguimiento_ot (con estado_ot y usuario) para la línea de tiempo
  GET  /api/cliente/pagos/pendientes              (solo con cuenta corriente)
       → [{ idOrden, numeroOT, destino, fechaEmision, fechaVencimiento, monto, diasAtraso, atrasada }]
  POST /api/cliente/pagos/webpay/iniciar          (solo con cuenta corriente)
       body { idOrdenes: [..] } → { url, token }   (mismo flujo Webpay que usa el operador)
  POST /api/cliente/cotizaciones                  (solo con cuenta corriente)
       body { idComunaOrigen, idComunaDestino, tipoServicio, bultos: [{ tipo, cantidad, pesoUnitario, largoCm, anchoCm, altoCm }] }
       → cotización guardada (numero, valorNeto, valorIva, valorTotal, validaHasta, estado)
       Necesita una tabla nueva "cotizacion" en la base de datos.
  GET  /api/cliente/cotizaciones                  (solo con cuenta corriente)
       → [cotización] del cliente, la más reciente primero

  Mientras esas rutas no existan (el backend responde 404 o 403), cada función
  usa los datos de clienteEjemplo.js y devuelve ejemplo: true para avisarlo en pantalla.
  ============================================================
*/

const CLAVE_PAGADAS = "marexpress_cliente_pagadas";
const CLAVE_COTIZACIONES = "marexpress_cliente_cotizaciones";
const DIA = 24 * 60 * 60 * 1000;

const leer = (clave) => {
    try {
        return JSON.parse(sessionStorage.getItem(clave)) || [];
    } catch {
        return [];
    }
};

// Intenta la ruta real; si el backend todavía no la tiene, usa el ejemplo
async function conRespaldo(llamada, respaldo) {
    try {
        return { datos: await llamada(), ejemplo: false };
    } catch (error) {
        if (error.status === 404 || error.status === 403) {
            return { datos: respaldo(), ejemplo: true };
        }
        throw error;
    }
}

const lista = (datos, clave) => (Array.isArray(datos) ? datos : datos?.[clave] || datos?.data || []);

// OT de ejemplo, marcando como pagadas las que se pagaron en esta sesión
const ordenesEjemplo = () => {
    const pagadas = leer(CLAVE_PAGADAS);
    return ejemplo.ordenes.map((orden) =>
        pagadas.includes(orden.idOrden)
            ? { ...orden, pago: [{ ...orden.pago[0], estadoPago: "PAGADO" }] }
            : orden
    );
};

export const obtenerPerfil = (tipoEjemplo) =>
    conRespaldo(() => api("/cliente/perfil"), () => ejemplo.perfil(tipoEjemplo));

export const obtenerOrdenes = () =>
    conRespaldo(async () => lista(await api("/cliente/ordenes"), "ordenes"), ordenesEjemplo);

export const obtenerOrden = (idOrden) =>
    conRespaldo(
        () => api(`/cliente/ordenes/${idOrden}`),
        () => ordenesEjemplo().find((orden) => orden.idOrden === idOrden)
    );

// Las OT con pago pendiente vencen a los "diasCredito" días de emitidas (30 por defecto)
export const obtenerPendientesPago = (diasCredito = 30) =>
    conRespaldo(
        async () => lista(await api("/cliente/pagos/pendientes"), "pendientes"),
        () => ordenesEjemplo()
            .filter((orden) => orden.pago?.[0]?.estadoPago === "PENDIENTE")
            .map((orden) => {
                const vence = new Date(new Date(orden.fechaCreacion).getTime() + diasCredito * DIA);
                const diasAtraso = Math.max(0, Math.floor((Date.now() - vence.getTime()) / DIA));
                return {
                    idOrden: orden.idOrden,
                    numeroOT: orden.numeroOT,
                    destino: orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna,
                    fechaEmision: orden.fechaCreacion,
                    fechaVencimiento: vence.toISOString(),
                    monto: Number(orden.valorTotal),
                    diasAtraso,
                    atrasada: diasAtraso > 0
                };
            })
    );

// Real: devuelve { url, token } para ir a Webpay. Ejemplo: marca las OT como pagadas.
export const pagarOrdenes = (idOrdenes) =>
    conRespaldo(
        () => api("/cliente/pagos/webpay/iniciar", { method: "POST", body: JSON.stringify({ idOrdenes }) }),
        () => {
            const pagadas = new Set([...leer(CLAVE_PAGADAS), ...idOrdenes]);
            sessionStorage.setItem(CLAVE_PAGADAS, JSON.stringify([...pagadas]));
            return { simulado: true };
        }
    );

// Comunas: esta ruta ya existe y permite al rol CLIENTE
export const obtenerComunas = () =>
    conRespaldo(async () => lista(await api("/comunas"), "comunas"), () => ejemplo.comunas);

export const cotizar = (solicitud, comunas) =>
    conRespaldo(
        () => api("/cliente/cotizaciones", { method: "POST", body: JSON.stringify(solicitud) }),
        () => {
            const guardadas = leer(CLAVE_COTIZACIONES);
            const pesoTotal = solicitud.bultos.reduce((s, b) => s + b.pesoUnitario * b.cantidad, 0);
            const volumenM3 = solicitud.bultos.reduce((s, b) => s + (b.largoCm * b.anchoCm * b.altoCm * b.cantidad) / 1000000, 0);
            const numero = 8 + guardadas.length;
            const cotizacion = {
                idCotizacion: numero,
                numero: `COT-${String(numero).padStart(6, "0")}`,
                fecha: new Date().toISOString(),
                tipoServicio: solicitud.tipoServicio,
                comunaOrigen: comunas.find((c) => c.idComuna === solicitud.idComunaOrigen),
                comunaDestino: comunas.find((c) => c.idComuna === solicitud.idComunaDestino),
                cantidadBultos: solicitud.bultos.reduce((s, b) => s + b.cantidad, 0),
                pesoTotal,
                volumenM3,
                ...ejemplo.calcularEjemplo({ pesoTotal, volumenM3, tipoServicio: solicitud.tipoServicio }),
                validaHasta: new Date(Date.now() + 15 * DIA).toISOString(),
                estado: "VIGENTE"
            };
            sessionStorage.setItem(CLAVE_COTIZACIONES, JSON.stringify([cotizacion, ...guardadas]));
            return cotizacion;
        }
    );

export const obtenerCotizaciones = () =>
    conRespaldo(
        async () => lista(await api("/cliente/cotizaciones"), "cotizaciones"),
        () => [...leer(CLAVE_COTIZACIONES), ...ejemplo.cotizaciones]
    );

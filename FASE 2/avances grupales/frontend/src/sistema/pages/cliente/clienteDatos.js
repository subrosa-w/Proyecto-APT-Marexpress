import { api } from "../../api.js";

/*
  ============================================================
  PORTAL CLIENTE - Llamadas al backend (/api/cliente, solo rol CLIENTE)
  ============================================================
  El backend obtiene la empresa desde el JWT: usuario → cliente_usuario → cliente.
  Nunca se envía el idCliente, para que un cliente no vea datos de otro.

  Cliente normal y con cuenta corriente:
    GET  /cliente/perfil          → { usuario, cliente, cuentaCorriente | null }
    GET  /cliente/ordenes         → { ordenes }
    GET  /cliente/ordenes/:id     → { orden } con seguimiento_ot e historial_ot
    GET  /cliente/tipos-bulto     → { tipos }
  Solo cliente con cuenta corriente (si no, el backend responde 403):
    GET  /cliente/pagos/pendientes        → { pendientes }
    POST /cliente/pagos/webpay/iniciar    → { url, token } para ir a Webpay
    GET  /cliente/cotizaciones            → { cotizaciones }
    POST /cliente/cotizaciones            → cotización guardada
  ============================================================
*/

export const obtenerPerfil = () => api("/cliente/perfil");

export const obtenerOrdenes = async () => (await api("/cliente/ordenes")).ordenes || [];

export const obtenerOrden = async (idOrden) => (await api(`/cliente/ordenes/${idOrden}`)).orden;

export const obtenerPendientesPago = async () => (await api("/cliente/pagos/pendientes")).pendientes || [];

export const pagarOrdenes = (idOrdenes) =>
    api("/cliente/pagos/webpay/iniciar", { method: "POST", body: JSON.stringify({ idOrdenes }) });

// Esta ruta es la misma que usan los demás roles y permite al rol CLIENTE
export const obtenerComunas = async () => {
    const datos = await api("/comunas");
    return Array.isArray(datos) ? datos : datos?.comunas || datos?.data || [];
};

export const obtenerTiposBulto = async () => (await api("/cliente/tipos-bulto")).tipos || [];

export const cotizar = (solicitud) =>
    api("/cliente/cotizaciones", { method: "POST", body: JSON.stringify(solicitud) });

export const obtenerCotizaciones = async () => (await api("/cliente/cotizaciones")).cotizaciones || [];

import { obtenerClientes, buscarClientes, crearCliente , obtenerCuentaCorrientePorCliente, asignarTarifaCliente, obtenerResumenCuentas, obtenerPlanillaMes, cerrarPlanillaMes } from "./clientes.service.js";

export const listarClientes = async (req, res) => {
    try {
        const clientes = await obtenerClientes();
        res.json(clientes);
    } catch (error) {
        console.error("Error al listar clientes:", error);
        res.status(500).json({
            mensaje: "Error interno al obtener los clientes"
        });
    }
};

export const buscarCliente = async (req, res) => {
    try {
        const termino = req.query.q?.trim();

        if (!termino) {
            return res.status(400).json({
                mensaje: "Debe ingresar un t�rmino de b�squeda"
            });
        }

        const clientes = await buscarClientes(termino);
        res.json(clientes);
    } catch (error) {
        console.error("Error al buscar clientes:", error);
        res.status(500).json({
            mensaje: "Error interno al buscar clientes"
        });
    }
};

export const registrarCliente = async (req, res) => {
    try {
        const cliente = await crearCliente(req.body);

        res.status(201).json({
            mensaje: "Cliente creado correctamente",
            cliente
        });
    } catch (error) {
        console.error("Error al crear cliente:", error);

        res.status(500).json({
            mensaje: "Error interno al crear el cliente"
        });
    }
};

export const listarResumenCuentas = async (req, res) => {
    try {
        const resumen = await obtenerResumenCuentas({
            periodo: req.query.periodo,
            fecha: req.query.fecha
        });
        res.json(resumen);
    } catch (error) {
        console.error("Error al resumir cuentas corrientes:", error);
        res.status(500).json({
            mensaje: "No fue posible cargar las cuentas corrientes"
        });
    }
};

export const verPlanillaMes = async (req, res) => {
    try {
        const planilla = await obtenerPlanillaMes(req.query.mes);
        res.json({ ok: true, planilla });
    } catch (error) {
        res.status(error.status || 500).json({
            mensaje: error.message || "No fue posible armar la planilla"
        });
    }
};

export const cerrarMesCuenta = async (req, res) => {
    try {
        const planilla = await cerrarPlanillaMes(req.body?.mes, req.user?.idUsuario);
        res.json({ ok: true, mensaje: "Cierre del mes registrado.", planilla });
    } catch (error) {
        res.status(error.status || 500).json({
            mensaje: error.message || "No fue posible cerrar el mes"
        });
    }
};

export const obtenerCuentaCorrienteCliente = async (req, res) => {
    try {
        const idCliente = Number(req.params.id);

        if (!Number.isInteger(idCliente) || idCliente <= 0) {
            return res.status(400).json({
                mensaje: "El ID del cliente no es válido"
            });
        }

        const cuenta =
            await obtenerCuentaCorrientePorCliente(idCliente);

        if (!cuenta) {
            return res.status(404).json({
                mensaje: "El cliente no tiene cuenta corriente"
            });
        }

        res.json(cuenta);

    } catch (error) {
        console.error(
            "Error al obtener cuenta corriente del cliente:",
            error
        );

        res.status(500).json({
            mensaje: "Error interno al obtener la cuenta corriente"
        });
    }
};

export const actualizarTarifaCliente = async (req, res) => {
    try {
        const idCliente = Number(req.params.id);
        const idTarifa = Number(req.body.idTarifa);

        if (!Number.isInteger(idCliente) || idCliente <= 0) {
            return res.status(400).json({
                mensaje: "El ID del cliente no es válido"
            });
        }

        if (!Number.isInteger(idTarifa) || idTarifa <= 0) {
            return res.status(400).json({
                mensaje: "Debe seleccionar un tarifario válido"
            });
        }

        const cliente = await asignarTarifaCliente(idCliente, idTarifa);
        res.json({
            mensaje: "Tarifario asignado al cliente",
            cliente
        });
    } catch (error) {
        res.status(400).json({
            mensaje: error.message || "No fue posible asignar el tarifario"
        });
    }
};
import { obtenerClientes, buscarClientes, crearCliente , obtenerCuentaCorrientePorCliente } from "../services/clientes.service.js";

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
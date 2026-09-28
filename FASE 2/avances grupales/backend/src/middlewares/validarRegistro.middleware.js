export const validarRegistro = (req, res, next) => {
    const {
        nombre,
        apellido,
        rut,
        correo,
        nombreUsuario,
        password
    } = req.body;

    if (
        !nombre?.trim() ||
        !apellido?.trim() ||
        !rut?.trim() ||
        !correo?.trim() ||
        !nombreUsuario?.trim() ||
        !password
    ) {
        return res.status(400).json({
            mensaje: "Nombre, apellido, RUT, correo, nombre de usuario y contraseña son obligatorios"
        });
    }

    const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

    if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
        return res.status(400).json({
            mensaje: "El RUT no es válido"
        });
    }

    const cuerpo = rutLimpio.slice(0, -1);
    const dvIngresado = rutLimpio.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resultado = 11 - (suma % 11);
    const dvCalculado =
        resultado === 11 ? "0" :
        resultado === 10 ? "K" :
        String(resultado);

    if (dvIngresado !== dvCalculado) {
        return res.status(400).json({
            mensaje: "El RUT no es válido"
        });
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(correo.trim())) {
        return res.status(400).json({
            mensaje: "El correo electrónico no es válido"
        });
    }

    if (nombreUsuario.trim().length < 4) {
        return res.status(400).json({
            mensaje: "El nombre de usuario debe tener al menos 4 caracteres"
        });
    }

    const passwordValida =
        password.length >= 10 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

    if (!passwordValida) {
        return res.status(400).json({
            mensaje: "La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
        });
    }

    next();
};
const token = sessionStorage.getItem("marexpress_token");
const usuarioGuardado = sessionStorage.getItem("marexpress_usuario");

const adminNombre = document.getElementById("admin-nombre");
const adminRol = document.getElementById("admin-rol");
const cerrarSesionAdmin = document.getElementById("cerrar-sesion-admin");

function cerrarSesion() {
    sessionStorage.removeItem("marexpress_token");
    sessionStorage.removeItem("marexpress_usuario");

    window.location.href = "../../index.html";
}

function validarSesionAdministrador() {
    if (!token || !usuarioGuardado) {
        cerrarSesion();
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(usuarioGuardado);
    } catch {
        cerrarSesion();
        return;
    }

    if (
        !usuario ||
        usuario.rol !== "ADMINISTRADOR"
    ) {
        cerrarSesion();
        return;
    }

    adminNombre.textContent =
        `${usuario.nombre} ${usuario.apellido}`;

    adminRol.textContent =
        usuario.rol;
}

cerrarSesionAdmin.addEventListener(
    "click",
    cerrarSesion
);

validarSesionAdministrador();
const token = sessionStorage.getItem("marexpress_token");
const usuarioGuardado = sessionStorage.getItem("marexpress_usuario");

const clienteNombre = document.getElementById("cliente-nombre");
const clienteRol = document.getElementById("cliente-rol");
const cerrarSesionCliente = document.getElementById(
    "cerrar-sesion-cliente"
);


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

function cerrarSesion() {
    sessionStorage.removeItem("marexpress_token");
    sessionStorage.removeItem("marexpress_usuario");

    window.location.href = "../../index.html";
}


/* =========================================================
   VALIDAR SESIÓN DEL CLIENTE
   ========================================================= */

function validarSesionCliente() {

    if (!token || !usuarioGuardado) {
        cerrarSesion();
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(usuarioGuardado);
    } catch (error) {
        cerrarSesion();
        return;
    }

    if (!usuario || usuario.rol !== "CLIENTE") {
        cerrarSesion();
        return;
    }

    const nombreCompleto =
        `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim();

    if (clienteNombre) {
        clienteNombre.textContent =
            nombreCompleto || usuario.nombreUsuario || "Cliente";
    }

    if (clienteRol) {
        clienteRol.textContent = usuario.rol;
    }


    /* =====================================================
       DATOS DEL PERFIL
       ===================================================== */

    const perfilNombre =
        document.getElementById("perfil-cliente-nombre");

    const perfilUsuario =
        document.getElementById("perfil-cliente-usuario");

    const perfilCorreo =
        document.getElementById("perfil-cliente-correo");

    const perfilRol =
        document.getElementById("perfil-cliente-rol");

    const perfilEstado =
        document.getElementById("perfil-cliente-estado");


    if (perfilNombre) {
        perfilNombre.textContent =
            nombreCompleto || "--";
    }

    if (perfilUsuario) {
        perfilUsuario.textContent =
            usuario.nombreUsuario ?? "--";
    }

    if (perfilCorreo) {
        perfilCorreo.textContent =
            usuario.correo ?? "--";
    }

    if (perfilRol) {
        perfilRol.textContent =
            usuario.rol ?? "--";
    }

    if (perfilEstado) {
        perfilEstado.textContent = "Sesión activa";
    }
}


/* =========================================================
   EVENTOS
   ========================================================= */

if (cerrarSesionCliente) {
    cerrarSesionCliente.addEventListener(
        "click",
        cerrarSesion
    );
}


/* =========================================================
   INICIO
   ========================================================= */

validarSesionCliente();
const token = sessionStorage.getItem("marexpress_token");
const usuarioGuardado = sessionStorage.getItem("marexpress_usuario");

const peonetaNombre = document.getElementById("peoneta-nombre");
const peonetaRol = document.getElementById("peoneta-rol");
const cerrarSesionPeoneta = document.getElementById(
    "cerrar-sesion-peoneta"
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
   VALIDAR SESIÓN DEL PEONETA
   ========================================================= */

function validarSesionPeoneta() {

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

    if (!usuario || usuario.rol !== "PEONETA") {
        cerrarSesion();
        return;
    }

    const nombreCompleto =
        `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim();

    if (peonetaNombre) {
        peonetaNombre.textContent =
            nombreCompleto || usuario.nombreUsuario || "Peoneta";
    }

    if (peonetaRol) {
        peonetaRol.textContent = usuario.rol;
    }


    /* =====================================================
       DATOS DEL PERFIL
       ===================================================== */

    const perfilNombre =
        document.getElementById("perfil-nombre");

    const perfilUsuario =
        document.getElementById("perfil-usuario");

    const perfilCorreo =
        document.getElementById("perfil-correo");

    const perfilRol =
        document.getElementById("perfil-rol");

    const perfilEstado =
        document.getElementById("perfil-estado");


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

if (cerrarSesionPeoneta) {
    cerrarSesionPeoneta.addEventListener(
        "click",
        cerrarSesion
    );
}


/* =========================================================
   INICIO
   ========================================================= */

validarSesionPeoneta();
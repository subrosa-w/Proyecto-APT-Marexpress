const API_URL = "http://localhost:3000/api";

const identificadorInput = document.getElementById("identificador");
const passwordInput = document.getElementById("password");
const loginForm = document.getElementById("login-form");
const loginSubmit = document.getElementById("login-submit");
const mostrarPassword = document.getElementById("mostrar-password");

const otpForm = document.getElementById("otp-form");
const codigoInput = document.getElementById("codigo");
const otpSubmit = document.getElementById("otp-submit");
const volverLogin = document.getElementById("volver-login");

const mensaje = document.getElementById("mensaje");

const sesionPanel = document.getElementById("sesion-panel");
const usuarioSesion = document.getElementById("usuario-sesion");
const rolSesion = document.getElementById("rol-sesion");
const cerrarSesion = document.getElementById("cerrar-sesion");

let challengeId = null;


/*
 * ============================================================
 * MENSAJES
 * ============================================================
 */

function mostrarMensaje(texto, tipo = "info") {
    mensaje.textContent = texto;
    mensaje.hidden = false;

    mensaje.classList.remove(
        "message-success",
        "message-error",
        "message-info"
    );

    mensaje.classList.add(`message-${tipo}`);
}

function ocultarMensaje() {
    mensaje.textContent = "";
    mensaje.hidden = true;
}


/*
 * ============================================================
 * VALIDACIÓN LOGIN
 * ============================================================
 */

function validarFormularioLogin() {
    const identificadorValido =
        identificadorInput.value.trim() !== "";

    const passwordValida =
        passwordInput.value.trim() !== "";

    loginSubmit.disabled =
        !(identificadorValido && passwordValida);
}

identificadorInput.addEventListener(
    "input",
    validarFormularioLogin
);

passwordInput.addEventListener(
    "input",
    validarFormularioLogin
);


/*
 * ============================================================
 * MOSTRAR / OCULTAR CONTRASEÑA
 * ============================================================
 */

mostrarPassword.addEventListener("click", () => {
    const passwordVisible =
        passwordInput.type === "text";

    passwordInput.type =
        passwordVisible
            ? "password"
            : "text";

    mostrarPassword.textContent =
        passwordVisible
            ? "Mostrar"
            : "Ocultar";

    mostrarPassword.setAttribute(
        "aria-pressed",
        String(!passwordVisible)
    );
});


/*
 * ============================================================
 * LOGIN - ETAPA 1
 * USUARIO / CORREO + CONTRASEÑA
 * ============================================================
 */

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    ocultarMensaje();

    loginSubmit.disabled = true;
    loginSubmit.textContent = "Verificando...";

    const identificador =
        identificadorInput.value.trim();

    const password =
        passwordInput.value;

    try {
        const respuesta = await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    identificador,
                    password
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(
                datos.mensaje ||
                "No fue posible iniciar sesión"
            );
        }

        if (
            !datos.requiereOtp ||
            !datos.challengeId
        ) {
            throw new Error(
                "La respuesta de autenticación no es válida"
            );
        }

        challengeId = datos.challengeId;

        loginForm.hidden = true;
        otpForm.hidden = false;

        codigoInput.value = "";
        codigoInput.focus();

        mostrarMensaje(
            datos.mensaje ||
            "Código de verificación enviado.",
            "success"
        );

    } catch (error) {
        mostrarMensaje(
            error.message ||
            "No fue posible iniciar sesión",
            "error"
        );

    } finally {
        loginSubmit.textContent =
            "Iniciar sesión";

        validarFormularioLogin();
    }
});


/*
 * ============================================================
 * VALIDACIÓN OTP
 * ============================================================
 */

function validarOtp() {
    const codigo =
        codigoInput.value.trim();

    otpSubmit.disabled =
        codigo.length === 0;
}

codigoInput.addEventListener(
    "input",
    validarOtp
);


/*
 * ============================================================
 * LOGIN - ETAPA 2
 * VERIFICACIÓN OTP
 * ============================================================
 */

otpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    ocultarMensaje();

    if (!challengeId) {
        mostrarMensaje(
            "La solicitud de verificación no es válida.",
            "error"
        );

        return;
    }

    otpSubmit.disabled = true;
    otpSubmit.textContent = "Verificando...";

    const codigo =
        codigoInput.value.trim();

    try {
        const respuesta = await fetch(
            `${API_URL}/auth/verificar-otp`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    challengeId,
                    codigo
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            throw new Error(
                datos.mensaje ||
                "Código de verificación inválido"
            );
        }

        if (
            !datos.autenticado ||
            !datos.token ||
            !datos.usuario
        ) {
            throw new Error(
                "La respuesta de autenticación no es válida"
            );
        }

        /*
         * Guardamos la sesión únicamente durante
         * la pestaña actual del navegador.
         */
        sessionStorage.setItem(
            "marexpress_token",
            datos.token
        );

        sessionStorage.setItem(
            "marexpress_usuario",
            JSON.stringify(datos.usuario)
        );

        challengeId = null;

        /*
         * ====================================================
         * REDIRECCIÓN SEGÚN ROL
         * ====================================================
         */

        switch (datos.usuario.rol) {

            case "ADMINISTRADOR":
                window.location.href =
                    "./views/administrador/index.html";
                return;

            case "OPERADOR":
                window.location.href =
                    "./views/operador/index.html";
                return;

            case "PEONETA":
                window.location.href =
                    "./views/peoneta/index.html";
                return;

            case "CLIENTE":
                window.location.href =
                    "./views/cliente/index.html";
                return;

            default:
                sessionStorage.removeItem("marexpress_token");
                sessionStorage.removeItem("marexpress_usuario");

                alert("El usuario no posee un rol válido.");
                return;
        }

        /*
         * Por ahora los demás roles permanecen
         * en la pantalla de sesión.
         * Después agregaremos sus dashboards.
         */

        loginForm.hidden = true;
        otpForm.hidden = true;
        sesionPanel.hidden = false;

        usuarioSesion.textContent =
            `${datos.usuario.nombre} ${datos.usuario.apellido}`;

        rolSesion.textContent =
            `Rol: ${datos.usuario.rol}`;

        mostrarMensaje(
            "Inicio de sesión correcto.",
            "success"
        );

    } catch (error) {
        mostrarMensaje(
            error.message ||
            "No fue posible verificar el código",
            "error"
        );

    } finally {
        otpSubmit.textContent =
            "Verificar e ingresar";

        validarOtp();
    }
});


/*
 * ============================================================
 * VOLVER DESDE OTP
 * ============================================================
 */

volverLogin.addEventListener("click", () => {
    challengeId = null;

    codigoInput.value = "";

    otpForm.hidden = true;
    loginForm.hidden = false;

    ocultarMensaje();

    passwordInput.value = "";
    passwordInput.focus();

    validarFormularioLogin();
    validarOtp();
});


/*
 * ============================================================
 * CERRAR SESIÓN
 * ============================================================
 */

cerrarSesion.addEventListener("click", () => {
    sessionStorage.removeItem(
        "marexpress_token"
    );

    sessionStorage.removeItem(
        "marexpress_usuario"
    );

    challengeId = null;

    identificadorInput.value = "";
    passwordInput.value = "";
    codigoInput.value = "";

    sesionPanel.hidden = true;
    otpForm.hidden = true;
    loginForm.hidden = false;

    usuarioSesion.textContent = "";
    rolSesion.textContent = "";

    ocultarMensaje();

    validarFormularioLogin();
    validarOtp();

    identificadorInput.focus();
});


validarFormularioLogin();
validarOtp();
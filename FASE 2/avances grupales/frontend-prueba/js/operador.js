const token = sessionStorage.getItem("marexpress_token");
const usuarioGuardado = sessionStorage.getItem("marexpress_usuario");

const operadorNombre = document.getElementById("operador-nombre");
const operadorRol = document.getElementById("operador-rol");
const cerrarSesionOperador = document.getElementById(
    "cerrar-sesion-operador"
);


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

function cerrarSesion() {
    sessionStorage.removeItem("marexpress_token");
    sessionStorage.removeItem("marexpress_usuario");

    window.location.href = "../../index.html";
}

const formatearCLP = (valor) => {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(valor) || 0);
};

/* =========================================================
   VALIDAR SESIÓN DEL OPERADOR
   ========================================================= */

function validarSesionOperador() {

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

    if (!usuario || usuario.rol !== "OPERADOR") {
        cerrarSesion();
        return;
    }

    if (operadorNombre) {
        operadorNombre.textContent =
            `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim();
    }

    if (operadorRol) {
        operadorRol.textContent = usuario.rol;
    }
}


/* =========================================================
   EVENTOS
   ========================================================= */

if (cerrarSesionOperador) {
    cerrarSesionOperador.addEventListener(
        "click",
        cerrarSesion
    );
}


/* =========================================================
   INICIO
   ========================================================= */

validarSesionOperador();

// =========================================================
// FLUJO NUEVA ORDEN DE TRANSPORTE
// =========================================================

const seccionesOT = document.querySelectorAll(".ot-seccion");
const pasosOT = document.querySelectorAll(".ot-paso");

const activarPasoOT = (indice) => {

    seccionesOT.forEach((seccion, i) => {
        seccion.classList.toggle(
            "abierta",
            i === indice
        );
    });

    pasosOT.forEach((paso, i) => {
        paso.classList.toggle(
            "activo",
            i === indice
        );
    });
};


seccionesOT.forEach((seccion, indice) => {

    const header =
        seccion.querySelector(
            ".ot-seccion-header"
        );

    if (!header) {
        return;
    }

    header.addEventListener(
        "click",
        () => {
            activarPasoOT(indice);
        }
    );

});


pasosOT.forEach((paso, indice) => {

    paso.addEventListener(
        "click",
        () => {
            activarPasoOT(indice);
        }
    );

});


activarPasoOT(0);

// =========================================================
// CARGAR CLIENTES
// =========================================================

const selectCliente =
    document.getElementById("cliente");
    let clientesDisponibles = [];



const cargarClientes = async () => {

    if (!selectCliente) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                "http://localhost:3000/api/clientes",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const clientes =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                clientes.mensaje ||
                "No se pudieron cargar los clientes"
            );
        }

        clientesDisponibles = clientes;

        selectCliente.innerHTML = `
            <option value="">
                Seleccione cliente
            </option>
        `;

        clientes.forEach(cliente => {

            const opcion =
                document.createElement("option");

            opcion.value =
                cliente.idCliente;

            opcion.textContent =
                `${cliente.razonSocial} - ${cliente.rut}`;

            selectCliente.appendChild(
                opcion
            );
        });

    } catch (error) {

        console.error(
            "Error al cargar clientes:",
            error
        );

    }

};


cargarClientes();

// =========================================================
// CARGAR COMUNAS
// =========================================================

const selectComunaOrigen =
    document.getElementById("comuna-origen");

const selectComunaDestino =
    document.getElementById("comuna-destino");


const cargarComunas = async () => {

    if (
        !selectComunaOrigen ||
        !selectComunaDestino
    ) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                "http://localhost:3000/api/comunas",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const comunas =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                comunas.mensaje ||
                "No se pudieron cargar las comunas"
            );
        }

        selectComunaOrigen.innerHTML = `
            <option value="">
                Seleccione comuna
            </option>
        `;

        selectComunaDestino.innerHTML = `
            <option value="">
                Seleccione comuna
            </option>
        `;

        comunas.forEach(comuna => {

            const texto =
                `${comuna.nombreComuna} - ${comuna.region.nombreRegion}`;

            const opcionOrigen =
                document.createElement("option");

            opcionOrigen.value =
                comuna.idComuna;

            opcionOrigen.textContent =
                texto;


            const opcionDestino =
                document.createElement("option");

            opcionDestino.value =
                comuna.idComuna;

            opcionDestino.textContent =
                texto;


            selectComunaOrigen.appendChild(
                opcionOrigen
            );

            selectComunaDestino.appendChild(
                opcionDestino
            );

        });

    } catch (error) {

        console.error(
            "Error al cargar comunas:",
            error
        );

    }

};


cargarComunas();

// =========================================================
// CARGAR TARIFAS POR TRAYECTO
// =========================================================

const selectTarifa =
    document.getElementById("tarifa");

let tarifasTrayecto = [];


const cargarTarifasTrayecto = async () => {

    if (!selectTarifa) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                "http://localhost:3000/api/tarifas-trayecto",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const tarifas =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                tarifas.mensaje ||
                "No se pudieron cargar las tarifas"
            );
        }

        tarifasTrayecto = tarifas;

        // Si ya hay origen y destino seleccionados,
        // actualizar automáticamente la tarifa.
        actualizarTarifaSegunRuta();

    } catch (error) {

        console.error(
            "Error al cargar tarifas:",
            error
        );

    }

};


const actualizarTarifaSegunRuta = () => {

    if (
        !selectComunaOrigen ||
        !selectComunaDestino ||
        !selectTarifa
    ) {
        return;
    }

    const idOrigen =
        Number(selectComunaOrigen.value);

    const idDestino =
        Number(selectComunaDestino.value);

    selectTarifa.innerHTML = `
        <option value="">
            Seleccione tarifa
        </option>
    `;

    if (
        !idOrigen ||
        !idDestino
    ) {
        return;
    }

    const coincidencias =
        tarifasTrayecto.filter(
            tarifa =>
                tarifa.idComunaOrigen === idOrigen &&
                tarifa.idComunaDestino === idDestino
        );

    coincidencias.forEach(tarifa => {

        const opcion =
            document.createElement("option");

        opcion.value =
            tarifa.idTarifa;

        opcion.dataset.idTarifaTrayecto =
            tarifa.idTarifaTrayecto;

        opcion.textContent =
            `$${Number(tarifa.valorFijo).toLocaleString("es-CL")} base`;

        selectTarifa.appendChild(
            opcion
        );

    });

};


selectComunaOrigen?.addEventListener(
    "change",
    actualizarTarifaSegunRuta
);

selectComunaDestino?.addEventListener(
    "change",
    actualizarTarifaSegunRuta
);


cargarTarifasTrayecto();

// =========================================================
// AUTOCOMPLETAR REMITENTE
// =========================================================

const inputRutOrigen =
    document.getElementById("rut-origen");

const inputDireccionOrigen =
    document.getElementById("direccion-origen");

const inputTelefonoOrigen =
    document.getElementById("telefono-origen");

const inputContactoOrigen =
    document.getElementById("contacto-origen");


const autocompletarRemitente = () => {

    if (!selectCliente) {
        return;
    }

    const idCliente =
        Number(selectCliente.value);

    const cliente =
        clientesDisponibles.find(
            item =>
                item.idCliente === idCliente
        );

    if (!cliente) {

        if (inputRutOrigen) {
            inputRutOrigen.value = "";
        }

        if (inputDireccionOrigen) {
            inputDireccionOrigen.value = "";
        }

        if (inputTelefonoOrigen) {
            inputTelefonoOrigen.value = "";
        }

        if (inputContactoOrigen) {
            inputContactoOrigen.value = "";
        }

        if (selectComunaOrigen) {
            selectComunaOrigen.value = "";
        }

        return;
    }

    if (inputRutOrigen) {
        inputRutOrigen.value =
            cliente.rut || "";
    }

    if (inputDireccionOrigen) {
        inputDireccionOrigen.value =
            cliente.direccion || "";
    }

    if (inputTelefonoOrigen) {
        inputTelefonoOrigen.value =
            cliente.telefono || "";
    }

    if (inputContactoOrigen) {
        inputContactoOrigen.value =
            cliente.razonSocial || "";
    }

    if (selectComunaOrigen) {

        selectComunaOrigen.value =
            String(cliente.idComuna || "");

        actualizarTarifaSegunRuta();
        actualizarResumenRuta();
    }

};


selectCliente?.addEventListener(
    "change",
    autocompletarRemitente
);



// =========================================================
// CARGAR DESTINATARIOS
// =========================================================

const selectDestinatario =
    document.getElementById("destinatario");

const inputRutDestino =
    document.getElementById("rut-destino");

const inputContactoDestino =
    document.getElementById("contacto-destino");

const inputDireccionDestino =
    document.getElementById("direccion-destino");

const inputTelefonoDestino =
    document.getElementById("telefono-destino");

const inputCorreoDestino =
    document.getElementById("correo-destino");

const inputReferenciaEntrega =
    document.getElementById("referencia-entrega");

let destinatariosDisponibles = [];


const cargarDestinatarios = async () => {

    if (!selectDestinatario) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                "http://localhost:3000/api/destinatarios",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudieron cargar los destinatarios"
            );
        }

        destinatariosDisponibles =
            datos.destinatarios || [];

        selectDestinatario.innerHTML = `
            <option value="">
                Seleccione destinatario
            </option>
        `;

        destinatariosDisponibles.forEach(
            destinatario => {

                const opcion =
                    document.createElement("option");

                opcion.value =
                    destinatario.idDestinatario;

                opcion.textContent =
                    destinatario.rut
                        ? `${destinatario.nombreRazonSocial} - ${destinatario.rut}`
                        : destinatario.nombreRazonSocial;

                selectDestinatario.appendChild(
                    opcion
                );
            }
        );

    } catch (error) {

        console.error(
            "Error al cargar destinatarios:",
            error
        );
    }
};


// =========================================================
// AUTOCOMPLETAR DESTINATARIO
// =========================================================

const autocompletarDestinatario = () => {

    const idDestinatario =
        Number(
            selectDestinatario?.value
        );

    const destinatario =
        destinatariosDisponibles.find(
            item =>
                item.idDestinatario ===
                idDestinatario
        );

    if (!destinatario) {

        if (inputRutDestino) {
            inputRutDestino.value = "";
        }

        if (inputContactoDestino) {
            inputContactoDestino.value = "";
        }

        if (inputDireccionDestino) {
            inputDireccionDestino.value = "";
        }

        if (inputTelefonoDestino) {
            inputTelefonoDestino.value = "";
        }

        if (inputCorreoDestino) {
            inputCorreoDestino.value = "";
        }

        if (inputReferenciaEntrega) {
            inputReferenciaEntrega.value = "";
        }

        if (selectComunaDestino) {
            selectComunaDestino.value = "";
        }

        actualizarTarifaSegunRuta();
        actualizarResumenRuta();

        return;
    }

    if (inputRutDestino) {
        inputRutDestino.value =
            destinatario.rut || "";
    }

    if (inputContactoDestino) {
        inputContactoDestino.value =
            destinatario.nombreRazonSocial || "";
    }

    if (inputDireccionDestino) {
        inputDireccionDestino.value =
            destinatario.direccion || "";
    }

    if (inputTelefonoDestino) {
        inputTelefonoDestino.value =
            destinatario.telefono || "";
    }

    if (inputCorreoDestino) {
        inputCorreoDestino.value =
            destinatario.correo || "";
    }

    if (inputReferenciaEntrega) {
        inputReferenciaEntrega.value =
            destinatario.referencia || "";
    }

    if (selectComunaDestino) {

        selectComunaDestino.value =
            String(
                destinatario.idComuna || ""
            );

        actualizarTarifaSegunRuta();
        actualizarResumenRuta();
    }
};


selectDestinatario?.addEventListener(
    "change",
    autocompletarDestinatario
);


cargarDestinatarios();

// =========================================================
// CREAR NUEVO DESTINATARIO
// =========================================================

const botonNuevoDestinatario =
    document.getElementById("btn-nuevo-destinatario");


const crearNuevoDestinatario = async () => {

    const rut =
        inputRutDestino?.value.trim() || "";

    const nombreRazonSocial =
        inputContactoDestino?.value.trim() || "";

    const direccion =
        inputDireccionDestino?.value.trim() || "";

    const telefono =
        inputTelefonoDestino?.value.trim() || "";

    const correo =
        inputCorreoDestino?.value.trim() || "";

    const referencia =
        inputReferenciaEntrega?.value.trim() || "";

    const idComuna =
        Number(
            selectComunaDestino?.value
        );


    if (!nombreRazonSocial) {

        alert(
            "Debes ingresar el nombre o razón social del destinatario."
        );

        return;
    }


    if (!direccion) {

        alert(
            "Debes ingresar la dirección del destinatario."
        );

        return;
    }


    if (!idComuna) {

        alert(
            "Debes seleccionar la comuna del destinatario."
        );

        return;
    }


    const datos = {

        rut:
            rut || null,

        nombreRazonSocial,

        direccion,

        telefono:
            telefono || null,

        correo:
            correo || null,

        referencia:
            referencia || null,

        idComuna
    };


    try {

        botonNuevoDestinatario.disabled =
            true;

        botonNuevoDestinatario.textContent =
            "Guardando...";


        const respuesta =
            await fetch(
                "http://localhost:3000/api/destinatarios",
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.mensaje ||
                "No fue posible crear el destinatario"
            );
        }


        const nuevoDestinatario =
            resultado.destinatario;


        destinatariosDisponibles.push(
            nuevoDestinatario
        );


        const opcion =
            document.createElement(
                "option"
            );


        opcion.value =
            nuevoDestinatario.idDestinatario;


        opcion.textContent =
            nuevoDestinatario.rut

                ? `${nuevoDestinatario.nombreRazonSocial} - ${nuevoDestinatario.rut}`

                : nuevoDestinatario.nombreRazonSocial;


        selectDestinatario.appendChild(
            opcion
        );


        selectDestinatario.value =
            String(
                nuevoDestinatario.idDestinatario
            );


        autocompletarDestinatario();


        alert(
            "Destinatario creado correctamente."
        );


    } catch (error) {

        console.error(
            "Error al crear destinatario:",
            error
        );


        alert(
            error.message
        );


    } finally {

        botonNuevoDestinatario.disabled =
            false;

        botonNuevoDestinatario.textContent =
            "+ Nuevo destinatario";
    }
};


botonNuevoDestinatario?.addEventListener(
    "click",
    crearNuevoDestinatario
);
// =========================================================
// RESUMEN DE RUTA
// =========================================================

const resumenOrigen =
    document.getElementById("resumen-origen");

const resumenDestino =
    document.getElementById("resumen-destino");


const actualizarResumenRuta = () => {

    if (resumenOrigen && selectComunaOrigen) {

        const opcionOrigen =
            selectComunaOrigen.options[
                selectComunaOrigen.selectedIndex
            ];

        resumenOrigen.textContent =
            selectComunaOrigen.value
                ? opcionOrigen.textContent.trim()
                : "Sin asignar";
    }

    if (resumenDestino && selectComunaDestino) {

        const opcionDestino =
            selectComunaDestino.options[
                selectComunaDestino.selectedIndex
            ];

        resumenDestino.textContent =
            selectComunaDestino.value
                ? opcionDestino.textContent.trim()
                : "Sin asignar";
    }

};


selectComunaOrigen?.addEventListener(
    "change",
    actualizarResumenRuta
);

selectComunaDestino?.addEventListener(
    "change",
    actualizarResumenRuta
);

// =========================================================
// RESUMEN DEL CLIENTE
// =========================================================

const resumenCliente =
    document.getElementById("resumen-cliente");

const actualizarResumenCliente = () => {

    if (!resumenCliente || !selectCliente) {
        return;
    }

    const opcion =
        selectCliente.options[
            selectCliente.selectedIndex
        ];

    resumenCliente.textContent =
        selectCliente.value
            ? opcion.textContent.trim()
            : "Sin asignar";
};


selectCliente?.addEventListener(
    "change",
    actualizarResumenCliente
);

// =========================================================
// TIPOS DE BULTO
// =========================================================

let tiposBultoDisponibles = [];

const cargarTiposBulto = async () => {

    try {

        const respuesta = await fetch(
            "http://localhost:3000/api/bultos/tipos",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudieron cargar los tipos de bulto"
            );
        }

        tiposBultoDisponibles = datos.tipos;

        console.log(
            "Tipos de bulto cargados:",
            tiposBultoDisponibles
        );

    } catch (error) {

        console.error(
            "Error al cargar tipos de bulto:",
            error
        );

    }
};


cargarTiposBulto();

// =========================================================
// AGREGAR CARGA
// =========================================================

const botonAgregarCarga =
    document.getElementById("agregar-carga");

const tablaCargas =
    document.getElementById("tabla-cargas");


const crearOpcionesTipoBulto = () => {

    return tiposBultoDisponibles
        .map(tipo => `
            <option value="${tipo.idTipoBulto}">
                ${tipo.nombreTipo}
            </option>
        `)
        .join("");
};


const agregarFilaCarga = () => {

    if (!tablaCargas) {
        return;
    }

    if (tiposBultoDisponibles.length === 0) {
        alert("No hay tipos de bulto disponibles.");
        return;
    }

    const filaVacia =
        tablaCargas.querySelector(
            'td[colspan="9"]'
        );

    if (filaVacia) {
        tablaCargas.innerHTML = "";
    }

    const fila =
        document.createElement("tr");

    fila.innerHTML = `
        <td>
            <select class="carga-tipo">
                ${crearOpcionesTipoBulto()}
            </select>
        </td>

        <td>
            <input
                type="text"
                class="carga-descripcion"
                placeholder="Descripción"
            >
        </td>

        <td>
            <input
                type="number"
                class="carga-cantidad"
                min="1"
                value="1"
            >
        </td>

        <td>
            <input
                type="number"
                class="carga-peso"
                min="0"
                step="0.01"
                placeholder="kg"
            >
        </td>

        <td>
            <input
                type="number"
                class="carga-largo"
                min="0"
                step="0.01"
                placeholder="cm"
            >
        </td>

        <td>
            <input
                type="number"
                class="carga-ancho"
                min="0"
                step="0.01"
                placeholder="cm"
            >
        </td>

        <td>
            <input
                type="number"
                class="carga-alto"
                min="0"
                step="0.01"
                placeholder="cm"
            >
        </td>

        <td class="carga-volumen">
            0 m³
        </td>

        <td>
            <button
                type="button"
                class="button-danger eliminar-carga"
            >
                Eliminar
            </button>
        </td>
    `;

    tablaCargas.appendChild(fila);
};


botonAgregarCarga?.addEventListener(
    "click",
    agregarFilaCarga
);

// =========================================================
// CALCULAR VOLUMEN DE CARGA
// =========================================================

const calcularVolumenFila = (fila) => {

    const cantidad =
        Number(
            fila.querySelector(".carga-cantidad")?.value
        ) || 0;

    const largo =
        Number(
            fila.querySelector(".carga-largo")?.value
        ) || 0;

    const ancho =
        Number(
            fila.querySelector(".carga-ancho")?.value
        ) || 0;

    const alto =
        Number(
            fila.querySelector(".carga-alto")?.value
        ) || 0;

    const volumen =
        (
            largo *
            ancho *
            alto *
            cantidad
        ) / 1000000;

    const celdaVolumen =
        fila.querySelector(".carga-volumen");

    if (celdaVolumen) {
        celdaVolumen.textContent =
            `${volumen.toFixed(3)} m³`;
    }
};


tablaCargas?.addEventListener(
    "input",
    (event) => {

        const fila =
            event.target.closest("tr");

        if (!fila) {
            return;
        }

        if (
            event.target.classList.contains("carga-cantidad") ||
            event.target.classList.contains("carga-largo") ||
            event.target.classList.contains("carga-ancho") ||
            event.target.classList.contains("carga-alto")
        ) {
            calcularVolumenFila(fila);
        }
    }
);


// =========================================================
// RESUMEN DE CARGA
// =========================================================

const resumenItems =
    document.getElementById("resumen-items");

const resumenPeso =
    document.getElementById("resumen-peso");

const resumenVolumen =
    document.getElementById("resumen-volumen");


const actualizarResumenCarga = () => {

    if (!tablaCargas) {
        return;
    }

    const filas =
        tablaCargas.querySelectorAll("tr");

    let totalItems = 0;
    let pesoTotal = 0;
    let volumenTotal = 0;

    filas.forEach(fila => {

        if (
            fila.querySelector('td[colspan="9"]')
        ) {
            return;
        }

        const cantidad =
            Number(
                fila.querySelector(
                    ".carga-cantidad"
                )?.value
            ) || 0;

        const peso =
            Number(
                fila.querySelector(
                    ".carga-peso"
                )?.value
            ) || 0;

        const largo =
            Number(
                fila.querySelector(
                    ".carga-largo"
                )?.value
            ) || 0;

        const ancho =
            Number(
                fila.querySelector(
                    ".carga-ancho"
                )?.value
            ) || 0;

        const alto =
            Number(
                fila.querySelector(
                    ".carga-alto"
                )?.value
            ) || 0;

        totalItems += cantidad;

        pesoTotal +=
            peso * cantidad;

        volumenTotal +=
            (
                largo *
                ancho *
                alto *
                cantidad
            ) / 1000000;
    });


    if (resumenItems) {
        resumenItems.textContent =
            totalItems;
    }

    if (resumenPeso) {
        resumenPeso.textContent =
            `${pesoTotal.toFixed(2)} kg`;
    }

    if (resumenVolumen) {
        resumenVolumen.textContent =
            `${volumenTotal.toFixed(3)} m³`;
    }
};


tablaCargas?.addEventListener(
    "input",
    actualizarResumenCarga
);


// =========================================================
// ELIMINAR CARGA
// =========================================================

tablaCargas?.addEventListener(
    "click",
    (event) => {

        const botonEliminar =
            event.target.closest(".eliminar-carga");

        if (!botonEliminar) {
            return;
        }

        const fila =
            botonEliminar.closest("tr");

        if (fila) {
            fila.remove();
        }


        if (
            tablaCargas.children.length === 0
        ) {

            tablaCargas.innerHTML = `
                <tr>
                    <td colspan="9">
                        No hay cargas agregadas.
                    </td>
                </tr>
            `;
        }


        actualizarResumenCarga();
    }
);


// =========================================================
// PREPARAR CARGAS PARA COTIZACION
// =========================================================

const obtenerCargasFormulario = () => {

    if (!tablaCargas) {
        return [];
    }

    const filas =
        tablaCargas.querySelectorAll("tr");

    const cargas = [];


    filas.forEach(fila => {

        if (
            fila.querySelector('td[colspan="9"]')
        ) {
            return;
        }


        const idTipoBulto =
            Number(
                fila.querySelector(
                    ".carga-tipo"
                )?.value
            );


        const descripcion =
            fila.querySelector(
                ".carga-descripcion"
            )?.value.trim() || null;


        const cantidad =
            Number(
                fila.querySelector(
                    ".carga-cantidad"
                )?.value
            );


        const pesoUnitario =
            Number(
                fila.querySelector(
                    ".carga-peso"
                )?.value
            );


        const largoCm =
            Number(
                fila.querySelector(
                    ".carga-largo"
                )?.value
            );


        const anchoCm =
            Number(
                fila.querySelector(
                    ".carga-ancho"
                )?.value
            );


        const altoCm =
            Number(
                fila.querySelector(
                    ".carga-alto"
                )?.value
            );


        cargas.push({
            idTipoBulto,
            descripcion,
            cantidad,
            pesoUnitario,
            largoCm,
            anchoCm,
            altoCm
        });
    });


    return cargas;
};


// =========================================================
// RETIRO Y RECARGO OPCIONAL
// =========================================================

const selectRequiereRetiro =
    document.getElementById("requiere-retiro");

const datosRetiro =
    document.getElementById("datos-retiro");

const inputDireccionRetiro =
    document.getElementById("direccion-retiro");

const inputValorRetiro =
    document.getElementById("valor-retiro");


const selectAplicaRecargo =
    document.getElementById("aplica-recargo");

const datosRecargo =
    document.getElementById("datos-recargo");

const inputDescripcionRecargo =
    document.getElementById("descripcion-recargo");

const inputValorRecargo =
    document.getElementById("valor-recargo");


const resumenRetiro =
    document.getElementById("resumen-retiro");

const resumenRecargos =
    document.getElementById("resumen-recargos");


// =========================================================
// MOSTRAR / OCULTAR RETIRO
// =========================================================

const actualizarVistaRetiro = () => {

    const requiereRetiro =
        selectRequiereRetiro?.value === "SI";

    if (datosRetiro) {
        datosRetiro.hidden =
            !requiereRetiro;
    }


    if (!requiereRetiro) {

        if (inputDireccionRetiro) {
            inputDireccionRetiro.value = "";
        }

        if (inputValorRetiro) {
            inputValorRetiro.value = "0";
        }

        if (resumenRetiro) {
            resumenRetiro.textContent = "$0";
        }
    }
};


selectRequiereRetiro?.addEventListener(
    "change",
    actualizarVistaRetiro
);


// =========================================================
// MOSTRAR / OCULTAR RECARGO
// =========================================================

const actualizarVistaRecargo = () => {

    const aplicaRecargo =
        selectAplicaRecargo?.value === "SI";

    if (datosRecargo) {
        datosRecargo.hidden =
            !aplicaRecargo;
    }


    if (!aplicaRecargo) {

        if (inputDescripcionRecargo) {
            inputDescripcionRecargo.value = "";
        }

        if (inputValorRecargo) {
            inputValorRecargo.value = "0";
        }

        if (resumenRecargos) {
            resumenRecargos.textContent = "$0";
        }
    }
};


selectAplicaRecargo?.addEventListener(
    "change",
    actualizarVistaRecargo
);


// Estado inicial
actualizarVistaRetiro();
actualizarVistaRecargo();

// =========================================================
// CALCULAR COTIZACION REAL
// =========================================================

const resumenNeto =
    document.getElementById("resumen-neto");

const resumenIva =
    document.getElementById("resumen-iva");

const resumenTotal =
    document.getElementById("resumen-total");

const botonConfirmarOT =
    document.getElementById("btn-confirmar-ot");

let datosOrdenCotizada = null;


// =========================================================
// DATOS DE PAGO
// =========================================================

const pagadoPorSelect =
    document.getElementById("pagado-por");

const tipoPagoSelect =
    document.getElementById("tipo-pago");

const metodoPagoSelect =
    document.getElementById("metodo-pago");

const cuentaCorrienteSelect =
    document.getElementById("cuenta-corriente");

const contenedorMetodoPago =
    metodoPagoSelect?.closest(".field");

const contenedorCuentaCorriente =
    document.getElementById(
        "contenedor-cuenta-corriente"
    );


// =========================================================
// CARGAR CUENTA CORRIENTE DEL CLIENTE
// =========================================================

const cargarCuentaCorrienteCliente = async (idCliente) => {

    if (!cuentaCorrienteSelect) {
        return;
    }

    cuentaCorrienteSelect.innerHTML = `
        <option value="">
            Seleccione cuenta corriente
        </option>
    `;

    if (!idCliente) {
        return;
    }

    try {

        const respuesta = await fetch(
            `http://localhost:3000/api/clientes/${idCliente}/cuenta-corriente`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        // El cliente simplemente no posee cuenta corriente
        if (respuesta.status === 404) {
            return;
        }

        const cuenta =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                cuenta.mensaje ||
                "No se pudo cargar la cuenta corriente"
            );
        }

        // No mostrar cuentas inactivas
        if (!cuenta.estado) {
            return;
        }

        const limiteCredito =
            Number(cuenta.limiteCredito) || 0;

        const saldoActual =
            Number(cuenta.saldoActual) || 0;

        const disponible =
            limiteCredito - saldoActual;

        const opcion =
            document.createElement("option");

        opcion.value =
            cuenta.idCuenta;

        opcion.textContent =
            `Cuenta #${cuenta.idCuenta} - Disponible: ${formatearCLP(disponible)}`;

        cuentaCorrienteSelect.appendChild(
            opcion
        );

    } catch (error) {

        console.error(
            "Error al cargar cuenta corriente:",
            error
        );
    }
};


// =========================================================
// CAMBIO DE CLIENTE
// =========================================================

selectCliente?.addEventListener(
    "change",
    () => {

        const idCliente =
            Number(selectCliente.value) || null;

        cargarCuentaCorrienteCliente(
            idCliente
        );
    }
);


// =========================================================
// MOSTRAR / OCULTAR CAMPOS DE PAGO
// =========================================================

const actualizarCamposPago = () => {

    const tipoPago =
        tipoPagoSelect?.value || "";

    // Ocultar campos variables
    if (contenedorMetodoPago) {
        contenedorMetodoPago.hidden = true;
    }

    if (contenedorCuentaCorriente) {
        contenedorCuentaCorriente.hidden = true;
    }

    // Limpiar selecciones anteriores
    if (metodoPagoSelect) {
        metodoPagoSelect.value = "";
    }

    if (cuentaCorrienteSelect) {
        cuentaCorrienteSelect.value = "";
    }


    // =====================================================
    // CONTADO
    // =====================================================

    if (tipoPago === "CONTADO") {

        if (contenedorMetodoPago) {
            contenedorMetodoPago.hidden = false;
        }

        return;
    }


    // =====================================================
    // CUENTA CORRIENTE
    // =====================================================

    if (tipoPago === "CUENTA_CORRIENTE") {

        if (contenedorCuentaCorriente) {
            contenedorCuentaCorriente.hidden = false;
        }

        const idCliente =
            Number(selectCliente?.value) || null;

        cargarCuentaCorrienteCliente(
            idCliente
        );

        return;
    }


    // =====================================================
    // POR PAGAR
    // =====================================================

    // No requiere método inmediato.
};


tipoPagoSelect?.addEventListener(
    "change",
    actualizarCamposPago
);

actualizarCamposPago();


// =========================================================
// CALCULAR COTIZACIÓN
// =========================================================

const calcularCotizacionOrden = async () => {

    const direccionOrigen =
        document.getElementById(
            "direccion-origen"
        )?.value.trim();

    const direccionDestino =
        document.getElementById(
            "direccion-destino"
        )?.value.trim();

    const tipoZona =
        document.getElementById(
            "tipo-zona"
        )?.value;

    const idCliente =
        Number(
            selectCliente?.value
        );

    const idComunaOrigen =
        Number(
            selectComunaOrigen?.value
        );

    const idComunaDestino =
        Number(
            selectComunaDestino?.value
        );

    const idTarifa =
        Number(
            selectTarifa?.value
        );

    const cargas =
        obtenerCargasFormulario();


    // =====================================================
    // RETIRO
    // =====================================================

    const requiereRetiro =
        selectRequiereRetiro?.value === "SI";

    const direccionRetiro =
        inputDireccionRetiro?.value.trim() || "";

    const valorRetiro =
        Number(
            inputValorRetiro?.value
        ) || 0;


    // =====================================================
    // RECARGO
    // =====================================================

    const aplicaRecargo =
        selectAplicaRecargo?.value === "SI";

    const descripcionRecargo =
        inputDescripcionRecargo?.value.trim() || "";

    const valorRecargo =
        Number(
            inputValorRecargo?.value
        ) || 0;


    // =====================================================
    // VALIDACIONES GENERALES
    // =====================================================

    if (
        !direccionOrigen ||
        !direccionDestino ||
        !idCliente ||
        !idComunaOrigen ||
        !idComunaDestino ||
        !idTarifa ||
        cargas.length === 0
    ) {

        alert(
            "Completa los datos obligatorios antes de calcular la cotización."
        );

        return;
    }


    // =====================================================
    // VALIDAR RETIRO
    // =====================================================

    if (
        requiereRetiro &&
        !direccionRetiro
    ) {

        alert(
            "Debes ingresar la dirección de retiro."
        );

        return;
    }

    if (
        requiereRetiro &&
        valorRetiro < 0
    ) {

        alert(
            "El valor del retiro no puede ser negativo."
        );

        return;
    }


    // =====================================================
    // VALIDAR RECARGO
    // =====================================================

    if (
        aplicaRecargo &&
        !descripcionRecargo
    ) {

        alert(
            "Debes indicar el motivo del recargo."
        );

        return;
    }

    if (
        aplicaRecargo &&
        valorRecargo <= 0
    ) {

        alert(
            "El valor del recargo debe ser mayor a $0."
        );

        return;
    }


    // =====================================================
    // ARMAR RECARGOS
    // =====================================================

    const recargos =
        aplicaRecargo
            ? [
                {
                    descripcion:
                        descripcionRecargo,

                    monto:
                        valorRecargo
                }
            ]
            : [];


    // =====================================================
    // ARMAR DATOS PARA BACKEND
    // =====================================================

    const idDestinatario =
        Number(
            selectDestinatario?.value
        ) || null;

    const datos = {

        direccionOrigen,
        direccionDestino,

        idCliente,

        idDestinatario,

        idComunaOrigen,
        idComunaDestino,

        idTarifa,

        tipoZona,

        requiereRetiro,

        cargas,

        recargos
    };


    // =====================================================
    // AGREGAR RETIRO SOLO SI CORRESPONDE
    // =====================================================

    if (requiereRetiro) {

        datos.retiro = {

            fechaProgramada:
                document.getElementById(
                    "fecha-retiro"
                )?.value || null,

            direccionRetiro,

            valorRetiro
        };
    }


    console.log(
        "DATOS COTIZACIÓN:",
        datos
    );


    try {

        const respuesta =
            await fetch(
                "http://localhost:3000/api/ordenes-transporte/calcular",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.mensaje ||
                "No fue posible calcular la cotización"
            );
        }


        const calculo =
            resultado.calculo;

        datosOrdenCotizada =
            datos;


        // =================================================
        // ACTUALIZAR RESUMEN DE RETIRO
        // =================================================

        if (resumenRetiro) {

            resumenRetiro.textContent =
                formatearCLP(
                    calculo.valorRetiroAplicado || 0
                );
        }


        // =================================================
        // ACTUALIZAR RESUMEN DE RECARGOS
        // =================================================

        if (resumenRecargos) {

            resumenRecargos.textContent =
                formatearCLP(
                    calculo.totalRecargos || 0
                );
        }


        // =================================================
        // ACTUALIZAR COTIZACIÓN
        // =================================================

        if (resumenNeto) {

            resumenNeto.textContent =
                formatearCLP(
                    calculo.valorNeto
                );
        }

        if (resumenIva) {

            resumenIva.textContent =
                formatearCLP(
                    calculo.valorIva
                );
        }

        if (resumenTotal) {

            resumenTotal.textContent =
                formatearCLP(
                    calculo.valorTotal
                );
        }


        // =================================================
        // HABILITAR CONFIRMACIÓN
        // =================================================

        if (botonConfirmarOT) {
            botonConfirmarOT.disabled = false;
        }


        console.log(
            "Cotización calculada:",
            calculo
        );


    } catch (error) {

        if (botonConfirmarOT) {
            botonConfirmarOT.disabled = true;
        }

        console.error(
            "Error al calcular cotización:",
            error
        );

        alert(
            error.message
        );
    }
};


// =========================================================
// BOTÓN CALCULAR COTIZACIÓN
// =========================================================

const botonCalcularOT =
    document.getElementById(
        "btn-calcular-ot"
    );

botonCalcularOT?.addEventListener(
    "click",
    calcularCotizacionOrden
);

// =========================================================
// CONFIRMAR Y CREAR OT
// =========================================================

const confirmarOrdenTransporte = async () => {

    if (!datosOrdenCotizada) {

        alert(
            "Primero debes calcular la cotización."
        );

        return;
    }


    // =====================================================
    // DATOS ADICIONALES DE LA OT
    // =====================================================

    const tipoServicio =
        document.getElementById(
            "tipo-servicio"
        )?.value || "NORMAL";

    const tipoDocumento =
        document.getElementById(
            "tipo-documento"
        )?.value || "SIN_DOCUMENTO";

    const numeroDocumento =
        document.getElementById(
            "numero-documento"
        )?.value.trim() || null;
    
    const pagadoPor =
        document.getElementById("pagado-por")?.value || null;

    const tipoPago =
        document.getElementById("tipo-pago")?.value || null;

    const metodoPago =
        tipoPago === "CONTADO"
            ? document.getElementById("metodo-pago")?.value || null
            : null;

    const idCuenta =
        tipoPago === "CUENTA_CORRIENTE"
            ? Number(
                document.getElementById("cuenta-corriente")?.value
            ) || null
            : null;

    const contactoOrigen =
        document.getElementById(
            "contacto-origen"
        )?.value.trim() || null;

    const telefonoOrigen =
        document.getElementById(
            "telefono-origen"
        )?.value.trim() || null;

    const contactoDestino =
        document.getElementById(
            "contacto-destino"
        )?.value.trim() || null;

    const telefonoDestino =
        document.getElementById(
            "telefono-destino"
        )?.value.trim() || null;

    const referenciaEntrega =
        document.getElementById(
            "referencia-entrega"
        )?.value.trim() || null;


    // =====================================================
    // ARMAR DATOS DEFINITIVOS
    // =====================================================

    const datos = {

        ...datosOrdenCotizada,

        tipoServicio,

        tipoDocumento,

        numeroDocumento,

        contactoOrigen,

        telefonoOrigen,

        contactoDestino,

        telefonoDestino,

        referenciaEntrega,

        pagadoPor,

        tipoPago,

        metodoPago,

        idCuenta
    };


    // =====================================================
    // VALIDAR DOCUMENTO
    // =====================================================

    if (
        tipoDocumento !== "SIN_DOCUMENTO" &&
        !numeroDocumento
    ) {

        alert(
            "Debes ingresar el número del documento."
        );

        return;
    }

    // =====================================================
    // VALIDAR DATOS DE PAGO
    // =====================================================

    if (!pagadoPor) {
        alert("Debes seleccionar quién paga.");
        return;
    }

    if (!tipoPago) {
        alert("Debes seleccionar el tipo de pago.");
        return;
    }

    if (
        tipoPago === "CONTADO" &&
        !metodoPago
    ) {
        alert(
            "Debes seleccionar el método de pago."
        );
        return;
    }

    if (
        tipoPago === "CUENTA_CORRIENTE" &&
        !idCuenta
    ) {
        alert(
            "Debes seleccionar una cuenta corriente."
        );
        return;
    }

    if (
        tipoPago === "CUENTA_CORRIENTE" &&
        pagadoPor !== "REMITENTE"
    ) {
        alert(
            "La cuenta corriente solo puede ser utilizada por el remitente."
        );
        return;
    }

    try {

        botonConfirmarOT.disabled =
            true;

        botonConfirmarOT.textContent =
            "Creando OT...";


        const respuesta =
            await fetch(
                "http://localhost:3000/api/ordenes-transporte",
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.mensaje ||
                "No fue posible crear la orden de transporte"
            );
        }


        console.log(
            "OT CREADA:",
            resultado
        );


        const orden =
            resultado.orden ||
            resultado;


        if (
            orden?.numeroOT &&
            document.getElementById(
                "numero-ot"
            )
        ) {

            document.getElementById(
                "numero-ot"
            ).value =
                orden.numeroOT;
        }


        alert(
            `Orden de transporte creada correctamente${orden?.numeroOT
                ? `: ${orden.numeroOT}`
                : ""
            }`
        );


        datosOrdenCotizada =
            null;


    } catch (error) {

        console.error(
            "Error al crear OT:",
            error
        );

        alert(
            error.message
        );


    } finally {

        botonConfirmarOT.disabled =
            false;

        botonConfirmarOT.textContent =
            "Confirmar y crear OT";
    }
};


// =========================================================
// BOTÓN CONFIRMAR OT
// =========================================================

botonConfirmarOT?.addEventListener(
    "click",
    confirmarOrdenTransporte
);

// =========================================================
// TEMPORAL PARA PRUEBAS DESDE CONSOLA
// =========================================================

window.calcularCotizacionOrden =
    calcularCotizacionOrden;

// =========================================================
// RECEPCIÓN - BUSCAR ORDEN DE TRANSPORTE
// =========================================================

const inputRecepcionOT =
    document.getElementById("recepcion-ot");


const buscarOrdenRecepcion = async () => {

    const numeroOT =
        inputRecepcionOT?.value.trim();

    if (!numeroOT) {
        return;
    }

    try {

        const token =
            sessionStorage.getItem(
                "marexpress_token"
            );

        const respuesta = await fetch(
            `http://localhost:3000/api/ordenes-transporte/numero/${encodeURIComponent(numeroOT)}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje ||
                "No fue posible encontrar la orden"
            );
        }


        console.log(
            "OT ENCONTRADA PARA RECEPCIÓN:",
            resultado
        );

        console.log(
            "DETALLE CARGA:",
            resultado.detalle_carga?.[0]
        );

        const inputCliente =
            document.getElementById(
                "recepcion-cliente"
            );

        if (inputCliente) {

            inputCliente.value =
                resultado.cliente?.razonSocial ||
                resultado.cliente?.nombre ||
                "";
        }

        const inputOrigen =
            document.getElementById(
                "recepcion-origen"
            );

        if (inputOrigen) {

            const comunaOrigen =
                resultado
                    .comuna_orden_transporte_idComunaOrigenTocomuna;

            inputOrigen.value =
                comunaOrigen?.nombreComuna ||
                comunaOrigen?.nombre ||
                "";
        }

        // =========================================================
        // RECEPCIÓN - AUTOCOMPLETAR DATOS DE LA OT
        // =========================================================

        // DESTINO
        const inputDestino =
            document.getElementById("recepcion-destino");

        if (inputDestino) {

            const comunaDestino =
                resultado
                    .comuna_orden_transporte_idComunaDestinoTocomuna;

            inputDestino.value =
                comunaDestino?.nombreComuna ||
                comunaDestino?.nombre ||
                "";
        }


        // DOCUMENTO
        const selectDocumento =
            document.getElementById("recepcion-documento");

        if (selectDocumento) {
            selectDocumento.value =
                resultado.tipoDocumento || "";
        }


        // NÚMERO DOCUMENTO
        const inputNumeroDocumento =
            document.getElementById(
                "recepcion-numero-documento"
            );

        if (inputNumeroDocumento) {
            inputNumeroDocumento.value =
                resultado.numeroDocumento || "";
        }


        // =========================================================
        // CARGA RECIBIDA
        // =========================================================

        const carga =
            resultado.detalle_carga?.[0];

        if (carga) {

            const tipoBulto =
                document.getElementById("recepcion-tipo-bulto");

            const cantidad =
                document.getElementById("recepcion-cantidad");

            const peso =
                document.getElementById("recepcion-peso");

            const largo =
                document.getElementById("recepcion-largo");

            const ancho =
                document.getElementById("recepcion-ancho");

            const alto =
                document.getElementById("recepcion-alto");

            const volumen =
                document.getElementById("recepcion-volumen");

            const valorDeclarado =
                document.getElementById("recepcion-valor-declarado");


            // Tipo de bulto
            if (tipoBulto) {

                tipoBulto.innerHTML = "";

                const opcion =
                    document.createElement("option");

                opcion.value =
                    carga.idTipoBulto;

                opcion.textContent =
                    carga.tipo_bulto?.nombreTipo ||
                    "Tipo de bulto";

                opcion.selected = true;

                tipoBulto.appendChild(opcion);
            }


            // Cantidad
            if (cantidad) {
                cantidad.value =
                    carga.cantidad || "";
            }


            // Peso total de la OT
            if (peso) {
                peso.value =
                    resultado.pesoTotal || "";
            }


            // Dimensiones
            if (largo) {
                largo.value =
                    carga.largoCm || "";
            }

            if (ancho) {
                ancho.value =
                    carga.anchoCm || "";
            }

            if (alto) {
                alto.value =
                    carga.altoCm || "";
            }


            // Volumen total
            if (volumen) {
                volumen.value =
                    resultado.volumenTotalM3 || "";
            }


            // Valor declarado
            if (valorDeclarado) {
                valorDeclarado.value =
                    carga.valorDeclarado ||
                    resultado.valorDeclarado ||
                    "";
            }
        }


        // =========================================================
        // RESUMEN DE LA OT
        // =========================================================

        const resumenPeso =
            document.getElementById("resumen-peso");

        const resumenVolumen =
            document.getElementById("resumen-volumen");

        const resumenTipoCobro =
            document.getElementById("resumen-tipo-cobro");

        const resumenTotal =
            document.getElementById("resumen-total");


        if (resumenPeso) {

            resumenPeso.textContent =
                `${Number(resultado.pesoTotal || 0)} kg`;
        }


        if (resumenVolumen) {

            resumenVolumen.textContent =
                `${Number(resultado.volumenTotalM3 || 0)} m³`;
        }


        if (resumenTipoCobro) {

            resumenTipoCobro.textContent =
                resultado.tipoCobro || "-";
        }


        if (resumenTotal) {

            resumenTotal.textContent =
                Number(
                    resultado.valorTotal || 0
                ).toLocaleString(
                    "es-CL",
                    {
                        style: "currency",
                        currency: "CLP",
                        maximumFractionDigits: 0
                    }
                );
        }

    } catch (error) {

        console.error(
            "Error al buscar OT para recepción:",
            error
        );

        alert(error.message);
    }
};


inputRecepcionOT?.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            buscarOrdenRecepcion();
        }
    }
);
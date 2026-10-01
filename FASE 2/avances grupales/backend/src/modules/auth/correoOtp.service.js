import path from "node:path";
import { fileURLToPath } from "node:url";
import { enviarCorreo } from "../../config/correo.js";

/*
 * ============================================================
 * MAREXPRESS - Correo de verificación OTP
 * Logística & Distribución
 * ============================================================
 *
 * Plantilla corporativa de seguridad.
 *
 * © 2026 MAREXPRESS. Todos los derechos reservados.
 * ============================================================
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rutaLogo = path.resolve(
    __dirname,
    "../../assets/logo-marexpress.png"
);

// Colores corporativos MAREXPRESS
const AZUL = "#087DBD";
const AZUL_OSCURO = "#123B5D";
const AZUL_CLARO = "#EEF8FD";
const VERDE = "#27A844";
const VERDE_CLARO = "#EFF9F1";
const TEXTO = "#29465F";
const TEXTO_SUAVE = "#60798E";
const FONDO = "#F3F8FB";

export const enviarCodigoOtp = async ({
    destinatario,
    codigo,
    nombre = "Cliente"
}) => {
    const asunto = "Código de verificación | MAREXPRESS";

    const texto = `
MAREXPRESS - Logística & Distribución

Hola ${nombre},

Tu código de verificación es:

${codigo}

Este código tiene una validez de 5 minutos.

Si no solicitaste este código, puedes ignorar este mensaje.

SEGURIDAD MAREXPRESS
Nunca compartas este código, tu contraseña, códigos de recuperación
ni datos de acceso con otras personas.

Este correo fue generado automáticamente.
Por favor, no respondas a este mensaje.

© 2026 MAREXPRESS. Todos los derechos reservados.
`;

    const html = `
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Código de verificación MAREXPRESS
    </title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background-color:${FONDO};
        font-family:Arial, Helvetica, sans-serif;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
    style="
        width:100%;
        background-color:${FONDO};
        padding:35px 15px;
    "
>
<tr>
<td align="center">

<!-- TARJETA PRINCIPAL -->
<table
    width="600"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
    style="
        width:100%;
        max-width:600px;
        background-color:#FFFFFF;
        border-radius:18px;
        overflow:hidden;
        box-shadow:0 8px 30px rgba(18,59,93,0.10);
    "
>

<!-- LOGO -->
<tr>
<td
    align="center"
    style="
        background-color:#FFFFFF;
        padding:35px 30px 30px 30px;
    "
>

<img
    src="cid:logo-marexpress"
    width="280"
    alt="MAREXPRESS - Logística & Distribución"
    style="
        display:block;
        width:100%;
        max-width:280px;
        height:auto;
        margin:0 auto;
        border:0;
    "
>

</td>
</tr>

<!-- FRANJA AZUL + VERDE -->
<tr>
<td style="padding:0;">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
>
<tr>

<td
    width="50%"
    height="7"
    style="
        background-color:${AZUL};
        font-size:0;
        line-height:0;
    "
>
&nbsp;
</td>

<td
    width="50%"
    height="7"
    style="
        background-color:${VERDE};
        font-size:0;
        line-height:0;
    "
>
&nbsp;
</td>

</tr>
</table>

</td>
</tr>

<!-- CONTENIDO -->
<tr>
<td
    style="
        padding:38px 38px 34px 38px;
    "
>

<p
    style="
        margin:0 0 14px 0;
        color:${AZUL};
        font-size:14px;
        font-weight:700;
        letter-spacing:1px;
        text-transform:uppercase;
    "
>
    Seguridad de acceso
</p>

<h1
    style="
        margin:0 0 30px 0;
        color:${AZUL_OSCURO};
        font-size:28px;
        line-height:1.25;
        font-weight:700;
    "
>
    Código de verificación
</h1>

<p
    style="
        margin:0 0 20px 0;
        color:${TEXTO};
        font-size:16px;
        line-height:1.6;
    "
>
    Hola <strong>${nombre}</strong>,
</p>

<p
    style="
        margin:0 0 28px 0;
        color:${TEXTO};
        font-size:16px;
        line-height:1.6;
    "
>
    Recibimos una solicitud para verificar
    tu acceso al sistema
    <strong>MAREXPRESS</strong>.
</p>

<!-- CAJA OTP -->
<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
    style="
        margin-bottom:28px;
    "
>
<tr>
<td
    align="center"
    style="
        background-color:${AZUL_CLARO};
        border:2px solid ${AZUL};
        border-radius:14px;
        padding:28px 15px;
    "
>

<span
    style="
        display:inline-block;
        color:${AZUL};
        font-size:40px;
        line-height:1;
        font-weight:800;
        letter-spacing:10px;
    "
>
    ${codigo}
</span>

</td>
</tr>
</table>

<!-- VIGENCIA -->
<table
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
    style="
        margin-bottom:10px;
    "
>
<tr>

<td
    valign="middle"
    style="
        padding-right:10px;
        color:${VERDE};
        font-size:22px;
        font-weight:bold;
    "
>
    &#9719;
</td>

<td
    valign="middle"
    style="
        color:${TEXTO};
        font-size:15px;
        line-height:1.5;
    "
>
    Este código tiene una validez de
    <strong>5 minutos</strong>.
</td>

</tr>
</table>

<p
    style="
        margin:0 0 28px 0;
        color:${TEXTO_SUAVE};
        font-size:14px;
        line-height:1.6;
    "
>
    Si no solicitaste este código,
    puedes ignorar este mensaje.
</p>

<!-- SEGURIDAD -->
<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
>
<tr>

<td
    width="6"
    style="
        width:6px;
        background-color:${VERDE};
        border-radius:8px 0 0 8px;
    "
>
&nbsp;
</td>

<td
    style="
        background-color:${VERDE_CLARO};
        padding:20px 22px;
        border-radius:0 10px 10px 0;
    "
>

<p
    style="
        margin:0 0 7px 0;
        color:${VERDE};
        font-size:15px;
        font-weight:700;
    "
>
    Seguridad MAREXPRESS
</p>

<p
    style="
        margin:0;
        color:${TEXTO};
        font-size:13px;
        line-height:1.6;
    "
>
    Nunca compartas este código,
    tu contraseña, códigos de recuperación
    ni datos de acceso con otras personas.
</p>

</td>
</tr>
</table>

</td>
</tr>

<!-- FRANJA INFERIOR -->
<tr>
<td style="padding:0;">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
>
<tr>

<td
    width="50%"
    height="6"
    style="
        background-color:${AZUL};
        font-size:0;
        line-height:0;
    "
>
&nbsp;
</td>

<td
    width="50%"
    height="6"
    style="
        background-color:${VERDE};
        font-size:0;
        line-height:0;
    "
>
&nbsp;
</td>

</tr>
</table>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td
    align="center"
    style="
        background-color:#FAFCFD;
        padding:28px 30px 32px 30px;
    "
>

<p
    style="
        margin:0 0 5px 0;
        color:${AZUL};
        font-size:16px;
        font-weight:700;
    "
>
    MAREXPRESS
</p>

<p
    style="
        margin:0 0 20px 0;
        color:${VERDE};
        font-size:14px;
        font-weight:600;
    "
>
    Logística &amp; Distribución
</p>

<p
    style="
        margin:0 0 18px 0;
        color:${TEXTO_SUAVE};
        font-size:12px;
        line-height:1.7;
    "
>
    Este correo fue generado automáticamente
    por el sistema de seguridad MAREXPRESS.
    <br>
    Por favor, no respondas a este mensaje.
</p>

<p
    style="
        margin:0;
        color:${TEXTO_SUAVE};
        font-size:12px;
        line-height:1.6;
    "
>
    © 2026 MAREXPRESS.
    Todos los derechos reservados.
</p>

</td>
</tr>

</table>
<!-- FIN TARJETA -->

</td>
</tr>
</table>

</body>
</html>
`;

    return await enviarCorreo({
        destinatario,
        asunto,
        texto,
        html,

        attachments: [
            {
                filename: "logo-marexpress.png",
                path: rutaLogo,
                cid: "logo-marexpress"
            }
        ]
    });
};
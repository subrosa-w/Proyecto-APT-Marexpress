# Pruebas del backend con Postman

Esta carpeta contiene:

- `Marexpress-API.postman_collection.json`: 66 peticiones organizadas por módulo (salud, autenticación, catálogos, tarifas, clientes, OT, bodega, manifiestos, pagos, peoneta y portal cliente).
- `Marexpress-local.postman_environment.json`: el environment "Marexpress local", con las variables que usa la colección.

## Puesta en marcha

1. En Postman, usa **Import** para cargar los dos archivos.
2. Selecciona el environment **Marexpress local** y completa estas variables:
   - `identificador`: nombre de usuario o correo, por ejemplo `operador.benjamin` o `cliente.cuentacorriente`.
   - `password`: la contraseña del usuario. La de los usuarios de prueba está en `CLAVE_USUARIOS_PRUEBA` del `.env`.
3. Levanta el backend con `npm run dev`, que escucha en `http://localhost:3000`.

## Login (código OTP)

1. Ejecuta **01 · Autenticación → 1. Login (pide OTP)**. El `challengeId` se guarda solo.
2. El código de 6 dígitos llega al correo del usuario. Si en el `.env` está `OTP_EN_CONSOLA=true`, también aparece en la consola del backend como `[OTP DESARROLLO] LOGIN para ...: 123456`.
3. Copia ese código en la variable `otp` y ejecuta **2. Verificar OTP**. El `token` y el `rol` se guardan solos.

Todas las demás peticiones envían ese token. Para cambiar de rol, cambia `identificador` y repite el login.

Las peticiones de la carpeta 01 revisan las variables antes de enviarse. Si falta `identificador`, `password`, `challengeId` o un `otp` de 6 dígitos, la petición no se envía y Postman muestra un error en el panel de respuesta que dice qué variable completar (en ese caso la pestaña Test Results dice "No tests found", porque la petición no salió). Recuerda escribir los valores en la columna **Current value** del environment. Si prefieres escribir un valor directo en el body, en lugar de `{{variable}}`, también funciona: el aviso solo revisa las variables que el body usa.

> `OTP_EN_CONSOLA` es solo para desarrollo. El backend lo ignora si `NODE_ENV=production`.

## Qué carpeta usar según el rol

| Rol | Carpetas |
|---|---|
| ADMINISTRADOR | 02 a 08, y 03 · Tarifas (crear y editar solo el admin) |
| OPERADOR | 02, 04, 05, 06, 07 y 08 |
| PEONETA | 09 |
| CLIENTE normal | 10: perfil, órdenes, detalle y tipos de bulto |
| CLIENTE con cuenta corriente | 10 completa: además pendientes, pago Webpay y cotizaciones |

## Variables encadenadas

Algunas peticiones guardan IDs que usan las siguientes. Cada paso usa su propia OT, para que uno no le quite datos al otro:

- "Crear OT · contado" guarda `idOrden`, `numeroOT` e `idBulto`: es la OT principal que usan Editar OT, Bodega (06) y Manifiestos (07).
- "Crear OT · por pagar" guarda `numeroOTPorPagar`, que usa Pagos (08).
- "Crear OT para anular" guarda `idOrdenAnular`, que usa "Anular OT".
- "Crear OT · cuenta corriente" usa la variable de colección `idClienteCuentaCorriente` (por defecto 1) junto con `idCuenta`.
- "Crear cliente" guarda `idCliente`.
- "Crear manifiesto" guarda `idManifiesto`, y "Escanear OT (listar bultos)" guarda `idBultoManifiesto`, que usa "Quitar bulto".
- "Mis órdenes" guarda `idOrdenCliente`, y "Pendientes de pago" guarda `idOrdenPendiente`.

## Correr carpetas completas (Runner)

Las carpetas 04 a 08 se pueden correr enteras con el **Runner** de Postman, y repetir cuantas veces quieras:

- "Crear cliente", "Crear destinatario" y "Registro de cliente" generan un RUT nuevo en cada ejecución, así que no chocan con datos anteriores.
- El bulto de la OT principal hace el ciclo completo de bodega: lo recibe la sucursal 1, se traslada a la 2 y la sucursal 2 lo recibe. Después queda disponible para el manifiesto.
- "Reingresar OT rechazada a bodega" se salta sola si la variable de colección `numeroOTRechazada` está vacía, porque solo funciona con una OT rechazada en destino.

Cada ejecución crea datos de prueba reales en tu base de datos local: clientes, OT, un manifiesto, etc.

Si una petición responde **401**, el token falta o venció (dura 8 horas): repite el login. Si responde **403**, el rol con el que entraste no tiene acceso a esa ruta.

## Usuarios de prueba

Se crean con `npx tsx scripts/crear-usuarios-prueba.js`, que necesita `CLAVE_USUARIOS_PRUEBA` en el `.env`.

| Usuario | Correo | Rol | Detalle |
|---|---|---|---|
| `admin.benjamin` | ben.sandovalv+admin@duocuc.cl | ADMINISTRADOR | |
| `operador.benjamin` | ben.sandovalv+operador@duocuc.cl | OPERADOR | |
| `peoneta.benjamin` | ben.sandovalv+peoneta@duocuc.cl | PEONETA | Ve los manifiestos en los que lo asignen como peoneta |
| `cliente.benjamin` | ben.sandovalv+cliente@duocuc.cl | CLIENTE | Cliente normal: vinculado a Cliente Prueba MAREXPRESS SpA, que no tiene cuenta corriente |
| `cliente.cuentacorriente` | benja.sandoval.05@gmail.com | CLIENTE | Vinculado a Cliente Prueba SpA, que tiene cuenta corriente |

Los usuarios no se borran, porque tienen historial (OT, pagos y movimientos) que el sistema debe conservar. Para cambiar uno, edita el script y vuelve a correrlo: lo actualiza.

## Webpay (ambiente de integración)

"Iniciar Webpay" (en las carpetas 08 y 10) devuelve una `url` y un `token`. Postman no puede completar el pago: el pago se termina en el navegador con un formulario POST que envía `token_ws`. Lo más simple es pagar desde la aplicación.

Datos de prueba de Transbank para un pago aprobado:

- Tarjeta Visa: `4051 8856 0044 6623`
- CVV: `123`
- Vencimiento: cualquier fecha futura
- RUT: `11.111.111-1`
- Clave: `123`

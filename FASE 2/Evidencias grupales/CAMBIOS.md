# Cambios de la rama

Cinco mejoras chicas al sistema Marexpress. Cada tarea tiene su propio commit.
No se tocó la colección de Postman, los triggers de la base ni el `.env`.

## Antes de probar: scripts que hay que correr en cada base

Las columnas nuevas no se crean solas. Cada integrante debe correr esto **una vez** en su computador, desde la carpeta `backend/`, después de bajar la rama:

```bash
npx tsx scripts/agregar-usuario-ultimo-acceso.js
npx tsx scripts/agregar-manifiesto-cierre-kilometraje.js
npx tsx scripts/agregar-manifiesto-ot-orden-carga.js
npx prisma generate --config prisma7.config.ts
```

- Los tres scripts se pueden correr más de una vez sin problema: si la columna ya existe, dicen "Ya existía".
- El último comando regenera el cliente de Prisma (`backend/generated`, que no se sube a git). Sin él, el backend no conoce los campos nuevos.
- Después hay que **reiniciar el backend** (`npm run dev`), porque no recarga solo.
- Las tareas 4 y 5 no necesitan script: no agregan columnas.

| Script | Tabla | Columnas (todas aceptan nulo) |
| --- | --- | --- |
| `agregar-usuario-ultimo-acceso.js` | `usuario` | `ultimoAcceso` DATETIME |
| `agregar-manifiesto-cierre-kilometraje.js` | `manifiesto` | `fechaCierre` DATETIME, `kilometrajeFinal` INT |
| `agregar-manifiesto-ot-orden-carga.js` | `manifiesto_ot` | `ordenCarga` INT (y numera los manifiestos que ya existían) |

---

## Tarea 1. Último acceso del usuario (RF-04)

**Qué cambió**

- La tabla `usuario` tiene una columna nueva, `ultimoAcceso`, con la fecha y hora del último inicio de sesión.
- Se guarda cuando el login termina bien, es decir, al validar el código que llega por correo (segundo paso). Si el código es incorrecto no se guarda nada.
- La pantalla Usuarios del administrador muestra una columna "Último acceso". Si la persona nunca ha entrado, dice "Nunca".

**Archivos**

- `backend/scripts/agregar-usuario-ultimo-acceso.js` (nuevo)
- `backend/prisma/schema.prisma`
- `backend/src/modules/auth/verificarLogin.service.js`
- `backend/src/modules/maestros/maestros.service.js`
- `frontend/src/sistema/pages/admin/UsuariosPage.jsx`

**Cómo verlo**

1. Entrar como administrador (usuario, contraseña y código del correo).
2. Ir a **Usuarios**.
3. En la fila del administrador, la columna "Último acceso" muestra la fecha y hora de recién. Los que no han entrado desde el cambio dicen "Nunca".

---

## Tarea 2. Fecha de cierre y kilometraje del manifiesto (RF-45)

**Qué cambió**

- La tabla `manifiesto` tiene dos columnas nuevas: `fechaCierre` y `kilometrajeFinal`.
- La fecha de cierre se guarda sola en el mismo momento en que el manifiesto pasa a "Finalizado": cuando se cuadra el último pago de un reparto o cuando se recepciona un traspaso.
- El kilometraje se registra aparte, con un servicio nuevo: `PATCH /api/manifiestos/:id/kilometraje`. Solo acepta manifiestos finalizados y un número entero mayor que 0. Lo pueden usar administrador y operador, igual que el resto del módulo.
- En el detalle de un manifiesto finalizado aparece la fecha de cierre y un campo para guardar o corregir el kilometraje final.

**Archivos**

- `backend/scripts/agregar-manifiesto-cierre-kilometraje.js` (nuevo)
- `backend/prisma/schema.prisma`
- `backend/src/modules/manifiestos/manifiestos.service.js`
- `backend/src/modules/manifiestos/manifiestos.controller.js`
- `backend/src/modules/manifiestos/manifiestos.routes.js`
- `frontend/src/sistema/pages/shared/ManifiestosPage.jsx`

**Cómo verlo**

1. Entrar como administrador e ir a **Manifiestos**.
2. Finalizar un manifiesto. La forma más corta con los datos actuales: abrir el traspaso que está en ruta (MAN-000015) y pulsar **Recepcionar en bodega destino**. (En un reparto, se finaliza al dar de baja la última orden.)
3. El manifiesto queda "Finalizado" y arriba aparece "Fecha de cierre" con la hora de recién.
4. Escribir un número en "Kilometraje final del camión" y pulsar **Guardar kilometraje**. Queda guardado y el botón pasa a decir "Corregir kilometraje".

Ojo: hoy no hay ningún manifiesto finalizado en la base, así que hasta finalizar uno no se ve nada nuevo. Recepcionar el traspaso es un cambio real en los datos y no se puede deshacer.

---

## Tarea 3. Orden de carga (RF-41)

**Qué cambió**

- La tabla `manifiesto_ot` tiene una columna nueva, `ordenCarga`: el número de orden en que cada OT se subió al camión.
- Cuando se escanea el primer bulto de una OT, se le asigna el número mayor del manifiesto más 1 (1, 2, 3...).
- Si una OT se saca del manifiesto, las demás no se renumeran: conservan su número.
- El script numeró los manifiestos que ya existían según el orden en que se cargaron.
- El número se ve en el detalle del manifiesto y en la pantalla del peoneta. No cambia el orden en que se listan.

**Archivos**

- `backend/scripts/agregar-manifiesto-ot-orden-carga.js` (nuevo)
- `backend/prisma/schema.prisma`
- `backend/src/modules/manifiestos/manifiestos.service.js`
- `backend/src/modules/peoneta/peoneta.service.js`
- `frontend/src/sistema/pages/shared/ManifiestosPage.jsx`
- `frontend/src/sistema/pages/peoneta/ManifiestosPeonetaPage.jsx`

**Cómo verlo**

1. Entrar como operador o administrador, ir a **Manifiestos** y abrir uno en preparación.
2. Escanear o cargar dos OT. En la tabla, cada grupo empieza con "Carga N° 1", "Carga N° 2".
3. Como administrador, abrir un manifiesto en ruta: la tabla "Órdenes del viaje" tiene la columna "Carga N°".
4. Entrar como peoneta, abrir su manifiesto: cada OT muestra "Orden de carga N" junto a su estado.

---

## Tarea 4. Alerta de morosidad

**Qué cambió**

- Hay una función nueva, `calcularMorosidad`, que devuelve dos listas:
  - **OT impagas:** órdenes entregadas hace más de 7 días cuyo último pago no está pagado y no es de cuenta corriente. No cuentan las anuladas ni las canceladas. Los 7 días están en la constante `DIAS_GRACIA_OT_IMPAGA`.
  - **Cuentas sobre el límite:** cuentas corrientes activas, con límite de crédito mayor que 0, cuyo saldo supera el límite.
- Con esas listas se crean alertas de tipo `MOROSIDAD` cada vez que se cargan las alertas (la campana): una por OT impaga y una por cuenta sobre el límite.
- Cuando la deuda se paga, la alerta se marca como leída sola.
- Si el administrador la marca como leída a mano, no vuelve a aparecer: una sola vez por OT, y para una misma cuenta no antes de 30 días.
- En Cuentas corrientes, la lista "Con deuda" marca con la etiqueta roja "Sobre el límite" a las cuentas que cumplen la regla.

Las alertas de cuenta no tienen OT asociada; se reconocen por su título ("Cuenta corriente N° X sobre el límite"). No se agregaron columnas a la tabla `alerta` ni se cambió el funcionamiento de las alertas que ya existían.

**Archivos**

- `backend/src/modules/pagos/morosidad.service.js` (nuevo)
- `backend/src/modules/alertas/alertas.service.js`
- `frontend/src/sistema/pages/admin/CuentasCorrientesPage.jsx`
- `frontend/src/sistema/sistema.css` (clase `mx-badge-limite` para la etiqueta)

**Cómo verlo**

1. Entrar como administrador u operador y abrir la campana.
2. Con los datos actuales aparece una alerta: "OT impaga OT-000001", con el cliente, el monto ($65.000), la fecha de entrega y los días que lleva.
3. Pulsar "Leída" en esa alerta y volver a abrir la campana: no se vuelve a crear.
4. La alerta de cuenta corriente ("Cuenta corriente N° X sobre el límite") y la etiqueta "Sobre el límite" en **Cuentas corrientes** aparecen cuando una cuenta debe más que su límite. Hoy ninguna cuenta está en ese caso (Cliente Prueba SpA debe $359.975 y su límite es $5.000.000), y el límite solo se puede fijar al crear el cliente. Para mostrarlo en la demo: crear un cliente con cuenta corriente y un límite bajo (por ejemplo $10.000) y hacerle una OT a cuenta corriente por un valor mayor.

---

## Tarea 5. Secciones nuevas del reporte

**Qué cambió**

- El informe del administrador devuelve tres datos nuevos (`pagos`, `cuadraturas` y `morosidad`) sin cambiar nada de lo que ya devolvía.
- **Pagos del período por método:** cantidad y monto de los pagos pagados cuya fecha cae en el período, agrupados por método. Webpay guarda el método como "TARJETA", igual que la tarjeta presencial; se distinguen porque Webpay deja escrito "Webpay..." en la observación del pago. Se muestran como "Tarjeta por Webpay" y "Tarjeta presencial (caja o reparto)".
- **Cuadraturas del período:** los pagos que el administrador cuadró en un manifiesto (observación "Cuadrado en MAN-..."), con fecha, manifiesto, OT, método, monto y el total.
- **Morosidad:** deuda por cliente usando la misma función de la tarea 4. Es el estado de hoy y no cambia con el período; el título de la sección lo dice.
- En la pantalla, las tres secciones tienen el mismo estilo que las anteriores y sus botones de Excel y PDF, que usan las mismas funciones de descarga que ya existían.

**Archivos**

- `backend/src/modules/reportes/reportes.service.js`
- `frontend/src/sistema/pages/admin/ReportesPage.jsx`

**Cómo verlo**

1. Entrar como administrador e ir a **Reportes**.
2. Elegir "Por año" y pulsar **Ver informe**. Bajar hasta el final de la página.
3. "Pagos del período por método" muestra 18 pagos por $500.800, separados en Webpay, efectivo, transferencia y tarjeta presencial.
4. "Cuadraturas del período" está vacía hasta que se cuadre un pago en un manifiesto (dar de baja una orden al recepcionar un reparto).
5. "Morosidad al día de hoy" muestra a Cliente Prueba SpA con la OT-000001 impaga. Cambiar el período no cambia esta sección.
6. Probar los botones **Excel** y **PDF** de cada sección.

---

## Cómo se probó

- La lógica de cada tarea se probó llamando a las funciones del servicio desde scripts temporales, dentro de una transacción que se deshace al final. La base quedó con los mismos datos que antes: no hay OT, manifiestos, pagos ni alertas de prueba.
- El backend levanta sin errores y los servicios nuevos responden por HTTP (probado en el puerto 3100).
- En `frontend/`, `npm run build` pasa y `npm run lint` da los mismos 2 errores y 49 avisos que ya tenía el proyecto antes de estos cambios (ninguno nuevo).
- **No se revisó a ojo en el navegador.** Las pantallas compilan, pero conviene mirarlas una vez antes de la demo siguiendo los pasos de arriba.

## Cosas a tener en cuenta para la demo

- **Conexión a MySQL después de reiniciar el computador.** Al empezar, el backend no pudo conectarse a MySQL: el usuario de la base usa la autenticación `caching_sha2_password` y la conexión del proyecto no permite pedir la clave pública. Se arregla solo cuando alguien entra una vez a MySQL con ese usuario desde otro programa (por ejemplo MySQL Workbench). Antes de la demo, abrir Workbench y conectarse, o agregar `allowPublicKeyRetrieval: true` en `backend/src/config/prisma.js` (no se cambió porque no era parte de estas tareas).
- **La primera alerta de morosidad** (OT-000001) se crea la primera vez que un administrador u operador abre la aplicación con el backend nuevo.
- **Los 2 errores de lint que ya existían** están en `frontend/src/App.jsx` (`PlaceholderPage` sin usar) y `frontend/src/pages/Seguimiento.jsx` (`setState` dentro de un efecto). No se tocaron.

export const formatos = {
    rut: {
        placeholder: "12.345.678-9",
        title: "RUT chileno con puntos y guion",
        maxLength: 12,
        autoComplete: "off"
    },
    nombre: {
        placeholder: "Nombre",
        title: "Solo el nombre, sin números",
        maxLength: 100,
        autoComplete: "given-name"
    },
    apellido: {
        placeholder: "Apellido",
        title: "Apellido paterno",
        maxLength: 100,
        autoComplete: "family-name"
    },
    razon: {
        placeholder: "Nombre o razón social",
        title: "Nombre de la empresa o persona",
        maxLength: 150
    },
    fantasia: {
        placeholder: "Nombre de fantasía",
        maxLength: 150
    },
    giro: {
        placeholder: "Ej. Transporte de carga",
        maxLength: 150
    },
    telefono: {
        type: "tel",
        placeholder: "+56 9 1234 5678",
        title: "Teléfono chileno, con código de país",
        maxLength: 16,
        inputMode: "tel",
        autoComplete: "tel"
    },
    correo: {
        type: "email",
        placeholder: "nombre@correo.cl",
        title: "Correo electrónico válido",
        maxLength: 150,
        autoComplete: "email"
    },
    usuario: {
        placeholder: "usuario.marexpress",
        title: "Sin espacios. Letras, números, punto o guion",
        maxLength: 50,
        autoComplete: "username",
        pattern: "[A-Za-z0-9._-]{3,50}"
    },
    identificador: {
        placeholder: "usuario o correo@empresa.cl",
        title: "Nombre de usuario o correo electrónico",
        maxLength: 150,
        autoComplete: "username"
    },
    password: {
        title: "Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo",
        minLength: 10,
        autoComplete: "new-password"
    },
    passwordActual: {
        title: "Contraseña de la cuenta",
        autoComplete: "current-password"
    },
    otp: {
        placeholder: "000000",
        title: "Código numérico enviado al correo",
        inputMode: "numeric",
        autoComplete: "one-time-code",
        maxLength: 8,
        pattern: "[0-9]{4,8}"
    },
    direccion: {
        placeholder: "Calle 123, depto 4",
        title: "Calle, número y referencia corta",
        maxLength: 200,
        autoComplete: "street-address"
    },
    referencia: {
        placeholder: "Ej. Portón azul, timbre 2",
        title: "Dato para encontrar el lugar de entrega",
        maxLength: 255
    },
    documento: {
        placeholder: "123456",
        title: "Número de factura o guía, sin puntos",
        maxLength: 50
    },
    descripcion: {
        placeholder: "Ej. Caja de documentos",
        title: "Qué se está enviando",
        maxLength: 200
    },
    dinero: {
        type: "number",
        min: "0",
        step: "1",
        placeholder: "0",
        title: "Monto en pesos chilenos, sin puntos ni signo",
        inputMode: "numeric"
    },
    dineroOpcional: {
        type: "number",
        min: "0",
        step: "1",
        placeholder: "Opcional, dejar vacío",
        title: "Opcional. La empresa no usa precio base; si queda vacío se guarda en 0 y no se cobra",
        inputMode: "numeric"
    },
    kg: {
        type: "number",
        min: "0",
        step: "0.01",
        placeholder: "0,00",
        title: "Peso en kilogramos, con hasta 2 decimales",
        inputMode: "decimal"
    },
    cm: {
        type: "number",
        min: "0",
        step: "1",
        placeholder: "0",
        title: "Medida en centímetros, número entero",
        inputMode: "numeric"
    },
    cantidad: {
        type: "number",
        min: "1",
        step: "1",
        placeholder: "1",
        title: "Cantidad de bultos, número entero",
        inputMode: "numeric"
    },
    patente: {
        placeholder: "ABCD12",
        title: "Patente chilena: 2 a 4 letras y 2 números",
        maxLength: 8,
        autoCapitalize: "characters"
    },
    marca: {
        placeholder: "Ej. Chevrolet",
        maxLength: 50
    },
    modelo: {
        placeholder: "Ej. NPR",
        maxLength: 50
    },
    anio: {
        type: "number",
        min: "1980",
        max: "2100",
        step: "1",
        placeholder: "2020",
        title: "Año del vehículo, 4 dígitos",
        inputMode: "numeric"
    },
    licencia: {
        placeholder: "A4",
        title: "Clase de licencia de conducir",
        maxLength: 20
    },
    fecha: {
        type: "date",
        title: "Fecha en formato día, mes y año"
    },
    busqueda: {
        type: "search",
        placeholder: "Buscar por número, cliente o comuna",
        title: "Texto libre para filtrar el listado"
    },
    contacto: {
        placeholder: "Nombre de quien recibe o despacha",
        maxLength: 150
    }
};

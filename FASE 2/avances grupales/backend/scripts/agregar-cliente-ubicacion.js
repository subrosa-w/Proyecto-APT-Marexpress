import prisma from "../src/config/prisma.js";

try {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS cliente_ubicacion (
            idClienteUbicacion INT AUTO_INCREMENT PRIMARY KEY,

            idCliente INT NOT NULL,
            idComuna INT NOT NULL,

            nombre VARCHAR(120) NOT NULL,
            tipoUbicacion VARCHAR(30) NOT NULL,

            direccion VARCHAR(200) NOT NULL,
            referencia VARCHAR(250) NULL,

            nombreContacto VARCHAR(120) NULL,
            telefonoContacto VARCHAR(20) NULL,
            correoContacto VARCHAR(150) NULL,

            esPrincipal BOOLEAN NOT NULL DEFAULT FALSE,
            permiteRetiro BOOLEAN NOT NULL DEFAULT TRUE,
            permiteEntrega BOOLEAN NOT NULL DEFAULT TRUE,
            estado BOOLEAN NOT NULL DEFAULT TRUE,

            fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT fk_cliente_ubicacion_cliente
                FOREIGN KEY (idCliente)
                REFERENCES cliente(idCliente),

            CONSTRAINT fk_cliente_ubicacion_comuna
                FOREIGN KEY (idComuna)
                REFERENCES comuna(idComuna),

            CONSTRAINT chk_cliente_ubicacion_tipo
                CHECK (
                    tipoUbicacion IN (
                        'CASA_MATRIZ',
                        'SUCURSAL',
                        'BODEGA',
                        'CENTRO_DISTRIBUCION',
                        'OTRA'
                    )
                )
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX idx_cliente_ubicacion_cliente
        ON cliente_ubicacion (idCliente)
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX idx_cliente_ubicacion_comuna
        ON cliente_ubicacion (idComuna)
    `);

    console.log(
        "✅ Tabla cliente_ubicacion creada correctamente."
    );

} catch (error) {
    console.error(
        "❌ Error creando cliente_ubicacion:"
    );
    console.error(error.message);

} finally {
    await prisma.$disconnect();
}
import prisma from "../src/config/prisma.js";

/*
 * Crea las tablas de cotizaciones del portal cliente (cuenta corriente).
 * Ejecutar una vez: npx tsx scripts/agregar-cotizacion.js
 * Se puede repetir sin problema: usa CREATE TABLE IF NOT EXISTS.
 */
try {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS cotizacion (
            idCotizacion INT AUTO_INCREMENT PRIMARY KEY,
            numeroCotizacion VARCHAR(20) NULL,

            fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            validaHasta DATE NOT NULL,
            estado VARCHAR(20) NOT NULL DEFAULT 'VIGENTE',
            tipoServicio VARCHAR(30) NOT NULL DEFAULT 'NORMAL',

            cantidadBultos INT NOT NULL,
            pesoTotal DECIMAL(12,2) NOT NULL,
            volumenTotalM3 DECIMAL(12,4) NOT NULL DEFAULT 0,
            tipoCobro VARCHAR(20) NULL,

            valorNeto DECIMAL(12,2) NOT NULL,
            valorIva DECIMAL(12,2) NOT NULL,
            valorTotal DECIMAL(12,2) NOT NULL,

            idCliente INT NOT NULL,
            idUsuario INT NOT NULL,
            idComunaOrigen INT NOT NULL,
            idComunaDestino INT NOT NULL,
            idTarifa INT NOT NULL,
            idOrden INT NULL,

            CONSTRAINT uq_cotizacion_numero UNIQUE (numeroCotizacion),

            CONSTRAINT fk_cotizacion_cliente
                FOREIGN KEY (idCliente) REFERENCES cliente(idCliente),
            CONSTRAINT fk_cotizacion_usuario
                FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
            CONSTRAINT fk_cotizacion_comuna_origen
                FOREIGN KEY (idComunaOrigen) REFERENCES comuna(idComuna),
            CONSTRAINT fk_cotizacion_comuna_destino
                FOREIGN KEY (idComunaDestino) REFERENCES comuna(idComuna),
            CONSTRAINT fk_cotizacion_tarifa
                FOREIGN KEY (idTarifa) REFERENCES tarifa(idTarifa),
            CONSTRAINT fk_cotizacion_orden
                FOREIGN KEY (idOrden) REFERENCES orden_transporte(idOrden),

            CONSTRAINT chk_cotizacion_estado
                CHECK (estado IN ('VIGENTE', 'CONVERTIDA', 'ANULADA')),
            CONSTRAINT chk_cotizacion_bultos
                CHECK (cantidadBultos > 0),
            CONSTRAINT chk_cotizacion_valores
                CHECK (valorNeto >= 0 AND valorIva >= 0 AND valorTotal >= 0)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS cotizacion_detalle (
            idCotizacionDetalle INT AUTO_INCREMENT PRIMARY KEY,
            idCotizacion INT NOT NULL,
            idTipoBulto INT NOT NULL,

            cantidad INT NOT NULL,
            pesoUnitario DECIMAL(10,2) NOT NULL,
            largoCm DECIMAL(10,2) NOT NULL,
            anchoCm DECIMAL(10,2) NOT NULL,
            altoCm DECIMAL(10,2) NOT NULL,

            CONSTRAINT fk_cotizacion_detalle_cotizacion
                FOREIGN KEY (idCotizacion) REFERENCES cotizacion(idCotizacion),
            CONSTRAINT fk_cotizacion_detalle_tipo_bulto
                FOREIGN KEY (idTipoBulto) REFERENCES tipo_bulto(idTipoBulto),

            CONSTRAINT chk_cotizacion_detalle_cantidad
                CHECK (cantidad > 0),
            CONSTRAINT chk_cotizacion_detalle_medidas
                CHECK (pesoUnitario > 0 AND largoCm > 0 AND anchoCm > 0 AND altoCm > 0)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci
    `);

    console.log("✅ Tablas cotizacion y cotizacion_detalle listas.");
} catch (error) {
    console.error("❌ Error creando las tablas de cotización:", error.message);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}

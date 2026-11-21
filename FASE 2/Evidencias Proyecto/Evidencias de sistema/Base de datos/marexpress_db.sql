-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: marexpress_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alerta`
--

DROP TABLE IF EXISTS `alerta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alerta` (
  `idAlerta` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(40) COLLATE utf8mb4_spanish_ci NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_spanish_ci NOT NULL,
  `mensaje` varchar(300) COLLATE utf8mb4_spanish_ci NOT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  `idOrden` int DEFAULT NULL,
  `idUsuario` int DEFAULT NULL,
  PRIMARY KEY (`idAlerta`),
  KEY `fk_alerta_orden` (`idOrden`),
  KEY `fk_alerta_usuario` (`idUsuario`),
  KEY `idx_alerta_leida_fecha` (`leida`,`fechaCreacion`),
  CONSTRAINT `fk_alerta_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_alerta_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alerta`
--

LOCK TABLES `alerta` WRITE;
/*!40000 ALTER TABLE `alerta` DISABLE KEYS */;
/*!40000 ALTER TABLE `alerta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bulto`
--

DROP TABLE IF EXISTS `bulto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulto` (
  `idBulto` int NOT NULL AUTO_INCREMENT,
  `codigoBulto` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `numeroBulto` int NOT NULL,
  `idDetalleCarga` int NOT NULL,
  `idSucursalActual` int DEFAULT NULL,
  `peso` decimal(10,2) DEFAULT NULL,
  `largoCm` decimal(10,2) DEFAULT NULL,
  `anchoCm` decimal(10,2) DEFAULT NULL,
  `altoCm` decimal(10,2) DEFAULT NULL,
  `estado` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'EN_BODEGA',
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idBulto`),
  UNIQUE KEY `codigoBulto` (`codigoBulto`),
  UNIQUE KEY `uq_bulto_detalle_numero` (`idDetalleCarga`,`numeroBulto`),
  KEY `fk_bulto_sucursal_actual` (`idSucursalActual`),
  CONSTRAINT `fk_bulto_detalle_carga` FOREIGN KEY (`idDetalleCarga`) REFERENCES `detalle_carga` (`idDetalleCarga`),
  CONSTRAINT `fk_bulto_sucursal_actual` FOREIGN KEY (`idSucursalActual`) REFERENCES `sucursal` (`idSucursal`),
  CONSTRAINT `chk_bulto_estado` CHECK ((`estado` in (_utf8mb4'EN_BODEGA',_utf8mb4'ASIGNADO_MANIFIESTO',_utf8mb4'EN_TRANSITO',_utf8mb4'EN_TRASLADO',_utf8mb4'EN_REPARTO',_utf8mb4'ENTREGADO',_utf8mb4'RECHAZADO',_utf8mb4'DEVUELTO')))
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulto`
--

LOCK TABLES `bulto` WRITE;
/*!40000 ALTER TABLE `bulto` DISABLE KEYS */;
/*!40000 ALTER TABLE `bulto` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_bulto_identidad_update` BEFORE UPDATE ON `bulto` FOR EACH ROW BEGIN
    DECLARE v_movimientos INT DEFAULT 0;

    IF OLD.codigoBulto <> NEW.codigoBulto
       OR OLD.numeroBulto <> NEW.numeroBulto
       OR OLD.idDetalleCarga <> NEW.idDetalleCarga THEN

        SELECT COUNT(*)
        INTO v_movimientos
        FROM movimiento_bulto
        WHERE idBulto = OLD.idBulto;

        IF v_movimientos > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede modificar la identidad de un bulto que ya tiene movimientos registrados';
        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_bulto_delete` BEFORE DELETE ON `bulto` FOR EACH ROW BEGIN
    DECLARE v_asignaciones INT DEFAULT 0;
    DECLARE v_entregas INT DEFAULT 0;
    DECLARE v_movimientos INT DEFAULT 0;

    SELECT COUNT(*)
    INTO v_asignaciones
    FROM manifiesto_bulto
    WHERE idBulto = OLD.idBulto;

    SELECT COUNT(*)
    INTO v_entregas
    FROM entrega_bulto
    WHERE idBulto = OLD.idBulto;

    SELECT COUNT(*)
    INTO v_movimientos
    FROM movimiento_bulto
    WHERE idBulto = OLD.idBulto;

    IF v_asignaciones > 0
       OR v_entregas > 0
       OR v_movimientos > 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede eliminar un bulto que posee historial logistico';

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `idCliente` int NOT NULL AUTO_INCREMENT,
  `rut` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `razonSocial` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `nombreFantasia` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `giro` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `direccion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `correo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `idComuna` int NOT NULL,
  `idTarifa` int DEFAULT NULL,
  PRIMARY KEY (`idCliente`),
  UNIQUE KEY `rut` (`rut`),
  KEY `fk_cliente_comuna` (`idComuna`),
  KEY `fk_cliente_tarifa` (`idTarifa`),
  CONSTRAINT `fk_cliente_comuna` FOREIGN KEY (`idComuna`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `fk_cliente_tarifa` FOREIGN KEY (`idTarifa`) REFERENCES `tarifa` (`idTarifa`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente_ubicacion`
--

DROP TABLE IF EXISTS `cliente_ubicacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente_ubicacion` (
  `idClienteUbicacion` int NOT NULL AUTO_INCREMENT,
  `idCliente` int NOT NULL,
  `idComuna` int NOT NULL,
  `nombre` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `tipoUbicacion` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `direccion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `referencia` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombreContacto` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `telefonoContacto` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `correoContacto` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `esPrincipal` tinyint(1) NOT NULL DEFAULT '0',
  `permiteRetiro` tinyint(1) NOT NULL DEFAULT '1',
  `permiteEntrega` tinyint(1) NOT NULL DEFAULT '1',
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idClienteUbicacion`),
  KEY `idx_cliente_ubicacion_cliente` (`idCliente`),
  KEY `idx_cliente_ubicacion_comuna` (`idComuna`),
  CONSTRAINT `fk_cliente_ubicacion_cliente` FOREIGN KEY (`idCliente`) REFERENCES `cliente` (`idCliente`),
  CONSTRAINT `fk_cliente_ubicacion_comuna` FOREIGN KEY (`idComuna`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `chk_cliente_ubicacion_tipo` CHECK ((`tipoUbicacion` in (_utf8mb4'CASA_MATRIZ',_utf8mb4'SUCURSAL',_utf8mb4'BODEGA',_utf8mb4'CENTRO_DISTRIBUCION',_utf8mb4'OTRA')))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente_ubicacion`
--

LOCK TABLES `cliente_ubicacion` WRITE;
/*!40000 ALTER TABLE `cliente_ubicacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `cliente_ubicacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente_usuario`
--

DROP TABLE IF EXISTS `cliente_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente_usuario` (
  `idClienteUsuario` int NOT NULL AUTO_INCREMENT,
  `idCliente` int NOT NULL,
  `idUsuario` int NOT NULL,
  `fechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idClienteUsuario`),
  UNIQUE KEY `uq_cliente_usuario` (`idCliente`,`idUsuario`),
  KEY `fk_cliente_usuario_usuario` (`idUsuario`),
  CONSTRAINT `fk_cliente_usuario_cliente` FOREIGN KEY (`idCliente`) REFERENCES `cliente` (`idCliente`),
  CONSTRAINT `fk_cliente_usuario_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente_usuario`
--

LOCK TABLES `cliente_usuario` WRITE;
/*!40000 ALTER TABLE `cliente_usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `cliente_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comuna`
--

DROP TABLE IF EXISTS `comuna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comuna` (
  `idComuna` int NOT NULL AUTO_INCREMENT,
  `nombreComuna` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `idRegion` int NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idComuna`),
  UNIQUE KEY `uq_comuna_region` (`nombreComuna`,`idRegion`),
  KEY `fk_comuna_region` (`idRegion`),
  CONSTRAINT `fk_comuna_region` FOREIGN KEY (`idRegion`) REFERENCES `region` (`idRegion`)
) ENGINE=InnoDB AUTO_INCREMENT=347 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comuna`
--

LOCK TABLES `comuna` WRITE;
/*!40000 ALTER TABLE `comuna` DISABLE KEYS */;
/*!40000 ALTER TABLE `comuna` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conductor`
--

DROP TABLE IF EXISTS `conductor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conductor` (
  `idConductor` int NOT NULL AUTO_INCREMENT,
  `rut` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `apellido` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `licencia` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `vencimientoLicencia` date DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idConductor`),
  UNIQUE KEY `rut` (`rut`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conductor`
--

LOCK TABLES `conductor` WRITE;
/*!40000 ALTER TABLE `conductor` DISABLE KEYS */;
/*!40000 ALTER TABLE `conductor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizacion`
--

DROP TABLE IF EXISTS `cotizacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizacion` (
  `idCotizacion` int NOT NULL AUTO_INCREMENT,
  `numeroCotizacion` varchar(20) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `validaHasta` date NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'VIGENTE',
  `tipoServicio` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'NORMAL',
  `cantidadBultos` int NOT NULL,
  `pesoTotal` decimal(12,2) NOT NULL,
  `volumenTotalM3` decimal(12,4) NOT NULL DEFAULT '0.0000',
  `tipoCobro` varchar(20) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `valorNeto` decimal(12,2) NOT NULL,
  `valorIva` decimal(12,2) NOT NULL,
  `valorTotal` decimal(12,2) NOT NULL,
  `idCliente` int NOT NULL,
  `idUsuario` int NOT NULL,
  `idComunaOrigen` int NOT NULL,
  `idComunaDestino` int NOT NULL,
  `idTarifa` int NOT NULL,
  `idOrden` int DEFAULT NULL,
  PRIMARY KEY (`idCotizacion`),
  UNIQUE KEY `uq_cotizacion_numero` (`numeroCotizacion`),
  KEY `fk_cotizacion_cliente` (`idCliente`),
  KEY `fk_cotizacion_usuario` (`idUsuario`),
  KEY `fk_cotizacion_comuna_origen` (`idComunaOrigen`),
  KEY `fk_cotizacion_comuna_destino` (`idComunaDestino`),
  KEY `fk_cotizacion_tarifa` (`idTarifa`),
  KEY `fk_cotizacion_orden` (`idOrden`),
  CONSTRAINT `fk_cotizacion_cliente` FOREIGN KEY (`idCliente`) REFERENCES `cliente` (`idCliente`),
  CONSTRAINT `fk_cotizacion_comuna_destino` FOREIGN KEY (`idComunaDestino`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `fk_cotizacion_comuna_origen` FOREIGN KEY (`idComunaOrigen`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `fk_cotizacion_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_cotizacion_tarifa` FOREIGN KEY (`idTarifa`) REFERENCES `tarifa` (`idTarifa`),
  CONSTRAINT `fk_cotizacion_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`),
  CONSTRAINT `chk_cotizacion_bultos` CHECK ((`cantidadBultos` > 0)),
  CONSTRAINT `chk_cotizacion_estado` CHECK ((`estado` in (_utf8mb4'VIGENTE',_utf8mb4'CONVERTIDA',_utf8mb4'ANULADA'))),
  CONSTRAINT `chk_cotizacion_valores` CHECK (((`valorNeto` >= 0) and (`valorIva` >= 0) and (`valorTotal` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizacion`
--

LOCK TABLES `cotizacion` WRITE;
/*!40000 ALTER TABLE `cotizacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotizacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizacion_detalle`
--

DROP TABLE IF EXISTS `cotizacion_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizacion_detalle` (
  `idCotizacionDetalle` int NOT NULL AUTO_INCREMENT,
  `idCotizacion` int NOT NULL,
  `idTipoBulto` int NOT NULL,
  `cantidad` int NOT NULL,
  `pesoUnitario` decimal(10,2) NOT NULL,
  `largoCm` decimal(10,2) NOT NULL,
  `anchoCm` decimal(10,2) NOT NULL,
  `altoCm` decimal(10,2) NOT NULL,
  PRIMARY KEY (`idCotizacionDetalle`),
  KEY `fk_cotizacion_detalle_cotizacion` (`idCotizacion`),
  KEY `fk_cotizacion_detalle_tipo_bulto` (`idTipoBulto`),
  CONSTRAINT `fk_cotizacion_detalle_cotizacion` FOREIGN KEY (`idCotizacion`) REFERENCES `cotizacion` (`idCotizacion`),
  CONSTRAINT `fk_cotizacion_detalle_tipo_bulto` FOREIGN KEY (`idTipoBulto`) REFERENCES `tipo_bulto` (`idTipoBulto`),
  CONSTRAINT `chk_cotizacion_detalle_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_cotizacion_detalle_medidas` CHECK (((`pesoUnitario` > 0) and (`largoCm` > 0) and (`anchoCm` > 0) and (`altoCm` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizacion_detalle`
--

LOCK TABLES `cotizacion_detalle` WRITE;
/*!40000 ALTER TABLE `cotizacion_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotizacion_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuenta_corriente`
--

DROP TABLE IF EXISTS `cuenta_corriente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuenta_corriente` (
  `idCuenta` int NOT NULL AUTO_INCREMENT,
  `fechaApertura` date NOT NULL,
  `limiteCredito` decimal(12,2) DEFAULT '0.00',
  `saldoActual` decimal(12,2) DEFAULT '0.00',
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `idCliente` int NOT NULL,
  PRIMARY KEY (`idCuenta`),
  UNIQUE KEY `uq_cuenta_corriente_cliente` (`idCliente`),
  CONSTRAINT `fk_cuenta_cliente` FOREIGN KEY (`idCliente`) REFERENCES `cliente` (`idCliente`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuenta_corriente`
--

LOCK TABLES `cuenta_corriente` WRITE;
/*!40000 ALTER TABLE `cuenta_corriente` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuenta_corriente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `destinatario`
--

DROP TABLE IF EXISTS `destinatario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `destinatario` (
  `idDestinatario` int NOT NULL AUTO_INCREMENT,
  `rut` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombreRazonSocial` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `direccion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `correo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `referencia` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idComuna` int NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idDestinatario`),
  UNIQUE KEY `uq_destinatario_rut` (`rut`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `destinatario`
--

LOCK TABLES `destinatario` WRITE;
/*!40000 ALTER TABLE `destinatario` DISABLE KEYS */;
/*!40000 ALTER TABLE `destinatario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_carga`
--

DROP TABLE IF EXISTS `detalle_carga`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_carga` (
  `idDetalleCarga` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `cantidad` int NOT NULL,
  `pesoUnitario` decimal(10,2) DEFAULT NULL,
  `pesoTotal` decimal(10,2) DEFAULT NULL,
  `largoCm` decimal(10,2) DEFAULT NULL,
  `anchoCm` decimal(10,2) DEFAULT NULL,
  `altoCm` decimal(10,2) DEFAULT NULL,
  `volumenM3` decimal(12,4) GENERATED ALWAYS AS ((((`largoCm` * `anchoCm`) * `altoCm`) / 1000000)) STORED,
  `valorDeclarado` decimal(12,2) DEFAULT NULL,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idOrden` int NOT NULL,
  `idTipoBulto` int NOT NULL,
  PRIMARY KEY (`idDetalleCarga`),
  KEY `fk_detalle_carga_orden` (`idOrden`),
  KEY `fk_detalle_carga_tipo_bulto` (`idTipoBulto`),
  CONSTRAINT `fk_detalle_carga_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_detalle_carga_tipo_bulto` FOREIGN KEY (`idTipoBulto`) REFERENCES `tipo_bulto` (`idTipoBulto`),
  CONSTRAINT `chk_detalle_alto` CHECK (((`altoCm` is null) or (`altoCm` > 0))),
  CONSTRAINT `chk_detalle_ancho` CHECK (((`anchoCm` is null) or (`anchoCm` > 0))),
  CONSTRAINT `chk_detalle_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_detalle_largo` CHECK (((`largoCm` is null) or (`largoCm` > 0))),
  CONSTRAINT `chk_detalle_peso_total` CHECK (((`pesoTotal` is null) or (`pesoTotal` > 0))),
  CONSTRAINT `chk_detalle_peso_unitario` CHECK (((`pesoUnitario` is null) or (`pesoUnitario` > 0))),
  CONSTRAINT `chk_detalle_valor_declarado` CHECK (((`valorDeclarado` is null) or (`valorDeclarado` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_carga`
--

LOCK TABLES `detalle_carga` WRITE;
/*!40000 ALTER TABLE `detalle_carga` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_carga` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_detalle_carga_update` BEFORE UPDATE ON `detalle_carga` FOR EACH ROW BEGIN
    DECLARE cantidadEntregada INT DEFAULT 0;
    DECLARE cantidadActiva INT DEFAULT 0;

    /* Si la carga ya tiene historial, no permitir moverla a otra OT */
    IF NEW.idOrden <> OLD.idOrden THEN

        IF EXISTS (
            SELECT 1
            FROM manifiesto_carga mc
            WHERE mc.idDetalleCarga = OLD.idDetalleCarga
        )
        OR EXISTS (
            SELECT 1
            FROM entrega_carga ec
            WHERE ec.idDetalleCarga = OLD.idDetalleCarga
        ) THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede cambiar la OT de una carga que ya tiene movimientos';
        END IF;

    END IF;

    /* Total efectivamente entregado */
    SELECT COALESCE(SUM(ec.cantidadEntregada), 0)
    INTO cantidadEntregada
    FROM entrega_carga ec
    WHERE ec.idDetalleCarga = OLD.idDetalleCarga;

    /*
      Cantidad todavía comprometida en manifiestos activos.

      Los manifiestos ya finalizados no siguen reservando
      la carga pendiente.
    */
    SELECT COALESCE(
        SUM(
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM entrega_ot eo_terminal
                    WHERE eo_terminal.idManifiestoOT = mc.idManifiestoOT
                      AND eo_terminal.resultadoEntrega IN (
                          'ENTREGADA',
                          'ENTREGA_PARCIAL',
                          'RECHAZADA',
                          'NO_RECIBIDO'
                      )
                )
                THEN 0

                ELSE GREATEST(
                    mc.cantidadEnviada -
                    COALESCE(
                        (
                            SELECT SUM(ec2.cantidadEntregada)
                            FROM entrega_carga ec2
                            INNER JOIN entrega_ot eo2
                                ON eo2.idEntrega = ec2.idEntrega
                            WHERE eo2.idManifiestoOT = mc.idManifiestoOT
                              AND ec2.idDetalleCarga = mc.idDetalleCarga
                        ),
                        0
                    ),
                    0
                )
            END
        ),
        0
    )
    INTO cantidadActiva
    FROM manifiesto_carga mc
    WHERE mc.idDetalleCarga = OLD.idDetalleCarga;

    /*
      No permitir reducir la cantidad original
      por debajo de lo ya entregado o comprometido.
    */
    IF NEW.cantidad < cantidadEntregada + cantidadActiva THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La cantidad no puede ser menor que lo entregado y comprometido actualmente';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_detalle_carga_delete` BEFORE DELETE ON `detalle_carga` FOR EACH ROW BEGIN
    DECLARE cantidadEnviada INT;
    DECLARE cantidadEntregada INT;

    SELECT COALESCE(SUM(cantidadEnviada), 0)
    INTO cantidadEnviada
    FROM manifiesto_carga
    WHERE idDetalleCarga = OLD.idDetalleCarga;

    SELECT COALESCE(SUM(cantidadEntregada), 0)
    INTO cantidadEntregada
    FROM entrega_carga
    WHERE idDetalleCarga = OLD.idDetalleCarga;

    IF cantidadEnviada > 0 OR cantidadEntregada > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede eliminar un detalle de carga que ya tiene envios o entregas';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `entrega_bulto`
--

DROP TABLE IF EXISTS `entrega_bulto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrega_bulto` (
  `idEntregaBulto` int NOT NULL AUTO_INCREMENT,
  `idEntrega` int NOT NULL,
  `idBulto` int NOT NULL,
  `estadoEntrega` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `fechaRegistro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idEntregaBulto`),
  UNIQUE KEY `uq_entrega_bulto` (`idEntrega`,`idBulto`),
  KEY `fk_entrega_bulto_bulto` (`idBulto`),
  CONSTRAINT `fk_entrega_bulto_bulto` FOREIGN KEY (`idBulto`) REFERENCES `bulto` (`idBulto`),
  CONSTRAINT `fk_entrega_bulto_entrega` FOREIGN KEY (`idEntrega`) REFERENCES `entrega_ot` (`idEntrega`),
  CONSTRAINT `chk_entrega_bulto_estado` CHECK ((`estadoEntrega` in (_utf8mb4'ENTREGADO',_utf8mb4'RECHAZADO',_utf8mb4'NO_RECIBIDO')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrega_bulto`
--

LOCK TABLES `entrega_bulto` WRITE;
/*!40000 ALTER TABLE `entrega_bulto` DISABLE KEYS */;
/*!40000 ALTER TABLE `entrega_bulto` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_bulto_insert` BEFORE INSERT ON `entrega_bulto` FOR EACH ROW BEGIN
    DECLARE bultoEnManifiesto INT DEFAULT 0;

    SELECT COUNT(*)
    INTO bultoEnManifiesto
    FROM entrega_ot eo
    INNER JOIN manifiesto_carga mc
        ON mc.idManifiestoOT = eo.idManifiestoOT
    INNER JOIN manifiesto_bulto mb
        ON mb.idManifiestoCarga = mc.idManifiestoCarga
    WHERE eo.idEntrega = NEW.idEntrega
      AND mb.idBulto = NEW.idBulto;

    IF bultoEnManifiesto = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El bulto no pertenece al manifiesto asociado a esta entrega';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_bulto_limite_insert` BEFORE INSERT ON `entrega_bulto` FOR EACH ROW BEGIN
    DECLARE detalleBulto INT;
    DECLARE cantidadPermitida INT DEFAULT 0;
    DECLARE bultosEntregados INT DEFAULT 0;

    /* Saber a qué detalle de carga pertenece el bulto */
    SELECT idDetalleCarga
    INTO detalleBulto
    FROM bulto
    WHERE idBulto = NEW.idBulto;

    /* Cantidad registrada como entregada para ese detalle */
    SELECT COALESCE(SUM(cantidadEntregada), 0)
    INTO cantidadPermitida
    FROM entrega_carga
    WHERE idEntrega = NEW.idEntrega
      AND idDetalleCarga = detalleBulto;

    /* Bultos ya marcados físicamente como entregados */
    SELECT COUNT(*)
    INTO bultosEntregados
    FROM entrega_bulto eb
    INNER JOIN bulto b
        ON b.idBulto = eb.idBulto
    WHERE eb.idEntrega = NEW.idEntrega
      AND b.idDetalleCarga = detalleBulto
      AND eb.estadoEntrega = 'ENTREGADO';

    IF NEW.estadoEntrega = 'ENTREGADO'
       AND bultosEntregados + 1 > cantidadPermitida THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Los bultos entregados superan la cantidad registrada en entrega_carga';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_bulto_estado_insert` AFTER INSERT ON `entrega_bulto` FOR EACH ROW BEGIN
    IF NEW.estadoEntrega = 'ENTREGADO' THEN

        UPDATE bulto
        SET estado = 'ENTREGADO',
            idSucursalActual = NULL
        WHERE idBulto = NEW.idBulto;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_bulto_update` BEFORE UPDATE ON `entrega_bulto` FOR EACH ROW BEGIN
    DECLARE bultoEnManifiesto INT DEFAULT 0;

    /* No permitir cambiar el intento de entrega */
    IF NEW.idEntrega <> OLD.idEntrega THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede cambiar el intento de entrega asociado al bulto';
    END IF;

    /* No permitir cambiar el bulto */
    IF NEW.idBulto <> OLD.idBulto THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede cambiar el bulto asociado a una entrega ya registrada';
    END IF;

    /* Verificar que el bulto pertenece al manifiesto de la entrega */
    SELECT COUNT(*)
    INTO bultoEnManifiesto
    FROM entrega_ot eo
    INNER JOIN manifiesto_carga mc
        ON mc.idManifiestoOT = eo.idManifiestoOT
    INNER JOIN manifiesto_bulto mb
        ON mb.idManifiestoCarga = mc.idManifiestoCarga
    WHERE eo.idEntrega = NEW.idEntrega
      AND mb.idBulto = NEW.idBulto;

    IF bultoEnManifiesto = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El bulto no pertenece al manifiesto asociado a esta entrega';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_bulto_limite_update` BEFORE UPDATE ON `entrega_bulto` FOR EACH ROW BEGIN
    DECLARE detalleBulto INT;
    DECLARE cantidadPermitida INT DEFAULT 0;
    DECLARE bultosEntregados INT DEFAULT 0;

    /* Saber a qué detalle de carga pertenece el bulto */
    SELECT idDetalleCarga
    INTO detalleBulto
    FROM bulto
    WHERE idBulto = NEW.idBulto;

    /* Cantidad registrada como entregada para ese detalle */
    SELECT COALESCE(SUM(cantidadEntregada), 0)
    INTO cantidadPermitida
    FROM entrega_carga
    WHERE idEntrega = NEW.idEntrega
      AND idDetalleCarga = detalleBulto;

    /* Otros bultos ya marcados como entregados */
    SELECT COUNT(*)
    INTO bultosEntregados
    FROM entrega_bulto eb
    INNER JOIN bulto b
        ON b.idBulto = eb.idBulto
    WHERE eb.idEntrega = NEW.idEntrega
      AND b.idDetalleCarga = detalleBulto
      AND eb.estadoEntrega = 'ENTREGADO'
      AND eb.idEntregaBulto <> OLD.idEntregaBulto;

    IF NEW.estadoEntrega = 'ENTREGADO'
       AND bultosEntregados + 1 > cantidadPermitida THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Los bultos entregados superan la cantidad registrada en entrega_carga';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_bulto_estado_update` AFTER UPDATE ON `entrega_bulto` FOR EACH ROW BEGIN
    IF NEW.estadoEntrega = 'ENTREGADO' THEN

        UPDATE bulto
        SET estado = 'ENTREGADO',
            idSucursalActual = NULL
        WHERE idBulto = NEW.idBulto;

    ELSEIF OLD.estadoEntrega = 'ENTREGADO'
       AND NEW.estadoEntrega IN ('RECHAZADO', 'NO_RECIBIDO') THEN

        UPDATE bulto
        SET estado = 'EN_TRANSITO',
            idSucursalActual = NULL
        WHERE idBulto = NEW.idBulto;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `entrega_carga`
--

DROP TABLE IF EXISTS `entrega_carga`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrega_carga` (
  `idEntregaCarga` int NOT NULL AUTO_INCREMENT,
  `idEntrega` int NOT NULL,
  `idDetalleCarga` int NOT NULL,
  `cantidadEntregada` int NOT NULL,
  `pesoEntregado` decimal(10,2) DEFAULT NULL,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`idEntregaCarga`),
  UNIQUE KEY `uq_entrega_carga` (`idEntrega`,`idDetalleCarga`),
  KEY `fk_entrega_carga_detalle` (`idDetalleCarga`),
  CONSTRAINT `fk_entrega_carga_detalle` FOREIGN KEY (`idDetalleCarga`) REFERENCES `detalle_carga` (`idDetalleCarga`),
  CONSTRAINT `fk_entrega_carga_entrega` FOREIGN KEY (`idEntrega`) REFERENCES `entrega_ot` (`idEntrega`),
  CONSTRAINT `chk_entrega_carga_cantidad` CHECK ((`cantidadEntregada` > 0)),
  CONSTRAINT `chk_entrega_carga_peso` CHECK (((`pesoEntregado` is null) or (`pesoEntregado` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrega_carga`
--

LOCK TABLES `entrega_carga` WRITE;
/*!40000 ALTER TABLE `entrega_carga` DISABLE KEYS */;
/*!40000 ALTER TABLE `entrega_carga` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_carga_insert` BEFORE INSERT ON `entrega_carga` FOR EACH ROW BEGIN
    DECLARE ordenEntrega INT;
    DECLARE ordenDetalle INT;
    DECLARE manifiestoEntrega INT;
    DECLARE cantidadOriginal INT;
    DECLARE cantidadEnviadaManifiesto INT;
    DECLARE cantidadEntregadaManifiesto INT;
    DECLARE cantidadEntregadaTotal INT;

    -- 1. Obtener OT y manifiesto asociados a la entrega
    SELECT idOrden, idManifiestoOT
    INTO ordenEntrega, manifiestoEntrega
    FROM entrega_ot
    WHERE idEntrega = NEW.idEntrega;

    -- 2. Obtener OT y cantidad original del detalle
    SELECT idOrden, cantidad
    INTO ordenDetalle, cantidadOriginal
    FROM detalle_carga
    WHERE idDetalleCarga = NEW.idDetalleCarga;

    -- 3. Validar que el detalle pertenezca a la misma OT
    IF ordenEntrega <> ordenDetalle THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El detalle de carga no pertenece a la OT asociada a la entrega';
    END IF;

    -- 4. Cantidad de este detalle enviada en ESTE manifiesto
    SELECT COALESCE(SUM(cantidadEnviada), 0)
    INTO cantidadEnviadaManifiesto
    FROM manifiesto_carga
    WHERE idManifiestoOT = manifiestoEntrega
      AND idDetalleCarga = NEW.idDetalleCarga;

    -- 5. Cantidad ya entregada de este detalle en ESTE manifiesto
    SELECT COALESCE(SUM(ec.cantidadEntregada), 0)
    INTO cantidadEntregadaManifiesto
    FROM entrega_carga ec
    INNER JOIN entrega_ot eo
        ON ec.idEntrega = eo.idEntrega
    WHERE eo.idManifiestoOT = manifiestoEntrega
      AND ec.idDetalleCarga = NEW.idDetalleCarga;

    -- 6. Cantidad entregada total histórica del detalle
    SELECT COALESCE(SUM(cantidadEntregada), 0)
    INTO cantidadEntregadaTotal
    FROM entrega_carga
    WHERE idDetalleCarga = NEW.idDetalleCarga;

    -- 7. No entregar más de lo enviado en este manifiesto
    IF cantidadEntregadaManifiesto + NEW.cantidadEntregada > cantidadEnviadaManifiesto THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La cantidad entregada supera la cantidad enviada en este manifiesto';
    END IF;

    -- 8. No superar la cantidad original total
    IF cantidadEntregadaTotal + NEW.cantidadEntregada > cantidadOriginal THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La cantidad entregada supera la cantidad original del detalle de carga';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_carga_update` BEFORE UPDATE ON `entrega_carga` FOR EACH ROW BEGIN
    DECLARE ordenEntrega INT;
    DECLARE ordenDetalle INT;
    DECLARE manifiestoEntrega INT;
    DECLARE cantidadOriginal INT;
    DECLARE cantidadEnviadaManifiesto INT;
    DECLARE cantidadOtrasEntregasManifiesto INT;
    DECLARE cantidadOtrasEntregasTotal INT;

    -- 1. No permitir cambiar el intento de entrega
    IF NEW.idEntrega <> OLD.idEntrega THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede cambiar el intento de entrega asociado a una carga ya registrada';
    END IF;

    -- 2. No permitir cambiar el detalle de carga
    IF NEW.idDetalleCarga <> OLD.idDetalleCarga THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede cambiar el detalle de carga de una entrega ya registrada';
    END IF;

    -- 3. Obtener OT y manifiesto asociados a la entrega
    SELECT idOrden, idManifiestoOT
    INTO ordenEntrega, manifiestoEntrega
    FROM entrega_ot
    WHERE idEntrega = NEW.idEntrega;

    -- 4. Obtener OT y cantidad original del detalle
    SELECT idOrden, cantidad
    INTO ordenDetalle, cantidadOriginal
    FROM detalle_carga
    WHERE idDetalleCarga = NEW.idDetalleCarga;

    -- 5. Validar que el detalle pertenezca a la misma OT
    IF ordenEntrega <> ordenDetalle THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El detalle de carga no pertenece a la OT asociada a la entrega';
    END IF;

    -- 6. Cantidad enviada de este detalle en ESTE manifiesto
    SELECT COALESCE(SUM(cantidadEnviada), 0)
    INTO cantidadEnviadaManifiesto
    FROM manifiesto_carga
    WHERE idManifiestoOT = manifiestoEntrega
      AND idDetalleCarga = NEW.idDetalleCarga;

    -- 7. Otras cantidades entregadas en ESTE manifiesto
    SELECT COALESCE(SUM(ec.cantidadEntregada), 0)
    INTO cantidadOtrasEntregasManifiesto
    FROM entrega_carga ec
    INNER JOIN entrega_ot eo
        ON ec.idEntrega = eo.idEntrega
    WHERE eo.idManifiestoOT = manifiestoEntrega
      AND ec.idDetalleCarga = NEW.idDetalleCarga
      AND ec.idEntregaCarga <> OLD.idEntregaCarga;

    -- 8. Otras cantidades entregadas históricamente
    SELECT COALESCE(SUM(cantidadEntregada), 0)
    INTO cantidadOtrasEntregasTotal
    FROM entrega_carga
    WHERE idDetalleCarga = NEW.idDetalleCarga
      AND idEntregaCarga <> OLD.idEntregaCarga;

    -- 9. No superar lo enviado en este manifiesto
    IF cantidadOtrasEntregasManifiesto + NEW.cantidadEntregada
       > cantidadEnviadaManifiesto THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La cantidad entregada supera la cantidad enviada en este manifiesto';
    END IF;

    -- 10. No superar la cantidad original total
    IF cantidadOtrasEntregasTotal + NEW.cantidadEntregada
       > cantidadOriginal THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La cantidad entregada supera la cantidad original del detalle de carga';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_carga_delete` BEFORE DELETE ON `entrega_carga` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT =
    'No se puede eliminar un registro de carga entregada; debe conservarse la trazabilidad';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `entrega_ot`
--

DROP TABLE IF EXISTS `entrega_ot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrega_ot` (
  `idEntrega` int NOT NULL AUTO_INCREMENT,
  `fechaEntrega` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resultadoEntrega` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `motivoResultado` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `nombreReceptor` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `rutReceptor` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `observacion` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `evidencia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idOrden` int NOT NULL,
  `idManifiestoOT` int NOT NULL,
  `idUsuario` int NOT NULL,
  PRIMARY KEY (`idEntrega`),
  UNIQUE KEY `uq_entrega_manifiesto_ot` (`idManifiestoOT`),
  KEY `fk_entrega_orden` (`idOrden`),
  KEY `fk_entrega_usuario` (`idUsuario`),
  CONSTRAINT `fk_entrega_manifiesto_ot` FOREIGN KEY (`idManifiestoOT`) REFERENCES `manifiesto_ot` (`idManifiestoOT`),
  CONSTRAINT `fk_entrega_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_entrega_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`),
  CONSTRAINT `chk_entrega_motivo` CHECK (((`resultadoEntrega` not in (_utf8mb4'RECHAZADA',_utf8mb4'NO_RECIBIDO')) or ((`motivoResultado` is not null) and (trim(`motivoResultado`) <> _utf8mb4'')))),
  CONSTRAINT `chk_entrega_resultado` CHECK ((`resultadoEntrega` in (_utf8mb4'EN_PROCESO',_utf8mb4'ENTREGADA',_utf8mb4'ENTREGA_PARCIAL',_utf8mb4'RECHAZADA',_utf8mb4'NO_RECIBIDO')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrega_ot`
--

LOCK TABLES `entrega_ot` WRITE;
/*!40000 ALTER TABLE `entrega_ot` DISABLE KEYS */;
/*!40000 ALTER TABLE `entrega_ot` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_ot_insert` BEFORE INSERT ON `entrega_ot` FOR EACH ROW BEGIN
    DECLARE ordenManifiesto INT;

    -- 1. Obtener la OT asociada al manifiesto
    SELECT idOrden
    INTO ordenManifiesto
    FROM manifiesto_ot
    WHERE idManifiestoOT = NEW.idManifiestoOT;

    -- 2. Validar que el manifiesto pertenezca a la misma OT
    IF ordenManifiesto <> NEW.idOrden THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El manifiesto asociado no pertenece a la OT de la entrega';
    END IF;

    -- 3. Toda entrega debe comenzar EN_PROCESO
    IF NEW.resultadoEntrega <> 'EN_PROCESO' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Una nueva entrega debe comenzar con estado EN_PROCESO';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_ot_update` BEFORE UPDATE ON `entrega_ot` FOR EACH ROW BEGIN
    DECLARE ordenManifiesto INT;
    DECLARE cantidadOriginal INT DEFAULT 0;
    DECLARE cantidadEntregada INT DEFAULT 0;
    DECLARE registrosCarga INT DEFAULT 0;

    /* No permitir cambiar la OT del intento */
    IF NEW.idOrden <> OLD.idOrden THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede cambiar la OT de un intento de entrega';
    END IF;

    /* No permitir cambiar el manifiesto asociado */
    IF NEW.idManifiestoOT <> OLD.idManifiestoOT THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede cambiar el manifiesto de un intento de entrega';
    END IF;

    /* Un resultado final no puede volver a EN_PROCESO */
    IF OLD.resultadoEntrega IN (
        'ENTREGADA',
        'ENTREGA_PARCIAL',
        'RECHAZADA',
        'NO_RECIBIDO'
    )
    AND NEW.resultadoEntrega <> OLD.resultadoEntrega THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Una entrega finalizada no puede cambiar su resultado';
    END IF;

    /* Comprobar que el manifiesto pertenece a la misma OT */
    SELECT idOrden
    INTO ordenManifiesto
    FROM manifiesto_ot
    WHERE idManifiestoOT = NEW.idManifiestoOT;

    IF ordenManifiesto <> NEW.idOrden THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El manifiesto no pertenece a la OT indicada';
    END IF;

    /* Receptor obligatorio si hubo entrega */
    IF NEW.resultadoEntrega IN ('ENTREGADA', 'ENTREGA_PARCIAL')
       AND (
           NEW.nombreReceptor IS NULL
           OR TRIM(NEW.nombreReceptor) = ''
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Debe indicar el receptor de la carga entregada';
    END IF;

    /* Motivo obligatorio cuando no se recibe */
    IF NEW.resultadoEntrega IN ('RECHAZADA', 'NO_RECIBIDO')
       AND (
           NEW.motivoResultado IS NULL
           OR TRIM(NEW.motivoResultado) = ''
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Debe indicar el motivo del rechazo o no recepción';
    END IF;

    /* Cantidad original total de la OT */
    SELECT COALESCE(SUM(cantidad), 0)
    INTO cantidadOriginal
    FROM detalle_carga
    WHERE idOrden = NEW.idOrden;

    /* Cantidad entregada históricamente de la OT */
    SELECT COALESCE(SUM(ec.cantidadEntregada), 0)
    INTO cantidadEntregada
    FROM entrega_carga ec
    INNER JOIN detalle_carga dc
        ON dc.idDetalleCarga = ec.idDetalleCarga
    WHERE dc.idOrden = NEW.idOrden;

    /* Cargas registradas en este intento */
    SELECT COUNT(*)
    INTO registrosCarga
    FROM entrega_carga
    WHERE idEntrega = NEW.idEntrega;

    /* Rechazo/no recibido no puede tener carga entregada */
    IF NEW.resultadoEntrega IN ('RECHAZADA', 'NO_RECIBIDO')
       AND registrosCarga > 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Un rechazo o no recibido no puede registrar carga entregada';
    END IF;

    /* Para cerrar como entregada debe existir carga en la OT */
    IF NEW.resultadoEntrega = 'ENTREGADA'
       AND cantidadOriginal = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede completar una OT sin carga registrada';
    END IF;

    /* ENTREGADA = toda la carga de la OT completada */
    IF NEW.resultadoEntrega = 'ENTREGADA'
       AND cantidadEntregada < cantidadOriginal THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede marcar ENTREGADA mientras quede carga pendiente';
    END IF;

    /* ENTREGA_PARCIAL = entregó algo, pero todavía queda saldo */
    IF NEW.resultadoEntrega = 'ENTREGA_PARCIAL'
       AND (
           cantidadEntregada = 0
           OR cantidadEntregada >= cantidadOriginal
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La entrega parcial requiere carga entregada y saldo pendiente';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_ot_bultos_update` BEFORE UPDATE ON `entrega_ot` FOR EACH ROW BEGIN
    DECLARE cantidadEntregadaIntento INT DEFAULT 0;
    DECLARE cantidadBultosEntregados INT DEFAULT 0;

    IF NEW.resultadoEntrega IN (
        'ENTREGADA',
        'ENTREGA_PARCIAL'
    ) THEN

        /* Cantidad registrada como entregada en este intento */
        SELECT COALESCE(SUM(cantidadEntregada), 0)
        INTO cantidadEntregadaIntento
        FROM entrega_carga
        WHERE idEntrega = NEW.idEntrega;

        /* Bultos físicos marcados como entregados en este intento */
        SELECT COUNT(*)
        INTO cantidadBultosEntregados
        FROM entrega_bulto
        WHERE idEntrega = NEW.idEntrega
          AND estadoEntrega = 'ENTREGADO';

        IF cantidadEntregadaIntento <> cantidadBultosEntregados THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'La cantidad entregada no coincide con los bultos marcados como entregados';
        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_ot_bultos_completos_update` BEFORE UPDATE ON `entrega_ot` FOR EACH ROW BEGIN
    DECLARE totalBultosManifiesto INT DEFAULT 0;
    DECLARE totalBultosConResultado INT DEFAULT 0;

    IF NEW.resultadoEntrega IN (
        'ENTREGADA',
        'ENTREGA_PARCIAL',
        'RECHAZADA',
        'NO_RECIBIDO'
    ) THEN

        /* Total de bultos físicos asociados a este manifiesto */
        SELECT COUNT(*)
        INTO totalBultosManifiesto
        FROM manifiesto_bulto mb
        INNER JOIN manifiesto_carga mc
            ON mc.idManifiestoCarga = mb.idManifiestoCarga
        WHERE mc.idManifiestoOT = NEW.idManifiestoOT;

        /* Bultos con resultado registrado en este intento */
        SELECT COUNT(*)
        INTO totalBultosConResultado
        FROM entrega_bulto
        WHERE idEntrega = NEW.idEntrega;

        IF totalBultosConResultado <> totalBultosManifiesto THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Todos los bultos del manifiesto deben tener un resultado antes de cerrar la entrega';
        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_ot_estado_bultos_update` BEFORE UPDATE ON `entrega_ot` FOR EACH ROW BEGIN
    DECLARE totalBultos INT DEFAULT 0;
    DECLARE entregados INT DEFAULT 0;
    DECLARE noEntregados INT DEFAULT 0;

    SELECT COUNT(*)
    INTO totalBultos
    FROM entrega_bulto
    WHERE idEntrega = NEW.idEntrega;

    SELECT COUNT(*)
    INTO entregados
    FROM entrega_bulto
    WHERE idEntrega = NEW.idEntrega
      AND estadoEntrega = 'ENTREGADO';

    SELECT COUNT(*)
    INTO noEntregados
    FROM entrega_bulto
    WHERE idEntrega = NEW.idEntrega
      AND estadoEntrega IN ('RECHAZADO', 'NO_RECIBIDO');

    /* ENTREGADA = todos los bultos entregados */
    IF NEW.resultadoEntrega = 'ENTREGADA'
       AND entregados <> totalBultos THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Una entrega ENTREGADA requiere todos los bultos marcados como ENTREGADO';
    END IF;

    /* ENTREGA_PARCIAL = algunos entregados y otros no */
    IF NEW.resultadoEntrega = 'ENTREGA_PARCIAL'
       AND (
           entregados = 0
           OR noEntregados = 0
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Una ENTREGA_PARCIAL requiere bultos entregados y bultos no entregados';
    END IF;

    /* RECHAZADA o NO_RECIBIDO = ninguno entregado */
    IF NEW.resultadoEntrega IN ('RECHAZADA', 'NO_RECIBIDO')
       AND entregados > 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Una entrega rechazada o no recibida no puede tener bultos entregados';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_ot_estado_au` AFTER UPDATE ON `entrega_ot` FOR EACH ROW BEGIN
    IF NEW.resultadoEntrega <> OLD.resultadoEntrega THEN

        IF NEW.resultadoEntrega = 'ENTREGADA' THEN
            UPDATE orden_transporte
            SET idEstado = (
                SELECT idEstado
                FROM estado_ot
                WHERE nombreEstado = 'ENTREGADA'
                LIMIT 1
            )
            WHERE idOrden = NEW.idOrden;

        ELSEIF NEW.resultadoEntrega = 'ENTREGA_PARCIAL' THEN
            UPDATE orden_transporte
            SET idEstado = (
                SELECT idEstado
                FROM estado_ot
                WHERE nombreEstado = 'ENTREGA_PARCIAL'
                LIMIT 1
            )
            WHERE idOrden = NEW.idOrden;

        ELSEIF NEW.resultadoEntrega = 'RECHAZADA' THEN
            UPDATE orden_transporte
            SET idEstado = (
                SELECT idEstado
                FROM estado_ot
                WHERE nombreEstado = 'RECHAZADA'
                LIMIT 1
            )
            WHERE idOrden = NEW.idOrden;

        ELSEIF NEW.resultadoEntrega = 'NO_RECIBIDO' THEN
            UPDATE orden_transporte
            SET idEstado = (
                SELECT idEstado
                FROM estado_ot
                WHERE nombreEstado = 'NO_RECIBIDO'
                LIMIT 1
            )
            WHERE idOrden = NEW.idOrden;
        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_entrega_ot_delete` BEFORE DELETE ON `entrega_ot` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT =
    'No se puede eliminar un intento de entrega; debe conservarse la trazabilidad';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `estado_ot`
--

DROP TABLE IF EXISTS `estado_ot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estado_ot` (
  `idEstado` int NOT NULL AUTO_INCREMENT,
  `nombreEstado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `descripcion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`idEstado`),
  UNIQUE KEY `nombreEstado` (`nombreEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estado_ot`
--

LOCK TABLES `estado_ot` WRITE;
/*!40000 ALTER TABLE `estado_ot` DISABLE KEYS */;
/*!40000 ALTER TABLE `estado_ot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_ot`
--

DROP TABLE IF EXISTS `historial_ot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_ot` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `fechaHora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descripcion` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `idOrden` int NOT NULL,
  `idEstado` int NOT NULL,
  `idUsuario` int NOT NULL,
  PRIMARY KEY (`idHistorial`),
  KEY `fk_historial_orden` (`idOrden`),
  KEY `fk_historial_estado` (`idEstado`),
  KEY `fk_historial_usuario` (`idUsuario`),
  CONSTRAINT `fk_historial_estado` FOREIGN KEY (`idEstado`) REFERENCES `estado_ot` (`idEstado`),
  CONSTRAINT `fk_historial_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_ot`
--

LOCK TABLES `historial_ot` WRITE;
/*!40000 ALTER TABLE `historial_ot` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_ot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_tarifa`
--

DROP TABLE IF EXISTS `historial_tarifa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_tarifa` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `idTarifa` int NOT NULL,
  `idUsuario` int DEFAULT NULL,
  `tipoCambio` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `campo` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `valorAnterior` text CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci,
  `valorNuevo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci,
  `variacionPct` decimal(10,2) DEFAULT NULL,
  `fechaCambio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idHistorial`),
  KEY `fk_historial_tarifa_tarifa` (`idTarifa`),
  KEY `fk_historial_tarifa_usuario` (`idUsuario`),
  CONSTRAINT `fk_historial_tarifa_tarifa` FOREIGN KEY (`idTarifa`) REFERENCES `tarifa` (`idTarifa`),
  CONSTRAINT `fk_historial_tarifa_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_tarifa`
--

LOCK TABLES `historial_tarifa` WRITE;
/*!40000 ALTER TABLE `historial_tarifa` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_tarifa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manifiesto`
--

DROP TABLE IF EXISTS `manifiesto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manifiesto` (
  `idManifiesto` int NOT NULL AUTO_INCREMENT,
  `numeroManifiesto` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaSalida` datetime DEFAULT NULL,
  `observacion` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'PREPARACION',
  `idVehiculo` int DEFAULT NULL,
  `idConductor` int DEFAULT NULL,
  `fechaSalidaProgramada` datetime DEFAULT NULL,
  `idComuna` int DEFAULT NULL,
  `tipo` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'REPARTO',
  `fechaCierre` datetime DEFAULT NULL,
  `kilometrajeFinal` int DEFAULT NULL,
  PRIMARY KEY (`idManifiesto`),
  UNIQUE KEY `numeroManifiesto` (`numeroManifiesto`),
  KEY `fk_manifiesto_vehiculo` (`idVehiculo`),
  KEY `fk_manifiesto_conductor` (`idConductor`),
  KEY `fk_manifiesto_comuna` (`idComuna`),
  CONSTRAINT `fk_manifiesto_comuna` FOREIGN KEY (`idComuna`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `fk_manifiesto_conductor` FOREIGN KEY (`idConductor`) REFERENCES `conductor` (`idConductor`),
  CONSTRAINT `fk_manifiesto_vehiculo` FOREIGN KEY (`idVehiculo`) REFERENCES `vehiculo` (`idVehiculo`),
  CONSTRAINT `chk_manifiesto_estado` CHECK ((`estado` in (_utf8mb4'PREPARACION',_utf8mb4'EN_RUTA',_utf8mb4'FINALIZADO',_utf8mb4'CANCELADO')))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manifiesto`
--

LOCK TABLES `manifiesto` WRITE;
/*!40000 ALTER TABLE `manifiesto` DISABLE KEYS */;
/*!40000 ALTER TABLE `manifiesto` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_update` BEFORE UPDATE ON `manifiesto` FOR EACH ROW BEGIN
    DECLARE cantidadCarga INT;

    -- Verificar si el manifiesto ya tiene carga asociada
    SELECT COUNT(*)
    INTO cantidadCarga
    FROM manifiesto_carga mc
    INNER JOIN manifiesto_ot mo
        ON mc.idManifiestoOT = mo.idManifiestoOT
    WHERE mo.idManifiesto = OLD.idManifiesto;

    IF cantidadCarga > 0 THEN

        -- No permitir cambiar vehículo
        IF NEW.idVehiculo <> OLD.idVehiculo THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede cambiar el vehiculo de un manifiesto que ya tiene carga asociada';
        END IF;

        -- No permitir cambiar conductor
        IF NEW.idConductor <> OLD.idConductor THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede cambiar el conductor de un manifiesto que ya tiene carga asociada';
        END IF;

        -- No permitir cambiar número de manifiesto
        IF NEW.numeroManifiesto <> OLD.numeroManifiesto THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede cambiar el numero de un manifiesto que ya tiene carga asociada';
        END IF;

        -- Una vez registrada la salida, no modificarla
        IF OLD.fechaSalida IS NOT NULL
           AND (
                NEW.fechaSalida IS NULL
                OR NEW.fechaSalida <> OLD.fechaSalida
           ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede modificar la fecha de salida de un manifiesto que ya salio';
        END IF;

    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_validar_bultos_salida` BEFORE UPDATE ON `manifiesto` FOR EACH ROW BEGIN
    DECLARE v_faltantes INT DEFAULT 0;

    IF OLD.fechaSalida IS NULL
       AND NEW.fechaSalida IS NOT NULL THEN

        SELECT COUNT(*)
        INTO v_faltantes
        FROM manifiesto_carga mc
        WHERE mc.idManifiestoOT IN (
            SELECT mo.idManifiestoOT
            FROM manifiesto_ot mo
            WHERE mo.idManifiesto = NEW.idManifiesto
        )
        AND (
            SELECT COUNT(*)
            FROM manifiesto_bulto mb
            WHERE mb.idManifiestoCarga = mc.idManifiestoCarga
        ) <> mc.cantidadEnviada;

        IF v_faltantes > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede iniciar el manifiesto: faltan bultos físicos por asignar';
        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_registrar_salida_bultos` AFTER UPDATE ON `manifiesto` FOR EACH ROW BEGIN
    IF OLD.fechaSalida IS NULL
       AND NEW.fechaSalida IS NOT NULL THEN

        INSERT INTO movimiento_bulto (
            idBulto,
            idSucursal,
            idManifiesto,
            tipoMovimiento,
            fechaMovimiento,
            observacion,
            idUsuario
        )
        SELECT
            mb.idBulto,
            b.idSucursalActual,
            NEW.idManifiesto,
            'SALIDA_MANIFIESTO',
            NEW.fechaSalida,
            CONCAT(
                'Salida automática en manifiesto ',
                NEW.numeroManifiesto
            ),
            NULL
        FROM manifiesto_bulto mb
        INNER JOIN manifiesto_carga mc
            ON mc.idManifiestoCarga = mb.idManifiestoCarga
        INNER JOIN manifiesto_ot mo
            ON mo.idManifiestoOT = mc.idManifiestoOT
        INNER JOIN bulto b
            ON b.idBulto = mb.idBulto
        WHERE mo.idManifiesto = NEW.idManifiesto;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bultos_en_transito` AFTER UPDATE ON `manifiesto` FOR EACH ROW BEGIN
    IF OLD.fechaSalida IS NULL
       AND NEW.fechaSalida IS NOT NULL THEN

        UPDATE bulto b
        INNER JOIN manifiesto_bulto mb
            ON mb.idBulto = b.idBulto
        INNER JOIN manifiesto_carga mc
            ON mc.idManifiestoCarga = mb.idManifiestoCarga
        INNER JOIN manifiesto_ot mo
            ON mo.idManifiestoOT = mc.idManifiestoOT
        SET b.estado = 'EN_TRANSITO',
            b.idSucursalActual = NULL
        WHERE mo.idManifiesto = NEW.idManifiesto
          AND b.estado = 'ASIGNADO_MANIFIESTO';

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_delete` BEFORE DELETE ON `manifiesto` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT =
    'No se puede eliminar un manifiesto; debe conservarse la trazabilidad';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `manifiesto_bulto`
--

DROP TABLE IF EXISTS `manifiesto_bulto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manifiesto_bulto` (
  `idManifiestoBulto` int NOT NULL AUTO_INCREMENT,
  `idManifiestoCarga` int NOT NULL,
  `idBulto` int NOT NULL,
  `fechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`idManifiestoBulto`),
  UNIQUE KEY `uq_manifiesto_bulto` (`idManifiestoCarga`,`idBulto`),
  KEY `fk_manifiesto_bulto_bulto` (`idBulto`),
  CONSTRAINT `fk_manifiesto_bulto_bulto` FOREIGN KEY (`idBulto`) REFERENCES `bulto` (`idBulto`),
  CONSTRAINT `fk_manifiesto_bulto_manifiesto_carga` FOREIGN KEY (`idManifiestoCarga`) REFERENCES `manifiesto_carga` (`idManifiestoCarga`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manifiesto_bulto`
--

LOCK TABLES `manifiesto_bulto` WRITE;
/*!40000 ALTER TABLE `manifiesto_bulto` DISABLE KEYS */;
/*!40000 ALTER TABLE `manifiesto_bulto` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_insert` BEFORE INSERT ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE detalleBulto INT;
    DECLARE detalleManifiesto INT;

    SELECT idDetalleCarga
    INTO detalleBulto
    FROM bulto
    WHERE idBulto = NEW.idBulto;

    SELECT idDetalleCarga
    INTO detalleManifiesto
    FROM manifiesto_carga
    WHERE idManifiestoCarga = NEW.idManifiestoCarga;

    IF detalleBulto <> detalleManifiesto THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El bulto no pertenece al detalle de carga asignado al manifiesto';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_limite_insert` BEFORE INSERT ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE cantidadPermitida INT DEFAULT 0;
    DECLARE cantidadActual INT DEFAULT 0;

    SELECT cantidadEnviada
    INTO cantidadPermitida
    FROM manifiesto_carga
    WHERE idManifiestoCarga = NEW.idManifiestoCarga;

    SELECT COUNT(*)
    INTO cantidadActual
    FROM manifiesto_bulto
    WHERE idManifiestoCarga = NEW.idManifiestoCarga;

    IF cantidadActual + 1 > cantidadPermitida THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se pueden asignar más bultos que la cantidad enviada en el manifiesto';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_activo_insert` BEFORE INSERT ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE compromisosActivos INT DEFAULT 0;

    SELECT COUNT(*)
    INTO compromisosActivos
    FROM manifiesto_bulto mb
    INNER JOIN manifiesto_carga mc
        ON mc.idManifiestoCarga = mb.idManifiestoCarga
    WHERE mb.idBulto = NEW.idBulto
      AND NOT EXISTS (
          SELECT 1
          FROM entrega_ot eo
          WHERE eo.idManifiestoOT = mc.idManifiestoOT
            AND eo.resultadoEntrega IN (
                'RECHAZADA',
                'NO_RECIBIDO'
            )
      );

    IF compromisosActivos > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El bulto ya se encuentra comprometido en otro manifiesto';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_estado_validar_insert` BEFORE INSERT ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE v_estado VARCHAR(30);

    SELECT estado
    INTO v_estado
    FROM bulto
    WHERE idBulto = NEW.idBulto;

    IF v_estado = 'ENTREGADO' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede asignar a un manifiesto un bulto que ya fue entregado';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_disponible_insert` BEFORE INSERT ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE v_estado VARCHAR(30);

    SELECT estado
    INTO v_estado
    FROM bulto
    WHERE idBulto = NEW.idBulto;

    IF v_estado NOT IN ('EN_BODEGA', 'ASIGNADO_MANIFIESTO') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El bulto no esta disponible en bodega para ser asignado al manifiesto';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_estado_insert` AFTER INSERT ON `manifiesto_bulto` FOR EACH ROW BEGIN
    UPDATE bulto
    SET estado = 'ASIGNADO_MANIFIESTO'
    WHERE idBulto = NEW.idBulto;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_update` BEFORE UPDATE ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE detalleBulto INT;
    DECLARE detalleManifiesto INT;

    SELECT idDetalleCarga
    INTO detalleBulto
    FROM bulto
    WHERE idBulto = NEW.idBulto;

    SELECT idDetalleCarga
    INTO detalleManifiesto
    FROM manifiesto_carga
    WHERE idManifiestoCarga = NEW.idManifiestoCarga;

    IF detalleBulto <> detalleManifiesto THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El bulto no pertenece al detalle de carga asignado al manifiesto';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_limite_update` BEFORE UPDATE ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE cantidadPermitida INT DEFAULT 0;
    DECLARE cantidadActual INT DEFAULT 0;

    SELECT cantidadEnviada
    INTO cantidadPermitida
    FROM manifiesto_carga
    WHERE idManifiestoCarga = NEW.idManifiestoCarga;

    SELECT COUNT(*)
    INTO cantidadActual
    FROM manifiesto_bulto
    WHERE idManifiestoCarga = NEW.idManifiestoCarga
      AND idManifiestoBulto <> OLD.idManifiestoBulto;

    IF cantidadActual + 1 > cantidadPermitida THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se pueden asignar más bultos que la cantidad enviada en el manifiesto';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_activo_update` BEFORE UPDATE ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE compromisosActivos INT DEFAULT 0;

    SELECT COUNT(*)
    INTO compromisosActivos
    FROM manifiesto_bulto mb
    INNER JOIN manifiesto_carga mc
        ON mc.idManifiestoCarga = mb.idManifiestoCarga
    WHERE mb.idBulto = NEW.idBulto
      AND mb.idManifiestoBulto <> OLD.idManifiestoBulto
      AND NOT EXISTS (
          SELECT 1
          FROM entrega_ot eo
          WHERE eo.idManifiestoOT = mc.idManifiestoOT
            AND eo.resultadoEntrega IN (
                'RECHAZADA',
                'NO_RECIBIDO'
            )
      );

    IF compromisosActivos > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El bulto ya se encuentra comprometido en otro manifiesto';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_estado_validar_update` BEFORE UPDATE ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE v_estado VARCHAR(30);

    SELECT estado
    INTO v_estado
    FROM bulto
    WHERE idBulto = NEW.idBulto;

    IF v_estado = 'ENTREGADO' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede asignar a un manifiesto un bulto que ya fue entregado';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_bulto_disponible_update` BEFORE UPDATE ON `manifiesto_bulto` FOR EACH ROW BEGIN
    DECLARE v_estado VARCHAR(30);

    SELECT estado
    INTO v_estado
    FROM bulto
    WHERE idBulto = NEW.idBulto;

    IF v_estado NOT IN ('EN_BODEGA', 'ASIGNADO_MANIFIESTO') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'El bulto no esta disponible en bodega para ser asignado al manifiesto';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `manifiesto_carga`
--

DROP TABLE IF EXISTS `manifiesto_carga`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manifiesto_carga` (
  `idManifiestoCarga` int NOT NULL AUTO_INCREMENT,
  `idManifiestoOT` int NOT NULL,
  `idDetalleCarga` int NOT NULL,
  `cantidadEnviada` int NOT NULL,
  `pesoEnviado` decimal(10,2) DEFAULT NULL,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`idManifiestoCarga`),
  KEY `fk_manifiesto_carga_manifiesto_ot` (`idManifiestoOT`),
  KEY `fk_manifiesto_carga_detalle` (`idDetalleCarga`),
  CONSTRAINT `fk_manifiesto_carga_detalle` FOREIGN KEY (`idDetalleCarga`) REFERENCES `detalle_carga` (`idDetalleCarga`),
  CONSTRAINT `fk_manifiesto_carga_manifiesto_ot` FOREIGN KEY (`idManifiestoOT`) REFERENCES `manifiesto_ot` (`idManifiestoOT`),
  CONSTRAINT `chk_manifiesto_carga_cantidad` CHECK ((`cantidadEnviada` > 0)),
  CONSTRAINT `chk_manifiesto_carga_peso` CHECK (((`pesoEnviado` is null) or (`pesoEnviado` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manifiesto_carga`
--

LOCK TABLES `manifiesto_carga` WRITE;
/*!40000 ALTER TABLE `manifiesto_carga` DISABLE KEYS */;
/*!40000 ALTER TABLE `manifiesto_carga` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_carga_insert` BEFORE INSERT ON `manifiesto_carga` FOR EACH ROW BEGIN
    DECLARE cantidadOriginal INT DEFAULT 0;
    DECLARE cantidadEntregada INT DEFAULT 0;
    DECLARE cantidadActiva INT DEFAULT 0;
    DECLARE ordenDetalle INT;
    DECLARE ordenManifiesto INT;

    /* Obtener la OT y cantidad original del detalle */
    SELECT idOrden, cantidad
    INTO ordenDetalle, cantidadOriginal
    FROM detalle_carga
    WHERE idDetalleCarga = NEW.idDetalleCarga;

    /* Obtener la OT del manifiesto */
    SELECT idOrden
    INTO ordenManifiesto
    FROM manifiesto_ot
    WHERE idManifiestoOT = NEW.idManifiestoOT;

    /* El detalle debe pertenecer a la misma OT */
    IF ordenDetalle <> ordenManifiesto THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La carga seleccionada no pertenece a la OT de este manifiesto';
    END IF;

    /* Cantidad efectivamente entregada históricamente */
    SELECT COALESCE(SUM(ec.cantidadEntregada), 0)
    INTO cantidadEntregada
    FROM entrega_carga ec
    WHERE ec.idDetalleCarga = NEW.idDetalleCarga;

    /*
      Cantidad todavía comprometida en manifiestos activos.

      - ENTREGADA          -> deja de estar activa
      - ENTREGA_PARCIAL    -> deja de estar activa
      - RECHAZADA          -> queda disponible nuevamente
      - NO_RECIBIDO        -> queda disponible nuevamente
      - EN_PROCESO         -> solo cuenta lo enviado menos lo ya entregado
      - Sin intento        -> cuenta toda la cantidad enviada
    */
    SELECT COALESCE(
        SUM(
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM entrega_ot eo_terminal
                    WHERE eo_terminal.idManifiestoOT = mc.idManifiestoOT
                      AND eo_terminal.resultadoEntrega IN (
                          'ENTREGADA',
                          'ENTREGA_PARCIAL',
                          'RECHAZADA',
                          'NO_RECIBIDO'
                      )
                )
                THEN 0

                ELSE GREATEST(
                    mc.cantidadEnviada -
                    COALESCE(
                        (
                            SELECT SUM(ec2.cantidadEntregada)
                            FROM entrega_carga ec2
                            INNER JOIN entrega_ot eo2
                                ON eo2.idEntrega = ec2.idEntrega
                            WHERE eo2.idManifiestoOT = mc.idManifiestoOT
                              AND ec2.idDetalleCarga = mc.idDetalleCarga
                        ),
                        0
                    ),
                    0
                )
            END
        ),
        0
    )
    INTO cantidadActiva
    FROM manifiesto_carga mc
    WHERE mc.idDetalleCarga = NEW.idDetalleCarga;

    /*
      No podemos comprometer más unidades
      que las originalmente registradas en la OT.
    */
    IF cantidadEntregada + cantidadActiva + NEW.cantidadEnviada
       > cantidadOriginal THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La cantidad supera el saldo disponible de esta carga';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_carga_update` BEFORE UPDATE ON `manifiesto_carga` FOR EACH ROW BEGIN
    DECLARE fechaSalidaManifiesto DATETIME;
    DECLARE intentosEntrega INT DEFAULT 0;
    DECLARE cantidadOriginal INT DEFAULT 0;
    DECLARE cantidadEntregada INT DEFAULT 0;
    DECLARE cantidadActivaOtros INT DEFAULT 0;

    /* No permitir cambiar las relaciones principales */
    IF NEW.idManifiestoOT <> OLD.idManifiestoOT THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede cambiar el manifiesto asociado a la carga';
    END IF;

    IF NEW.idDetalleCarga <> OLD.idDetalleCarga THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede cambiar el detalle de carga asociado';
    END IF;

    /* Obtener fecha de salida del manifiesto */
    SELECT m.fechaSalida
    INTO fechaSalidaManifiesto
    FROM manifiesto m
    INNER JOIN manifiesto_ot mo
        ON mo.idManifiesto = m.idManifiesto
    WHERE mo.idManifiestoOT = NEW.idManifiestoOT;

    /* Verificar si ya existe intento de entrega */
    SELECT COUNT(*)
    INTO intentosEntrega
    FROM entrega_ot
    WHERE idManifiestoOT = NEW.idManifiestoOT;

    /*
      Si ya salió o comenzó la entrega,
      no permitir alterar cantidades/peso.
    */
    IF fechaSalidaManifiesto IS NOT NULL
       OR intentosEntrega > 0 THEN

        IF NEW.cantidadEnviada <> OLD.cantidadEnviada
           OR NOT (NEW.pesoEnviado <=> OLD.pesoEnviado) THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede modificar cantidad o peso después de la salida o inicio de entrega';
        END IF;
    END IF;

    /* Cantidad original de la carga */
    SELECT cantidad
    INTO cantidadOriginal
    FROM detalle_carga
    WHERE idDetalleCarga = NEW.idDetalleCarga;

    /* Cantidad total ya entregada */
    SELECT COALESCE(SUM(ec.cantidadEntregada), 0)
    INTO cantidadEntregada
    FROM entrega_carga ec
    WHERE ec.idDetalleCarga = NEW.idDetalleCarga;

    /* Compromisos activos de otros manifiestos */
    SELECT COALESCE(
        SUM(
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM entrega_ot eo_terminal
                    WHERE eo_terminal.idManifiestoOT = mc.idManifiestoOT
                      AND eo_terminal.resultadoEntrega IN (
                          'ENTREGADA',
                          'ENTREGA_PARCIAL',
                          'RECHAZADA',
                          'NO_RECIBIDO'
                      )
                )
                THEN 0
                ELSE GREATEST(
                    mc.cantidadEnviada -
                    COALESCE(
                        (
                            SELECT SUM(ec2.cantidadEntregada)
                            FROM entrega_carga ec2
                            INNER JOIN entrega_ot eo2
                                ON eo2.idEntrega = ec2.idEntrega
                            WHERE eo2.idManifiestoOT = mc.idManifiestoOT
                              AND ec2.idDetalleCarga = mc.idDetalleCarga
                        ),
                        0
                    ),
                    0
                )
            END
        ),
        0
    )
    INTO cantidadActivaOtros
    FROM manifiesto_carga mc
    WHERE mc.idDetalleCarga = NEW.idDetalleCarga
      AND mc.idManifiestoCarga <> OLD.idManifiestoCarga;

    IF cantidadEntregada
       + cantidadActivaOtros
       + NEW.cantidadEnviada
       > cantidadOriginal THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La nueva cantidad supera el saldo disponible de esta carga';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_carga_delete` BEFORE DELETE ON `manifiesto_carga` FOR EACH ROW BEGIN
    DECLARE fechaSalidaManifiesto DATETIME;
    DECLARE cantidadEntregas INT;

    -- 1. Obtener la fecha de salida del manifiesto
    SELECT m.fechaSalida
    INTO fechaSalidaManifiesto
    FROM manifiesto_ot mo
    INNER JOIN manifiesto m
        ON mo.idManifiesto = m.idManifiesto
    WHERE mo.idManifiestoOT = OLD.idManifiestoOT;

    -- 2. Revisar si este manifiesto ya tiene intentos de entrega
    SELECT COUNT(*)
    INTO cantidadEntregas
    FROM entrega_ot
    WHERE idManifiestoOT = OLD.idManifiestoOT;

    -- 3. Si el manifiesto ya salió, no permitir borrar su carga
    IF fechaSalidaManifiesto IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede eliminar carga de un manifiesto que ya registro su salida';
    END IF;

    -- 4. Si ya existe un intento de entrega, tampoco se puede borrar
    IF cantidadEntregas > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede eliminar carga de un manifiesto que ya tiene intentos de entrega';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `manifiesto_ot`
--

DROP TABLE IF EXISTS `manifiesto_ot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manifiesto_ot` (
  `idManifiestoOT` int NOT NULL AUTO_INCREMENT,
  `idManifiesto` int NOT NULL,
  `idOrden` int NOT NULL,
  `fechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `ordenCarga` int DEFAULT NULL,
  PRIMARY KEY (`idManifiestoOT`),
  UNIQUE KEY `uq_manifiesto_ot` (`idManifiesto`,`idOrden`),
  KEY `fk_manifiesto_ot_orden` (`idOrden`),
  CONSTRAINT `fk_manifiesto_ot_manifiesto` FOREIGN KEY (`idManifiesto`) REFERENCES `manifiesto` (`idManifiesto`),
  CONSTRAINT `fk_manifiesto_ot_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manifiesto_ot`
--

LOCK TABLES `manifiesto_ot` WRITE;
/*!40000 ALTER TABLE `manifiesto_ot` DISABLE KEYS */;
/*!40000 ALTER TABLE `manifiesto_ot` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_ot_update` BEFORE UPDATE ON `manifiesto_ot` FOR EACH ROW BEGIN
    DECLARE cantidadRegistrosCarga INT;

    SELECT COUNT(*)
    INTO cantidadRegistrosCarga
    FROM manifiesto_carga
    WHERE idManifiestoOT = OLD.idManifiestoOT;

    IF cantidadRegistrosCarga > 0
       AND (
            NEW.idManifiesto <> OLD.idManifiesto
            OR NEW.idOrden <> OLD.idOrden
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede cambiar el manifiesto o la OT porque ya existe carga asociada';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_manifiesto_ot_delete` BEFORE DELETE ON `manifiesto_ot` FOR EACH ROW BEGIN
    DECLARE cantidadRegistrosCarga INT;

    SELECT COUNT(*)
    INTO cantidadRegistrosCarga
    FROM manifiesto_carga
    WHERE idManifiestoOT = OLD.idManifiestoOT;

    IF cantidadRegistrosCarga > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'No se puede eliminar la OT del manifiesto porque ya tiene carga asociada';
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `manifiesto_usuario`
--

DROP TABLE IF EXISTS `manifiesto_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manifiesto_usuario` (
  `idManifiestoUsuario` int NOT NULL AUTO_INCREMENT,
  `idManifiesto` int NOT NULL,
  `idUsuario` int NOT NULL,
  `fechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idManifiestoUsuario`),
  UNIQUE KEY `uq_manifiesto_usuario` (`idManifiesto`,`idUsuario`),
  KEY `fk_manifiesto_usuario_usuario` (`idUsuario`),
  CONSTRAINT `fk_manifiesto_usuario_manifiesto` FOREIGN KEY (`idManifiesto`) REFERENCES `manifiesto` (`idManifiesto`),
  CONSTRAINT `fk_manifiesto_usuario_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manifiesto_usuario`
--

LOCK TABLES `manifiesto_usuario` WRITE;
/*!40000 ALTER TABLE `manifiesto_usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `manifiesto_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_bulto`
--

DROP TABLE IF EXISTS `movimiento_bulto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_bulto` (
  `idMovimientoBulto` int NOT NULL AUTO_INCREMENT,
  `idBulto` int NOT NULL,
  `idSucursal` int DEFAULT NULL,
  `idSucursalOrigen` int DEFAULT NULL,
  `idSucursalDestino` int DEFAULT NULL,
  `idManifiesto` int DEFAULT NULL,
  `tipoMovimiento` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `fechaMovimiento` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idUsuario` int DEFAULT NULL,
  PRIMARY KEY (`idMovimientoBulto`),
  UNIQUE KEY `uq_movimiento_bulto_salida_manifiesto` (`idBulto`,`idManifiesto`,`tipoMovimiento`),
  KEY `fk_movimiento_bulto_sucursal` (`idSucursal`),
  KEY `fk_movimiento_bulto_usuario` (`idUsuario`),
  KEY `fk_movimiento_bulto_manifiesto` (`idManifiesto`),
  KEY `fk_movimiento_bulto_sucursal_origen` (`idSucursalOrigen`),
  KEY `fk_movimiento_bulto_sucursal_destino` (`idSucursalDestino`),
  CONSTRAINT `fk_movimiento_bulto_bulto` FOREIGN KEY (`idBulto`) REFERENCES `bulto` (`idBulto`),
  CONSTRAINT `fk_movimiento_bulto_manifiesto` FOREIGN KEY (`idManifiesto`) REFERENCES `manifiesto` (`idManifiesto`),
  CONSTRAINT `fk_movimiento_bulto_sucursal` FOREIGN KEY (`idSucursal`) REFERENCES `sucursal` (`idSucursal`),
  CONSTRAINT `fk_movimiento_bulto_sucursal_destino` FOREIGN KEY (`idSucursalDestino`) REFERENCES `sucursal` (`idSucursal`),
  CONSTRAINT `fk_movimiento_bulto_sucursal_origen` FOREIGN KEY (`idSucursalOrigen`) REFERENCES `sucursal` (`idSucursal`),
  CONSTRAINT `fk_movimiento_bulto_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`),
  CONSTRAINT `chk_movimiento_bulto_tipo` CHECK ((`tipoMovimiento` in (_utf8mb4'ENTRADA_BODEGA',_utf8mb4'SALIDA_MANIFIESTO',_utf8mb4'DEVOLUCION',_utf8mb4'TRASLADO')))
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_bulto`
--

LOCK TABLES `movimiento_bulto` WRITE;
/*!40000 ALTER TABLE `movimiento_bulto` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimiento_bulto` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_validar_insert` BEFORE INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    IF NEW.tipoMovimiento IN ('ENTRADA_BODEGA', 'DEVOLUCION')
       AND NEW.idSucursal IS NULL THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La entrada o devolución de un bulto requiere una sucursal';

    END IF;

    IF NEW.tipoMovimiento = 'SALIDA_MANIFIESTO'
       AND NEW.idManifiesto IS NULL THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'La salida de un bulto requiere un manifiesto';

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_manifiesto_insert` BEFORE INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    DECLARE v_existe INT DEFAULT 0;

    IF NEW.tipoMovimiento = 'SALIDA_MANIFIESTO' THEN

        SELECT COUNT(*)
        INTO v_existe
        FROM manifiesto_bulto mb
        INNER JOIN manifiesto_carga mc
            ON mc.idManifiestoCarga = mb.idManifiestoCarga
        INNER JOIN manifiesto_ot mo
            ON mo.idManifiestoOT = mc.idManifiestoOT
        WHERE mb.idBulto = NEW.idBulto
          AND mo.idManifiesto = NEW.idManifiesto;

        IF v_existe = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'El bulto no está asignado al manifiesto indicado';
        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_traslado_insert` BEFORE INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    IF NEW.tipoMovimiento = 'TRASLADO' THEN

        IF NEW.idSucursalOrigen IS NULL
           OR NEW.idSucursalDestino IS NULL THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'El traslado requiere sucursal de origen y destino';

        END IF;

        IF NEW.idSucursalOrigen = NEW.idSucursalDestino THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'La sucursal de origen y destino deben ser diferentes';

        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_llegada_insert` BEFORE INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    DECLARE v_estado VARCHAR(30);
    DECLARE v_destino INT DEFAULT NULL;

    IF NEW.tipoMovimiento = 'ENTRADA_BODEGA' THEN

        SELECT estado
        INTO v_estado
        FROM bulto
        WHERE idBulto = NEW.idBulto;

        IF v_estado = 'EN_TRASLADO' THEN

            SELECT idSucursalDestino
            INTO v_destino
            FROM movimiento_bulto
            WHERE idBulto = NEW.idBulto
              AND tipoMovimiento = 'TRASLADO'
            ORDER BY fechaMovimiento DESC, idMovimientoBulto DESC
            LIMIT 1;

            IF v_destino IS NULL
               OR NEW.idSucursal <> v_destino THEN

                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT =
                'El bulto debe ingresar en la sucursal destino del traslado';

            END IF;

        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_origen_traslado_insert` BEFORE INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    DECLARE v_estado VARCHAR(30);
    DECLARE v_sucursal_actual INT;

    IF NEW.tipoMovimiento = 'TRASLADO' THEN

        SELECT estado, idSucursalActual
        INTO v_estado, v_sucursal_actual
        FROM bulto
        WHERE idBulto = NEW.idBulto;

        IF v_estado <> 'EN_BODEGA' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Solo se puede trasladar un bulto que se encuentre en bodega';
        END IF;

        IF v_sucursal_actual IS NULL
           OR v_sucursal_actual <> NEW.idSucursalOrigen THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'El bulto no se encuentra en la sucursal de origen indicada';

        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_entrada_validar_insert` BEFORE INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    DECLARE v_estado VARCHAR(30);
    DECLARE v_sucursal_actual INT;

    IF NEW.tipoMovimiento = 'ENTRADA_BODEGA' THEN

        SELECT estado, idSucursalActual
        INTO v_estado, v_sucursal_actual
        FROM bulto
        WHERE idBulto = NEW.idBulto;

        IF v_estado = 'EN_BODEGA'
           AND v_sucursal_actual IS NOT NULL
           AND v_sucursal_actual <> NEW.idSucursal THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'El bulto ya se encuentra registrado en otra sucursal';

        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_devolucion_validar_insert` BEFORE INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    DECLARE v_estado VARCHAR(30);

    IF NEW.tipoMovimiento = 'DEVOLUCION' THEN

        SELECT estado
        INTO v_estado
        FROM bulto
        WHERE idBulto = NEW.idBulto;

        IF v_estado NOT IN ('EN_TRANSITO', 'ASIGNADO_MANIFIESTO') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Solo se puede devolver a bodega un bulto proveniente de una operación activa';
        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_salida_fecha_insert` BEFORE INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    DECLARE v_fecha_salida DATETIME;

    IF NEW.tipoMovimiento = 'SALIDA_MANIFIESTO' THEN

        SELECT fechaSalida
        INTO v_fecha_salida
        FROM manifiesto
        WHERE idManifiesto = NEW.idManifiesto;

        IF v_fecha_salida IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'No se puede registrar la salida del bulto: el manifiesto aun no ha iniciado';
        END IF;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_estado_insert` AFTER INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    IF NEW.tipoMovimiento IN ('ENTRADA_BODEGA', 'DEVOLUCION') THEN

        IF NEW.idSucursal IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'La entrada o devolución de un bulto requiere una sucursal';
        END IF;

        UPDATE bulto
        SET estado = 'EN_BODEGA',
            idSucursalActual = NEW.idSucursal
        WHERE idBulto = NEW.idBulto;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_traslado_estado_insert` AFTER INSERT ON `movimiento_bulto` FOR EACH ROW BEGIN
    IF NEW.tipoMovimiento = 'TRASLADO' THEN

        UPDATE bulto
        SET estado = 'EN_TRASLADO',
            idSucursalActual = NULL
        WHERE idBulto = NEW.idBulto;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_update` BEFORE UPDATE ON `movimiento_bulto` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT =
    'No se puede modificar un movimiento de bulto; debe conservarse la trazabilidad';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_movimiento_bulto_delete` BEFORE DELETE ON `movimiento_bulto` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT =
    'No se puede eliminar un movimiento de bulto; debe conservarse la trazabilidad';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `movimiento_cuenta`
--

DROP TABLE IF EXISTS `movimiento_cuenta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_cuenta` (
  `idMovimiento` int NOT NULL AUTO_INCREMENT,
  `fechaMovimiento` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipoMovimiento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `descripcion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idCuenta` int NOT NULL,
  `idOrden` int DEFAULT NULL,
  `idUsuario` int NOT NULL,
  PRIMARY KEY (`idMovimiento`),
  KEY `fk_movimiento_cuenta` (`idCuenta`),
  KEY `fk_movimiento_orden` (`idOrden`),
  KEY `fk_movimiento_usuario` (`idUsuario`),
  CONSTRAINT `fk_movimiento_cuenta` FOREIGN KEY (`idCuenta`) REFERENCES `cuenta_corriente` (`idCuenta`),
  CONSTRAINT `fk_movimiento_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_movimiento_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_cuenta`
--

LOCK TABLES `movimiento_cuenta` WRITE;
/*!40000 ALTER TABLE `movimiento_cuenta` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimiento_cuenta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `observacion_ot`
--

DROP TABLE IF EXISTS `observacion_ot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `observacion_ot` (
  `idObservacion` int NOT NULL AUTO_INCREMENT,
  `fechaHora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observacion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `idOrden` int NOT NULL,
  `idUsuario` int NOT NULL,
  PRIMARY KEY (`idObservacion`),
  KEY `fk_observacion_orden` (`idOrden`),
  KEY `fk_observacion_usuario` (`idUsuario`),
  CONSTRAINT `fk_observacion_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_observacion_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `observacion_ot`
--

LOCK TABLES `observacion_ot` WRITE;
/*!40000 ALTER TABLE `observacion_ot` DISABLE KEYS */;
/*!40000 ALTER TABLE `observacion_ot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_transporte`
--

DROP TABLE IF EXISTS `orden_transporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_transporte` (
  `idOrden` int NOT NULL AUTO_INCREMENT,
  `numeroOT` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaRetiro` date DEFAULT NULL,
  `fechaEntregaEstimada` date DEFAULT NULL,
  `direccionOrigen` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `contactoOrigen` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `telefonoOrigen` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `direccionDestino` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `contactoDestino` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `telefonoDestino` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `referenciaEntrega` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `pesoTotal` decimal(10,2) DEFAULT NULL,
  `valorTotal` decimal(12,2) DEFAULT NULL,
  `idCliente` int NOT NULL,
  `idComunaOrigen` int NOT NULL,
  `idComunaDestino` int NOT NULL,
  `idEstado` int NOT NULL,
  `idTarifa` int NOT NULL,
  `tipoDocumento` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'SIN_DOCUMENTO',
  `numeroDocumento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `tipoServicio` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'NORMAL',
  `requiereRetiro` tinyint(1) NOT NULL DEFAULT '0',
  `tipoZona` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `valorBaseAplicado` decimal(12,2) DEFAULT NULL,
  `valorKgAplicado` decimal(12,2) DEFAULT NULL,
  `valorRetiroAplicado` decimal(12,2) DEFAULT NULL,
  `valorZonaAplicado` decimal(12,2) DEFAULT NULL,
  `valorIva` decimal(12,2) DEFAULT NULL,
  `valorNeto` decimal(12,2) DEFAULT NULL,
  `pesoReal` decimal(12,2) DEFAULT NULL,
  `precioPesoAplicado` decimal(12,2) DEFAULT NULL,
  `precioVolumenAplicado` decimal(12,2) DEFAULT NULL,
  `tipoCobro` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `valorCargaAplicado` decimal(12,2) DEFAULT NULL,
  `volumenTotalM3` decimal(12,4) DEFAULT NULL,
  `idTarifaTrayecto` int DEFAULT NULL,
  `valorM3Aplicado` decimal(12,2) DEFAULT NULL,
  `idDestinatario` int DEFAULT NULL,
  PRIMARY KEY (`idOrden`),
  UNIQUE KEY `numeroOT` (`numeroOT`),
  KEY `fk_orden_cliente` (`idCliente`),
  KEY `fk_orden_estado` (`idEstado`),
  KEY `fk_orden_tarifa` (`idTarifa`),
  KEY `fk_orden_comuna_origen` (`idComunaOrigen`),
  KEY `fk_orden_comuna_destino` (`idComunaDestino`),
  KEY `fk_orden_tarifa_trayecto` (`idTarifaTrayecto`),
  KEY `fk_orden_transporte_destinatario` (`idDestinatario`),
  CONSTRAINT `fk_orden_cliente` FOREIGN KEY (`idCliente`) REFERENCES `cliente` (`idCliente`),
  CONSTRAINT `fk_orden_comuna_destino` FOREIGN KEY (`idComunaDestino`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `fk_orden_comuna_origen` FOREIGN KEY (`idComunaOrigen`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `fk_orden_estado` FOREIGN KEY (`idEstado`) REFERENCES `estado_ot` (`idEstado`),
  CONSTRAINT `fk_orden_tarifa` FOREIGN KEY (`idTarifa`) REFERENCES `tarifa` (`idTarifa`),
  CONSTRAINT `fk_orden_tarifa_trayecto` FOREIGN KEY (`idTarifaTrayecto`) REFERENCES `tarifa_trayecto` (`idTarifaTrayecto`),
  CONSTRAINT `fk_orden_transporte_destinatario` FOREIGN KEY (`idDestinatario`) REFERENCES `destinatario` (`idDestinatario`),
  CONSTRAINT `chk_orden_numero_documento` CHECK ((((`tipoDocumento` in (_utf8mb4'FACTURA',_utf8mb4'BOLETA',_utf8mb4'OT_MANUAL')) and (`numeroDocumento` is not null) and (trim(`numeroDocumento`) <> _utf8mb4'')) or ((`tipoDocumento` = _utf8mb4'SIN_DOCUMENTO') and ((`numeroDocumento` is null) or (trim(`numeroDocumento`) = _utf8mb4''))))),
  CONSTRAINT `chk_orden_tipo_documento` CHECK ((`tipoDocumento` in (_utf8mb4'FACTURA',_utf8mb4'BOLETA',_utf8mb4'OT_MANUAL',_utf8mb4'SIN_DOCUMENTO'))),
  CONSTRAINT `chk_orden_tipo_servicio` CHECK (((`tipoServicio` in (_utf8mb4'NORMAL',_utf8mb4'URGENTE',_utf8mb4'PRIORITARIO')) or (`tipoServicio` is null)))
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_transporte`
--

LOCK TABLES `orden_transporte` WRITE;
/*!40000 ALTER TABLE `orden_transporte` DISABLE KEYS */;
/*!40000 ALTER TABLE `orden_transporte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pago`
--

DROP TABLE IF EXISTS `pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pago` (
  `idPago` int NOT NULL AUTO_INCREMENT,
  `fechaPago` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monto` decimal(12,2) NOT NULL,
  `pagadoPor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `tipoPago` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `metodoPago` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `estadoPago` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idCuenta` int DEFAULT NULL,
  `referencia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idOrden` int NOT NULL,
  `idUsuario` int NOT NULL,
  PRIMARY KEY (`idPago`),
  KEY `fk_pago_orden` (`idOrden`),
  KEY `fk_pago_usuario` (`idUsuario`),
  KEY `fk_pago_cuenta_corriente` (`idCuenta`),
  CONSTRAINT `fk_pago_cuenta_corriente` FOREIGN KEY (`idCuenta`) REFERENCES `cuenta_corriente` (`idCuenta`),
  CONSTRAINT `fk_pago_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_pago_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pago`
--

LOCK TABLES `pago` WRITE;
/*!40000 ALTER TABLE `pago` DISABLE KEYS */;
/*!40000 ALTER TABLE `pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recargo`
--

DROP TABLE IF EXISTS `recargo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recargo` (
  `idRecargo` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fechaRecargo` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `idOrden` int NOT NULL,
  PRIMARY KEY (`idRecargo`),
  KEY `fk_recargo_orden` (`idOrden`),
  CONSTRAINT `fk_recargo_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recargo`
--

LOCK TABLES `recargo` WRITE;
/*!40000 ALTER TABLE `recargo` DISABLE KEYS */;
/*!40000 ALTER TABLE `recargo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `region`
--

DROP TABLE IF EXISTS `region`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `region` (
  `idRegion` int NOT NULL AUTO_INCREMENT,
  `nombreRegion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `codigoRegion` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idRegion`),
  UNIQUE KEY `nombreRegion` (`nombreRegion`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `region`
--

LOCK TABLES `region` WRITE;
/*!40000 ALTER TABLE `region` DISABLE KEYS */;
/*!40000 ALTER TABLE `region` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `retiro`
--

DROP TABLE IF EXISTS `retiro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `retiro` (
  `idRetiro` int NOT NULL AUTO_INCREMENT,
  `fechaSolicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaProgramada` date DEFAULT NULL,
  `direccionRetiro` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `contacto` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `observacion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `valorRetiro` decimal(10,2) DEFAULT '0.00',
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idOrden` int NOT NULL,
  PRIMARY KEY (`idRetiro`),
  KEY `fk_retiro_orden` (`idOrden`),
  CONSTRAINT `fk_retiro_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `retiro`
--

LOCK TABLES `retiro` WRITE;
/*!40000 ALTER TABLE `retiro` DISABLE KEYS */;
/*!40000 ALTER TABLE `retiro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `idRol` int NOT NULL AUTO_INCREMENT,
  `nombreRol` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `descripcion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `nombreRol` (`nombreRol`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seguimiento_ot`
--

DROP TABLE IF EXISTS `seguimiento_ot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seguimiento_ot` (
  `idSeguimiento` int NOT NULL AUTO_INCREMENT,
  `fechaHora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ubicacion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `descripcion` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `idOrden` int NOT NULL,
  `idEstado` int NOT NULL,
  `idUsuario` int NOT NULL,
  PRIMARY KEY (`idSeguimiento`),
  KEY `fk_seguimiento_orden` (`idOrden`),
  KEY `fk_seguimiento_estado` (`idEstado`),
  KEY `fk_seguimiento_usuario` (`idUsuario`),
  CONSTRAINT `fk_seguimiento_estado` FOREIGN KEY (`idEstado`) REFERENCES `estado_ot` (`idEstado`),
  CONSTRAINT `fk_seguimiento_orden` FOREIGN KEY (`idOrden`) REFERENCES `orden_transporte` (`idOrden`),
  CONSTRAINT `fk_seguimiento_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seguimiento_ot`
--

LOCK TABLES `seguimiento_ot` WRITE;
/*!40000 ALTER TABLE `seguimiento_ot` DISABLE KEYS */;
/*!40000 ALTER TABLE `seguimiento_ot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sucursal`
--

DROP TABLE IF EXISTS `sucursal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sucursal` (
  `idSucursal` int NOT NULL AUTO_INCREMENT,
  `nombreSucursal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `direccion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `idComuna` int NOT NULL,
  PRIMARY KEY (`idSucursal`),
  KEY `fk_sucursal_comuna` (`idComuna`),
  CONSTRAINT `fk_sucursal_comuna` FOREIGN KEY (`idComuna`) REFERENCES `comuna` (`idComuna`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sucursal`
--

LOCK TABLES `sucursal` WRITE;
/*!40000 ALTER TABLE `sucursal` DISABLE KEYS */;
/*!40000 ALTER TABLE `sucursal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tarifa`
--

DROP TABLE IF EXISTS `tarifa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarifa` (
  `idTarifa` int NOT NULL AUTO_INCREMENT,
  `nombreTarifa` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `valorBase` decimal(10,2) NOT NULL,
  `valorKg` decimal(10,2) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `idTipoTarifa` int NOT NULL,
  `valorRetiro` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valorZonaLejana` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valorZonaUrbana` decimal(10,2) NOT NULL DEFAULT '0.00',
  `factorVolumetrico` int NOT NULL DEFAULT '4000',
  `valorM3` decimal(10,2) DEFAULT NULL,
  `valorRetiroMediano` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valorRetiroGrande` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`idTarifa`),
  KEY `fk_tarifa_tipo_tarifa` (`idTipoTarifa`),
  CONSTRAINT `fk_tarifa_tipo_tarifa` FOREIGN KEY (`idTipoTarifa`) REFERENCES `tipo_tarifa` (`idTipoTarifa`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tarifa`
--

LOCK TABLES `tarifa` WRITE;
/*!40000 ALTER TABLE `tarifa` DISABLE KEYS */;
/*!40000 ALTER TABLE `tarifa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tarifa_tramo`
--

DROP TABLE IF EXISTS `tarifa_tramo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarifa_tramo` (
  `idTarifaTramo` int NOT NULL AUTO_INCREMENT,
  `idTarifa` int NOT NULL,
  `kgDesde` decimal(10,2) NOT NULL,
  `kgHasta` decimal(10,2) NOT NULL,
  `valorFijo` decimal(10,2) DEFAULT NULL,
  `valorKg` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`idTarifaTramo`),
  KEY `fk_tarifa_tramo_tarifa` (`idTarifa`),
  CONSTRAINT `fk_tarifa_tramo_tarifa` FOREIGN KEY (`idTarifa`) REFERENCES `tarifa` (`idTarifa`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tarifa_tramo`
--

LOCK TABLES `tarifa_tramo` WRITE;
/*!40000 ALTER TABLE `tarifa_tramo` DISABLE KEYS */;
/*!40000 ALTER TABLE `tarifa_tramo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tarifa_trayecto`
--

DROP TABLE IF EXISTS `tarifa_trayecto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarifa_trayecto` (
  `idTarifaTrayecto` int NOT NULL AUTO_INCREMENT,
  `idTarifa` int NOT NULL,
  `idComunaOrigen` int NOT NULL,
  `idComunaDestino` int NOT NULL,
  `valorFijo` decimal(10,2) NOT NULL,
  `valorKg` decimal(10,2) DEFAULT NULL,
  `valorM3` decimal(10,2) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idTarifaTrayecto`),
  UNIQUE KEY `uq_tarifa_trayecto` (`idTarifa`,`idComunaOrigen`,`idComunaDestino`),
  KEY `fk_tarifa_trayecto_origen` (`idComunaOrigen`),
  KEY `fk_tarifa_trayecto_destino` (`idComunaDestino`),
  CONSTRAINT `fk_tarifa_trayecto_destino` FOREIGN KEY (`idComunaDestino`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `fk_tarifa_trayecto_origen` FOREIGN KEY (`idComunaOrigen`) REFERENCES `comuna` (`idComuna`),
  CONSTRAINT `fk_tarifa_trayecto_tarifa` FOREIGN KEY (`idTarifa`) REFERENCES `tarifa` (`idTarifa`),
  CONSTRAINT `chk_tarifa_trayecto_valores_no_negativos` CHECK (((`valorFijo` >= 0) and ((`valorKg` is null) or (`valorKg` >= 0)) and ((`valorM3` is null) or (`valorM3` >= 0))))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tarifa_trayecto`
--

LOCK TABLES `tarifa_trayecto` WRITE;
/*!40000 ALTER TABLE `tarifa_trayecto` DISABLE KEYS */;
/*!40000 ALTER TABLE `tarifa_trayecto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_bulto`
--

DROP TABLE IF EXISTS `tipo_bulto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_bulto` (
  `idTipoBulto` int NOT NULL AUTO_INCREMENT,
  `nombreTipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `descripcion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`idTipoBulto`),
  UNIQUE KEY `nombreTipo` (`nombreTipo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_bulto`
--

LOCK TABLES `tipo_bulto` WRITE;
/*!40000 ALTER TABLE `tipo_bulto` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipo_bulto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_recargo`
--

DROP TABLE IF EXISTS `tipo_recargo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_recargo` (
  `idTipoRecargo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) COLLATE utf8mb4_spanish_ci NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idTipoRecargo`),
  UNIQUE KEY `uq_tipo_recargo_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_recargo`
--

LOCK TABLES `tipo_recargo` WRITE;
/*!40000 ALTER TABLE `tipo_recargo` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipo_recargo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_tarifa`
--

DROP TABLE IF EXISTS `tipo_tarifa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_tarifa` (
  `idTipoTarifa` int NOT NULL AUTO_INCREMENT,
  `nombreTipoTarifa` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `descripcion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  PRIMARY KEY (`idTipoTarifa`),
  UNIQUE KEY `nombreTipoTarifa` (`nombreTipoTarifa`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_tarifa`
--

LOCK TABLES `tipo_tarifa` WRITE;
/*!40000 ALTER TABLE `tipo_tarifa` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipo_tarifa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `idUsuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `apellido` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `rut` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `correo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `idRol` int NOT NULL,
  `nombreUsuario` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `correoVerificadoEn` datetime DEFAULT NULL,
  `registroPendiente` tinyint(1) NOT NULL DEFAULT '0',
  `ultimoAcceso` datetime DEFAULT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `rut` (`rut`),
  UNIQUE KEY `correo` (`correo`),
  UNIQUE KEY `uq_usuario_nombreUsuario` (`nombreUsuario`),
  KEY `fk_usuario_rol` (`idRol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`idRol`) REFERENCES `rol` (`idRol`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculo`
--

DROP TABLE IF EXISTS `vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculo` (
  `idVehiculo` int NOT NULL AUTO_INCREMENT,
  `patente` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `marca` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `modelo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `anio` int DEFAULT NULL,
  `capacidadKg` decimal(10,2) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idVehiculo`),
  UNIQUE KEY `patente` (`patente`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculo`
--

LOCK TABLES `vehiculo` WRITE;
/*!40000 ALTER TABLE `vehiculo` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verificacion_acceso`
--

DROP TABLE IF EXISTS `verificacion_acceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verificacion_acceso` (
  `idVerificacion` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `proposito` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'LOGIN',
  `challengeId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `codigoHash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `expiraEn` datetime NOT NULL,
  `intentos` int NOT NULL DEFAULT '0',
  `usado` tinyint(1) NOT NULL DEFAULT '0',
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idVerificacion`),
  UNIQUE KEY `uq_verificacion_acceso_challenge` (`challengeId`),
  KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `verificacion_acceso_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verificacion_acceso`
--

LOCK TABLES `verificacion_acceso` WRITE;
/*!40000 ALTER TABLE `verificacion_acceso` DISABLE KEYS */;
/*!40000 ALTER TABLE `verificacion_acceso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'marexpress_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-20 21:48:27

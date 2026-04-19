-- Migration: Add Listados Tables
-- Date: 2026-04-19

-- Table for Pendientes
CREATE TABLE IF NOT EXISTS pendientes (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    paciente VARCHAR(255) NOT NULL,
    pendiente VARCHAR(50) CHECK (pendiente IN ('Autorizacion', 'Pedido Medico', 'Pago')),
    detalle TEXT,
    seguimiento VARCHAR(50) DEFAULT 'Pendiente' CHECK (seguimiento IN ('En Proceso', 'Finalizado', 'Pendiente')),
    observaciones TEXT,
    month_group VARCHAR(7) NOT NULL, -- e.g., '2026-04'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for System Codes
CREATE TABLE IF NOT EXISTS system_codes (
    id SERIAL PRIMARY KEY,
    analisis TEXT NOT NULL UNIQUE,
    codigo_sistema VARCHAR(255),
    codigo_nbu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Billing Prices
CREATE TABLE IF NOT EXISTS billing_prices (
    id SERIAL PRIMARY KEY,
    analisis TEXT NOT NULL UNIQUE,
    cibic VARCHAR(255),
    gornitz VARCHAR(255),
    fpm VARCHAR(255),
    manlab VARCHAR(255),
    lerda VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

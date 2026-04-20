-- Migration: Add Multiple Documents Support
-- Date: 2026-04-20

-- 1. Create the new appointment_documents table
CREATE TABLE IF NOT EXISTS appointment_documents (
    id SERIAL PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrate existing document_url from appointments table
INSERT INTO appointment_documents (appointment_id, document_url, filename)
SELECT id, document_url, 'Pedido Médico Anterior'
FROM appointments
WHERE document_url IS NOT NULL;

-- 3. (Optional but recommended) You might want to keep the column in appointments 
-- for a while during transition, or just drop it if you're sure or nullable.
-- ALTER TABLE appointments RENAME COLUMN document_url TO legacy_document_url;

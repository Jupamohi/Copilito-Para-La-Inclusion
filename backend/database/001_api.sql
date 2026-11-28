-- Ejecutar una vez sobre la base restaurada, con psql -v ON_ERROR_STOP=1.
BEGIN;
ALTER TABLE participante ALTER COLUMN codigo TYPE varchar(64);
ALTER TABLE participante ADD COLUMN muestras_retiradas integer CHECK (muestras_retiradas >= 0);
-- Una sesión de voz puede comenzar antes de registrar el primer clasificador.
ALTER TABLE sesion ALTER COLUMN id_version DROP NOT NULL;
ALTER TABLE muestra RENAME COLUMN vector63 TO vector;
ALTER TABLE muestra DROP CONSTRAINT ck_muestra_vector;
ALTER TABLE muestra ADD CONSTRAINT ck_muestra_vector CHECK (
  array_ndims(vector) = 1 AND cardinality(vector) IN (63,126)
  AND array_position(vector, NULL::real) IS NULL
);
ALTER TABLE intervencion ADD COLUMN clave_envio uuid;
ALTER TABLE intervencion ADD UNIQUE (id_sesion, clave_envio);
CREATE TABLE api_token (
  huella bytea PRIMARY KEY,
  id_admin integer NOT NULL REFERENCES administrador,
  vence timestamptz NOT NULL
);
GRANT SELECT, INSERT, DELETE ON api_token TO lsc_app;
-- La cuenta HTTP lee hashes para verificar credenciales. El aprovisionamiento usa el propietario.
REVOKE INSERT, DELETE, UPDATE ON administrador FROM lsc_app;
COMMIT;

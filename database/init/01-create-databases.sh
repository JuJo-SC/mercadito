#!/bin/bash
set -Eeuo pipefail

: "${APP_DB_PASSWORD:?APP_DB_PASSWORD is required}"
: "${KC_DB_PASSWORD:?KC_DB_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE mercadito_app LOGIN PASSWORD '${APP_DB_PASSWORD}';
CREATE DATABASE mercadito OWNER mercadito_app;
CREATE ROLE keycloak_app LOGIN PASSWORD '${KC_DB_PASSWORD}';
CREATE DATABASE keycloak OWNER keycloak_app;
SQL

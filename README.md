# Expo Agroalimentaria La Grita 2026 · Casino Militar

Plataforma oficial de la **Expo Agroalimentaria La Grita 2026** (20, 21 y 22 de noviembre de 2026 · Casino Militar de La Grita, Municipio Jáuregui, Estado Táchira), organizada por **Grupo CENEXPO** (`@cenexposc`) y presentada en digital por **AgroMarket** (`@agromarket.ve`), con el patrocinio oficial principal de **BISA Biotecnología** (`@bisa_ve`) y **Banco Sofitasa** (`@bancosofitasa`).

## Despliegue en Cloudflare Workers & Pages

Este repositorio está configurado para compilar y desplegar automáticamente en **Cloudflare Workers & Pages**:

- **Lockfile compatible (`bun.lock` v1)**: Compatible con `bun install --frozen-lockfile` (`Bun v1.2.15+` y `Bun v1.4+`) y con `npm install`.
- **Comando de compilación (Build command)**: `npm run build` (o `bun run build`)
- **Directorio de salida (Output directory)**: `dist`
- **Configuración de Cloudflare Workers (`wrangler.jsonc`)**: Sirve los archivos estáticos de `./dist` con enrutamiento SPA (`single-page-application`).
- **Configuración de Cloudflare Pages (`public/_redirects`)**: Incluye `/* /index.html 200` para rutas profundas (`/pase/:token`, `/stand/:code`, `/admin`, `/admin/checkin`).

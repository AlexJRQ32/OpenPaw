# Deploy del Backend - OpenPaw Devs

## Hosting

- **URL:** http://openpaw.alwaysdata.net/api
- **Admin panel:** https://admin.alwaysdata.com (usuario: `openpaw`)
- **FTP:** `ftp-openpaw.alwaysdata.net` / puerto 990 (SSL/TLS) / usuario: `openpaw`

## Cómo hacer un deploy

### 1. Compilar

```bash
cd backend
dotnet publish OpenPawDevs.WebAPI/OpenPawDevs.WebAPI.csproj `
  -c Release -r linux-x64 --self-contained true `
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true `
  -o publish-deploy
```

### 2. Subir por FTP

Con FileZilla:
- **Servidor:** `ftp-openpaw.alwaysdata.net`
- **Usuario:** `openpaw`
- **Contraseña:** la de la cuenta
- **Cifrado:** Requerir SSL/TLS explícito (puerto 990)
- **Destino:** `/www/api/`

Subir estos archivos:
- `publish-deploy/OpenPawDevs.WebAPI` (el binario Linux)
- `publish-deploy/appsettings.json`
- `publish-deploy/appsettings.Production.json`

### 3. Configurar sitio en Alwaysdata

Web → Sites → `openpaw.alwaysdata.net/api`
- **Type:** .NET
- **Working directory:** `/home/openpaw/www/api`
- **Command:** `bash -c 'chmod +x ./OpenPawDevs.WebAPI && exec ./OpenPawDevs.WebAPI --urls "http://$IP:$PORT"'`
- **.NET version:** 10

### 4. Verificar

```bash
curl -X POST http://openpaw.alwaysdata.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@openpaw.com","password":"Test123456"}'
```

## Notas

- El binario es **self-contained** (~112 MB), incluye el runtime .NET
- Si cambia la URL del backend, actualizar:
  - `frontend/api/proxy.js` (proxy Vercel)
  - `frontend/vite.config.js` (proxy local)
  - `frontend/.env` (local)
  - `frontend/.env.production` (producción)
- Los logs del backend se ven en Alwaysdata: Web → Sites → Logs

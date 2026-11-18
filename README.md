# PCBuildMatch

Plataforma de validación automatizada de compatibilidad de hardware para PCs de escritorio. El sistema recibe una lista de componentes, construye un prompt técnico, consulta un modelo de lenguaje y devuelve un veredicto estructurado con puntaje, advertencias y diagnóstico.

**Estado:** aplicación funcional y probada en Windows con PostgreSQL 18.6, FastAPI, Next.js y Google Gemini.

## Descripción y valor

PCBuildMatch resuelve la verificación previa al ensamblaje de una PC. El usuario describe los componentes que planea comprar o ya posee y el sistema analiza:

- Compatibilidad de socket y chipset entre CPU y motherboard.
- Tipo de memoria (DDR4/DDR5), velocidad, canales y soporte EXPO/XMP.
- Disponibilidad de lanes PCIe, slots M.2/SATA y espacio físico.
- Potencia de la fuente, conectores EPS/PCIe/12VHPWR y protecciones.
- Compatibilidad de refrigeración: TDP, altura del disipador, tamaño del radiador y clearance.
- Cableado y headers: CPU_FAN, AIO_PUMP, SYS_FAN, conectores de 3 y 4 pines, PWM, sensor de RPM/tach, alineación del pin 1 y alimentación de la bomba de un AIO.
- Soporte de BIOS para la generación del procesador.

La salida es un JSON estricto y persistido en PostgreSQL, apto para integrarse con otras herramientas o para auditoría posterior.

## Arquitectura

El proyecto es un monorepo con dos aplicaciones independientes:

1. **Backend FastAPI:** expone la API REST, valida el body con Pydantic, orquesta la llamada al proveedor de IA, parsea y valida el JSON de respuesta, y persiste el resultado en PostgreSQL.
2. **Frontend Next.js:** interfaz de usuario que consume la API, gestiona el formulario dinámico y renderiza el dashboard de resultados.

Flujo de una validación:

```text
[ Next.js UI ] --HTTP/JSON--> [ FastAPI ] --HTTPS--> [ Gemini API ]
                                    |
                                    v
                              [ PostgreSQL ]
```

1. El navegador envía `POST /api/validate-build` con los componentes.
2. FastAPI valida el body con Pydantic.
3. El servicio de IA arma el prompt y consulta el proveedor configurado.
4. La respuesta del LLM se normaliza, se parsea como JSON estricto y se valida contra el esquema.
5. SQLAlchemy persiste el resultado en la tabla `hardware_builds`.
6. La API devuelve `201 Created` con el registro completo.
7. El frontend renderiza el puntaje, las advertencias y el diagnóstico técnico.

## Stack tecnológico

| Capa | Tecnología | Versión de referencia |
|---|---|---|
| Lenguaje backend | Python | 3.15.2 (probado); 3.11+ requerido |
| Framework backend | FastAPI | 0.162.0 |
| Servidor ASGI | Uvicorn | 0.54.0 |
| ORM | SQLAlchemy | 2.1.8 |
| Driver PostgreSQL | psycopg | 3.3.8 |
| Validación de datos | Pydantic | 2.14.2 |
| Configuración | pydantic-settings | 2.16.2 |
| Cliente HTTP | httpx | 0.28.1 |
| Base de datos | PostgreSQL | 18.6 (probado); 16+ recomendado |
| Framework frontend | Next.js (App Router) | 16.4.5 |
| UI | React | 19.3.1 |
| Estilos | Tailwind CSS | 4.3.4 |
| Lenguaje frontend | TypeScript | 5.9.3 |
| Runtime frontend | Node.js | 26.13.0 (probado); 20.9+ requerido |
| Gestor de paquetes | npm | 11.20.0 (probado) |
| IA | Google Gemini | `gemini-3.5-flash` + cadena de respaldo |

Las versiones exactas del backend están fijadas en `backend/requirements.txt` y `backend/requirements-dev.txt`. Las del frontend están fijadas en `frontend/package.json` y `frontend/package-lock.json`.

## Estructura del repositorio

```text
PCBuildMatch/
├── backend/
│   ├── app/
│   │   ├── api/v1/routes/builds.py   # Endpoint POST /api/validate-build
│   │   ├── core/config.py            # Settings desde variables de entorno
│   │   ├── db/                       # Engine, sesiones y Base declarativa
│   │   ├── models/hardware_build.py  # Modelo ORM hardware_builds
│   │   ├── schemas/hardware_build.py # Schemas Pydantic
│   │   ├── services/ai.py            # Proveedores de IA, prompt y fallback
│   │   └── main.py                   # FastAPI, CORS y lifespan
│   ├── tests/                        # Reservado para tests automatizados
│   ├── .env.example                  # Plantilla sin credenciales
│   ├── requirements.txt              # Dependencias de runtime
│   └── requirements-dev.txt          # Dependencias de desarrollo
├── frontend/
│   ├── app/
│   │   ├── components/               # Formulario, resultados, estados e iconos
│   │   ├── lib/api.ts                # Cliente tipado del backend
│   │   ├── page.tsx                  # Página principal
│   │   └── globals.css               # Tailwind y estilos base
│   ├── public/
│   ├── .env.example                  # Plantilla sin credenciales
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Requisitos del sistema

- Windows 10 u 11 de 64 bits.
- Python 3.11 o superior. El proyecto fue probado con Python 3.15.2.
- Node.js 20.9 o superior. El proyecto fue probado con Node.js 26.13.0.
- npm 10 o superior.
- PostgreSQL 16 o superior, con pgAdmin 4. El proyecto fue probado con PostgreSQL 18.6.
- Git 2.40 o superior, opcional pero recomendado para clonar el repositorio.

Docker no es necesario. La aplicación funciona con PostgreSQL instalado de forma nativa en Windows.

> En los comandos siguientes, reemplazar `C:\ruta\al\proyecto` por la ruta real donde se encuentra el repositorio.

## Configuración de PostgreSQL con pgAdmin

### 1. Instalar PostgreSQL

1. Ejecutar el instalador de PostgreSQL para Windows.
2. Mantener el puerto `5432` salvo que ya esté ocupado por otra instalación.
3. Definir y recordar la contraseña del superusuario `postgres`.
4. Verificar que el instalador incluya pgAdmin 4.
5. Finalizar la instalación y abrir pgAdmin 4 desde el menú Inicio.

### 2. Crear el rol de la aplicación

1. En el panel izquierdo de pgAdmin, expandir **Servers**.
2. Conectarse al servidor local e ingresar la contraseña del usuario `postgres`.
3. Expandir **Login/Group Roles**.
4. Hacer clic derecho y seleccionar **Create > Login/Group Role**.
5. En la pestaña **General**, definir el nombre `pcbuildmatch`.
6. En la pestaña **Definition**, definir una contraseña segura. En este documento se usa el placeholder `<contrasena>`.
7. En la pestaña **Privileges**, verificar que **Can login** esté habilitado.
8. Guardar el rol.

### 3. Crear la base de datos

1. Expandir **Databases**.
2. Hacer clic derecho y seleccionar **Create > Database**.
3. Definir el nombre `pcbuildmatch`.
4. Seleccionar `pcbuildmatch` como **Owner**.
5. Guardar la base de datos.

### 4. Verificar permisos del esquema

Abrir el **Query Tool** sobre la base `pcbuildmatch` y ejecutar:

```sql
GRANT ALL ON SCHEMA public TO pcbuildmatch;
```

Si la base fue creada con `pcbuildmatch` como owner, este paso suele ser redundante, pero evita problemas de permisos en PostgreSQL 15 y superiores.

### 5. Verificar la conexión

En el **Query Tool** de la base `pcbuildmatch`, ejecutar:

```sql
SELECT current_database(), current_user, version();
```

La consulta debe devolver la base `pcbuildmatch`, el usuario `pcbuildmatch` y la versión de PostgreSQL.

### 6. Armar la cadena de conexión

La aplicación utiliza SQLAlchemy con el driver `psycopg`:

```text
postgresql+psycopg://pcbuildmatch:<contrasena>@localhost:5432/pcbuildmatch
```

Reemplazar `<contrasena>` por la contraseña real definida en pgAdmin. Si contiene caracteres especiales como `@`, `:`, `/` o `#`, deben codificarse para URL antes de armar la cadena.

> La tabla `hardware_builds` se crea automáticamente al iniciar el backend. No es necesario crearla manualmente en pgAdmin.

## Configuración del backend

### 1. Abrir la terminal

Abrir **PowerShell** o **CMD** y ubicarse en la carpeta del backend:

```powershell
cd C:\ruta\al\proyecto\backend
```

### 2. Verificar Python

```powershell
python --version
```

Debe devolver Python 3.11 o superior. Si el comando no se reconoce, reinstalar Python marcando la opción **Add Python to PATH**.

### 3. Crear y activar el entorno virtual

En PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Si PowerShell bloquea la ejecución de scripts:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

En CMD:

```cmd
python -m venv venv
venv\Scripts\activate.bat
```

El prompt debe mostrar `(venv)` al inicio.

### 4. Instalar dependencias

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Para instalar también las dependencias de desarrollo:

```powershell
pip install -r requirements-dev.txt
```

### 5. Configurar variables de entorno

Crear el archivo `.env` a partir de la plantilla:

```powershell
Copy-Item .env.example .env
```

En CMD:

```cmd
copy .env.example .env
```

Editar `backend/.env` con Notepad o el editor preferido:

```powershell
notepad .env
```

Completar como mínimo:

```env
DATABASE_URL=postgresql+psycopg://pcbuildmatch:<contrasena>@localhost:5432/pcbuildmatch
AI_PROVIDER=gemini
GEMINI_API_KEY=<clave_de_gemini>
```

Si se utiliza otro proveedor, completar la clave correspondiente y cambiar `AI_PROVIDER` a `openai`, `anthropic` o `deepseek`.

No commitear `backend/.env`. El archivo está incluido en `.gitignore`.

### 6. Ejecutar la API

Con el entorno virtual activado:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Alternativa que no depende de la activación del entorno:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verificar:

- API: `http://127.0.0.1:8000/`
- Documentación interactiva: `http://127.0.0.1:8000/docs`
- OpenAPI: `http://127.0.0.1:8000/openapi.json`

Al iniciar, la aplicación ejecuta `Base.metadata.create_all()` y crea la tabla `hardware_builds` si no existe.

## Configuración del frontend

### 1. Abrir una segunda terminal

Mantener el backend en ejecución y abrir otra ventana de PowerShell o CMD:

```powershell
cd C:\ruta\al\proyecto\frontend
```

### 2. Verificar Node.js y npm

```powershell
node --version
npm --version
```

Se requiere Node.js 20.9 o superior.

### 3. Instalar dependencias

```powershell
npm install
```

Si PowerShell bloquea `npm`, usar `npm.cmd`:

```powershell
npm.cmd install
```

### 4. Configurar variables de entorno

Crear el archivo `.env.local` a partir de la plantilla:

```powershell
Copy-Item .env.example .env.local
```

En CMD:

```cmd
copy .env.example .env.local
```

Editar `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Si la variable se deja vacía, el cliente utiliza `http://localhost:8000` como valor por defecto. La variable debe apuntar a la URL base del backend, sin `/api` al final.

### 5. Ejecutar el servidor de desarrollo

```powershell
npm run dev
```

Si PowerShell bloquea `npm`:

```powershell
npm.cmd run dev
```

Abrir `http://localhost:3000` en el navegador.

### 6. Verificar la compilación de producción

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

## Ejecución completa

La aplicación requiere dos procesos activos:

| Terminal | Directorio | Comando | URL |
|---|---|---|---|
| 1 | `backend` | `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` | `http://127.0.0.1:8000` |
| 2 | `frontend` | `npm run dev` | `http://localhost:3000` |

El backend debe iniciarse primero para que el frontend pueda validar builds. CORS permite por defecto los orígenes `http://localhost:3000` y `http://127.0.0.1:3000`.

Si un puerto está ocupado, identificar el proceso:

```powershell
Get-NetTCPConnection -LocalPort 8000 -State Listen
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

Y detenerlo por PID:

```powershell
Stop-Process -Id <PID> -Force
```

## Variables de entorno

### Backend

Archivo: `backend/.env`. Plantilla versionada: `backend/.env.example`.

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `DATABASE_URL` | Sí | — | Cadena de conexión SQLAlchemy a PostgreSQL. |
| `AI_PROVIDER` | No | `gemini` | Proveedor activo: `gemini`, `openai`, `anthropic` o `deepseek`. |
| `GEMINI_API_KEY` | Según proveedor | Vacía | Clave de Google Gemini. |
| `OPENAI_API_KEY` | Según proveedor | Vacía | Clave de OpenAI. |
| `ANTHROPIC_API_KEY` | Según proveedor | Vacía | Clave de Anthropic. |
| `DEEPSEEK_API_KEY` | Según proveedor | Vacía | Clave de DeepSeek. |
| `GEMINI_MODEL` | No | `gemini-3.5-flash` | Modelo principal de Gemini. |
| `GEMINI_FALLBACK_MODELS` | No | `gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-flash-lite-latest` | Modelos de respaldo, separados por comas. |
| `DEEPSEEK_MODEL` | No | `deepseek-v4-pro` | Modelo de DeepSeek. |
| `OPENAI_MODEL` | No | Vacío | Modelo de OpenAI. |
| `ANTHROPIC_MODEL` | No | Vacío | Modelo de Anthropic. |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Endpoint compatible con OpenAI. |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com` | Endpoint de DeepSeek. |
| `AI_TIMEOUT_SECONDS` | No | `60` | Timeout por request al proveedor de IA. |
| `API_PREFIX` | No | `/api` | Prefijo de los endpoints. |
| `BACKEND_CORS_ORIGINS` | No | `http://localhost:3000,http://127.0.0.1:3000` | Orígenes permitidos por CORS, separados por comas. |
| `APP_NAME` | No | `PCBuildMatch` | Nombre mostrado en la documentación. |
| `APP_ENV` | No | `development` | Entorno de ejecución. |
| `DEBUG` | No | `true` | Modo debug de FastAPI. |

Las credenciales de `.env.example` están vacías. Completar únicamente las del proveedor seleccionado.

### Frontend

Archivo: `frontend/.env.local`. Plantilla versionada: `frontend/.env.example`.

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000` | URL base del backend FastAPI. |

`NEXT_PUBLIC_API_URL` se incrusta en el bundle del navegador. No colocar secretos en variables `NEXT_PUBLIC_*`.

## Contrato de la API

### `POST /api/validate-build`

Analiza una build, la persiste y devuelve el registro creado.

#### Request

Formato recomendado:

```json
{
  "components": [
    {
      "type": "CPU",
      "brand": "AMD",
      "model": "Ryzen 7 9800X3D",
      "socket": "AM5",
      "tdp_w": 120
    },
    {
      "type": "Motherboard",
      "brand": "MSI",
      "model": "MAG B650 TOMAHAWK WIFI",
      "socket": "AM5",
      "memory": "DDR5",
      "headers": ["CPU_FAN", "AIO_PUMP", "SYS_FAN"]
    },
    {
      "type": "RAM",
      "model": "G.Skill Flare X5 32 GB (2x16 GB) DDR5-6000 CL30"
    },
    {
      "type": "Storage",
      "model": "Samsung 990 PRO 2 TB NVMe PCIe 4.0"
    },
    {
      "type": "PSU",
      "model": "Corsair RM850x 850 W 80 Plus Gold ATX 3.0"
    },
    {
      "type": "Cooling",
      "model": "Arctic Liquid Freezer III 360 ARGB",
      "socket": "AM5",
      "connectors": "3-pin pump RPM + 4-pin PWM fans",
      "radiator_mm": 360
    }
  ]
}
```

También se acepta un array directo como body:

```json
[
  {"type": "CPU", "model": "Ryzen 7 9800X3D", "socket": "AM5"},
  {"type": "Motherboard", "model": "MSI MAG B650 TOMAHAWK WIFI", "socket": "AM5"}
]
```

Cada componente es un objeto JSON libre. Cuanto más detalle técnico se incluya, más preciso es el análisis. La API acepta entre 1 y 50 componentes y rechaza objetos vacíos.

#### Response `201 Created`

```json
{
  "id": 1,
  "components_json": [
    {
      "type": "CPU",
      "brand": "AMD",
      "model": "Ryzen 7 9800X3D",
      "socket": "AM5",
      "tdp_w": 120
    }
  ],
  "compatibility_score": 92,
  "warnings": [
    "Falta la fuente: no se puede confirmar la potencia ni los conectores."
  ],
  "detailed_feedback": "La CPU AM5 y la motherboard AM5 con DDR5 son compatibles. Se recomienda verificar la versión de BIOS...",
  "created_at": "2026-11-04T15:30:00Z"
}
```

#### Códigos de estado

| Código | Descripción |
|---|---|
| `201` | Build validada y persistida correctamente. |
| `422` | El body no cumple el esquema de Pydantic. |
| `500` | Error al guardar el resultado en PostgreSQL. |
| `502` | Error del proveedor de IA o JSON de respuesta inválido. |

La llamada al LLM es síncrona y puede tardar varios segundos. El frontend utiliza un timeout de 120 segundos.

## Modelo de datos

Tabla: `hardware_builds`.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `integer` | Primary key, secuencia automática. |
| `components_json` | `json` | Not null. Lista original de componentes. |
| `compatibility_score` | `integer` | Not null, check entre 0 y 100. |
| `warnings` | `json` | Not null, default `[]`. |
| `detailed_feedback` | `text` | Not null. Diagnóstico técnico. |
| `created_at` | `timestamptz` | Not null, default `now()`. |

La tabla se crea automáticamente al iniciar la aplicación mediante `Base.metadata.create_all()` en el lifespan de FastAPI.

Alembic está incluido en `requirements.txt`, pero las migraciones todavía no están configuradas. Para un entorno productivo se recomienda incorporar una carpeta `migrations/` y un `alembic.ini`.

## Motor de validación con IA

### Proveedores

El proveedor se selecciona con `AI_PROVIDER`:

- `gemini` (por defecto).
- `openai`.
- `anthropic`.
- `deepseek`.

Solo se utiliza el proveedor configurado. Las claves se leen desde `backend/.env` y nunca se envían al frontend.

### Reglas del prompt

El system prompt exige:

- Analizar únicamente los componentes incluidos por el usuario.
- No inventar especificaciones ni agregar componentes no mencionados.
- Marcar como advertencia cualquier dato crítico faltante.
- Verificar socket, chipset, BIOS, memoria, PCIe, alimentación, refrigeración, espacio físico y cableado.
- Evaluar casos de 3 y 4 pines, PWM, sensor de RPM/tach, pin 1, header AIO_PUMP y alimentación de la bomba.
- Devolver exclusivamente un objeto JSON con `compatibility_score`, `warnings` y `detailed_feedback`.
- Usar un entero entre 0 y 100 para el puntaje y español para los textos.

### Validación de la respuesta

El backend:

1. Elimina fences de Markdown si el modelo las agrega.
2. Extrae el primer objeto JSON.
3. Convierte y acota el puntaje al rango 0–100.
4. Normaliza `warnings` como lista de strings no vacíos.
5. Exige un `detailed_feedback` no vacío.
6. Valida el resultado con Pydantic antes de persistirlo.

Si el JSON es inválido, el endpoint responde `502` y no guarda nada en la base.

### Cadena de fallback de Gemini

La cadena se configura con `GEMINI_MODEL` y `GEMINI_FALLBACK_MODELS`:

```text
gemini-3.5-flash
  -> gemini-3.5-flash-lite
    -> gemini-3.1-flash-lite
      -> gemini-flash-lite-latest
```

Comportamiento:

| Situación | Acción |
|---|---|
| `429` cuota agotada | Pasa al siguiente modelo de inmediato. |
| `503` saturación | Reintenta una vez y luego pasa al siguiente. |
| Respuesta vacía o sin candidatos | Prueba el siguiente modelo. |
| JSON inválido | Prueba el siguiente modelo. |
| `401` o `403` | Corta la cadena y devuelve error de credenciales. |
| Todos los modelos fallan | `502` con el detalle de cada intento. |

Las cuotas de Gemini son por modelo y por proyecto. La cadena multiplica la capacidad disponible del nivel gratuito, pero no elimina los límites. El modelo que respondió queda registrado en el log del backend.

## Frontend

La interfaz utiliza Next.js App Router, React 19, TypeScript y Tailwind CSS 4.

Funcionalidades:

- Formulario dinámico con CPU, motherboard, RAM, almacenamiento, fuente y refrigeración.
- Componentes adicionales con tipo y descripción libres.
- Botones para cargar un ejemplo, limpiar el formulario y agregar o quitar componentes.
- Estado de carga con spinner y el texto `Analizando compatibilidad y voltajes...`.
- Dashboard con gauge circular animado para `compatibility_score`.
- Umbrales de color: verde para 90 o más, ámbar entre 70 y 89, rojo por debajo de 70.
- Sección de advertencias de ensamblaje con scroll cuando hay muchas alertas.
- Tarjeta de diagnóstico técnico con opción de copiar el informe.
- Botón para validar otra build y reiniciar el flujo.
- Panel de error que distingue problemas de conexión de saturación del proveedor de IA.
- Auto-scroll al resultado y diseño responsive sin overflow horizontal.
- Atributos `aria-live`, `role="status"` y `role="alert"` para accesibilidad básica.

## Seguridad

- `backend/.env` y `frontend/.env.local` están incluidos en `.gitignore`.
- Los archivos `.env.example` no contienen claves, contraseñas ni cadenas de conexión reales.
- Las claves de IA se utilizan exclusivamente en el backend.
- `NEXT_PUBLIC_API_URL` es pública por definición; no debe contener secretos.
- CORS está restringido por defecto a los orígenes locales.
- Pydantic valida el body de entrada y SQLAlchemy utiliza consultas parametrizadas.
- Los errores del proveedor se recortan y se redacta la API key antes de devolverlos.
- Los componentes enviados por el usuario se transmiten al proveedor de IA configurado. No ingresar datos personales, confidenciales o sensibles.

No implementado todavía:

- Autenticación y autorización.
- Rate limiting.
- HTTPS y despliegue productivo.
- Rotación automática de claves.

## Verificación y calidad

### Backend

Verificar que la API responde:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/" -Method Get
```

Probar el endpoint desde Swagger:

1. Abrir `http://127.0.0.1:8000/docs`.
2. Expandir `POST /api/validate-build`.
3. Usar **Try it out** con un body de ejemplo.
4. Verificar la respuesta `201` y el registro en PostgreSQL.

También se puede comprobar la tabla desde pgAdmin:

```sql
SELECT id, compatibility_score, created_at
FROM hardware_builds
ORDER BY id DESC
LIMIT 10;
```

### Frontend

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

### Pruebas realizadas

- Validación real contra Gemini con respuesta `201` y persistencia en PostgreSQL.
- Validación desde la interfaz con puntaje, advertencias y diagnóstico.
- CORS verificado para `http://localhost:3000`.
- Body envuelto (`{"components": [...]}`) y array directo verificados.
- Lista vacía rechazada con `422`.
- Error del proveedor de IA manejado con `502`.
- Fallback de Gemini verificado con `429` real: el modelo principal agotó su cuota y la petición continuó con `gemini-3.5-flash-lite`.
- Fallback verificado de forma determinista para `429`, `503`, respuesta vacía y JSON inválido.

El repositorio todavía no incluye una suite de tests automatizados. Las verificaciones anteriores son manuales y de integración.

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `python` no se reconoce | Python no está en PATH | Reinstalar Python con **Add Python to PATH** y abrir una terminal nueva. |
| `Activate.ps1 cannot be loaded` | Política de ejecución de PowerShell | Ejecutar `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` y volver a activar. |
| `ModuleNotFoundError` | Entorno virtual inactivo o dependencias faltantes | Activar `venv` y ejecutar `pip install -r requirements.txt`. |
| `psycopg.OperationalError` | PostgreSQL detenido, base o usuario inexistente | Verificar el servicio de PostgreSQL y los datos de `DATABASE_URL`. |
| `password authentication failed` | Contraseña incorrecta o caracteres especiales sin codificar | Restablecer la contraseña en pgAdmin y codificarla para URL. |
| `psql` no se reconoce | La carpeta `bin` de PostgreSQL no está en PATH | Usar pgAdmin o ejecutar `C:\Program Files\PostgreSQL\<VERSION>\bin\psql.exe`. |
| `npm` bloqueado por PowerShell | Política de ejecución | Usar `npm.cmd` en lugar de `npm`. |
| Error de CORS en el navegador | Origen no permitido | Agregar el origen a `BACKEND_CORS_ORIGINS` y reiniciar el backend. |
| `502 Bad Gateway` | Clave inválida, cuota agotada o proveedor saturado | Revisar el log del backend y la clave del proveedor. La cadena de fallback puede resolver la saturación. |
| `Address already in use` | Puerto ocupado | Identificar el PID con `Get-NetTCPConnection` y detenerlo con `Stop-Process`. |
| Cambios en `.env` no se aplican | Variables leídas al iniciar | Reiniciar el backend y el servidor de Next.js. |
| `NEXT_PUBLIC_API_URL` vacía | Plantilla sin valor | El cliente usa `http://localhost:8000` por defecto; si el backend está en otra URL, completar la variable. |

## Limitaciones y trabajo futuro

- No hay suite de tests automatizados; se recomienda agregar pytest y mocks del proveedor de IA.
- No hay migraciones Alembic; la tabla se crea con `create_all()` al iniciar.
- No hay autenticación ni rate limiting; el servicio está pensado para uso local.
- No hay historial visual de builds; los registros se consultan directamente en PostgreSQL.
- La llamada al LLM es síncrona y no utiliza streaming.
- La salida del modelo puede contener errores. El puntaje es orientativo y siempre debe contrastarse con los manuales del fabricante.
- Las cuotas gratuitas de Gemini son limitadas. La cadena de fallback amplía la capacidad, pero no la hace ilimitada.
- Como alternativa sin cuotas de API, se evaluó incorporar un modelo local con Ollama. La integración no está implementada en esta versión.

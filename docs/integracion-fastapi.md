# Copiloto · Guía de integración

## Qué se conectó

React conserva la navegación, el estado de los turnos, los permisos de cámara y micrófono, el avatar y el diseño. MediaPipe calcula las coordenadas en el navegador. El adaptador de `frontend/src/api/cliente.ts` envía las peticiones. FastAPI valida la entrada con Pydantic y abre una transacción de PostgreSQL mediante psycopg. La respuesta vuelve a React y sus componentes existentes muestran el resultado, el indicador de carga o el error.

Ejemplo: al pulsar **Aceptar y continuar**, React envía `POST /api/v1/consents` con el alcance y la versión. FastAPI registra el participante y su consentimiento en una sola transacción y responde `201 {"id_participante":"…"}`. React dibuja ese código en la pantalla de confirmación. Se genera un identificador aleatorio para evitar códigos de retiro predecibles. Trátelo como un secreto. En el turno de señas viajan 126 números. En el turno de voz se transmite la grabación al servidor local mediante multipart.

### Del botón a la base de datos

```mermaid
sequenceDiagram
    actor Persona
    participant React
    participant Vite
    participant FastAPI
    participant PostgreSQL
    Persona->>React: Aceptar y continuar
    React->>Vite: POST /api/v1/consents con JSON
    Vite->>FastAPI: Reenvía el método, los encabezados y el cuerpo
    FastAPI->>FastAPI: Pydantic valida alcance y versión
    FastAPI->>PostgreSQL: Inserta participante y consentimiento
    PostgreSQL-->>FastAPI: Transacción confirmada
    FastAPI-->>React: HTTP 201 con id_participante, vía Vite
    React-->>Persona: Consentimiento registrado y código
```

Durante la solicitud, el hook existente `useSolicitud` mantiene el estado de carga. Si PostgreSQL rechaza una operación, el contexto de conexión revierte la transacción y FastAPI produce un código HTTP. El cliente traduce ese código al mensaje de la pantalla. Por ejemplo, la revocación bloquea la fila del participante y llama a la función SQL existente; una carga concurrente de muestras debe esperar ese bloqueo y luego volver a comprobar el consentimiento.

Cuando la conexión falla justo después de guardar un turno, el navegador puede perder la respuesta aunque PostgreSQL haya confirmado la escritura. Por eso cada intervención del frontend lleva una clave de envío. Al reintentar, el servidor encuentra la clave bajo el bloqueo de la sesión y devuelve el ID anterior. Puede comprobar que la exportación conserva un único turno.

## Estructura y función de cada cambio

Distribución de las carpetas principales:

```text
Copilito-Para-La-Inclusion/
├── backend/
│   ├── database/           Copilito.sql y 001_api.sql
│   ├── main.py             API, CORS y rutas persistentes
│   ├── datos.py            Acceso a PostgreSQL y autenticación
│   ├── esquemas.py         Contratos Pydantic
│   ├── motores.py          Inferencia y voz locales
│   ├── crear_admin.py      Alta administrativa
│   ├── iniciar-local.ps1   Arranque en este equipo
│   └── verificar_integracion.py
├── frontend/
│   ├── public/             Logo, galería y recursos de MediaPipe
│   ├── scripts/            Preparación del worker y WASM
│   ├── src/api/            Cliente HTTP y adaptador de demostración
│   ├── src/features/       Consentimiento, dispositivos, turnos, cierre, SUS y administración
│   ├── src/app/            Estado y rutas de React
│   └── vite.config.ts      Proxy en desarrollo
└── docs/                   Diseño del proyecto y esta guía
```

| Archivo desde la raíz | Función |
|---|---|
| backend/main.py | Aplicación FastAPI, CORS por origen, rutas, consultas parametrizadas, transacciones, catálogo y respuestas HTTP. |
| backend/esquemas.py | Modelos de entrada y salida para Swagger y validación de vectores, turnos, respuestas SUS, métricas y dimensiones de la matriz. |
| backend/datos.py | Conexiones a la base indicada por DATABASE_URL, verificación de tokens y lectura o bloqueo de sesiones. |
| backend/motores.py | Carga local de ONNX Runtime para clasificación y de faster-whisper para transcribir. Las dependencias de IA se importan cuando se utiliza cada motor. |
| backend/database/Copilito.sql | Volcado original de PostgreSQL 17, con cinco señas registradas. |
| backend/database/001_api.sql | Migración transaccional que conserva las muestras antiguas de 63 valores, admite 126, amplía el código de participante, añade claves de reintento y guarda huellas de tokens con vencimiento. Permite iniciar sesiones sin una CNN registrada. |
| backend/crear_admin.py | Alta interactiva de un administrador. Usa una contraseña introducida en privado y almacena un hash bcrypt mediante pgcrypto. |
| backend/iniciar-local.ps1 | Arranque de la instalación local preparada y alta interactiva de usuarios. |
| backend/requirements.txt, backend/requirements-voz.txt y backend/.gitignore | Dependencias de la API y exclusión del entorno virtual, cachés y archivos locales de configuración. |
| backend/verificar_integracion.py | Prueba de ida y vuelta sobre una base de ensayo mediante HTTP y el proxy real de Vite. |
| frontend/vite.config.ts | Proxy de desarrollo desde /api/v1 hacia 127.0.0.1:8000. |
| frontend/.env.example y .env.local local | Selección de HTTP real. El segundo archivo está excluido de Git. |
| frontend/src/api/{tipos,cliente}.ts | Contrato de sesión y SUS, identificador estable de reintento para cada intervención y errores de disponibilidad de los motores. |
| frontend/src/features/dispositivos/Preparacion.tsx | Envía el código de consentimiento al comenzar una sesión. |
| frontend/src/features/sus/CuestionarioSus.tsx | Incluye el UUID de la sesión al enviar las diez respuestas. |
| frontend/src/i18n/textos.ts | Mensajes explicativos si falta sesión o un motor está indisponible. |
| frontend/src/app/cierre.test.tsx y frontend/src/api/api.test.ts | Verifican el contrato de sesión y el UUID enviado en el SUS. |
| frontend/README.md | Referencia al contrato y a esta guía. |

Las carpetas `frontend/public`, `frontend/scripts`, las demás funcionalidades de `frontend/src` y los documentos de actas, arquitectura, requisitos y wireframes conservan sus funciones.

## Arranque en la copia preparada del Escritorio

Ya se creó una base de desarrollo llamada `copiloto_dev` en un clúster independiente de PostgreSQL 17, con acceso local en el puerto 55439, el esquema migrado y el catálogo original. Las comprobaciones automatizadas usaron otro clúster en el puerto 55489. Los datos y modelos de desarrollo viven en la carpeta de trabajo de Codex, fuera de OneDrive y del repositorio. Mantenga esa carpeta si desea conservar el entorno preparado.

Desde dos terminales PowerShell abiertas en la raíz del repositorio:

```powershell
# Terminal A. Primera vez, si desea entrar al panel de administración
.\backend\iniciar-local.ps1 -CrearAdmin

# Terminal A. Arranque normal
.\backend\iniciar-local.ps1
```

```powershell
# Terminal B
cd frontend
npm.cmd run dev
```

La primera orden le permite elegir su usuario y contraseña de administrador. Para probar consentimiento y voz basta con el arranque normal. El script utiliza `backend/.venv` y `backend/.local.json`, excluidos de Git. El JSON guarda rutas y puerto. El script descifra con la cuenta actual de Windows la contraseña del rol necesario para el proceso. PostgreSQL sigue activo cuando se detiene Uvicorn. Para apagar esa base de desarrollo, ejecute `.\backend\iniciar-local.ps1 -DetenerBase` desde la raíz.

Para preparar este equipo se usó `initdb` con autenticación SCRAM, `createdb`, `psql -v ON_ERROR_STOP=1`, un Python independiente para crear el entorno con `-m venv`, y `pip install -r requirements.txt -r requirements-voz.txt`. Se descargó Whisper tiny multilingüe para ejecutar la voz en local. En otros equipos puede usar la instalación estándar que sigue.

## Instalación inicial en Windows

Use PostgreSQL 17 con pgcrypto, Python 3.11 o superior con pip y venv, y la versión de Node admitida por el frontend. Estos ejemplos son de PowerShell. Abra las terminales en la raíz del repositorio.

**1. Base de desarrollo.** Si es una instalación nueva, cree el rol y una base vacía. El volcado usa los nombres de rol `postgres` y `lsc_app`. Si el rol de su equipo ya existe, use sus credenciales y omita su creación. Los comandos SQL se ejecutan dentro de psql. El comando de contraseña la pide de forma interactiva.

```powershell
$pg = 'C:\Program Files\PostgreSQL\17\bin'
& "$pg\psql.exe" -U postgres -d postgres
```

```sql
CREATE ROLE lsc_app LOGIN;
\password lsc_app
CREATE DATABASE copiloto_dev;
\q
```

Desde la raíz, restaure el volcado **solo en la base nueva** y aplique la migración una vez. En una base existente que ya tiene el esquema original, haga una copia de seguridad y aplique únicamente la migración tras revisarla con el propietario.

```powershell
& "$pg\psql.exe" -X -v ON_ERROR_STOP=1 -U postgres -d copiloto_dev -f backend/database/Copilito.sql
& "$pg\psql.exe" -X -v ON_ERROR_STOP=1 -U postgres -d copiloto_dev -f backend/database/001_api.sql
```

**2. Preparar Python** desde la raíz.

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Si usa un ejecutable Python completo sin el lanzador `py`, sustituya `py -3` por su ruta. Las dependencias base son FastAPI, Pydantic 2, Uvicorn, psycopg con binarios y python-multipart. Se declara Pydantic explícitamente porque los esquemas usan su API de la versión 2.

**3. Alta administrativa** desde `backend`. Configure temporalmente una conexión con permisos de propietario. Puede guardar las contraseñas de PostgreSQL en el archivo estándar de contraseñas de libpq o introducir la cadena de conexión mediante un prompt. En una URL, codifique los caracteres especiales de usuario o contraseña.

```powershell
$env:DATABASE_URL = Read-Host 'URL PostgreSQL del propietario' -MaskInput
.\.venv\Scripts\python.exe crear_admin.py
```

`-MaskInput` corresponde a PowerShell 7.1+. Ejemplo de formato de conexión: `postgresql://usuario:clave_codificada@127.0.0.1:5432/copiloto_dev`. El login de la web usa el usuario **administrativo de Copiloto** creado por el script. El proceso HTTP usa el rol **lsc_app de PostgreSQL**. Los usuarios de demostración pertenecen exclusivamente al modo mock.

## Arranque cotidiano en dos terminales

**Terminal A**, desde la raíz:

```powershell
cd backend
$env:DATABASE_URL = Read-Host 'URL PostgreSQL de lsc_app' -MaskInput
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --no-access-log
```

**Terminal B**, también desde la raíz:

```powershell
cd frontend
# Solo en una instalación nueva o si cambió el lockfile
npm.cmd ci
npm.cmd run dev
```

Abra la URL que imprime Vite. Se configuró `VITE_USE_MOCK=false` en la copia de trabajo y en el ejemplo. Si ya tiene un `.env.local` de otra instalación, revise este valor y `VITE_API_BASE_URL=/api/v1`. Reinicie Vite después de cambiarlo. La cadena de PostgreSQL pertenece al proceso Python. Las variables `VITE_*` se exponen al navegador.

El proxy hace que React use su mismo origen durante el desarrollo. Para acceso directo desde otro origen, configure `CORS_ORIGINS` en Python como lista separada por comas de orígenes completos autorizados. Por defecto admite localhost y 127.0.0.1 en el puerto 5173. En producción enrute `/api/v1` al servidor ASGI desde el servidor HTTPS que entregue el frontend compilado.

## Contrato de la API

Prefijo común: `/api/v1`. Los objetos se envían como JSON salvo el audio. Las cuatro operaciones señaladas con “admin” requieren un encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Entrada | Resultado |
|---|---|---|---|
| POST | /consents | alcance, version_formato | 201, código de participante |
| POST | /consents/{codigo}/revoke | Código en ruta | Constancia y número de muestras eliminadas por la función SQL |
| POST | /sessions | id_participante, código vigente | 201, session_id e inicio con zona horaria |
| POST | /predict | session_id, vector de 126 números finitos | Glosa en el campo seña, confianza y aceptada según umbral |
| POST | /stt | Archivo multipart audio, máximo 10 MiB, WebM/Ogg/MP4/WAV | Texto transcrito en español |
| POST | /translate | texto | Lista ordenada de palabras o expresiones con glosa y ruta de animación o marca fuera_de_vocabulario |
| POST | /sessions/{sid}/interventions | interlocutor, tipo, texto, confianza, confirmada, latencia_ms, clave_envio opcional | 201, ID del turno. El cliente reutiliza su clave en reintentos |
| PATCH | /sessions/{sid}/end | UUID en ruta | duracion_ms. Un segundo cierre devuelve la misma duración |
| GET | /sessions/{sid}/export | UUID en ruta | text/plain con los turnos en orden |
| POST | /sus | session_id y diez enteros entre 1 y 5 | Puntaje 0–100. Una encuesta por sesión finalizada |
| POST | /auth/login | usuario, contraseña | Token aleatorio válido por una hora. La base conserva su huella |
| GET | /signs | admin | Catálogo activo con id, glosa, descripción y animación |
| POST | /samples | admin, id_sena, id_participante, vector | 201, ID de muestra. PostgreSQL comprueba el consentimiento |
| GET | /model | admin | Versión vigente con métricas, matriz y umbral. 404 si no hay versión |
| PUT | /model | admin, version, métricas en 0–1, matriz_confusion, umbral | Métricas registradas. La ruta física del artefacto se resuelve en el servidor |

Pydantic devuelve 422 por cuerpos o UUID inválidos. Una credencial inválida o vencida produce 401. Un participante sin consentimiento recibe 403 al intentar iniciar una sesión o cargar muestras. Se usa 404 para recursos desconocidos, 409 ante conflictos de estado, 413 para audio demasiado grande, 415 para tipos de audio incompatibles y 503 para dependencias no disponibles. Las respuestas de errores de validación omiten el valor enviado.

## Cómo comprobarlo

1. Abra [Swagger UI](http://127.0.0.1:8000/docs). En `POST /api/v1/translate`, pulse **Try it out**, use `{"texto":"Buenos días, gracias"}` y pulse **Execute**. Con el catálogo del volcado, debe obtener dos entradas, **BUENOS DÍAS** y **GRACIAS**. La coincidencia usa primero la expresión más larga. Esta operación es una búsqueda de vocabulario, no una traducción gramatical libre.
2. En el frontend acepte el consentimiento. En la pestaña Red del navegador debe aparecer `POST /api/v1/consents` con estado 201. Copie el código. Acceda al panel con su administrador y compruebe que aparece el catálogo. Para probar en Swagger una ruta protegida, inicie sesión por HTTP y pegue el token en **Authorize**.
3. En una base exclusiva de ensayo, agregue una muestra, retire el consentimiento y compruebe la cantidad eliminada. El script siguiente automatiza esto, así como cierre, exportación, SUS, validación y permisos. Crea registros reales de prueba y espera el catálogo original y ausencia de CNN vigente. El vector de ceros sirve para probar almacenamiento; no evalúa reconocimiento.
4. Desde `backend`, con los dos servidores en marcha y un administrador de ensayo:

```powershell
$env:TEST_ADMIN = Read-Host 'Administrador de ensayo'
$env:TEST_CLAVE = Read-Host 'Contraseña de ensayo' -MaskInput
.\.venv\Scripts\python.exe verificar_integracion.py --base http://127.0.0.1:5173/api/v1 --swagger http://127.0.0.1:8000
```

Si define `TEST_WAV` con la ruta a un WAV de prueba que contenga habla y configura `COPILOTO_STT` en el backend, la misma verificación sube el archivo y comprueba la transcripción real. En esta máquina se usó una frase sintetizada como entrada de prueba, con Whisper multilingüe tiny. El resultado reconoció el saludo y mostró errores en otras palabras. Esto verifica el transporte y la inferencia, no la precisión en el piloto.

Desde `frontend`, ejecute `npm.cmd run build`, `npm.cmd test` y `npm.cmd run lint`. Vitest usa datos de prueba. La prueba HTTP usa PostgreSQL y el frontend real. Durante la implementación se inicializó un clúster PostgreSQL 17 independiente con SCRAM, se restauró el volcado y se probó con el rol limitado lsc_app. Chromium también envió un consentimiento desde React, abrió el catálogo con autenticación y ejecutó una petición desde Swagger UI.

## Motores y límites

- **Clasificador de LSC.** Se necesita un modelo entrenado por el equipo y etiquetas en su orden exacto. Instale `onnxruntime` en el entorno Python cuando disponga de él. Defina `COPILOTO_MODELOS` como ruta absoluta a una carpeta que contenga `<version>/modelo.onnx` y `<version>/etiquetas.json`. Este último es una lista JSON de glosas. El adaptador espera una entrada float32 de forma [1,126] y una primera salida [1,número de clases] de probabilidades. Mantenga el orden de manos y la normalización de `frontend/src/lib/vector`. Una sesión toma la versión vigente al iniciarse. El panel registra métricas suministradas por el equipo; no entrena el modelo ni mide su exactitud. Hace falta validar inferencia y exactitud con señantes reales.
- **Voz.** Desde `backend`, instale `.\.venv\Scripts\python.exe -m pip install -r requirements-voz.txt` para habilitar STT. El archivo fija faster-whisper y una versión compatible de PyAV. Defina `COPILOTO_STT` como ruta absoluta de un modelo Whisper multilingüe local en formato CTranslate2 con sus archivos de configuración y tokenizer. El motor abre el audio del formulario y lo procesa en CPU. El endpoint de Copiloto no reenvía el audio a un servicio externo. La disponibilidad y calidad dependen del equipo, formato y modelo elegido. [Modelo multilingüe de referencia](https://huggingface.co/Systran/faster-whisper-tiny).
- **Animaciones.** El catálogo del volcado incluye rutas. El equipo debe suministrar y validar los archivos correspondientes en `frontend/public/avatar/`. La interfaz mantiene su representación de respaldo cuando faltan recursos.
- **Identidad y despliegue.** El prototipo utiliza el código aleatorio de participante para revocar y el UUID de sesión para acceder a operaciones de conversación. Los identificadores y URLs de sesión requieren confidencialidad. Para uso multiusuario en producción, vincule sesiones a una identidad autenticada, configure límites de solicitudes y tamaño de carga en el proxy antes de analizar multipart, TLS y tratamiento de registros. Los chequeos de tamaño del endpoint ocurren después de recibir el archivo. Los códigos históricos predecibles del volcado merecen revisión antes de exponer un despliegue previo.
- **Migración.** Las muestras históricas de 63 componentes siguen en la base con su longitud original. Su conversión requiere conocer el lado de la mano y el preprocesamiento de origen. La migración no inventa la mitad faltante. La tabla guarda las muestras de entrenamiento. Revocar elimina esas muestras conforme a la función original; los turnos se guardan por sesión.


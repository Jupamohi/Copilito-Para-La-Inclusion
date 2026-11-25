# Copilito para la Inclusión · Frontend

Cliente web del prototipo de conversación por turnos en Lengua de Señas Colombiana. Incluye consentimiento, preparación de cámara, ambos turnos de conversación, cierre con historial y exportación, cuestionario piloto, revocación y administración del prototipo.

## Ejecutar localmente

Use Node.js 22.12 o posterior de la serie 22. Desde la raíz del repositorio, en PowerShell:

```powershell
Set-Location frontend
if (!(Test-Path .env.local)) {
    Copy-Item .env.example .env.local
}
npm.cmd ci
npm.cmd run dev
```

Abra la URL que imprima Vite. Para habilitar el cuestionario en la demo, configure `VITE_PILOT_MODE=true` en `.env.local` y reinicie Vite. Para verificar el código:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
```

## Archivos locales de MediaPipe

El ZIP incluye el modelo `public/mediapipe/hand_landmarker.task`. `npm run dev` y `npm run build` preparan el worker y copian el WASM desde `node_modules` mediante `npm run assets:mediapipe`. En el navegador, el worker, el WASM y el modelo se cargan desde el mismo servidor que la aplicación. [Hand Landmarker de Google AI Edge](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker#models)

Para reponer el modelo y copiar los archivos a mano desde `frontend/` después de `npm ci`, ejecute en PowerShell:

```powershell
New-Item -ItemType Directory -Force public/mediapipe/wasm | Out-Null
Copy-Item -Path 'node_modules/@mediapipe/tasks-vision/wasm/*' -Destination 'public/mediapipe/wasm/' -Recurse -Force
curl.exe -fL 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' -o 'public/mediapipe/hand_landmarker.task'
npm.cmd run assets:mediapipe
```

La cámara requiere `localhost` o HTTPS. La prueba de dispositivos procesa los fotogramas en un worker con un fotograma en vuelo. La vista previa se refleja mediante CSS y el worker recibe la orientación original. Los fotogramas se descartan tras analizarlos. P-02 usa únicamente el conteo de manos y la estimación de luz, y libera la cámara al salir.

## Configuración

| Variable            | Valor de ejemplo | Comportamiento                                                                                                      |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `VITE_USE_MOCK`     | `true`           | Activa el adaptador en memoria. Con `false` o sin definir se usa HTTP.                                              |
| `VITE_API_BASE_URL` | `/api/v1`        | Prefijo del servidor HTTP. Puede ser una URL absoluta. Una URL de otro origen requiere CORS configurado en FastAPI. |
| `VITE_PILOT_MODE`   | `false`          | Cambie a `true` para habilitar `/sus`.                                                                              |

Reinicie Vite al cambiar `.env.local`. Si usa `/api/v1`, sirva la API en el mismo origen o configure un proxy inverso. Al servir `dist` en producción, configure el servidor para devolver `index.html` en las rutas de React Router y enrutar `/api/v1` a la API.

## Modo mock y pruebas

El mock implementa las quince operaciones del borrador, con cinco señas iniciales, ambos resultados de confianza, transcripción de ejemplo, traducción con palabras fuera de vocabulario y credenciales de prueba `admin` / `copilito-demo`. Conserva el estado de prueba únicamente en memoria. Cada recarga reinicia ese estado.

Vitest comprueba el vector de dos manos, la grabación, las transiciones de pantalla, el cliente HTTP, el mock, la cola del avatar y los formularios. `vitest-axe` revisa las pantallas P-01 a P-10 en jsdom. La verificación en Chromium cubre contraste, navegación por teclado, reflujo con texto al 200 %, ambos turnos con el sonido apagado, descarga real del `.txt`, SUS y administración. Se usaron fuentes de cámara y micrófono de prueba. La validación perceptual con usuarios y la prueba con FastAPI y dispositivos del piloto quedan pendientes.

Para comprobar una compilación de producción en local, ejecute `npm.cmd run build` seguido de `npm.cmd run preview`. Los valores `VITE_*` se incorporan al compilar. Para activar el modo HTTP en producción, configure `VITE_USE_MOCK=false`, indique la URL de FastAPI si sirve en otro origen y vuelva a compilar. Vite advierte sobre el tamaño del módulo 3D, que se carga al abrir una traducción o vista previa.

Para comprobar las guardas, abra `/preparacion` y `/conversacion` sin consentimiento, y `/admin/catalogo` sin token. Deben redirigir a bienvenida o acceso, respectivamente. Pruebe `/sus` con los dos valores de `VITE_PILOT_MODE`. Al recorrer la bienvenida con teclado, el enlace «Ir al contenido principal» debe ser visible al recibir foco. Revise también el zoom al 200 % en el navegador.

Para probar P-01 y P-02, elija primero «No aceptar» y luego «Volver a leer». Acepte y compruebe el identificador antes de abrir la preparación. Bloquee la cámara para comprobar el aviso, habilite el permiso en el navegador y pulse «Reintentar». Compruebe los estados de cero, una y dos manos, la desactivación del inicio sin luz suficiente y el selector si hay varias cámaras. Con una mano visible y luz suficiente, pulse «Iniciar conversación».

En P-03A, muestre las manos y compruebe que el dibujo coincida con la vista previa. Pulse «Reconocer seña». En el mock, repita una captura si aparece el aviso de rechazo. Cuando aparezca una sugerencia, pruebe primero «Descartar» y en el siguiente intento «Confirmar y hablar». Compruebe el tiempo de respuesta, la glosa y el texto en pantalla con el sonido apagado. El navegador requiere una voz local en español para la síntesis. Se prefiere `es-CO` cuando está disponible.

En modo HTTP, inspeccione la petición `/predict` en la pestaña Red del navegador. Debe tener `session_id` y `vector`, con 126 números finitos y sin contenido de cámara. El tiempo de respuesta se mide desde la petición hasta que se recibe la respuesta. El objetivo es menos de dos segundos y se comprobará con la API real.

Para probar P-03B, confirme una seña y use «Cambiar al turno de voz». Pulse «Hablar», conceda permiso al micrófono y luego pulse «Detener». Compruebe que aparece la transcripción antes de «Confirmar transcripción». Pruebe «Repetir grabación» para volver al micrófono. Tras confirmar, revise el orden de la secuencia, las palabras fuera de vocabulario y los controles de pausa, velocidad y repetición. En la vista del avatar, pruebe los controles visibles y el teclado. Active la preferencia de movimiento reducido para comprobar el avance paso a paso. Al volver al turno de señas, la intervención de voz confirmada se envía junto con su latencia.

Para probar el cierre, confirme intervenciones de ambas personas y abra «Ir al cierre de sesión». Pulse «Finalizar sesión» para enviar las intervenciones pendientes y después cerrar la sesión. Revise fecha, hora de Colombia, duración e historial. «Exportar texto» descarga el `.txt` que devuelve la API. «Nueva sesión» limpia el historial de la interfaz y vuelve a la bienvenida con el consentimiento actual.

En modo piloto, abra «Responder cuestionario» desde el cierre. Seleccione un valor de 1 a 5 en cada uno de los diez ítems. Compruebe que se muestra un mensaje de confirmación tras enviar. Para probar la revocación, abra «Retirar mi consentimiento» en la bienvenida, escriba el identificador obtenido al aceptar y marque la confirmación. El servidor devuelve la constancia y el número de muestras eliminadas. En el mock, realice la prueba dentro de la misma recarga para conservar el identificador de prueba.

## Administración del prototipo

1. Para probar con el mock, acepte el consentimiento y guarde el identificador antes de abrir «Soy administrador». Inicie sesión con `admin` y `copilito-demo`. Las peticiones administrativas usan el token en memoria. «Cerrar sesión», una recarga o una respuesta 401 de un recurso protegido cierran el acceso en el cliente.
2. En «Catálogo de señas», revise glosa y descripción y abra «Ver animación». La vista usa el mismo `Avatar3D` que el turno de voz. Al cambiar de seña o salir se desmonta la vista anterior.
3. En «Carga de muestras», elija la seña y escriba el identificador del participante. El archivo JSON puede ser el arreglo de 126 números o un objeto con un campo `vector` que contenga ese arreglo. La petición envía el vector y los identificadores. Pruebe un identificador sin consentimiento y luego el identificador registrado en la misma recarga.
4. En «Modelo y métricas», revise la versión vigente, la matriz y el umbral. Abra «Sustituir versión» o «Registrar versión» si falta el modelo. Introduzca métricas de 0 a 100. El cliente las convierte a la escala de 0 a 1 para la API. La matriz usa `etiquetas` y `valores`, por ejemplo `{"etiquetas":["HOLA","AYUDA"],"valores":[[5,2],[1,6]]}`.

## Animaciones locales del avatar

El avatar genérico sirve para probar los flujos. Sus gestos son de demostración. El módulo 3D se carga al mostrar una traducción o abrir una vista previa. `Avatar3D` mantiene una sola escena visible en la conversación o el catálogo. Con WebGL deshabilitado, la frase y la secuencia siguen disponibles en texto y ofrecen los mismos controles de reproducción de la secuencia.

Los activos se sirven desde `public/avatar/`. `animacion` puede indicar una ruta relativa a esa carpeta. Para glTF o GLB, use un clip incorporado, como `saludo.glb#Saludo`. Sin fragmento se usa el primer clip. Coloque el modelo con la cara hacia +Z y encuadre torso y manos en la escala del avatar. Los recursos externos del glTF deben residir en la misma carpeta pública o estar incorporados al archivo.

El formato JSON provisional usa un objeto con `fotogramas`. Cada fotograma contiene `tiempo_ms` creciente y `rotaciones`, un mapa de nombre de articulación a un arreglo `[x,y,z]` en radianes locales. Las articulaciones del rig provisional son `LeftShoulder`, `LeftElbow`, `LeftWrist` y sus equivalentes `Right`. Los dedos usan `Thumb`, `Index`, `Middle`, `Ring` y `Pinky` con prefijo de lado y segmentos `1` a `3`, por ejemplo `LeftIndex1`. En GLB, los nombres de los huesos deben corresponder a los tracks del clip; queda pendiente acordar el mapa definitivo con el equipo.

## Supuestos y pendientes

- **Consentimiento del piloto.** El texto, el alcance `uso_del_prototipo` y la versión `1` del formulario son provisionales. Falta validarlos con el equipo. La apertura de P-03 requiere consentimiento y una sesión iniciada. Si vuelve a P-02 en la misma sesión, puede verificar otra cámara y regresar sin crear una segunda sesión.
- **Preparación de cámara.** La luz se estima con un umbral provisional de luminancia media de 55 sobre 255. El worker intenta leer a 8 fotogramas por segundo y omite lecturas si aún está analizando una. Valide el umbral, la frecuencia, los tiempos de espera y los mensajes de dispositivos en los equipos del piloto.
- **Cambio de contrato en `/predict`.** La CNN debe entrenarse/adaptarse para entrada de 126 valores con este orden: 63 de la mano izquierda real y 63 de la derecha, con ceros en el bloque ausente. En `src/lib/vector`, cada punto es relativo a la muñeca y se divide por la mayor distancia euclidiana a esta dentro de la mano. El orden interno sigue los 21 puntos de MediaPipe en XYZ. Falta validar la escala y el convenio de coordenadas con el entrenamiento de la CNN. La posición relativa entre manos queda desactivada. La entrada al worker conserva su orientación original, así que `Left` y `Right` corresponden a la lateralidad que devuelve Hand Landmarker para esa orientación. Si una integración espeja el fotograma antes de detectarlo, `adaptarManos` puede invertir lado y coordenada x. El umbral inicial del mock es 0,80 y la interfaz respeta el campo `aceptada`.
- **Esquemas HTTP.** Confirmar con backend los nombres y formas de los campos de consentimiento, revocación, sesiones, predicción, traducción, catálogo, muestras, modelo y SUS. El borrador se implementa en `src/api/` con `version_formato`, `inicio` en ISO 8601, `duracion_ms`, `confirmada`, `latencia_ms`, y `animacion` como URL o `null`. Se supone que «seña» contiene la glosa y que `texto` es opcional. `/sessions` comienza con un POST sin cuerpo y el envío SUS lleva las diez respuestas. Confirmar si alguno requiere asociar el identificador correspondiente en el cuerpo. El esquema SQL del ZIP requiere vincular el SUS a una sesión y no fija el contrato HTTP.
- **STT y administración.** Confirmar el campo multipart `audio` y los formatos de audio admitidos. Para `/samples` se propone JSON con los identificadores y el vector numérico, en coherencia con la privacidad. Confirmar la estructura del error de consentimiento: el adaptador reconoce provisionalmente HTTP 403 con `detail.code` igual a `CONSENT_REQUIRED`.
- **Token.** Se supone autenticación `Bearer` en los tres recursos de administración. El cliente borra el token en memoria cuando una petición autenticada recibe 401. Falta confirmar si la respuesta de inicio de sesión incluye vencimiento para anticiparlo.
- **Captura e intervenciones.** Se propone un botón de reconocimiento, con una antigüedad máxima de 750 ms desde el último resultado del detector. Las intervenciones confirmadas esperan en memoria hasta cambiar de turno o finalizar. Si el servidor devuelve un error, el botón permite reintentar y conserva los envíos que recibieron acuse. Para una respuesta perdida después de que el servidor guardó la intervención, falta acordar idempotencia con backend. Al salir de conversación se libera el dispositivo y se descartan la captura y las solicitudes sin terminar.
- **Voz y avatar.** La latencia de voz suma el tiempo de `/stt` y `/translate`. Queda por verificar qué formatos admite FastAPI en los navegadores del piloto, validar clips y poses con el equipo de LSC y aprobar los mensajes marcados con `TODO(supuesto)`.
- **Cierre, SUS y revocación.** Confirmar que `PATCH /sessions/{id}/end` es reintentable y que un identificador de revocación desconocido devuelve HTTP 404. El historial visual usa las intervenciones de la sesión en memoria. El cuestionario conserva el orden y la polaridad de los diez ítems del SUS, con redacción provisional para el piloto. Definir la versión oficial y cómo asocia FastAPI las respuestas a la sesión. [Adaptación al español de Sevilla-González et al.](https://humanfactors.jmir.org/2020/4/e21161)
- **Muestras en PostgreSQL.** El SQL del ZIP define `muestra.vector63` y exige 63 posiciones. El JSON provisional de `/samples` envía 126 valores en el convenio de `/predict`. Coordinar con backend la migración de la columna y su restricción, la resolución del identificador visible del participante y el error de consentimiento vigente.
- **Versión del modelo.** Se interpreta HTTP 404 de `GET /model` como ausencia de versión. La matriz usa filas de clases reales y columnas de clases predichas. El SQL requiere `version_modelo.ruta_artefacto`; el borrador de `PUT /model` deja pendiente cómo asignarla. Confirmar esos puntos y la forma de la respuesta con backend.

export const textos = {
  titulo: 'Copilito para la Inclusión',
  saltar: 'Ir al contenido principal',
  inicio: 'Volver al inicio',
  bienvenida: 'Bienvenida y consentimiento',
  preparacion: 'Preparación de dispositivos',
  conversacion: 'Conversación',
  cierre: 'Cierre de sesión',
  sus: 'Cuestionario de usabilidad',
  revocar: 'Retirar mi consentimiento',
  admin: 'Soy administrador',
  acceso: 'Acceso del administrador',
  catalogo: 'Catálogo de señas',
  muestras: 'Carga de muestras',
  modelo: 'Modelo y métricas',
  paginaAusente: 'Página no encontrada',
  privacidadManos: 'Solo se envían puntos de las manos, no video',
  // TODO(supuesto): revisar con el equipo la redacción del formato oficial de consentimiento.
  consentimiento: {
    introduccion:
      'Use el prototipo para conversar por turnos en Lengua de Señas Colombiana y en español. Para continuar, lea cómo se usan los datos y acepte el consentimiento.',
    audio:
      'Cuando use el turno de voz, la grabación se enviará al servidor para transcribirla y se descartará del navegador.',
    aceptacion: 'Acepto el uso de mis datos para participar en el prototipo.',
    aceptar: 'Aceptar y continuar',
    noAceptar: 'No aceptar',
    guardando: 'Guardando el consentimiento…',
    guardado: 'Consentimiento registrado',
    identificador: 'Su identificador de participante',
    guardeIdentificador:
      'Guarde este identificador. Lo necesitará si decide retirar su consentimiento.',
    irPreparacion: 'Preparar dispositivos',
    rechazado: 'sin consentimiento no se puede usar la cámara',
    volverALeer: 'Volver a leer',
  },
  dispositivos: {
    denegada:
      'No pudimos usar su cámara porque el permiso está bloqueado. Habilítelo en el candado de la barra de direcciones y pulse Reintentar.',
    perdida:
      'Se perdió la conexión con la cámara. Su conversación sigue guardada. Revise que la cámara esté conectada y pulse Reintentar.',
    manoNoDetectada: 'No vemos su mano. Acérquela a la cámara y mejore la luz.',
    // TODO(supuesto): revisar los nuevos mensajes de preparación durante el piloto.
    instrucciones:
      'Ubíquese frente a la cámara y coloque al menos una mano completa dentro del cuadro.',
    elegirCamara: 'Cámara',
    camaraSinNombre: (indice: number) => `Cámara ${indice}`,
    vistaPrevia: 'Vista previa de su cámara',
    solicitando: 'Permita el acceso a su cámara para continuar.',
    calibrando: 'Preparando la detección de manos…',
    conteos: [
      'No detectamos manos.',
      'Detectamos una mano.',
      'Detectamos dos manos.',
    ],
    luzInsuficiente:
      'Hay poca luz. Ilumine sus manos y vuelva a colocarlas dentro del cuadro.',
    sinCamara:
      'No encontramos una cámara disponible. Conecte una o elija otra y pulse Reintentar.',
    camaraNoDisponible:
      'No pudimos iniciar la cámara. Use una conexión segura y revise que la cámara esté disponible. Luego pulse Reintentar.',
    detectorNoDisponible:
      'No pudimos iniciar la detección de manos. Pulse Reintentar. Si el problema continúa, pruebe con otro navegador.',
    reintentar: 'Reintentar',
    iniciarSesion: 'Iniciar conversación',
    iniciandoSesion: 'Iniciando conversación…',
    volverSesion: 'Volver a la conversación',
  },
  sena: {
    noReconocida:
      'No pudimos reconocer la seña. Repítala con la mano completa dentro del cuadro.',
    // TODO(supuesto): validar el control de captura y los nuevos mensajes con el equipo del piloto.
    turno: 'Turno de señas',
    captura: 'Cámara',
    instrucciones:
      'Haga la seña con las manos dentro del cuadro y pulse Reconocer seña.',
    volverPreparacion: 'Volver a preparar los dispositivos',
    resultado: 'Resultado de la seña',
    reconocer: 'Reconocer seña',
    analizando: 'Analizando la seña…',
    sinCaptura:
      'No pudimos leer los puntos de sus manos. Colóquelas dentro del cuadro y pulse Reintentar.',
    verifique: 'Verifique la seña',
    confirmada: 'Seña confirmada',
    glosa: 'Glosa',
    texto: 'Texto en español',
    confianza: 'Confianza',
    latencia: (milisegundos: number) =>
      `Tiempo de respuesta: ${milisegundos} ms`,
    confirmar: 'Confirmar y hablar',
    descartar: 'Descartar',
    voz: {
      preparando: 'Preparando la voz…',
      reproduciendo: 'Reproduciendo la voz.',
      terminada: 'La reproducción de voz terminó.',
      noDisponible:
        'No hay una voz local en español disponible. Lea el texto en pantalla.',
      error: 'No pudimos reproducir la voz. Lea el texto en pantalla.',
    },
  },
  // TODO(supuesto): validar la redacción de los mensajes nuevos de voz y avatar durante el piloto.
  turnos: {
    pasarAVoz: 'Cambiar al turno de voz',
    pasarASenas: 'Cambiar al turno de señas',
    guardando: 'Guardando la intervención antes de cambiar de turno…',
    reintentar: 'Reintentar cambio de turno',
    irAlCierre: 'Ir al cierre de sesión',
  },
  // TODO(supuesto): revisar textos, formato del consentimiento y versión del SUS con el equipo del piloto.
  resumen: {
    sinSesion: 'Inicie una sesión para consultar el resumen y el historial.',
    datos: 'Datos de la sesión',
    finalizada: 'Sesión finalizada',
    fecha: 'Fecha de inicio',
    hora: 'Hora de inicio en Colombia',
    duracion: 'Duración',
    duracionPendiente: 'Se calcula al finalizar.',
    datoNoDisponible: 'No disponible',
    menosDeUnSegundo: 'Menos de un segundo',
    historial: 'Historial de la conversación',
    historialVacio: 'Todavía no hay intervenciones confirmadas.',
    interlocutores: { sordo: 'Persona sorda', oyente: 'Persona oyente' },
    finalizar: 'Finalizar sesión',
    finalizando: 'Guardando las intervenciones y finalizando la sesión…',
    reintentarCierre: 'Reintentar cierre',
    volverConversacion: 'Volver a la conversación',
    exportar: 'Exportar texto',
    exportando: 'Preparando la descarga de texto…',
    descargaLista: 'Se inició la descarga del historial.',
    reintentarExportacion: 'Reintentar exportación',
    responder: 'Responder cuestionario',
    nuevaSesion: 'Nueva sesión',
  },
  cuestionario: {
    escala:
      'Indique su grado de acuerdo con cada afirmación. Use 1 para «Totalmente en desacuerdo» y 5 para «Totalmente de acuerdo».',
    items: [
      'Me gustaría usar esta herramienta con frecuencia.',
      'La herramienta me pareció más complicada de lo necesario.',
      'Usar esta herramienta me resultó fácil.',
      'Necesitaría ayuda técnica para usar esta herramienta.',
      'Las funciones de la herramienta me parecieron bien integradas.',
      'Encontré demasiadas inconsistencias en esta herramienta.',
      'Creo que la mayoría de las personas aprendería a usarla rápidamente.',
      'Usar esta herramienta me resultó engorroso.',
      'Me sentí con confianza al usar esta herramienta.',
      'Tuve que aprender muchas cosas antes de poder usarla.',
    ],
    enviar: 'Enviar cuestionario',
    enviando: 'Enviando el cuestionario…',
    gracias: 'Gracias por responder el cuestionario.',
    volverCierre: 'Volver al cierre de sesión',
  },
  revocacion: {
    instrucciones:
      'Ingrese el identificador que recibió al aceptar el consentimiento. Le mostraremos la constancia cuando el servidor confirme la revocación.',
    identificador: 'Identificador de participante',
    confirmo:
      'Confirmo que quiero retirar mi consentimiento y que se eliminen mis muestras.',
    retirar: 'Retirar consentimiento',
    retirando: 'Retirando el consentimiento…',
    retirado: 'Consentimiento retirado',
    constancia: 'Constancia de eliminación de muestras',
    muestrasEliminadas: 'Muestras eliminadas',
  },
  voz: {
    turno: 'Turno de voz',
    grabacion: 'Micrófono',
    instrucciones: 'Pulse Hablar, diga su frase y luego pulse Detener.',
    hablar: 'Hablar',
    detener: 'Detener',
    confirmar: 'Confirmar transcripción',
    repetir: 'Repetir grabación',
    transcripcion: 'Revise la transcripción',
    transcripcionConfirmada: 'Transcripción confirmada',
    sinTexto:
      'No pudimos transcribir la grabación. Pulse Reintentar y diga la frase de nuevo.',
    microfonoNoDisponible:
      'No encontramos un micrófono. Conéctelo y pulse Reintentar.',
    microfonoDenegado:
      'El permiso del micrófono está bloqueado. Habilítelo en el candado de la barra de direcciones y pulse Reintentar.',
    grabacionNoDisponible:
      'La grabación de audio no está disponible. Use una conexión segura y pruebe con otro navegador.',
    grabacionFallida:
      'No pudimos grabar el audio. Revise el micrófono y pulse Reintentar.',
    estados: {
      lista: 'El micrófono está apagado.',
      permiso: 'Permita el acceso al micrófono para grabar.',
      grabando: 'Grabando su voz.',
      transcribiendo: 'Transcribiendo la grabación…',
      verificar: 'La transcripción está lista para revisar.',
      traduciendo: 'Preparando la secuencia de señas…',
      traducida: 'La secuencia de señas está disponible.',
      error: 'La solicitud requiere atención.',
    },
  },
  avatar: {
    titulo: 'Traducción a señas',
    lienzo:
      'Avatar 3D para visualizar las señas, con cara, torso y manos en cuadro',
    frase: 'Frase completa:',
    glosa: 'Glosa actual',
    fuera: 'Fuera de vocabulario',
    lista: 'Secuencia completa de la traducción',
    palabraFuera:
      'Esta palabra aún no está en el vocabulario; se muestra destacada.',
    sinSecuencia:
      'La traducción no devolvió una secuencia de señas. Puede leer la frase completa.',
    terminada: 'Terminó la secuencia.',
    sinWebGL:
      'El avatar 3D no está disponible. Puede seguir la secuencia en texto y repetirla.',
    cargando: 'Preparando el avatar 3D…',
    calidadReducida:
      'Reducimos la calidad visual del avatar para mantener la reproducción.',
    demostracion:
      'Gesto genérico de demostración. La glosa está disponible en texto.',
    vista: 'Controles de la vista del avatar',
    teclado:
      'Use las flechas para girar, + o − para acercar o alejar e Inicio para restablecer la vista.',
    repetir: 'Repetir secuencia',
    pausar: 'Pausar',
    continuar: 'Continuar',
    siguiente: 'Siguiente glosa',
    velocidad: 'Velocidad',
    normal: 'Normal',
    lenta: 'Lenta',
    ordenes: {
      izquierda: 'Girar a la izquierda',
      derecha: 'Girar a la derecha',
      acercar: 'Acercar',
      alejar: 'Alejar',
      restablecer: 'Restablecer vista',
    },
  },
  // TODO(supuesto): revisar la redacción de administración con el equipo del piloto.
  administracion: {
    navegacion: 'Administración del prototipo',
    usuario: 'Usuario',
    contrasena: 'Contraseña',
    entrar: 'Iniciar sesión',
    entrando: 'Iniciando sesión…',
    salir: 'Cerrar sesión',
    cargando: 'Cargando datos…',
  },
  catalogoAdmin: {
    ver: 'Ver animación',
    verSena: (glosa: string) => `Ver animación de ${glosa}`,
    vista: (glosa: string) => `Vista previa de ${glosa}`,
    vacio: 'Todavía no hay señas en el catálogo.',
  },
  muestrasAdmin: {
    sena: 'Seña',
    elegir: 'Seleccione una seña',
    participante: 'Identificador de participante',
    archivo: 'Archivo de la muestra',
    formato:
      'Seleccione un archivo JSON con 126 valores normalizados. Los primeros 63 corresponden a la mano izquierda y los siguientes 63 a la derecha.',
    cargar: 'Cargar muestra',
    cargando: 'Cargando muestra…',
    cargada: 'muestra cargada',
    sinSenas:
      'El catálogo está vacío. Agregue una seña en el sistema antes de cargar una muestra.',
  },
  modeloAdmin: {
    vigente: 'Versión vigente',
    version: 'Nombre de la versión',
    metricas: {
      exactitud: 'Exactitud',
      precision: 'Precisión',
      sensibilidad: 'Sensibilidad',
      f1: 'F1',
      umbral: 'Umbral de confianza',
    },
    medida: (nombre: string) => `${nombre} (%)`,
    supera: 'La exactitud supera el 85 %.',
    hasta: 'La exactitud está en 85 % o menos.',
    matriz: 'Matriz de confusión',
    matrizGuia: 'Filas de clases reales y columnas de clases predichas',
    realPredicha: 'Clase real / predicha',
    matrizVacia: 'Aún no hay datos de la matriz de confusión.',
    matrizJson: 'Matriz de confusión en JSON',
    formatoMatriz:
      'Use «etiquetas» para las clases y «valores» para las filas. Debe haber una fila y una columna por clase.',
    sinModelo: 'Aún no hay una versión registrada.',
    registrar: 'Registrar versión',
    sustituir: 'Sustituir versión',
    guardar: 'Guardar versión',
    guardando: 'Guardando versión…',
    guardado: 'Versión guardada.',
    cancelar: 'Cancelar edición',
  },
  api: {
    conexion:
      'Se perdió la conexión. Su conversación sigue guardada. Pulse Reintentar.',
    credenciales:
      'Usuario o contraseña incorrectos. Revíselos e intente de nuevo.',
    muestraSinConsentimiento:
      'No se puede cargar la muestra porque el participante no tiene un consentimiento vigente.',
    // TODO(supuesto): aprobar estos mensajes nuevos de validación y servicio.
    consentimientoNoEncontrado:
      'No encontramos un consentimiento con ese identificador. Revise el código y pulse Reintentar.',
    sesionAdmin: 'Su sesión de administrador venció. Inicie sesión de nuevo.',
    servidor: 'No pudimos completar la solicitud. Intente de nuevo.',
    respuestaInvalida:
      'El servidor devolvió una respuesta inesperada. Intente de nuevo.',
    vectorInvalido:
      'Los puntos de las manos están incompletos. Intente capturarlos de nuevo.',
    audioInvalido: 'No pudimos leer la grabación. Intente grabar de nuevo.',
    susIncompleto:
      'Responda las diez preguntas antes de enviar el cuestionario.',
    archivoMuestraInvalido:
      'El archivo debe ser un JSON con un vector de 126 números finitos. Revíselo y seleccione un archivo válido.',
    muestraIncompleta:
      'Seleccione una seña y un archivo, e indique el identificador de participante.',
    modeloInvalido:
      'Indique el nombre de la versión y compruebe que cada porcentaje esté entre 0 y 100.',
    matrizInvalida:
      'Revise el JSON de la matriz. Use etiquetas distintas y una matriz cuadrada con números no negativos.',
  },
} as const;

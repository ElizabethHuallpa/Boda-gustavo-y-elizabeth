/* ===================== RSVP · CONFIGURACIÓN (editable) =====================
   Lista de invitados: n = nombre completo, p = asistentes autorizados.
   Reemplaza los 3 nombres de prueba por tu lista real. */
const RSVP_CONFIG={
  guests:[
    {n:"Gustavo Antonio",p:3},
    {n:"Orfelinda Avalo",p:1},
    {n:"Carla Arellano",p:2},
    {n:"Fabian Sotelo",p:2},
    {n:"Jairo Lindo",p:2},
    {n:"Luis Ponte",p:2},
    {n:"Miguel Carhuatocto",p:2},
    {n:"Claudia Jimenez",p:2},
    {n:"Akira Yamashiro",p:2},
    {n:"Victoria Anticon",p:1},
    {n:"Rafael Chipana",p:2},
    {n:"Jonathan Medina",p:2},
    {n:"Sonia Arellano",p:2},
    {n:"Clotilde Avalo",p:2},
    {n:"Freddy Avalo",p:2},
    {n:"Luis Medina",p:2},
    {n:Carolina Gamio"",p:2},
    {n:"Ana Avalo",p:2},
    {n:"Jose Boschi",p:2},
    {n:"Ernest Arellano",p:1},
    {n:"Mercedes Arellano",p:1},
    {n:"Mercedes Medina",p:2},
    {n:"Angelo Arellano",p:1},
    {n:"Franz Chipana",p:2},
    {n:"Nolberta Chayña",p:1},
    {n:"Celso Huallpa"",p:1},
    {n:"Ruth Huallpa",p:1},
    {n:"Lourdes Garro",p:3},
    {n:"Petrona Percca Alania",p:1},
    {n:"Gladys Chayña",p:1},
    {n:"Ruben Huamani",p:2},
    {n:"Yulieth Pere",p:2},
    {n:"Liseth Gamio",p:2},
    {n:"Dashiell del Carpio",p:2},
    {n:"Rosa Maria Condezo",p:2},
     {n:"Hivet Mamani",p:2},
     {n:"Luis Romero",p:2},
     {n:"Dann Arias Berrocal",p:1},
     {n:"Stefany Yarasca",p:1},
     {n:"Guisell Caballero",p:2},
     {n:"Eric Peña",p:2},
     {n:"Eduardo Mollinedo",p:2},
     {n:"Alberto Percca Alania",p:2},
     {n:"Rene Chayña",p:2},
     {n:"Cesar Chayña",p:2},
     {n:"Abdon Chayña",p:2},
     {n:"Eudocia Chayña",p:2},
     {n:"Perci Chayña",p:2},
     {n:"Andre Apaza",p:2},
     {n:"Reymundo Hualpa",p:2},
     {n:"Leonarda Mulluni",p:2},
     {n:"Yossy Quintanilla",p:2},
     {n:"",p:2},
     {n:"",p:2},
     {n:"",p:2},
]
  ],
  unlistedPasses:1,  // asistentes permitidos si el nombre no está en la lista
  seatsCap:10        // tope de seguridad
};

/**
 * RSVP · Boda Elizabeth y Gustavo  —  Backend en Google Apps Script (versión 2)
 *
 * QUÉ HACE
 *  1. Si tu hoja de cálculo tiene una pestaña "Invitados", busca al invitado por su nombre y RELLENA SU FILA
 *     (asistencia, asistentes, restricciones, mensaje, fecha) en las columnas que ya existen.
 *  2. Además guarda cada respuesta en la pestaña "Respuestas" (se crea sola) como bitácora.
 *  3. Si el invitado pide más asistentes de los que tiene autorizados en tu hoja, rechaza la respuesta.
 *
 * SIN CREDENCIALES: el script se ejecuta con TU cuenta cuando lo publicas como "Aplicación web".
 *
 * INSTALACIÓN (resumen)
 *  - Abre tu hoja de cálculo → Extensiones → Apps Script → pega este código → Guardar.
 *  - Implementar → Nueva implementación → Aplicación web → Ejecutar como: yo → Acceso: Cualquier persona.
 *  - Si cambias el código: Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar.
 *  - Para comprobar: abre la URL de la aplicación web en el navegador; debe mostrar {"ok":true,...}.
 */

/*
const CONFIG = {
  HOJA_INVITADOS: 'Invitados',        // nombre de la pestaña con tu base de invitados (fila 1 = encabezados)
  HOJA_RESPUESTAS: 'Respuestas',      // bitácora de respuestas
  AUTORIZADOS_SI_NO_ESTA: 1,          // asistentes permitidos si el nombre no está en tu hoja y el navegador no indica otro valor
  TOPE_ASISTENTES: 10,                // tope de seguridad
  DEBUG: false,                       // true solo para pruebas: devuelve el detalle técnico del error
  // Nombres de encabezado que reconoce (sin importar mayúsculas ni tildes). Agrega los tuyos si hace falta.
  COLUMNAS: {
    nombre:        ['nombre completo', 'nombre', 'nombres', 'invitado', 'invitados'],
    autorizados:   ['pases', 'pases autorizados', 'autorizados', 'asistentes autorizados', 'cupos', 'numero de pases', 'n de pases'],
    asistencia:    ['asistencia', 'confirmacion', 'respuesta', 'estado', 'confirmado'],
    asistentes:    ['asistentes', 'asistentes confirmados', 'confirmados', 'personas', 'numero de asistentes', 'cuantos asisten'],
    restricciones: ['restricciones alimentarias', 'restricciones', 'alergias', 'menu', 'dieta'],
    mensaje:       ['mensaje', 'mensaje para los novios', 'comentarios', 'comentario'],
    fecha:         ['fecha de respuesta', 'fecha respuesta', 'fecha', 'respondio']
  }
};

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    const error = validarBasico(p);
    if (error) return salida({ ok: false, error: error });

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      if (!ss) return salida({ ok: false, error: 'El script no está vinculado a una hoja de cálculo' });

      const base = leerBase(ss);
      const enc = base ? buscarInvitado(base, p.nombre) : null;
      const autorizados = enc
        ? enc.autorizados
        : (Number(p.autorizados) > 0 ? Math.min(Number(p.autorizados), CONFIG.TOPE_ASISTENTES) : CONFIG.AUTORIZADOS_SI_NO_ESTA);

      if (Number(p.asistentes) > autorizados) {
        return salida({ ok: false, error: 'Supera los asistentes autorizados (' + autorizados + ')' });
      }
      registrarRespuesta(ss, p, autorizados, !!enc);
      const actualizado = enc ? actualizarFila(base, enc.fila, p) : false;
      return salida({ ok: true, enBase: !!enc, filaActualizada: actualizado });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return salida({ ok: false, error: CONFIG.DEBUG ? String(err) : 'Solicitud no válida' });
  }
}

// Prueba rápida y diagnóstico: abre la URL de la aplicación web en el navegador.
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const out = { ok: true, mensaje: 'RSVP activo', version: 2 };
  if (!ss) {
    out.hoja = 'SIN HOJA VINCULADA: crea el script desde la hoja (Extensiones > Apps Script)';
    return salida(out);
  }
  out.hoja = ss.getName();
  out.pestanas = ss.getSheets().map(function (s) { return s.getName(); });
  const hoja = ss.getSheetByName(CONFIG.HOJA_INVITADOS);
  if (!hoja) {
    out.invitados = { encontrada: false, ayuda: 'No hay una pestaña llamada "' + CONFIG.HOJA_INVITADOS + '". Se guardará solo en "' + CONFIG.HOJA_RESPUESTAS + '".' };
    return salida(out);
  }
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(String);
  const cols = mapearColumnas(encabezados);
  const detectadas = {};
  Object.keys(cols).forEach(function (k) { detectadas[k] = cols[k] >= 0 ? encabezados[cols[k]] : null; });
  out.invitados = { encontrada: true, filas: Math.max(0, datos.length - 1), encabezados: encabezados, columnasDetectadas: detectadas };
  return salida(out);
}

function validarBasico(p) {
  if (!p || typeof p.nombre !== 'string' || p.nombre.trim().split(/\s+/).length < 2) return 'Falta el nombre completo';
  if (p.asistencia !== 'Asistiré' && p.asistencia !== 'No podré asistir') return 'Falta la confirmación';
  const n = Number(p.asistentes);
  if (!Number.isInteger(n) || n < 0 || n > CONFIG.TOPE_ASISTENTES) return 'Número de asistentes no válido';
  if (p.asistencia === 'Asistiré' && n < 1) return 'Indica al menos 1 asistente';
  return null;
}

// ---------- Base de invitados ----------
function leerBase(ss) {
  const hoja = ss.getSheetByName(CONFIG.HOJA_INVITADOS);
  if (!hoja) return null;
  const datos = hoja.getDataRange().getValues();
  if (datos.length < 1) return null;
  const cols = mapearColumnas(datos[0].map(String));
  if (cols.nombre < 0) return null;       // sin columna de nombre no podemos ubicar la fila
  return { hoja: hoja, datos: datos, cols: cols };
}

function mapearColumnas(encabezados) {
  const normalizados = encabezados.map(normalizar);
  const cols = {};
  Object.keys(CONFIG.COLUMNAS).forEach(function (clave) {
    cols[clave] = -1;
    const sinonimos = CONFIG.COLUMNAS[clave].map(normalizar);
    for (let s = 0; s < sinonimos.length && cols[clave] < 0; s++) {
      const i = normalizados.indexOf(sinonimos[s]);
      if (i >= 0) cols[clave] = i;
    }
  });
  return cols;
}

function buscarInvitado(base, nombre) {
  const clave = normalizar(nombre);
  for (let i = 1; i < base.datos.length; i++) {
    if (normalizar(String(base.datos[i][base.cols.nombre])) === clave) {
      const v = base.cols.autorizados >= 0 ? Number(base.datos[i][base.cols.autorizados]) : 0;
      return { fila: i + 1, autorizados: v > 0 ? Math.min(v, CONFIG.TOPE_ASISTENTES) : CONFIG.AUTORIZADOS_SI_NO_ESTA };
    }
  }
  return null;
}

function actualizarFila(base, fila, p) {
  const valores = {
    asistencia: limpio(p.asistencia),
    asistentes: Number(p.asistentes),
    restricciones: limpio(p.restricciones),
    mensaje: limpio(p.mensaje),
    fecha: new Date()
  };
  let escrito = false;
  Object.keys(valores).forEach(function (k) {
    if (base.cols[k] >= 0) {
      base.hoja.getRange(fila, base.cols[k] + 1).setValue(valores[k]);
      escrito = true;
    }
  });
  return escrito;
}

// ---------- Bitácora ----------
function registrarRespuesta(ss, p, autorizados, enBase) {
  let hoja = ss.getSheetByName(CONFIG.HOJA_RESPUESTAS);
  if (!hoja) hoja = ss.insertSheet(CONFIG.HOJA_RESPUESTAS);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(['Fecha', 'Nombre', 'Asistencia', 'Asistentes', 'Autorizados', 'Encontrado en la base',
                    'Restricciones alimentarias', 'Mensaje']);
  }
  hoja.appendRow([new Date(), limpio(p.nombre), limpio(p.asistencia), Number(p.asistentes), autorizados,
                  enBase ? 'Sí' : 'No', limpio(p.restricciones), limpio(p.mensaje)]);
}

// ---------- Utilidades ----------
function normalizar(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Evita que un texto como "=HYPERLINK(...)" se ejecute como fórmula en la hoja.
function limpio(v) {
  const s = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

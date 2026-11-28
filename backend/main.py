import os
import re
import secrets
from uuid import UUID
import psycopg
from psycopg.types.json import Jsonb
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, PlainTextResponse
from datos import administrador, conexion, huella, sesion
from esquemas import Consentimiento, Credenciales, Frase, Intervencion, Modelo, Muestra, Participacion, SUS
from esquemas import (Acceso, Cierre, Conocida, Desconocida, Identificador, ParticipanteCreado,
                      Puntaje, Revocacion, Sena, SesionCreada)
from motores import rutas_motores

app = FastAPI(title="Copiloto", version="1.0")
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in origins.split(",")],
                   allow_methods=["GET", "POST", "PATCH", "PUT"], allow_headers=["Authorization", "Content-Type"])
api = APIRouter(prefix="/api/v1")


@app.exception_handler(RequestValidationError)
def datos_invalidos(request, exc):
    return JSONResponse({"detail": [{"loc": e["loc"], "msg": e["msg"]} for e in exc.errors()]}, status_code=422)


@app.exception_handler(psycopg.OperationalError)
def sin_base(request, exc):
    return JSONResponse({"detail": "Base de datos no disponible"}, status_code=503)


@app.exception_handler(psycopg.IntegrityError)
def conflicto(request, exc):
    return JSONResponse({"detail": "Los datos entran en conflicto con el registro existente"}, status_code=409)


@api.post("/consents", status_code=201, response_model=ParticipanteCreado)
def consentir(datos: Consentimiento):
    codigo = secrets.token_urlsafe(24)
    with conexion() as db:
        db.execute("""WITH nuevo AS (INSERT INTO participante(codigo) VALUES (%s) RETURNING id_participante)
                   INSERT INTO consentimiento(id_participante, alcance, version_formato)
                   SELECT id_participante,%s,%s FROM nuevo""", (codigo, datos.alcance, datos.version_formato))
    return {"id_participante": codigo}


@api.post("/consents/{codigo}/revoke", response_model=Revocacion)
def retirar(codigo: str):
    with conexion() as db:
        p = db.execute("SELECT estado,muestras_retiradas FROM participante WHERE codigo=%s FOR UPDATE", (codigo,)).fetchone()
        if not p:
            raise HTTPException(404, "Participante desconocido")
        n = p["muestras_retiradas"]
        if n is None:
            n = db.execute("SELECT fn_revocar_consentimiento(%s) AS n", (codigo,)).fetchone()["n"]
            db.execute("UPDATE participante SET muestras_retiradas=%s WHERE codigo=%s", (n, codigo))
    return {"constancia": f"Consentimiento revocado para {codigo}", "muestras_eliminadas": n}


@api.post("/sessions", status_code=201, response_model=SesionCreada)
def crear_sesion(datos: Participacion):
    with conexion() as db:
        vigente = db.execute("""SELECT p.id_participante FROM participante p JOIN consentimiento c USING(id_participante)
                             WHERE p.codigo=%s AND p.estado='activo' AND c.fecha_revocacion IS NULL FOR SHARE OF p""",
                             (datos.id_participante,)).fetchone()
        if not vigente:
            raise HTTPException(403, "Consentimiento vigente requerido")
        return db.execute("""INSERT INTO sesion(id_version) VALUES ((SELECT id_version FROM version_modelo WHERE vigente))
                          RETURNING id_sesion AS session_id,inicio""").fetchone()


@api.patch("/sessions/{sid}/end", response_model=Cierre)
def cerrar(sid: UUID):
    with conexion() as db:
        sesion(db, sid, True)
        return db.execute("""UPDATE sesion SET fin=coalesce(fin,clock_timestamp()) WHERE id_sesion=%s
                          RETURNING (extract(epoch FROM fin-inicio)*1000)::bigint AS duracion_ms""", (sid,)).fetchone()


@api.post("/sessions/{sid}/interventions", status_code=201, response_model=Identificador)
def intervenir(sid: UUID, datos: Intervencion):
    with conexion() as db:
        actual = sesion(db, sid, True)
        if datos.clave_envio:
            previa = db.execute("SELECT id_intervencion::text AS id FROM intervencion WHERE id_sesion=%s AND clave_envio=%s", (sid, datos.clave_envio)).fetchone()
            if previa:
                return previa
        if actual["fin"]:
            raise HTTPException(409, "Sesión cerrada")
        return db.execute("""INSERT INTO intervencion(id_sesion,orden,interlocutor,tipo,texto,confianza,confirmada,latencia_ms,clave_envio)
                          SELECT %s,coalesce(max(orden),0)+1,%s,%s,%s,%s,%s,%s,%s FROM intervencion WHERE id_sesion=%s
                          RETURNING id_intervencion::text AS id""",
                          (sid, datos.interlocutor, "sena" if datos.tipo == "seña" else "voz", datos.texto,
                           datos.confianza, datos.confirmada, datos.latencia_ms, datos.clave_envio, sid)).fetchone()


@api.get("/sessions/{sid}/export", response_class=PlainTextResponse)
def exportar(sid: UUID):
    with conexion() as db:
        sesion(db, sid)
        filas = db.execute("SELECT interlocutor,texto FROM intervencion WHERE id_sesion=%s ORDER BY orden", (sid,))
        return "\n".join(f"{r['interlocutor']}: {r['texto']}" for r in filas)


@api.post("/sus", response_model=Puntaje)
def encuesta(datos: SUS):
    puntaje = 2.5 * sum(v-1 if i % 2 == 0 else 5-v for i, v in enumerate(datos.respuestas))
    with conexion() as db:
        if not sesion(db, datos.session_id, True)["fin"]:
            raise HTTPException(409, "Finalice primero la sesión")
        previa = db.execute("SELECT respuestas FROM respuesta_sus WHERE id_sesion=%s", (datos.session_id,)).fetchone()
        if previa and previa["respuestas"] != datos.respuestas:
            raise HTTPException(409, "La sesión ya tiene respuestas diferentes")
        if not previa:
            db.execute("INSERT INTO respuesta_sus(id_sesion,respuestas,puntaje) VALUES (%s,%s,%s)",
                       (datos.session_id, Jsonb(datos.respuestas), puntaje))
    return {"puntaje": puntaje}


def catalogo(db):
    return db.execute("""SELECT id_sena::text AS id,glosa,coalesce(descripcion,'') AS descripcion,archivo_animacion AS animacion
                      FROM sena WHERE activa ORDER BY glosa""").fetchall()


@api.post("/translate", response_model=list[Conocida | Desconocida])
def traducir(datos: Frase):
    with conexion() as db:
        vocabulario = {tuple(s["glosa"].casefold().split()): s for s in catalogo(db)}
    palabras = re.findall(r"\w+", datos.texto)
    claves = sorted(vocabulario, key=len, reverse=True)
    normalizadas = tuple(p.casefold() for p in palabras)
    salida = []
    i = 0
    while i < len(palabras):
        clave = next((k for k in claves if normalizadas[i:i+len(k)] == k), None)
        if clave:
            s = vocabulario[clave]
            salida.append(dict(palabra=" ".join(palabras[i:i+len(clave)]), glosa=s["glosa"],
                               animacion=s["animacion"], fuera_de_vocabulario=False))
            i += len(clave)
        else:
            salida.append(dict(palabra=palabras[i], fuera_de_vocabulario=True))
            i += 1
    return salida


@api.post("/auth/login", response_model=Acceso)
def login(datos: Credenciales):
    if len(datos.contraseña.encode()) > 72:
        raise HTTPException(401, "Credenciales incorrectas")
    with conexion() as db:
        admin = db.execute("""SELECT id_admin FROM administrador WHERE usuario=%s
                           AND hash_contrasena=crypt(%s,hash_contrasena)""", (datos.usuario, datos.contraseña)).fetchone()
        if not admin:
            raise HTTPException(401, "Credenciales incorrectas")
        token = secrets.token_urlsafe(32)
        db.execute("DELETE FROM api_token WHERE vence<=now()")
        db.execute("INSERT INTO api_token VALUES (%s,%s,now()+interval '1 hour')", (huella(token), admin["id_admin"]))
    return {"token": token}


@api.get("/signs", response_model=list[Sena])
def signos(admin: int = Depends(administrador)):
    with conexion() as db:
        return catalogo(db)


@api.post("/samples", status_code=201, response_model=Identificador)
def muestra(datos: Muestra, admin: int = Depends(administrador)):
    with conexion() as db:
        p = db.execute("SELECT id_participante,estado FROM participante WHERE codigo=%s FOR UPDATE", (datos.id_participante,)).fetchone()
        if not p or p["estado"] != "activo":
            raise HTTPException(403, {"code": "CONSENT_REQUIRED"})
        try:
            return db.execute("""INSERT INTO muestra(id_sena,id_participante,origen,vector) VALUES (%s,%s,'propio',%s)
                              RETURNING id_muestra::text AS id""", (datos.id_sena, p["id_participante"], datos.vector)).fetchone()
        except psycopg.errors.CheckViolation:
            raise HTTPException(403, {"code": "CONSENT_REQUIRED"})


@api.get("/model", response_model=Modelo)
def modelo(admin: int = Depends(administrador)):
    with conexion() as db:
        row = db.execute("""SELECT nombre AS version, exactitud, precision_ AS precision, sensibilidad, f1,
                          umbral_confianza AS umbral, coalesce(matriz_confusion,'{"etiquetas":[],"valores":[]}'::jsonb) AS matriz_confusion FROM version_modelo WHERE vigente""").fetchone()
        if not row:
            raise HTTPException(404, "Todavía no hay un modelo vigente")
        return row


@api.put("/model", response_model=Modelo)
def guardar(datos: Modelo, admin: int = Depends(administrador)):
    from motores import clasificador, directorio_modelo
    artefacto = directorio_modelo(datos.version)
    try:
        clasificador(artefacto)
    except Exception as exc:
        raise HTTPException(503, "No se pudo cargar el modelo de esta versión") from exc
    with conexion() as db:
        db.execute("SELECT pg_advisory_xact_lock(527293)")
        db.execute("UPDATE version_modelo SET vigente=false WHERE vigente")
        guardado = db.execute("""INSERT INTO version_modelo(id_admin,nombre,ruta_artefacto,exactitud,precision_,sensibilidad,f1,
                   matriz_confusion,umbral_confianza,vigente) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,true)
                   ON CONFLICT(nombre) DO UPDATE SET exactitud=excluded.exactitud,precision_=excluded.precision_,
                   sensibilidad=excluded.sensibilidad,f1=excluded.f1,matriz_confusion=excluded.matriz_confusion,
                   umbral_confianza=excluded.umbral_confianza,vigente=true,ruta_artefacto=excluded.ruta_artefacto
                   RETURNING nombre AS version,exactitud,precision_ AS precision,sensibilidad,f1,matriz_confusion,umbral_confianza AS umbral""",
                   (admin, datos.version, str(artefacto), datos.exactitud, datos.precision, datos.sensibilidad,
                    datos.f1, Jsonb(datos.matriz_confusion.model_dump()), datos.umbral)).fetchone()
    return guardado


api.include_router(rutas_motores)
app.include_router(api)

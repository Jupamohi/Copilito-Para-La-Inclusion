import hashlib
import os
from contextlib import contextmanager
import psycopg
from psycopg.rows import dict_row
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


@contextmanager
def conexion():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise HTTPException(503, "Configure DATABASE_URL en el servidor")
    with psycopg.connect(url, row_factory=dict_row, connect_timeout=4) as db:
        yield db


def huella(token):
    return hashlib.sha256(token.encode()).digest()


def administrador(cred: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False))):
    if cred:
        with conexion() as db:
            row = db.execute("SELECT id_admin FROM api_token WHERE huella=%s AND vence>now()", (huella(cred.credentials),)).fetchone()
            if row:
                return row["id_admin"]
    raise HTTPException(401, "Autenticación requerida", headers={"WWW-Authenticate": "Bearer"})


def sesion(db, sid, bloquear=False):
    sql = "SELECT * FROM sesion WHERE id_sesion=%s"
    row = db.execute(sql + (" FOR UPDATE" if bloquear else ""), (sid,)).fetchone()
    if not row:
        raise HTTPException(404, "Sesión desconocida")
    return row

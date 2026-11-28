"""Ejecutar desde backend con DATABASE_URL de aprovisionamiento."""
from getpass import getpass
from datos import conexion

if __name__ == "__main__":
    usuario = input("Usuario: ").strip()
    clave = getpass("Contraseña (12 caracteres como mínimo): ")
    if not 1 <= len(usuario) <= 50 or len(clave) < 12 or len(clave.encode()) > 72:
        raise SystemExit("Usuario o longitud de contraseña inválidos")
    with conexion() as db:
        db.execute("INSERT INTO administrador(usuario,hash_contrasena) VALUES (%s,crypt(%s,gen_salt('bf',12)))",
                   (usuario, clave))
    print("Administrador creado.")

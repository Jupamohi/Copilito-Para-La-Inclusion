param([switch]$CrearAdmin, [switch]$DetenerBase)
$ErrorActionPreference = 'Stop'
$config = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '.local.json') | ConvertFrom-Json
$datos = Join-Path $config.directorio 'postgres'
$control = Join-Path $config.binPostgres 'pg_ctl.exe'
if ($DetenerBase) {
    & $control -D $datos -m fast -w stop
    exit $LASTEXITCODE
}
& $control -D $datos status | Out-Null
if ($LASTEXITCODE -ne 0) {
    & $control -D $datos -l (Join-Path $config.directorio 'postgres.log') -o "-p $($config.puerto) -h 127.0.0.1" -w start
    if ($LASTEXITCODE) { throw 'PostgreSQL no pudo iniciarse. Revise postgres.log.' }
}
$usuario = if ($CrearAdmin) { 'postgres' } else { 'lsc_app' }
$archivo = if ($CrearAdmin) { 'propietario.clave' } else { 'aplicacion.clave' }
$clave = Get-Content -LiteralPath (Join-Path $config.directorio $archivo) | ConvertTo-SecureString
$anterior = $env:PGPASSWORD
$urlAnterior = $env:DATABASE_URL
$sttAnterior = $env:COPILOTO_STT
Push-Location $PSScriptRoot
try {
    $env:PGPASSWORD = [System.Net.NetworkCredential]::new('', $clave).Password
    $env:DATABASE_URL = "postgresql://$usuario@127.0.0.1:$($config.puerto)/copiloto_dev"
    $env:COPILOTO_STT = $config.stt
    if ($CrearAdmin) {
        & .\.venv\Scripts\python.exe crear_admin.py
    } else {
        & .\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --no-access-log
    }
    $resultado = $LASTEXITCODE
} finally {
    Pop-Location
    $env:PGPASSWORD = $anterior
    $env:DATABASE_URL = $urlAnterior
    $env:COPILOTO_STT = $sttAnterior
}
exit $resultado

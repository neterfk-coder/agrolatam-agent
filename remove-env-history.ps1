<#
remove-env-history.ps1

Uso: Ejecuta este script para clonar un mirror del repo, eliminar `.env` de todo
el historial usando `git-filter-repo`, y opcionalmente forzar el push al remoto.

Advertencias:
- Debes tener permisos para hacer `git push --force` al remoto.
- Rota todas las claves expuestas tras la limpieza.
- El script no descarga ni ejecuta BFG. Si no tienes `git-filter-repo`, instala
  con `pip install git-filter-repo` o usa la alternativa manual.

Ejemplo:
PowerShell -ExecutionPolicy Bypass -File .\remove-env-history.ps1 -RepoUrl "https://github.com/USUARIO/REPO.git" -ForcePush
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl,

    [string]$MirrorDir = "$env:TEMP\repo-mirror-$([System.Guid]::NewGuid().ToString())",

    [switch]$ForcePush,

    [switch]$DryRun
)

function Abort([string]$msg){
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

Write-Host "Mirror directory: $MirrorDir"

$gfr = Get-Command git-filter-repo -ErrorAction SilentlyContinue
if (-not $gfr) {
    Write-Host "No se encontró 'git-filter-repo' en PATH." -ForegroundColor Yellow
    Write-Host "Instálalo con: pip install git-filter-repo" -ForegroundColor Yellow
    if (-not $ForcePush) {
        Write-Host "Abortando: instala git-filter-repo o vuelve a ejecutar con -ForcePush para continuar bajo tu responsabilidad." -ForegroundColor Yellow
        exit 1
    }
}

if ($DryRun) {
    Write-Host "--- DRY RUN ---" -ForegroundColor Cyan
    Write-Host "Comandos que se ejecutarían:" -ForegroundColor Cyan
    Write-Host "git clone --mirror $RepoUrl $MirrorDir"
    Write-Host "cd $MirrorDir"
    Write-Host "git filter-repo --path .env --invert-paths"
    Write-Host "git reflog expire --expire=now --all"
    Write-Host "git gc --prune=now --aggressive"
    Write-Host "git push --force --all" -ForegroundColor Yellow
    Write-Host "git push --force --tags" -ForegroundColor Yellow
    Write-Host "--- END DRY RUN ---" -ForegroundColor Cyan
    exit 0
}

Write-Host "Clonando mirror del repo..." -ForegroundColor Green
git clone --mirror $RepoUrl $MirrorDir 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) { Abort "Falló git clone --mirror" }

Push-Location $MirrorDir
try {
    Write-Host "Ejecutando git-filter-repo para eliminar '.env' del historial..." -ForegroundColor Green
    git filter-repo --path .env --invert-paths 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) { Abort "git-filter-repo falló" }

    Write-Host "Limpiando reflog y haciendo gc..." -ForegroundColor Green
    git reflog expire --expire=now --all 2>&1 | Write-Host
    git gc --prune=now --aggressive 2>&1 | Write-Host

    if ($ForcePush) {
        Write-Host "Forzando push de ramas y tags al remoto..." -ForegroundColor Yellow
        git push --force --all 2>&1 | Write-Host
        if ($LASTEXITCODE -ne 0) { Abort "git push --force --all falló" }
        git push --force --tags 2>&1 | Write-Host
        if ($LASTEXITCODE -ne 0) { Abort "git push --force --tags falló" }
    }
    else {
        Write-Host "No se ejecutó push. Para aplicar los cambios al remoto, ejecuta:" -ForegroundColor Cyan
        Write-Host "  cd $MirrorDir" -ForegroundColor Cyan
        Write-Host "  git push --force --all" -ForegroundColor Cyan
        Write-Host "  git push --force --tags" -ForegroundColor Cyan
    }
}
finally {
    Pop-Location
}

Write-Host "Hecho." -ForegroundColor Green
Write-Host "IMPORTANTE: Rota inmediatamente todas las claves expuestas en '.env'." -ForegroundColor Red

# P.E.O - Gerador de Instalador MODO LOCAL
# Este instalador e para USO OFFLINE, sem necessidade de cadastro

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   P.E.O - BUILD INSTALADOR MODO LOCAL     " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Define variavel de ambiente para o modo
$env:PEO_MODE = "LOCAL"

# Passo 1: Instalar dependencias do backend
Write-Host "[1/5] Instalando dependencias do backend (incluindo esbuild)..." -ForegroundColor Yellow
cd "..\backend"
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "[X] Erro ao instalar dependencias do backend!" -ForegroundColor Red
    exit 1 
}

# Passo 2: Compilar backend com esbuild
Write-Host "[2/5] Compilando backend TypeScript..." -ForegroundColor Yellow
node build-standalone.cjs
if ($LASTEXITCODE -ne 0) { 
    Write-Host "[X] Erro ao compilar backend!" -ForegroundColor Red
    exit 1 
}

# Passo 3: Voltar para P.E.O-Install e buildar frontend
cd "..\P.E.O-Install"
Write-Host "[3/5] Compilando frontend (React+Vite)..." -ForegroundColor Yellow
powershell -File build-frontend.ps1
if ($LASTEXITCODE -ne 0) { 
    Write-Host "[X] Erro ao compilar frontend!" -ForegroundColor Red
    exit 1 
}

# Passo 4: Instalar dependencias do instalador
Write-Host "[4/5] Preparando motor do instalador Electron..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "[X] Erro ao instalar dependencias do instalador!" -ForegroundColor Red
    exit 1 
}

# Passo 5: Gerar instalador Windows
Write-Host "[5/5] Gerando instalador .exe MODO LOCAL..." -ForegroundColor Blue
npm run build:win
if ($LASTEXITCODE -ne 0) { 
    Write-Host "[X] Erro ao gerar instalador!" -ForegroundColor Red
    exit 1 
}

# Renomeia o instalador
$arquivoOriginal = Get-ChildItem -Path "dist" -Filter "*.exe" | Where-Object { $_.Name -notmatch "Local|Intranet" } | Select-Object -First 1
if ($arquivoOriginal) {
    $novoNome = "P.E.O - Local Setup 1.0.0.exe"
    $caminhoDestino = Join-Path "dist" $novoNome
    # Remove arquivo antigo se existir
    if (Test-Path $caminhoDestino) {
        Remove-Item $caminhoDestino -Force
    }
    Rename-Item -Path $arquivoOriginal.FullName -NewName $novoNome -Force
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "[OK] INSTALADOR LOCAL GERADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "[>>] Localizacao: dist\$novoNome" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[OK] Instalador gerado em dist\" -ForegroundColor Green
}


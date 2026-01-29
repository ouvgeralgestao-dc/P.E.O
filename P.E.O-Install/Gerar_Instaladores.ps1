# P.E.O - GERADOR MASTER DE INSTALADORES v2.0
# Este script orquestra TODA a criacao dos instaladores profissionais

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Magenta
Write-Host "      P.E.O - GERADOR MASTER v2.0          " -ForegroundColor Magenta
Write-Host "   Instaladores Profissionais Windows      " -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

# Etapa 0: Converter icone
Write-Host "[ETAPA 0/3] Preparando icone profissional..." -ForegroundColor Cyan
powershell -File converter-icone.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Conversao de icone falhou. Continuando com icone padrao..." -ForegroundColor Yellow
}

Write-Host ""

# Etapa 1: Gerar instalador LOCAL
Write-Host "[ETAPA 1/3] Gerando Instalador MODO LOCAL..." -ForegroundColor Cyan
powershell -File build-instalador-local.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Falha ao gerar instalador LOCAL!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Etapa 2: Gerar instalador INTRANET
Write-Host "[ETAPA 2/3] Gerando Instalador MODO INTRANET..." -ForegroundColor Cyan
powershell -File build-instalador-intranet.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Falha ao gerar instalador INTRANET!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Etapa 3: Relatorio final
Write-Host "============================================" -ForegroundColor Green
Write-Host "[OK] TODOS OS INSTALADORES GERADOS!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "[>>] Pasta de saida: dist\" -ForegroundColor White
Write-Host ""

# Lista os arquivos gerados
$instaladores = Get-ChildItem -Path "dist" -Filter "*.exe" -Recurse
if ($instaladores.Count -gt 0) {
    Write-Host "[OK] Instaladores disponiveis:" -ForegroundColor Cyan
    foreach ($instalador in $instaladores) {
        $tamanhoMB = [math]::Round($instalador.Length / 1MB, 2)
        Write-Host "   [+] $($instalador.Name) - ${tamanhoMB} MB" -ForegroundColor White
    }
} else {
    Write-Host "[!] Nenhum instalador .exe encontrado na pasta dist!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[>>] Proximo passo: Execute os instaladores para testar!" -ForegroundColor Cyan
Write-Host ""

# Script de Build Completo do Frontend
# Este script compila o React+Vite em arquivos estaticos prontos para producao

Write-Host "[>>] Compilando Frontend (React + Vite)..." -ForegroundColor Cyan

# Navega para a pasta do frontend
cd "..\frontend"

# Instala dependencias se necessario
if (-not (Test-Path "node_modules")) {
    Write-Host "[>>] Instalando dependencias do frontend..." -ForegroundColor Yellow
    npm install
}

# Executa o build de producao
Write-Host "[>>] Executando build de producao..." -ForegroundColor Yellow
npm run build

# Copia a pasta dist para o instalador
if (Test-Path "dist") {
    Write-Host "[>>] Copiando build para P.E.O-Install..." -ForegroundColor Yellow
    $destino = "..\P.E.O-Install\bundled-frontend"
    
    # Remove pasta antiga se existir
    if (Test-Path $destino) {
        Remove-Item -Recurse -Force $destino
    }
    
    # Copia nova versao
    Copy-Item -Recurse "dist" $destino
    
    Write-Host "[OK] Frontend compilado e copiado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "[X] ERRO: Pasta dist nao foi gerada!" -ForegroundColor Red
    exit 1
}

# Volta para a pasta do instalador
cd "..\P.E.O-Install"

Write-Host "[OK] Frontend pronto para empacotamento!" -ForegroundColor Cyan

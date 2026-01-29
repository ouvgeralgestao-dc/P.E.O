# CONVERSOR DE ICONE PNG PARA ICO
# Converte a logo do projeto em formato .ico com multiplas resolucoes

$ErrorActionPreference = "Stop"

Write-Host "[>>] Convertendo logo PNG para ICO..." -ForegroundColor Cyan

# Caminhos
$logoOriginal = "..\logo_white_com_fundo-removebg-preview.png"
$iconeDestino = "assets\icon.ico"

# Cria pasta assets se nao existir
if (-not (Test-Path "assets")) {
    New-Item -ItemType Directory -Path "assets" | Out-Null
    Write-Host "[OK] Pasta assets criada" -ForegroundColor Green
}

# Verifica se a logo original existe
if (-not (Test-Path $logoOriginal)) {
    Write-Host "[!] Logo original nao encontrada em: $logoOriginal" -ForegroundColor Yellow
    Write-Host "[>>] Tentando usar ImageMagick..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "INSTRUCOES MANUAIS:" -ForegroundColor Red
    Write-Host "1. Acesse: https://convertio.co/pt/png-ico/" -ForegroundColor White
    Write-Host "2. Faca upload da logo_white_com_fundo-removebg-preview.png" -ForegroundColor White
    Write-Host "3. Baixe o arquivo .ico gerado" -ForegroundColor White
    Write-Host "4. Salve como: $iconeDestino" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verifica se ImageMagick esta instalado
$magickInstalado = Get-Command magick -ErrorAction SilentlyContinue

if ($magickInstalado) {
    Write-Host "[OK] ImageMagick detectado! Convertendo..." -ForegroundColor Green
    
    # Converte PNG para ICO com multiplas resolucoes
    magick convert $logoOriginal -define icon:auto-resize=256,128,64,48,32,16 $iconeDestino
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Icone convertido com sucesso!" -ForegroundColor Green
        Write-Host "[>>] Salvo em: $iconeDestino" -ForegroundColor White
    } else {
        Write-Host "[X] Erro ao converter com ImageMagick" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[!] ImageMagick nao instalado no sistema." -ForegroundColor Yellow
    Write-Host "[>>] Tentando metodo alternativo..." -ForegroundColor Yellow
    
    # Copia o PNG como backup
    Copy-Item $logoOriginal "assets\icon.png" -Force
    
    Write-Host ""
    Write-Host "ATENCAO: Conversao automatica nao disponivel!" -ForegroundColor Red
    Write-Host ""
    Write-Host "OPCOES:" -ForegroundColor Cyan
    Write-Host "1. Instalar ImageMagick: https://imagemagick.org/script/download.php" -ForegroundColor White
    Write-Host "2. Usar conversor online: https://convertio.co/pt/png-ico/" -ForegroundColor White
    Write-Host ""
    Write-Host "Apos obter o .ico, salve em: $iconeDestino" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

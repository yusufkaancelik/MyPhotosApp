# MyPhotos Bağımlılıkları Yükleme Scripti

# Renkli çıktı fonksiyonları
function Write-Success {
    param($Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host $Message -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host $Message -ForegroundColor Cyan
}

# Script konumunu al
$scriptPath = $PSScriptRoot
Write-Info "`nMyPhotos - Bağımlılıkları Yükle"
Write-Info "====================================`n"

# Node.js kontrolü
Write-Info "Node.js versiyonu kontrol ediliyor..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js versiyonu: $nodeVersion"
} catch {
    Write-Error "[HATA] Node.js yüklü değil!"
    Write-Host "Lütfen Node.js'i yükleyin: https://nodejs.org/"
    Write-Host "Minimum versiyon: 18.x"
    Read-Host "Devam etmek için bir tuşa basın"
    exit 1
}

# npm kontrolü
Write-Info "`nnpm versiyonu kontrol ediliyor..."
try {
    $npmVersion = npm --version
    Write-Success "npm versiyonu: $npmVersion"
} catch {
    Write-Error "[HATA] npm yüklü değil!"
    Write-Host "Lütfen Node.js'i yeniden yükleyin"
    Read-Host "Devam etmek için bir tuşa basın"
    exit 1
}

# Backend bağımlılıkları
Write-Info "`nBackend bağımlılıkları yükleniyor..."
Write-Info "===================================="
try {
    Set-Location "$scriptPath\backend"
    npm install
    Write-Success "Backend bağımlılıkları başarıyla yüklendi!"
} catch {
    Write-Error "[HATA] Backend bağımlılıkları yüklenemedi!"
    Write-Error $_.Exception.Message
    Read-Host "Devam etmek için bir tuşa basın"
    exit 1
}

# Frontend bağımlılıkları
Write-Info "`nFrontend bağımlılıkları yükleniyor..."
Write-Info "===================================="
try {
    Set-Location "$scriptPath\frontend-new"
    npm install
    Write-Success "Frontend bağımlılıkları başarıyla yüklendi!"
} catch {
    Write-Error "[HATA] Frontend bağımlılıkları yüklenemedi!"
    Write-Error $_.Exception.Message
    Read-Host "Devam etmek için bir tuşa basın"
    exit 1
}

Write-Info "`nTüm bağımlılıklar başarıyla yüklendi!"
Write-Info "Uygulamayı başlatmak için 'start-app.bat' dosyasını çalıştırın.`n"

Read-Host "Devam etmek için bir tuşa basın"
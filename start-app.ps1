# Uygulamayı başlatma scripti

# Script konumunu al
$scriptPath = $PSScriptRoot
Write-Host "Uygulama konumu: $scriptPath" -ForegroundColor Cyan

Write-Host "MyPhotos uygulaması başlatılıyor..." -ForegroundColor Cyan

# Çalışan Node.js süreçlerini durdur
Write-Host "Eski süreçler durduruluyor..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

# Backend'i başlat
Write-Host "Backend başlatılıyor..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location "$path\backend"
    npm start
} -ArgumentList $scriptPath

# Frontend'i başlat
Write-Host "Frontend başlatılıyor..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location "$path\frontend-new"
    npm run dev
} -ArgumentList $scriptPath

# 5 saniye bekle
Start-Sleep -Seconds 5

# Varsayılan tarayıcıda aç
Write-Host "Uygulama açılıyor..." -ForegroundColor Cyan
Start-Process "https://localhost:5173"

Write-Host "`nUygulamayı kapatmak için bu pencereyi kapatabilirsiniz.`nKapatıldığında tüm süreçler otomatik olarak sonlandırılacaktır." -ForegroundColor Yellow

# Scriptboyunca bekle ve çıkışta temizlik yap
try {
    Wait-Job $backendJob, $frontendJob
} finally {
    Write-Host "`nUygulama kapatılıyor..." -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    taskkill /F /IM node.exe 2>$null
}
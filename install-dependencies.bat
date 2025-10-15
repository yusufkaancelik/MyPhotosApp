@echo off
echo MyPhotos - Bagimliliklari Yukle
echo =====================================
echo.

REM Script konumuna git
cd %~dp0

echo Node.js versiyonu kontrol ediliyor...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js yuklu degil!
    echo Lutfen Node.js'i yukleyin: https://nodejs.org/
    echo Minimum versiyon: 18.x
    pause
    exit /b 1
)

echo npm versiyonu kontrol ediliyor...
npm --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] npm yuklu degil!
    echo Lutfen Node.js'i yeniden yukleyin
    pause
    exit /b 1
)

echo.
echo Backend bagimliliklari yukleniyor...
echo =====================================
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [HATA] Backend bagimliliklari yuklenemedi!
    pause
    exit /b 1
)

echo.
echo Frontend bagimliliklari yukleniyor...
echo =====================================
cd ../frontend-new
call npm install
if %errorlevel% neq 0 (
    echo [HATA] Frontend bagimliliklari yuklenemedi!
    pause
    exit /b 1
)

echo.
echo Tum bagimliliklar basariyla yuklendi!
echo Uygulamayi baslatmak icin 'start-app.bat' dosyasini calistirin.
echo.
pause
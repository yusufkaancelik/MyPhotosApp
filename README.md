# MyPhotos

MyPhotos, fotoğraf yükleme, görüntüleme ve yönetimi sağlayan bir web uygulamasıdır. Hem frontend hem de backend bileşenleriyle modern bir mimariye sahiptir.

## Özellikler
- Fotoğraf yükleme ve indirme
- Fotoğrafları listeleme ve önizleme
- Kullanıcı dostu arayüz (React + Tailwind CSS)
- RESTful API ile backend (Node.js/Express)
- Dosya yönetimi ve güvenli depolama

## Proje Yapısı
```
MyPhotos/
├── backend/         # Sunucu tarafı kodları (Node.js, Express)
├── frontend/        # React tabanlı arayüz
├── frontend-new/    # Alternatif/deneysel frontend
├── uploads/         # Yüklenen fotoğraflar
├── install-dependencies.bat/ps1 # Bağımlılık kurulum scriptleri
├── start-app.bat/ps1            # Uygulama başlatma scriptleri
```

## Kurulum
1. Bağımlılıkları yükleyin:
   ```
   ./install-dependencies.bat
   ```
   veya
   ```
   ./install-dependencies.ps1
   ```
2. Uygulamayı başlatın:
   ```
   ./start-app.bat
   ```
   veya
   ```
   ./start-app.ps1
   ```

## Backend
- Node.js & Express
- API endpointleri: `/api/photos`, `/api/upload`, vb.
- Fotoğraf dosyaları `uploads/` klasöründe saklanır.

## Frontend
- React + Vite
- Tailwind CSS ile modern tasarım
- Fotoğraf galerisi ve yükleme arayüzü

## Katkı Sağlama
Pull request ve issue açarak katkıda bulunabilirsiniz.

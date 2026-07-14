# Vahşi Bahçe 3D

Clash of Clans tarzı **3D hayvanat bahçesi kurma** oyunu. Binaları yükselt, low-poly 3D hayvanlar yetiştir, yürüyen turistlerden para kazan.

## Özellikler

- **Three.js** ile gerçek 3D sahne (gölgeler, yörünge kamerası)
- Görünür **3D hayvanlar** ve **yürüyen turistler**
- Yükseltilebilir 3D binalar (Seviye 1–5)
- Kara canlılarıyla başla; **su canlıları Seviye 5’te** açılır
- Turist harcamasıyla ekonomi + yerel kayıt

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda açılan adresi ziyaret et (genelde `http://localhost:5173`).

Üretim derlemesi:

```bash
npm run build
npm run preview
```

## Kontroller

| Giriş | İşlem |
| --- | --- |
| Sürükle | Kamerayı döndür |
| Tekerlek / pinch | Zoom |
| Tıkla | Bina seç / yerleştir |
| Alt menü | İnşa · Hayvanlar · Bahçe |

## Teknoloji

- Vite
- Three.js

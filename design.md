# WatchSync AI — Tasarım Sistemi Rehberi (Design System)

> **Versiyon:** 1.0  
> **Tarih:** 2026-03-26  
> **Felsefe:** Calm Design — Bilişsel yükü minimize eden, fonksiyonel beyaz boşluk ağırlıklı, progresif açıklama (progressive disclosure) prensibine dayalı premium B2B arayüz.

---

## 1. Renk Paleti

### Ana Renkler (Primary)

| Rol | Ad | Hex | HSL | Kullanım Alanı |
|-----|-----|-----|-----|----------------|
| Arka Plan (Zemin) | Midnight | `#0A0A0F` | `240° 20% 5%` | Sayfa arka planı |
| Yüzey (Surface) | Dark Slate | `#12121A` | `240° 18% 8%` | Kart, sidebar, modal arka planı |
| Yüzey Yükseltilmiş | Elevated Slate | `#1A1A26` | `240° 20% 12%` | Hover durumları, aktif kart, dropdown |
| Birincil Vurgu | Electric Blue | `#3B82F6` | `217° 91% 60%` | CTA butonları, aktif durumlar, linkler |
| Birincil Vurgu (Hover) | Bright Blue | `#2563EB` | `217° 91% 53%` | Buton hover, aktif link |
| İkincil Vurgu | Warm Gold | `#F59E0B` | `38° 92% 50%` | Premium badge'ler, fiyat vurgulama |

### Anlamsal Renkler (Semantic)

| Rol | Ad | Hex | Kullanım Alanı |
|-----|-----|-----|----------------|
| Başarı | Emerald | `#10B981` | Başarılı senkronizasyon, onay |
| Uyarı | Amber | `#F59E0B` | Bekleyen işlem, dikkat |
| Hata | Rose | `#EF4444` | Hata mesajları, bağlantı kopması |
| Bilgi | Sky | `#38BDF8` | Bilgi mesajları, ipuçları |

### Metin Renkleri

| Rol | Hex | Opaklık | Kullanım Alanı |
|-----|-----|---------|----------------|
| Birincil Metin | `#F8FAFC` | 100% | Başlıklar, önemli veriler |
| İkincil Metin | `#94A3B8` | — | Açıklama, etiket, alt metin |
| Devre Dışı Metin | `#475569` | — | Pasif durumlar |
| Ters Metin (Light BG) | `#0F172A` | 100% | Açık arka planda metin |

### Kenarlık (Border) & Ayırıcı

| Rol | Hex | Kullanım Alanı |
|-----|-----|----------------|
| İnce Kenarlık | `#1E293B` | Kart contour, tablo çizgileri |
| Vurgulu Kenarlık | `#334155` | Focus ring, aktif input |
| Bölücü | `#1E293B` | Bölüm ayırıcıları |

---

## 2. Tipografi

### Font Ailesi

```css
/* Birincil Font — UI Metinleri */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Mono Font — Referans Numaraları, Fiyat */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Ölçek (Type Scale)

| Seviye | Tailwind Sınıfı | Boyut | Ağırlık | Satır Yüksekliği | Kullanım |
|--------|-----------------|-------|---------|-------------------|----------|
| Display | `text-4xl` | 36px | `font-bold` (700) | 1.1 | Landing hero başlığı |
| H1 | `text-3xl` | 30px | `font-bold` (700) | 1.2 | Sayfa başlıkları |
| H2 | `text-2xl` | 24px | `font-semibold` (600) | 1.3 | Bölüm başlıkları |
| H3 | `text-xl` | 20px | `font-semibold` (600) | 1.4 | Kart başlıkları |
| Body | `text-base` | 16px | `font-normal` (400) | 1.5 | Genel metin |
| Body Small | `text-sm` | 14px | `font-normal` (400) | 1.5 | Tablo hücresi, etiket |
| Caption | `text-xs` | 12px | `font-medium` (500) | 1.4 | Badge, zaman damgası |
| Mono | `font-mono text-sm` | 14px | `font-normal` (400) | 1.5 | Ref no, SKU, fiyat |

---

## 3. Aralık & Grid Sistemi

### Boşluk Ölçeği (Spacing Scale)

```
4px  (1)  → İkon içi padding
8px  (2)  → Eleman içi küçük boşluk
12px (3)  → Badge padding, küçük gap
16px (4)  → Varsayılan padding, tablo hücre
20px (5)  → Kart iç padding
24px (6)  → Bölüm arası gap
32px (8)  → Sayfa kenar boşluğu
48px (12) → Büyük bölüm ayırıcı
64px (16) → Hero bölümü padding
```

### Layout Grid

```
Sidebar Genişliği:         256px (w-64) — daraltılmış: 72px (w-18)
Ana İçerik Max Genişlik:   1280px (max-w-7xl)
İçerik Padding:            32px (p-8)
Kart Grid Gap:             24px (gap-6)
Tablo Satır Yüksekliği:    56px (h-14)
```

---

## 4. Bileşen Mimarisi (Component Architecture)

### 4.1 Layout Bileşenleri

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (font, theme provider)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Dashboard layout (Sidebar + Main)
│   │   ├── page.tsx                  # Dashboard Home
│   │   ├── inventory/
│   │   │   ├── page.tsx              # Envanter listesi
│   │   │   └── [id]/page.tsx         # Saat detay / AI Studio
│   │   ├── market-scanner/page.tsx   # Pazar tarayıcı
│   │   ├── crm/
│   │   │   ├── page.tsx              # Müşteri listesi
│   │   │   └── [id]/page.tsx         # Müşteri detay
│   │   ├── invoices/page.tsx         # Faturalar
│   │   └── settings/page.tsx         # Ayarlar
│   └── (public)/
│       └── page.tsx                  # Landing page
├── components/
│   ├── ui/                           # Atomik UI bileşenleri
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Toggle.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   └── DataTable.tsx
│   ├── layout/                       # Yapısal bileşenler
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── PageHeader.tsx
│   │   └── ContentArea.tsx
│   ├── dashboard/                    # Dashboard'a özel
│   │   ├── KPICard.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── SyncStatusBadge.tsx
│   ├── inventory/                    # Envantere özel
│   │   ├── WatchTable.tsx
│   │   ├── WatchForm.tsx
│   │   ├── PlatformToggles.tsx
│   │   └── ImageGallery.tsx
│   ├── ai-studio/                    # AI özel
│   │   ├── ImagePreview.tsx
│   │   ├── BackgroundSelector.tsx
│   │   ├── DescriptionGenerator.tsx
│   │   └── AIEnhanceButton.tsx
│   └── market-scanner/               # Pazar tarayıcı özel
│       ├── PriceTrendChart.tsx
│       ├── CompetitorTable.tsx
│       └── PriceAlertForm.tsx
├── hooks/                            # Özel React Hook'ları
│   ├── useAuth.ts
│   ├── useWatches.ts
│   ├── usePlatformSync.ts
│   └── useMarketData.ts
├── lib/                              # Yardımcı fonksiyonlar
│   ├── api.ts                        # Axios instance, interceptor'lar
│   ├── constants.ts
│   └── utils.ts
├── stores/                           # Zustand store'ları
│   ├── authStore.ts
│   ├── inventoryStore.ts
│   └── uiStore.ts
└── types/                            # TypeScript tipleri
    ├── watch.ts
    ├── platform.ts
    ├── user.ts
    └── api.ts
```

### 4.2 Temel Bileşen Spesifikasyonları

#### Button

```
Varyantlar:
  - primary   → bg-blue-600, text-white, hover:bg-blue-700
  - secondary → bg-slate-800, text-slate-200, hover:bg-slate-700
  - ghost     → bg-transparent, text-slate-400, hover:bg-slate-800
  - danger    → bg-red-600/10, text-red-400, hover:bg-red-600/20

Boyutlar:
  - sm → h-8 px-3 text-xs
  - md → h-10 px-4 text-sm (varsayılan)
  - lg → h-12 px-6 text-base

Durumlar: default, hover, active, disabled, loading (spinner)
Kenar Yuvarlama: rounded-lg (8px)
Geçiş: transition-all duration-150
```

#### KPI Card

```
Yapı:
  ┌─────────────────────────────┐
  │  📊 Etiket             ▲ 12% │ ← text-xs text-slate-400 + trend badge
  │  $1,245,800                  │ ← text-2xl font-bold font-mono
  │  ───────────                 │ ← mini sparkline (opsiyonel)
  └─────────────────────────────┘

Arka Plan: bg-slate-900/50 backdrop-blur-sm
Kenarlık: border border-slate-800
Padding: p-6
Hover: hover:border-slate-700 transition-colors
```

#### Data Table

```
Özellikler:
  - Sütun sıralama (sort)
  - Satır seçimi (checkbox)
  - Sayfalama (cursor-based)
  - Toplu işlem çubuğu (bulk action bar)
  - Boş durum (empty state) gösterimi
  - Yükleme durumu (skeleton rows)

Satır hover: hover:bg-slate-800/50
Başlık: text-xs uppercase tracking-wider text-slate-500
Kenarlık: border-b border-slate-800
```

---

## 5. Tailwind CSS Yapılandırması

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0A0A0F',
        surface: {
          DEFAULT: '#12121A',
          elevated: '#1A1A26',
        },
        accent: {
          blue: {
            DEFAULT: '#3B82F6',
            hover: '#2563EB',
            muted: '#3B82F6/10',
          },
          gold: {
            DEFAULT: '#F59E0B',
            muted: '#F59E0B/10',
          },
        },
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#38BDF8',
        },
        border: {
          subtle: '#1E293B',
          strong: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '1.1', fontWeight: '700' }],
      },
      spacing: {
        sidebar: '256px',
        'sidebar-collapsed': '72px',
      },
      maxWidth: {
        content: '1280px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};
```

---

## 6. Gölge & Efekt Sistemi

### Gölgeler

```css
/* Kart Gölgesi */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);

/* Yükseltilmiş Gölge (Modal, Dropdown) */
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 4px 10px rgba(0, 0, 0, 0.3);

/* İç Gölge (Input Focus) */
box-shadow: inset 0 0 0 1px #3B82F6, 0 0 0 3px rgba(59, 130, 246, 0.1);
```

### Glassmorphism (Seçili Bileşenler)

```css
/* Sidebar / Overlay */
background: rgba(18, 18, 26, 0.85);
backdrop-filter: blur(12px);
border: 1px solid rgba(30, 41, 59, 0.5);
```

---

## 7. İkonografi

**Kütüphane:** Lucide Icons (React)  
**Boyutlar:**  
- Sidebar ikonları: 20px  
- Buton ikonları: 16px  
- KPI ikonları: 24px  

**Stil:** `stroke-width: 1.5`, `text-slate-400` (varsayılan), `text-blue-500` (aktif)

---

## 8. Hareket & Animasyon Kuralları

| Öğe | Süre | Easing | Açıklama |
|-----|------|--------|----------|
| Buton hover | 150ms | ease-out | Arka plan renk geçişi |
| Modal giriş | 300ms | ease-out | Fade + scale(0.95 → 1) |
| Sidebar daraltma | 200ms | ease-in-out | Genişlik animasyonu |
| Toast bildirimi | 300ms | ease-out | Sağdan kayma (slide-in) |
| Skeleton | 2s | ease-in-out infinite | Nabız (pulse) efekti |
| Sayfa geçişi | 200ms | ease-out | Fade-in + translateY(8px → 0) |

> **Kural:** 300ms'den uzun animasyon kullanılmayacak. Kullanıcı eylemlerinde gecikme hissi yaratılmayacak.

---

## 9. Responsive Kırılım Noktaları

| Kırılım | Tailwind | Davranış |
|----------|----------|----------|
| Mobil | `< 768px` | Sidebar drawer olur, tek sütun layout |
| Tablet | `md (768px)` | Sidebar daraltılmış, 2 sütun grid |
| Masaüstü | `lg (1024px)` | Sidebar tam açık, 3-4 sütun grid |
| Geniş Ekran | `xl (1280px)` | Max genişlik, merkezde hizalı |

---

## 10. Sayfa Düzeni Wireframe'leri

### Dashboard Layout

```
┌──────────┬──────────────────────────────────────────┐
│          │  TopBar: Arama | Bildirim 🔔 | Profil 👤 │
│  SIDEBAR │──────────────────────────────────────────│
│          │  ┌─KPI──┐ ┌─KPI──┐ ┌─KPI──┐ ┌─KPI──┐  │
│  🏠 Home  │  │ $1.2M │ │  47  │ │  12  │ │ 98%  │  │
│  📦 Inv.  │  └──────┘ └──────┘ └──────┘ └──────┘  │
│  📊 Scan  │                                        │
│  👥 CRM   │  ┌─ Son Aktiviteler ───────────────┐   │
│  ⚙ Ayar   │  │ Rolex Sub → eBay senkronlandı ✓ │   │
│          │  │ Patek 5711 → Chrono24 hata ✗    │   │
│          │  │ AP Royal Oak → yeni ilan ➕       │   │
│          │  └──────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────┘
```

### AI Studio Layout

```
┌──────────┬──────────────────────┬──────────────────┐
│          │                      │                  │
│  SIDEBAR │   GÖRSEL ÖNİZLEME   │   FORM & AI      │
│          │                      │                  │
│          │  ┌────────────────┐  │  Brand: [Rolex]  │
│          │  │                │  │  Model: [Sub.]   │
│          │  │  🖼 Saat Görseli │  │  Ref:   [126610]│
│          │  │                │  │  Year:  [2024]   │
│          │  │                │  │                  │
│          │  └────────────────┘  │  ┌────────────┐  │
│          │                      │  │ AI Açıklama│  │
│          │  [AI Enhance ✨]     │  │ ...        │  │
│          │  [Arka Plan Seç 🎨] │  │            │  │
│          │                      │  └────────────┘  │
│          │                      │  [Generate 🤖]   │
└──────────┴──────────────────────┴──────────────────┘
```

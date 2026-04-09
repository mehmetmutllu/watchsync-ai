# 🔀 WatchSync AI — Git Çalışma Rehberi

> **Repo:** `https://github.com/mehmetmutllu/watchsync-ai`  
> **Senior:** Mehmet (@mehmetmutllu) → `backend/`, `ai-service/`  
> **Junior:** Berat (@berat0642) → `frontend/`

---

## 📌 Branch Yapısı

```
main        ← Canlı kod. KİMSE DOKUNMAZ. Sadece develop'dan merge.
develop     ← Tüm geliştirme bu dal üzerinden akar.
  ├── senior/feature/xxx   ← Mehmet'in dalları
  └── junior/feature/xxx   ← Berat'ın dalları
```

---

## ⛔ DOKUNULMAZ KURALLAR (İKİ KİŞİ DE UYACAK)

1. **`main` branch'ine ASLA direkt push yapılmaz**
2. **`develop` branch'ine ASLA direkt push yapılmaz** — her zaman PR aç
3. **Kendi klasörün dışına ASLA dokunma:**
   - Mehmet (Senior): `backend/` ve `ai-service/`
   - Berat (Junior): `frontend/`
4. **`.env` dosyalarını ASLA commit etme** — şifreler sızar
5. **`node_modules/` ve `vendor/` klasörlerini ASLA commit etme** — `.gitignore` hallediyor
6. **Her commit mesajı anlamlı olacak** — "asdasd" veya "düzeltme" YASAK

---

## 🟢 BERAT (JUNIOR) İÇİN ADIM ADIM REHBER

### �️ Mac + Docker Geliştirme Ortamı Kurulumu

> Berat **Mac** kullanıyor. Backend (Laravel + MySQL + Redis) Docker ile kendi makinesinde çalışacak. MAMP'a gerek yok.

#### Gerekli Yazılımlar

| Yazılım | Kontrol Komutu | Kurulum |
|---------|----------------|---------|
| Git | `git --version` | `brew install git` |
| Node.js 20+ | `node --version` | `brew install node` |
| Docker Desktop | `docker --version` | https://docs.docker.com/desktop/setup/install/mac-install/ |

> ⚠️ **Docker Desktop** uygulamasını açmayı unutma! Sadece yüklemek yetmez, çalışıyor olmalı.

#### Backend Kurulumu (Bir Kez)

```bash
# 1. Backend klasörüne gir
cd watchsync-ai/backend

# 2. Ortam dosyasını oluştur
cp .env.example .env

# 3. Docker container'ları başlat (ilk sefer 5-10 dk sürebilir)
docker compose up -d

# 4. PHP bağımlılıklarını yükle
docker compose exec laravel.test composer install

# 5. Uygulama anahtarı oluştur
docker compose exec laravel.test php artisan key:generate

# 6. Veritabanını kur ve demo veri yükle
docker compose exec laravel.test php artisan migrate --seed

# 7. Test et — aşağıdaki komut token döndürmeli:
curl http://localhost:8000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"demo@watchsync.ai","password":"password"}'
```

#### Frontend Kurulumu (Bir Kez)

```bash
cd watchsync-ai/frontend
npm install
npm run dev
# → http://localhost:3000 açılacak
# → Demo giriş: demo@watchsync.ai / password
```

#### Günlük Kullanım

```bash
# Mac'i açtığında Docker Desktop otomatik başlar.
# Eğer container'lar duraklamışsa:
cd backend
docker compose up -d

# Frontend başlat:
cd ../frontend
npm run dev
```

#### Port Çakışması (MAMP ile)

MAMP açıkken port çakışması olabilir. Çözüm:
- **En kolay:** MAMP'ı kapat (bu proje için gerek yok)
- **MAMP da lazımsa:** `backend/.env` dosyasında portları değiştir:
  ```
  APP_PORT=8001
  FORWARD_DB_PORT=3308
  ```

#### Faydalı Docker Komutları

```bash
# Container durumlarını gör
docker compose ps

# Logları izle
docker compose logs -f laravel.test

# Artisan komutu çalıştır
docker compose exec laravel.test php artisan migrate

# Container'ları durdur (verileri korur)
docker compose stop

# Container'ları tamamen sil (DİKKAT: veritabanı sıfırlanır)
docker compose down -v
```

---

### 📥 İlk Git Kurulumu (BİR KEZ YAPILIR)

```bash
# 1. Repo'yu bilgisayarına indir
git clone https://github.com/mehmetmutllu/watchsync-ai.git
cd watchsync-ai

# 2. develop branch'ine geç (KRİTİK!)
git checkout develop

# 3. Kimliğini ayarla
git config user.name "Berat - Junior"
git config user.email "berat@example.com"

# 4. Doğru branch'te olduğunu kontrol et
git branch
# Çıktı: * develop   ← yıldız develop'ta olmalı
```

---

### 🔄 HER YENİ GÖREV İÇİN DÖNGÜ

#### ✅ Adım 1: Güncel kodu çek
```bash
git checkout develop
git pull origin develop
```
> ⚠️ **Her yeni göreve başlamadan MUTLAKA bunu yap!** Yoksa eski kod üzerinde çalışırsın.

#### ✅ Adım 1.5: Veritabanını güncelle (her pull sonrası)
```bash
cd backend
docker compose exec laravel.test php artisan migrate
cd ..
```
> ⚡ Mehmet yeni tablo veya sütun eklemiş olabilir. Bu komutu çalıştırmazsan frontend'de API hataları alabilirsin.

#### ✅ Adım 2: Yeni branch oluştur
```bash
git checkout -b junior/feature/gorev-adi
```
**Doğru İsimlendirme Örnekleri:**
```
junior/feature/dashboard-ui
junior/feature/login-sayfasi
junior/feature/envanter-tablosu
junior/fix/kpi-kart-hatasi
junior/style/sidebar-renk-duzeltme
```
**YANLIŞ Örnekler:**
```
❌ yeni-degisiklik
❌ test123
❌ berat
❌ feature/dashboard    ← "junior/" prefix'i yok!
```

#### ✅ Adım 3: Kodunu yaz
```
✅ SADECE frontend/ klasöründe çalış
⛔ backend/ → DOKUNMA
⛔ ai-service/ → DOKUNMA
⛔ .github/ → DOKUNMA
⛔ plan.md, design.md, progress.md → Mehmet'e sor
```

#### ✅ Adım 4: Değişiklikleri kaydet
```bash
# 1. Neleri değiştirdin bak
git status

# 2. SADECE frontend klasöründekileri ekle
git add frontend/

# 3. Commit mesajı yaz
git commit -m "feat: KPI kartları bileşeni eklendi"
```

**Commit mesajı kuralı:**
| Prefix | Ne Zaman Kullanılır | Örnek |
|--------|---------------------|-------|
| `feat:` | Yeni özellik | `feat: login sayfası eklendi` |
| `fix:` | Hata düzeltme | `fix: buton tıklama hatası giderildi` |
| `style:` | Sadece CSS/görsel | `style: sidebar rengi güncellendi` |
| `refactor:` | Kod iyileştirme | `refactor: KPI bileşeni parçalandı` |

#### ✅ Adım 5: GitHub'a gönder (push)
```bash
git push origin junior/feature/gorev-adi
```

#### ✅ Adım 6: Pull Request (PR) aç
1. GitHub.com'a git → repo sayfasını aç
2. Üstte sarı banner'da **"Compare & pull request"** butonuna tıkla
3. Ayarları kontrol et:
   - **base:** `develop` ← (main DEĞİL!)
   - **compare:** `junior/feature/gorev-adi`
4. PR şablonundaki kontrol listesini doldur
5. Sağ tarafta **Reviewers** → `mehmetmutllu` seç
6. **"Create pull request"** butonuna tıkla
7. ⏳ **Mehmet'in onayını bekle**

#### ✅ Adım 7: Onaylandıktan sonra
- Mehmet onayladıktan sonra **"Merge pull request"** → **"Confirm merge"**
- **"Delete branch"** butonuna tıkla (dalı temizle)
- Yeni göreve başla → **Adım 1'e dön**

---

## 🔵 MEHMET (SENIOR) İÇİN REHBER

### 🔄 Geliştirme Döngüsü

```bash
# 1. Güncel kodu al
git checkout develop
git pull origin develop

# 2. Yeni dal oluştur
git checkout -b senior/feature/gorev-adi

# 3. Kodunu yaz (backend/ veya ai-service/)

# 4. Kaydet
git add backend/
git commit -m "feat: Redis mutex implementasyonu"
git push origin senior/feature/gorev-adi

# 5. GitHub'da PR aç → develop'a merge et
```

### 👀 Berat'ın PR'larını İnceleme

1. GitHub'da Berat'ın PR'ını aç
2. **"Files changed"** sekmesine tıkla
3. Kontrol listesi:
   - ✅ Sadece `frontend/` klasöründe mi çalışmış?
   - ✅ `.env` veya `backend/` dosyası yok mu?
   - ✅ Gereksiz `console.log` kalmamış mı?
   - ✅ Kod mantıklı ve temiz mi?
4. **Sorun yoksa:** "Approve" → "Merge"
5. **Sorun varsa:** Yorum yaz → Berat düzeltsin → tekrar review

---

## 🔃 KOD ÇEKME (PULL) KURALLARI

### Ne Zaman Pull Yapmalısın?

| Durum | Komut |
|-------|-------|
| Sabah işe başlarken | `git checkout develop` → `git pull origin develop` |
| Yeni branch açmadan önce | `git checkout develop` → `git pull origin develop` |
| Birisi "develop'a merge ettim" dediğinde | `git pull origin develop` |
| Kendi branch'inde çalışırken develop güncellendiyse | Kendi branch'ine geç → `git merge develop` |

### Komut Sırası (Her Gün İlk İş)

```bash
# 1. develop'a geç
git checkout develop

# 2. Güncel kodu çek
git pull origin develop

# 3. Kendi branch'ine geri dön (veya yeni oluştur)
git checkout junior/feature/mevcut-gorevim
# veya
git checkout -b junior/feature/yeni-gorevim
```

---

## 📤 KOD YÜKLEME (PUSH) KURALLARI

### Push Öncesi Kontrol Listesi

```bash
# 1. Doğru branch'te misin?
git branch
# → * junior/feature/xxx   ← Kendi branch'in olmalı
# → ASLA develop veya main olmamalı!

# 2. Neler değişmiş?
git status
# → Sadece frontend/ dosyaları olmalı

# 3. Yanlışlıkla başka dosya ekleme!
git add frontend/          # ✅ DOĞRU: sadece frontend
# git add .                # ⛔ YANLIŞ: her şeyi ekler!
# git add -A               # ⛔ YANLIŞ: her şeyi ekler!

# 4. Commit at
git commit -m "feat: açıklayıcı mesaj"

# 5. Push et
git push origin junior/feature/gorev-adi
```

> ⚠️ **ÖNEMLİ:** `git add .` veya `git add -A` **KULLANMA!** Sadece kendi klasörünü ekle.

---

## ⚠️ ACİL DURUMLAR

### "Yanlış branch'teyim!"
```bash
# Değişiklikleri geçici kaydet
git stash

# Doğru branch'e geç
git checkout junior/feature/dogru-branch

# Değişiklikleri geri al
git stash pop
```

### "Son commit'i geri almak istiyorum"
```bash
# Commit geri alınır ama kodlar kalır
git reset --soft HEAD~1
```

### "develop'daki güncel kodu branch'ime almak istiyorum"
```bash
git checkout junior/feature/benim-branch
git merge develop
# Çakışma (conflict) olursa Mehmet'e sor!
```

### "Yanlışlıkla backend/ klasörünü değiştirdim"
```bash
# Backend değişikliklerini geri al
git checkout -- backend/
```

### "Her şey karıştı, sıfırdan başlamak istiyorum"
```bash
# DİKKAT: Kaydetmediğin tüm değişiklikler SİLİNİR!
git checkout develop
git pull origin develop
git branch -D junior/feature/bozulan-branch
git checkout -b junior/feature/yeni
```

---

## 📊 Faydalı Kontrol Komutları

```bash
# Hangi branch'teyim?
git branch

# Son 10 commit'i gör
git log --oneline -10

# Kimin ne yaptığını gör
git log --oneline --author="Berat" -5
git log --oneline --author="Mehmet" -5

# Branch'ler arasındaki farkı gör
git diff develop..junior/feature/gorev-adi --stat
```

---

## 📅 Günlük İş Akışı Özeti

```
☀️ SABAH:
  git checkout develop → git pull origin develop
  git checkout -b junior/feature/gunun-gorevi

💻 GÜN İÇİ:
  (kodla...)
  git add frontend/
  git commit -m "feat: açıklama"
  (gerekirse birden fazla commit at)

🌙 AKŞAM (veya görev bittiğinde):
  git push origin junior/feature/gunun-gorevi
  GitHub'da PR aç → Mehmet'i reviewer ata
  Mehmet onaylayana kadar bekle veya yeni branch'te başla
```

---

## 🤖 AI İLE ÇALIŞMA REHBERİ (Berat için)

> Bu bölüm, AI asistanla (Claude / Copilot) birlikte frontend geliştirme yaparken izlenecek akışı anlatır.

### 📋 Gerekli Ortam (Bir Kez Kur)

1. **Git** → `git --version` ile kontrol et
2. **Node.js 20+** → `node --version` ile kontrol et (yoksa https://nodejs.org)
3. **VS Code** → GitHub Copilot Chat eklentisi kurulu olmalı
4. **GitHub hesabı** → Mehmet'in davetini kabul et (e-posta veya https://github.com/notifications)

### 🚀 İlk Kurulum Promptu (BİR KEZ YAPILIR)

Aşağıdaki promptu AI chat'e yapıştır. AI her şeyi otomatik yapacak:

```
WatchSync AI projesinde Junior Frontend Developer olarak çalışıyorum.

İLK KURULUM ADIMLARI — Aşağıdakileri sırasıyla yap:
1. Repoyu klonla: git clone https://github.com/mehmetmutllu/watchsync-ai.git
2. develop branch'ine geç: git checkout develop
3. Git kimliğimi ayarla: git config user.name "Berat" ve git config user.email "berat'ın e-postası"
4. Frontend bağımlılıklarını kur: cd frontend && npm install
5. Frontend'i çalıştır: npm run dev
6. Tarayıcıda http://localhost:3000 açılacak — çalıştığını doğrula

Sonra şunları yap:
- activecontext.md dosyasını oku — tamamlanan haftalar, mimari ve proje yapısını öğren
- progress.md dosyasını oku — benim (Junior) yapacağım görevleri bul
- İlk yapılacak görevleri listele ve "Başlayalım mı?" diye sor

NOT: Ben SADECE frontend/ klasöründe çalışıyorum. backend/ ve ai-service/'e DOKUNMAM.
```

### 🔄 Her Oturumda Kullanılacak Devam Promptu

Her yeni AI chat oturumunda aşağıdaki formatı kullan. AI her oturum sonunda sana güncellenmiş bir prompt verecek — onu kopyala ve bir sonraki chat'te yapıştır:

```
WatchSync AI projesinde Junior Frontend Developer olarak devam ediyorum.

ÖNCELİKLE:
1. git checkout develop && git pull origin develop (güncel kodu çek)
2. activecontext.md dosyasını oku — proje durumu ve mimari bilgisi orada
3. progress.md dosyasını oku — Junior görevlerimin durumunu gör

YAPILACAK GÖREVLER:
[Buraya mevcut haftanın Junior görevlerini yaz — Mehmet sana söyleyecek]

KURALLAR:
- SADECE frontend/ klasöründe çalış. backend/ ve ai-service/ DOKUNULMAZ.
- Her değişiklikte build kontrolü yap: npm run build
- Commit prefix: feat: / fix: / style: / refactor:
- Branch adı: junior/feature/[görev-adı]

GÖREV BİTTİĞİNDE (HER OTURUM SONUNDA MUTLAKA YAP):
1. Tüm değişiklikleri commit et: git add frontend/ && git commit -m "feat: açıklama"
2. Push et: git push origin junior/feature/[branch-adı]
3. activecontext.md dosyasını güncelle — ne yaptığını, hangi dosyaları oluşturduğunu yaz
4. progress.md dosyasını güncelle — tamamlanan Junior görevlerinin checkbox'larını [x] yap
5. Bana kopyalanabilir bir DEVAM PROMPTU üret — aşağıdaki şablonda:

--- KOPYALA BAŞLA ---
WatchSync AI projesinde Junior Frontend Developer olarak devam ediyorum.

ÖNCELİKLE:
1. git checkout develop && git pull origin develop
2. activecontext.md dosyasını oku
3. progress.md dosyasını oku

YAPILACAK GÖREVLER:
[Tamamlanmamış kalan Junior görevleri + sıradaki hafta]

SON OTURUMDA YAPILAN:
[Bu oturumda tamamlanan görevlerin kısa özeti]

KURALLAR:
- SADECE frontend/ klasöründe çalış
- Her değişiklikte build kontrolü: npm run build
- Branch: junior/feature/[görev-adı]

GÖREV BİTTİĞİNDE:
1. Commit + push
2. activecontext.md güncelle
3. progress.md güncelle
4. Yeni devam promptu üret
--- KOPYALA BİTİR ---
```

### 💡 Oturum Akışı Özeti

```
┌─────────────────────────────────────────────────────────┐
│  1. Yeni AI Chat aç                                     │
│  2. Devam promptunu yapıştır (ilk seferde kurulum       │
│     promptunu kullan)                                    │
│  3. AI otomatik olarak:                                  │
│     - Kodu çeker (git pull)                              │
│     - Proje durumunu okur                                │
│     - Görevleri listeler                                 │
│     - "Başlayalım mı?" der                              │
│  4. "Başla" de → AI kodlamaya başlar                     │
│  5. Görev bitince AI otomatik olarak:                    │
│     - Commit + push yapar                                │
│     - Dokümanları günceller                              │
│     - Yeni devam promptu üretir                          │
│  6. Promptu kopyala → yeni chat'e yapıştır → Adım 1     │
└─────────────────────────────────────────────────────────┘
```

### ⚠️ ÖNEMLİ UYARILAR

- **Backend Docker çalışıyor olmalı** — Frontend API'ye bağlanır. Eğer backend çalışmıyorsa Mehmet'e sor.
- **`npm run build` her zaman başarılı olmalı** — Build hata veriyorsa push YAPMA, önce düzelt.
- **PR açmayı unutma** — Push yaptıktan sonra GitHub'da Pull Request aç ve Mehmet'i reviewer ata.
- **Commit mesajları anlamlı olsun** — "düzeltme" veya "test" gibi mesajlar YASAK.
- **Branch isimlendirmesi** — Her zaman `junior/feature/görev-adı` formatında.

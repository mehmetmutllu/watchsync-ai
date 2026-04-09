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

### 📥 İlk Kurulum (BİR KEZ YAPILIR)

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

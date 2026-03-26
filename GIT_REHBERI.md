# 🔀 WatchSync AI — Git Çalışma Rehberi

> Bu dosya, projedeki iki geliştiricinin Git ile nasıl çalışacağını adım adım anlatır.  
> **Dikkatsiz arkadaşın bile bozamayacağı kadar basit bir sistem.**

---

## 📌 Branch Yapısı

```
main        ← Canlı kod. KİMSE DOKUNMAZ.
develop     ← Tüm geliştirme buraya merge olur.
  ├── senior/feature/xxx   ← Senior'un dalları
  └── junior/feature/xxx   ← Junior'un dalları
```

---

## 🚦 JUNIOR İÇİN ADIM ADIM REHBER

### 📥 İlk Kurulum (Bir Kez Yapılır)

```bash
# 1. Repo'yu bilgisayarına indir
git clone https://github.com/KULLANICI/watchsync-ai.git
cd watchsync-ai

# 2. develop branch'ine geç
git checkout develop

# 3. Kimliğini ayarla (kendi adını ve e-postanı yaz)
git config user.name "Ali - Junior"
git config user.email "ali@example.com"
```

---

### 🔄 Her Yeni Görev İçin (Tekrarlanan Döngü)

#### Adım 1: Güncel kodu al
```bash
git checkout develop
git pull origin develop
```

#### Adım 2: Yeni bir dal (branch) oluştur
```bash
# İsimlendirme: junior/feature/gorev-adi
git checkout -b junior/feature/dashboard-ui
```

> ⚠️ **KURAL:** Branch adı her zaman `junior/feature/` ile başlamalı!

#### Adım 3: Kodunu yaz
```
✅ SADECE frontend/ klasöründe çalış
⛔ backend/ klasörüne ASLA dokunma
⛔ ai-service/ klasörüne ASLA dokunma
```

#### Adım 4: Değişiklikleri kaydet (commit)
```bash
# Neleri değiştirdiğini gör
git status

# Sadece frontend klasöründeki değişiklikleri ekle
git add frontend/

# Anlamlı bir mesajla kaydet
git commit -m "feat: KPI kartları bileşeni eklendi"
```

**Commit mesajı kuralı:**
| Prefix | Ne Zaman |
|--------|----------|
| `feat:` | Yeni özellik |
| `fix:` | Hata düzeltme |
| `style:` | CSS/tasarım değişikliği |
| `refactor:` | Kod iyileştirme |

#### Adım 5: GitHub'a gönder
```bash
git push origin junior/feature/dashboard-ui
```

#### Adım 6: Pull Request (PR) aç
1. GitHub'a git → `junior/feature/dashboard-ui` dalını gör
2. **"Compare & pull request"** butonuna tıkla
3. **Base branch**: `develop` olduğundan emin ol
4. PR şablonundaki kontrol listesini doldur
5. **Senior'u reviewer olarak ata**
6. **"Create pull request"** butonuna tıkla
7. ⏳ Senior'un onayını bekle

#### Adım 7: Onay sonrası merge
- Senior onayladıktan sonra **"Merge pull request"** butonuna tıkla
- **"Delete branch"** butonuna tıkla (dalı temizle)

#### Adım 8: Yeni göreve başla → Adım 1'e dön

---

## 🔧 SENIOR İÇİN ADIM ADIM REHBER

### 📥 İlk Kurulum (Bir Kez Yapılır)

```bash
git clone https://github.com/KULLANICI/watchsync-ai.git
cd watchsync-ai
git checkout develop

git config user.name "Mehmet - Senior"
git config user.email "mehmet@example.com"
```

### 🔄 Geliştirme Döngüsü

```bash
# 1. Güncel kodu al
git checkout develop
git pull origin develop

# 2. Yeni dal oluştur
git checkout -b senior/feature/redis-lock

# 3. Kodunu yaz (backend/ veya ai-service/ klasörlerinde)

# 4. Kaydet ve gönder
git add backend/
git commit -m "feat: Redis mutex implementasyonu"
git push origin senior/feature/redis-lock

# 5. GitHub'da PR aç → develop'a merge et
```

### 👀 Junior'un PR'larını İnceleme

1. GitHub'da Junior'un PR'ını aç
2. **"Files changed"** sekmesine git
3. Kontrol et:
   - ✅ Sadece `frontend/` klasöründe mi çalışmış?
   - ✅ Gereksiz dosya eklememiş mi?
   - ✅ Kod kalitesi yeterli mi?
4. Sorun yoksa → **"Approve"** → **"Merge"**
5. Sorun varsa → Yorum yaz, Junior düzeltsin

---

## ⚠️ ACİL DURUMLAR

### "Yanlış branch'teyim, commit'i geri almak istiyorum"
```bash
# Son commit'i geri al (kod değişiklikleri kalır)
git reset --soft HEAD~1
```

### "develop'daki güncel kodu kendi branch'ime almak istiyorum"
```bash
git checkout junior/feature/benim-branch
git merge develop
```

### "Yanlışlıkla backend/ klasörünü değiştirdim"
```bash
# backend klasöründeki değişiklikleri geri al
git checkout -- backend/
```

### "Her şeyi bozdumm, temiz başlamak istiyorum"
```bash
# DİKKAT: Kaydedilmemiş tüm değişiklikler silinir!
git checkout develop
git pull origin develop
git branch -D junior/feature/bozulan-branch
# Yeniden başla
git checkout -b junior/feature/yeni-baslangic
```

---

## 📊 Branch Durumu Kontrol Komutu

```bash
# Hangi branch'teyim?
git branch

# Tüm branch'leri gör
git branch -a

# Son commit'leri gör
git log --oneline -10

# Değişiklikleri gör
git status
```

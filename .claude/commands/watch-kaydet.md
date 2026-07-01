---
description: Oturumu kaydet — md'leri güncelle, memory işaretçisini yaz, commit & push
---

Bu oturumu kaydet. Sırayla yap ve her adımı raporla:

1. **activecontext.md** güncelle:
   - Başlıktaki "Son Güncelleme" tarihini bugüne çek.
   - En alttaki `## 📌 Son Oturum` bloğunu güncelle (yoksa oluştur). İçerik:
     - **Yapılanlar:** bu oturumda tamamlanan somut işler (dosya/uç/karar).
     - **Mevcut durum:** neyin çalıştığı, neyin yarım kaldığı.
     - **Sonraki adımlar:** bir sonraki chat'in ilk yapacakları (net, sıralı).
2. **progress.md**: bu oturumda tamamlanan checkbox'ları `[x]` yap; aktif aşamanın özet tablosunu güncelle.
3. **Memory** (bu projeye özel, `~/.claude/projects/C--xampp-watchsync-ai/memory/`):
   - `project_watchsync.md` dosyasındaki "Aktif durum" satırını güncel odağa göre güncelle.
   - Gerekliyse `MEMORY.md` indeksini düzelt. (Tam planı KOPYALAMA — repo docs kaynak-of-truth; memory sadece işaretçi.)
4. **Git**:
   - `git status --short` ile değişenleri gör.
   - Yalnız izlenen doküman/kod dosyalarını stage'le. **Asla** `.env*`, credential, `vendor/`, `node_modules/`, `backend/storage/logs/` ekleme.
   - Conventional commit at (ör. `docs: oturum kaydı ve Aşama 7 ilerlemesi` veya yapılan işe uygun `feat:/fix:`).
   - Mevcut dala **push** et. Dal `main` ise push etme; kullanıcıyı uyar ve feature/develop öner.
5. Kullanıcıya bildir: "Kaydedildi. `/clear` atabilirsin; sonra `/watch-devam` ile kaldığımız yerden devam ederiz." Commit hash + push hedefini yaz.

Not: Commit öncesi hangi dosyaları stage'lediğini kısaca listele.

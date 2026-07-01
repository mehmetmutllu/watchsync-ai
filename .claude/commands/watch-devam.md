---
description: Önceki oturumdan devam et — bağlamı yükle, kaldığımız yeri özetle, devam et
---

Önceki oturumdan devam ediyoruz. Sırayla yap:

1. Oku (bu sırayla):
   - `CLAUDE.md` (ortam + ritüel + aktif odak)
   - `activecontext.md` → özellikle `## 📌 Son Oturum` ve aktif aşamanın DETAYLI spec bölümü
   - `progress.md` → aktif aşamanın checklist'i (nerede kalındı)
   - Bu projeye özel memory (`~/.claude/projects/C--xampp-watchsync-ai/memory/`)
2. Ortamı doğrula (gerekliyse): PHP 8.3 (`C:\php83`), backend :8001, frontend :3000, MariaDB :3307. Sunucular ayakta değilse `start-dev.bat` öner.
3. Kısa bir **"Kaldığımız yer + sıradaki 1-3 adım"** özeti çıkar (uzun anlatma).
4. Onay iste: "Buradan devam edeyim mi, yoksa başka bir şeye mi geçelim?" — onay gelince uygula.

Not: Memory veya doküman güncel değilse, koda/`git log`'a bakıp doğrula; çelişki varsa mevcut kod durumuna güven.

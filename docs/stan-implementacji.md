# Stan implementacji vs dokumentacja

Odniesienie do [media-i-reklamy.md](./media-i-reklamy.md). Ostatnia aktualizacja: **2026-11-02** (wdrożenie biblioteki mediów).

Legenda: ✅ zrobione · 🟡 częściowo · ⬜ zaplanowane · ❌ brak

---

## Persystencja

| Element | Stan | Uwagi |
|---------|------|--------|
| Tabela `shows` | ✅ | Neon, seed IWMTV / MCS |
| Tabela `ads` | ✅ | Slot = break + slot_index + metadane lotu |
| Tabela `media_assets` | ✅ | `kind`, poster + opcjonalne video |
| `ads.media_asset_id` | ✅ | FK, ON DELETE SET NULL |
| Legacy `frame_grab_url`, `video_url` na slocie | ✅ | Denormalizacja przy zapisie + join przy odczycie |

---

## Vercel Blob

| Element | Stan | Uwagi |
|---------|------|--------|
| `POST /api/media` | ✅ | `media/{id}/poster.*`, opcj. `preview.mp4` |
| `POST /api/media/upload` | ✅ | Legacy `spots/…` (deprecated) |
| `DELETE /api/media/[id]` | ✅ | Kasuje pliki + wiersz; 409 gdy sloty odwołują |
| Orphan cleanup | 🟡 | Filtr „0 spots” w UI; brak masowego delete |

---

## Upload i frame grab

| Element | Stan | Uwagi |
|---------|------|--------|
| Upload JPG-only → asset | ✅ | `image_only` |
| Upload MP4 + auto poster | ✅ | Canvas w przeglądarce (`extract-video-poster.ts`) |
| Kompresja 480p | ✅ | Media library + formularz slotu |
| Duration z metadanych pliku | ✅ | Przy uploadzie video w formularzu slotu |

---

## UI admin

| Element | Stan | Uwagi |
|---------|------|--------|
| **Media library** (sidebar) | ✅ | Browse, upload, preview, delete |
| Formularz slotu — picker biblioteki | ✅ | `NewAdModal` |
| Ten sam asset w wielu breakach | ✅ | Ten sam `media_asset_id` na wielu ads |
| Podgląd bez play (sam JPG) | ✅ | `AdPreviewModal` — brak zakładek video |

---

## API

| Element | Stan | Uwagi |
|---------|------|--------|
| `GET/POST /api/media` | ✅ | |
| `GET/PATCH/DELETE /api/media/[id]` | ✅ | PATCH = etykieta |
| `GET /api/timeline` | ✅ | Join media → resolved URL-e |
| Migracja starych URL → assets | ⬜ | Ręcznie: nowy upload / przypisanie |

---

## Następne kroki (opcjonalnie)

1. Skrypt migracji: legacy `spots/` → `media/{id}/` + wiersze `media_assets`.
2. Edycja postera / podmiana plików na istniejącym assetcie (PATCH multipart).
3. Etykieta media inline w bibliotece (PATCH już jest w API).

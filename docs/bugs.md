# Known bugs & open issues

Last updated: **2026-11-02**

---

## BUG-001 — Media library: poster frame picker vs on-screen video / thumbnails

**Status:** Open (partial fixes shipped; user reports still broken in production)

**Area:** Editing → Media library → **Pick poster frame** (existing `video_and_poster` assets)

### Expected behaviour

1. User opens **Pick poster frame** for an uploaded MP4.
2. Scrubbing the timeline updates **both** the large preview and the **Poster preview** JPEG panel to the same frame.
3. **Save poster frame** uploads a new JPG to Blob, updates `media_assets.poster_url`, and syncs `ads.frame_grab_url` for linked spots.
4. After save, **library cards**, **preview modal**, and **spot thumbnails** show the **new** poster (not a cached or first-frame image).
5. While scrubbing (before save), the visible video area should reflect the selected frame, not stay on the old poster or t=0.

### Reported actual behaviour (2026-11-02)

- Progress: slider no longer resets to ~1s after opening the picker (fixed in `2938e58`).
- Progress: **Poster preview** (right panel) updates when scrubbing after same-origin video proxy (`3035562`).
- **Still broken:**
  - User: *“The frame can be selected [for save] but the **video still shows the old frame**.”*
  - Interpretation: either (A) the **main player** in the picker does not visually track the scrubbed frame, and/or (B) **after save**, `<video>` elements (library grid, preview modal, spot preview) continue to show the **previous poster/first frame** despite a successful PATCH and updated DB row.

### Likely causes (hypotheses)

| # | Hypothesis | Notes |
|---|------------|--------|
| 1 | **Browser `<video>` paint lag** | `currentTime` seeks correctly for canvas capture, but the decoded frame is not repainted in the `<video>` element until play/pause or a keyframe. Overlay JPG mitigates this in the picker only if `seeked` → canvas → overlay runs reliably. |
| 2 | **Poster attribute / first-frame dominance** | Thumbnails used `<video poster={url}>` so the UI showed the **poster image** until full playback, masking seeked frames. Partially addressed by using `<img>` for cards when a real JPG poster exists. |
| 3 | **Blob URL cache** | Overwriting `media/{id}/poster.jpg` keeps the **same public URL**; browsers and CDNs cache the old JPG. Mitigation: `?v={updatedAt}` via `mediaAssetPosterSrc()` / `adPosterSrc()`. May fail if `updatedAt` is unchanged client-side, query params are stripped, or spot list is not reloaded after PATCH. |
| 4 | **Stale client timeline state** | `replaceMediaAssetPoster` updates Neon and returns fresh `MediaAsset`, but **ads** in memory on `/` still hold old `frameGrabUrl` / `updatedAt` until full timeline reload. Cache-bust on spots only works after refetch. |
| 5 | **Range / seek on proxied MP4** | `GET /api/media/[id]/preview-video` forwards `Range` to Blob; if range seeking fails in some browsers, scrubbing may not decode new frames (canvas might still read one frozen buffer). Needs verification with Network tab (206 responses). |
| 6 | **CORS / taint (legacy path)** | Direct Blob URLs for existing assets tainted canvas (404 on old ffmpeg CDN was a separate issue). Replace flow should use same-origin proxy only; confirm no code path still sets `video.src` to `blob.vercel-storage.com` in the picker. |

### Reproduction (admin)

1. Log in → **Editing** → **Media library**.
2. Upload or pick an asset with **Video + poster**.
3. **Pick poster frame** → scrub to a clearly different time (e.g. middle of clip).
4. Observe large video area vs **Poster preview** vs time readout.
5. **Save poster frame** → close modal.
6. Check card thumbnail and **Preview** modal (video with `poster` attribute).
7. Open **Spots & breaks** without hard refresh — check spot thumb for linked ads.

### Related code

| Path | Role |
|------|------|
| `src/components/VideoFramePickerModal.tsx` | Scrub UI, canvas capture, overlay preview |
| `src/app/api/media/[id]/preview-video/route.ts` | Same-origin MP4 stream + Range |
| `src/lib/media-client-upload.ts` | `replaceMediaAssetPoster()` — Blob upload + PATCH |
| `src/lib/db/media-repository.ts` | `updateMediaAssetPoster()` — DB + `ads.frame_grab_url` |
| `src/lib/media-display.ts` | `cacheBustedUrl`, `mediaAssetPosterSrc`, `adPosterSrc` |
| `src/components/MediaLibraryPanel.tsx` | Grid / preview / picker entry points |

### Fixes attempted (git)

| Commit | Intent |
|--------|--------|
| `2938e58` | Stop picker from resetting scrub on re-render |
| `3035562` | Same-origin `preview-video` proxy for seek + canvas |
| `2481138` | Overlay captured frame on player; cache-bust poster URLs; card `<img>` thumbs |

### Suggested next steps (engineering)

1. **Verify save path:** After PATCH, confirm Blob object and DB `poster_url` / `updated_at`; download poster URL with and without `?v=`.
2. **Picker UX:** Consider single visible surface (only `<img>` from canvas, hidden `<video>` for seek) or force frame repaint (`requestVideoFrameCallback`, short `play()` then `pause()` after each seek).
3. **After save:** Refetch `GET /api/timeline` (or patch ads in memory) when poster changes and linked `referenceCount > 0`.
4. **Optional:** Store poster version in DB (`poster_version` integer) or append version to stored URL on each overwrite.
5. **E2E test:** Playwright — scrub, assert preview pixel or data URL hash changes; save, assert card `img` src query param changes.

### Workaround (operators)

- After changing poster, **hard refresh** the admin app and re-open **Media library**.
- For spots, use **Refresh** on the page or reload timeline data before checking thumbs / client link.

---

_Add new issues below with IDs `BUG-002`, …_

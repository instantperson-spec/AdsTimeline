# Ads Timeline & Commercial Expiration Tracker 📺
### System Zarządzania Ramówką Reklamową & Monitorowania Dat Ważności Spotów Time-Sensitive

Aplikacja stworzona dla **Instant Productions** do planowania, prezentacji i śledzenia horyzontu czasowego (flight dates) dla reklam telewizyjnych.

Głównym celem systemu jest **precyzyjne monitorowanie kiedy zdjąć reklamę z ramówki**, aby nie dopuścić do wyemitowania przeterminowanego materiału (np. zwiastuna trasy koncertowej, której termin już minął).

---

## 🚀 Kluczowe Funkcjonalności

### 1. Show & Break Structure (Audycje & Bloki Reklamowe)
* **Przykład wdrożeniowy: Show 1. Ireland West Music TV**
  * Posiada 3 dedykowane przerwy reklamowe (Break 1, Break 2, Break 3).
  * Każda przerwa zawiera poszczególne sloty reklamowe (Slot 1, Slot 2...).
* Obsługa wielu audycji jednocześnie (np. *Ireland West Music TV*, *Country Music Spotlight*, *Celtic Sessions Live*) lub filtrowanie do pojedynczego programu.
* Możliwość dynamicznego dodawania i usuwania programów TV (`+ Nowy Show`).

### 2. Time-Sensitive Expiration Radar (Centrum Zdejmowania Reklam)
* Automatyczne wyliczanie statusu na podstawie daty końcowej (`endDate`):
  * 🔴 **Przeterminowana (Expired)**: data końcowa minęła (np. koncert odbył się wczoraj) — **czerwony alarm dźwiękowo-wizualny** nakazujący natychmiastowe zdjęcie z ramówki przed kolejną emisją.
  * 🟡 **Wygasająca (Expiring Soon)**: pozostało $\le 5$ dni do końca — ostrzeżenie dla traffic managera, aby przygotować podmianę materiału.
  * 🟢 **Aktywna (Active)**: spot w bezpiecznym oknie czasowym.
  * ⚪ **Zdjęta z anteny (Taken Off)**: zarchiwizowana z adnotacją o zrealizowanej podmianie (np. wstawiony zwiastun stacji).
* Akcja jednym kliknięciem: **„Zdejmij z anteny (Podmień)”** z polem na wpisanie materiału zastępczego (np. *„Zastąpiono zwiastunem stacji IWMTV 30s”*).

### 3. Cztery Tryby Prezentacji (Widoki)
1. **Oś Czasu (Gantt Timeline)**:
   * Pozioma oś czasu z paskami emisji dla każdego bloku reklamowego.
   * Widoczny znacznik **„DZIŚ”** oraz dynamiczne wskaźniki odliczania (*„Zostało: 3 dni”*, *„Przeterminowana 1 dzień temu!”*).
   * Skalowanie horyzontu (14 dni, 30 dni, 45 dni).
2. **Bloki Reklamowe (Matrix)**:
   * Przegląd per blok (Break 1, Break 2, Break 3) z kafelkami spotów, klatką z wideo, łącznym czasem trwania i przyciskiem szybkiego wstawiania spotu do danego bloku.
3. **Kalendarz Emisji (Monthly Calendar)**:
   * Widok miesięczny z flagami dni końcowych spotów (🚩 termin zdjęcia) oraz podglądem emisji w wybranym dniu.
4. **Centrum Zdejmowania (Urgent Radar)**:
   * Dedykowana tablica krytyczna filtrująca wyłącznie materiały wygasające i przeterminowane.

### 4. Podgląd Wideo & Klatek (20-30s H.264 HD)
* Każda reklama posiada klatkę z wideo (frame grab) oraz odtwarzacz wideo proxy (20-30s H.264 HD) z pełną kontrolą odtwarzania.
* Możliwość wgrywania własnych plików MP4 lub grafik klatek z poziomu przeglądarki.

### 5. Traffic Cue Sheet (Rozpiska dla Reżyserki / MCR)
* Generowanie oficjalnej rozpiski emisyjnej dla Master Control Room (MCR) z wykazem bloków, slotów, kodów czasowych i dyspozycji podmiany.
* Gotowość do druku (PDF / Print layout) oraz eksport do arkusza CSV.

---

## 🛠️ Uruchomienie Lokalne & Wdrożenie na Vercel

### Uruchomienie lokalne:
```bash
cd "/Volumes/ENV/INSTANT PRODUCTIONS/Ads_timeline"
npm run dev
```
Aplikacja uruchomi się domyślnie pod adresem `http://localhost:3000`.

### Budowanie produkcyjne:
```bash
npm run build
```

### Wdrożenie na Vercel:
Aplikacja jest w 100% zoptymalizowana pod Vercel (Next.js 16 App Router, Turbopack, Tailwind CSS v4):
1. Zaloguj się do CLI Vercel: `npx vercel`
2. Lub połącz repozytorium GitHub w panelu [vercel.com](https://vercel.com).


# Ads Timeline — Instant Productions

Commercial schedule and **pull-by date** tracker for **Faith World TV**, built for **Instant Productions**.

The app helps traffic and production control **when each spot must leave the air** (concert tours, festivals, time-sensitive promos) and gives publishers a **read-only client link** without admin controls.

---

## Programmes (seed data)

On first load (no saved data in the browser), two real programmes are created:

| Code   | Programme                 | Schedule                         | Breaks |
|--------|---------------------------|----------------------------------|--------|
| IWMTV  | Ireland West Music TV     | Wednesdays 22:00 GMT             | 3      |
| MCS    | The Michael Commins Show  | Wednesdays 23:00 GMT             | 2      |

**No demo commercials** are shipped — add spots in the admin **Edit panel**.

---

## Features

### Admin (`/`)

- **Sign in:** `/login` with `ADMIN_PASSWORD` (session cookie, 7 days). Client `/client` stays public.
- **Sidebar:** Cards & schedule, Full timeline (Gantt), Edit panel (breaks / slots / Pull & Restore).
- **Shows:** filter all programmes or one show; add show, add ad, MCR cue sheet.
- **Client link:** choose programme (or all), spot list and/or timeline; copy URL for the publisher.
- **Ad preview:** video + frame grab (URLs or file pick — blob/Neon planned for production).

### Client (`/client`)

Read-only view driven **only** by the link the admin generates:

| Query    | Values |
|----------|--------|
| `show`   | `all`, `IWMTV`, `MCS`, or internal show id |
| `view`   | `list`, `timeline`, or `list,timeline` (tabs when both) |

Example: `/client?show=IWMTV&view=list,timeline`

---

## Tech stack

- **Next.js 16** (App Router), React 19, Tailwind CSS v4
- **Persistence:** Neon Postgres (shows + ads metadata)
- **Media:** Vercel Blob (upload via `/api/media/upload`)

Sample MP4/Unsplash demo assets are **not** included. Placeholder poster: `/placeholder-poster.svg`.

---

## Local development

```bash
git clone https://github.com/instantperson-spec/AdsTimeline.git
cd AdsTimeline
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (admin) and [http://localhost:3000/client?show=all&view=list](http://localhost:3000/client?show=all&view=list) (client).

### Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string (pooled recommended) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token (for media uploads) |
| `ADMIN_PASSWORD` | Password for the admin panel (`/` and write APIs) |
| `SESSION_SECRET` | Random string used to sign admin session cookies |

On first API request the app creates tables and seeds **IWMTV** / **MCS** if the database is empty.

```bash
npm run build   # production build
npm start       # run production server locally
```

---

## Deploy on Vercel

1. Import [github.com/instantperson-spec/AdsTimeline](https://github.com/instantperson-spec/AdsTimeline) in the Vercel dashboard, **or**:
2. From the project directory: `npx vercel --prod` (use project name e.g. `ads-timeline` if the folder path contains spaces).

Framework preset: **Next.js**.

1. Create a [Neon](https://neon.tech) project and add **`DATABASE_URL`** to the Vercel project (Production + Preview).
2. In Vercel → **Storage** → create a **Blob** store linked to `ads-timeline`; **`BLOB_READ_WRITE_TOKEN`** is added automatically.
3. Set **`ADMIN_PASSWORD`** and **`SESSION_SECRET`** on Vercel.
4. Disable **Vercel Authentication** (Deployment Protection) on the project so `/client` works without a Vercel login — admin remains protected by app password.
5. Redeploy after env changes.

---

## Repository layout

```
src/app/page.tsx          Admin application
src/app/client/page.tsx   Client portal (URL params)
src/lib/mock-data.ts      Real programmes only; empty ads
src/lib/client-portal-url.ts   Client link builders
src/components/           UI (timeline, edit matrix, modals)
```

---

## License & contact

Private project for **Instant Productions** / **Faith World TV**.  
Questions: Instant Productions traffic / production contact.

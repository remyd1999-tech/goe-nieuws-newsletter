# Goe Nieuws · Newsletter builder

Modular section-based newsletter editor with live email-safe HTML preview and Brevo sending.

## Stack

- Next.js App Router
- Table-based HTML email (Outlook / Gmail / Apple Mail)
- Helvetica/Arial (sans) + Georgia (serif)
- Brevo transactional + campaign send via `/api/send`

## Local

```bash
npm install
cp .env.example .env.local   # fill BREVO_API_KEY + BREVO_SENDER_EMAIL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

The draft is a list of **sections**, each with:

- `font`: `sans` | `serif`
- `dividerAfter`: dotted `····` separator
- `blocks`: `text` | `image` (drag-drop) | `meta` | `framedTitle`

Spacing tokens (`text` / `image` / `divider` / `padX`) set defaults; each block can override pad top/bottom.

## Brevo

Needs a **Node server** (local or Vercel). GitHub Pages is static — send won’t work there.

| Env | Role |
|-----|------|
| `BREVO_API_KEY` | API key |
| `BREVO_SENDER_EMAIL` | Verified sender |
| `BREVO_SENDER_NAME` | Optional display name |
| `BREVO_LIST_ID` | Optional default campaign list |

- **Send test** → transactional `POST /v3/smtp/email`
- **Send to list** → create campaign + `sendNow`

Images in the HTML must be absolute URLs when sending (preview already rewrites with the current origin). Data-URL uploads work for tests but are heavy; prefer hosted `/assets/…` or a CDN for production sends.

## GitHub Pages

Public URL after deploy:

**https://remyd1999-tech.github.io/goe-nieuws-newsletter/**

Build sets `GITHUB_PAGES=true` → static `output: "export"` (no API).

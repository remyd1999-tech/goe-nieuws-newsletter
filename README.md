# Goe Nieuws · Newsletter builder

Interface to prepare the monthly Goe Nieuws newsletter, with live email-safe HTML preview. Brevo sending comes later.

## Stack

- Next.js (App Router, static export)
- Table-based HTML email (Outlook-friendly)
- Times New Roman + serif fallbacks
- Brevo stub in `src/lib/brevo.ts`

## Local

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub Pages

Public URL (after first deploy):

**https://remyd1999-tech.github.io/goe-nieuws-newsletter/**

1. Repo → **Settings → Pages**
2. Source: **GitHub Actions**
3. Push to `main` (or run the **Deploy GitHub Pages** workflow)

Build uses `GITHUB_PAGES=true` → `basePath` `/goe-nieuws-newsletter`.

## Newsletter structure

1. Logo  
2. Tagline  
3. Cover  
4. Label (e.g. `CHAPTER TWO`)  
5. Title  
6. Body (paragraphs + images)  
7. Socials + note + Brevo `{{ unsubscribe }}`

## Brevo (later)

Needs a server (not GitHub Pages). Use Vercel/Netlify or a small API for sending.

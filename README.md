# Goe Nieuws · Newsletter builder

Petite interface pour préparer la newsletter mensuelle informative de **Goe Nieuws**, avec preview HTML email-safe. L’envoi Brevo se branche ensuite.

## Stack

- Next.js (App Router)
- Template HTML table-based (Outlook-friendly)
- Times New Roman + fallbacks serif
- Stub Brevo dans `src/lib/brevo.ts`

## Démarrer

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Structure newsletter

1. Logo  
2. Tagline (NL + EN)  
3. Cover  
4. Label (ex. `CHAPTER TWO`)  
5. Titre  
6. Corps (paragraphes + images intercalées)  
7. Socials + note + unsubscribe Brevo `{{ unsubscribe }}`

## Assets

- `public/assets/cover.jpg` — cover OK  
- `public/assets/image-2.png` — illustration OK  
- `public/assets/logo.svg` / `scribbles.svg` — recréés (les exports Figma logo/tagline/image-1 étaient quasi noirs, souvent un fond transparent exporté en JPEG)

Re-exporte depuis Figma en **PNG fond blanc** si tu veux les originaux.

## Brevo (plus tard)

1. Créer une clé API Brevo  
2. Ajouter `BREVO_API_KEY` dans `.env.local`  
3. Brancher `src/lib/brevo.ts` + une route `/api/send`  
4. Héberger les images en URL absolue (Brevo ne voit pas `localhost`)

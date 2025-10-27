<div align="center">
<img src="https://github.com/dandanthedev/studytools-themestore/blob/main/public/logo.png?raw=true" alt="Studytools Logo" width="200">
<h1>StudyTools ThemeStore</h1>
<p>Een thema marketplace voor <a href="https://qkeleq10.github.io/studytools">StudyTools</a></p>
</div>

## Installeren
1. Clone de repo
2. Installeer de dependencies met `bun install`. Hiervoor moet je [Bun](https://bun.sh/) geinstalleerd hebben.
3. Start de frontend met `bun run dev`.
4. Open een nieuwe terminal en start de backend met `bunx convex dev --local`.
5. Wacht totdat de backend is opgestart en open hierna nog een nieuwe terminal.
6. Voer `bunx @convex-dev/auth` uit en volg de instructies om de auth environment in te stellen.
7. Stel een [Resend](https://resend.com/api-keys) key in met `bunx convex env set AUTH_RESEND_KEY <key>`. (Deze key is voor nu nog verplicht, in de toekomst komt er een bypass voor dev environments)
8. Sluit de terminal waar je net de auth en resend key hebt ingesteld. Je hebt nu de frontend en de backend opgestart.

## Opstarten
Na installatie kan je de frontend en de backend op de volgende manier starten:
- Frontend: `bun run dev`
- Backend: `bunx convex dev --local`

Je kunt de database beheren op `https://dashboard.convex.dev`.

# Architecture

De frontend is gebouwd met [Next.js](https://nextjs.org/). We maken gebruik van app router. Dit is te vinden in de `app` folder.

De backend is gebouwd met [Convex](https://convex.dev/). De backend routes kun je vinden in de `convex/functions` folder.
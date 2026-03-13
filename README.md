# Fraktbrev – Farlig Gods

ADR-fraktbrevsystem for generering av farlig gods-dokumenter med automatisk poengberegning, faremerker og Brreg-integrasjon.

## Funksjoner

- **Komplett ADR-database** – Alle 9 fareklasser med 90+ UN-koder
- **Poengberegning** – Automatisk utregning iht. ADR 1.1.3.6 (1000-poengregelen)
- **Brreg-oppslag** – Søk på org.nr. eller firmanavn, autoutfylling av adressedata
- **Fraktbrev i 4 kopier** – Avsender, transportør, mottaker, ekstra (fargekodede)
- **Faremerker** – ADR-faresedler, UN-etiketter, lithiumbatteri-etikett, orienteringspiler
- **Validering** – Obligatoriske felt, vektkontroll (netto vs. brutto)
- **Mobiltilpasset** – Responsivt design med kort-layout på mobil
- **PDF-utskrift** – Skriv ut via nettleserens print-dialog

## Kom i gang

```bash
# Installer avhengigheter
npm install

# Start utviklingsserver
npm run dev

# Bygg for produksjon
npm run build
```

## Deploy til Render (via GitHub)

1. **Push til GitHub:**
```bash
cd fraktbrev-farlig-gods
git init
git add .
git commit -m "Fraktbrev farlig gods - initial"
gh repo create fraktbrev-farlig-gods --public --push --source=.
```

2. **Koble til Render:**
   - Gå til [dashboard.render.com](https://dashboard.render.com)
   - Klikk **New** → **Static Site**
   - Koble til GitHub-repoet ditt
   - Render leser automatisk `render.yaml` – trykk **Create Static Site**
   - Vent ca. 1-2 min på deploy

Alternativt uten `render.yaml`:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

## Deploy til Vercel

```bash
# Alt 1: Via Vercel CLI
npm i -g vercel
vercel

# Alt 2: Koble til GitHub-repo i Vercel Dashboard
# Build command: npm run build
# Output directory: dist
```

## Deploy til Netlify

```bash
# Alt 1: Via Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist

# Alt 2: Koble til GitHub-repo i Netlify Dashboard
# Build command: npm run build
# Publish directory: dist
```

## Brreg API

Applikasjonen bruker Brønnøysundregistrenes åpne API direkte fra nettleseren:
- Oppslag: `https://data.brreg.no/enhetsregisteret/api/enheter/{orgnr}`
- Navnesøk: `https://data.brreg.no/enhetsregisteret/api/enheter?navn={søk}`

API-et krever ingen autentisering og har CORS-støtte for direkte kall fra frontend.

## Teknologi

- React 18 + Vite
- Ingen UI-bibliotek – ren CSS med mobile-first media queries
- Ingen backend – alt kjører client-side

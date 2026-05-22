# km-bundelaar-dashboard

`km-bundelaar-dashboard` is een lokale webapp voor administratie en boekhouding. De app combineert JSON-exportbestanden uit `zakelijke-km-logger`, controleert de ritgegevens en maakt rapportages en exportbestanden voor maand-, kwartaal- en jaarcontrole.

De app is bedoeld als apart dashboard naast `zakelijke-km-logger`. De originele JSON-bestanden worden alleen gelezen en niet aangepast.

## Belangrijke Eigenschappen

- Verwerking gebeurt lokaal in de browser.
- Er is geen backend, login of database-server.
- Er wordt niets online opgeslagen door de app zelf.
- Originele JSON-exportbestanden worden niet gewijzigd.
- Meerdere exports kunnen samen worden gecontroleerd.
- Geschikt voor maand-, kwartaal- en jaarcontrole.
- Waarschuwingen voor incomplete ritten, foutieve gegevens en mogelijke dubbele ritten.
- Export naar CSV en gecombineerde JSON-backup.

## Vereisten

- Node.js
- npm

## Lokaal Starten

Installeer eerst de projectafhankelijkheden:

```bash
npm install
```

Start daarna de lokale ontwikkelversie:

```bash
npm run dev
```

Open vervolgens de lokale URL die Vite toont. Meestal is dat:

```text
http://localhost:5173
```

Als poort `5173` al bezet is, toont Vite automatisch een andere lokale URL.

## Build Maken

Maak een productiebuild met:

```bash
npm run build
```

De gebouwde bestanden komen in de map `dist`.

Je kunt de build lokaal controleren met:

```bash
npm run preview
```

Open daarna de lokale URL die Vite toont.

## Gebruik

1. Ga naar `Upload`.
2. Upload een of meer JSON-exportbestanden uit `zakelijke-km-logger`, of gebruik `Voorbeelddata laden`.
3. Controleer in `Controle` of bestanden en ritten geldig zijn.
4. Bekijk het totaalbeeld in `Dashboard`.
5. Loop waarschuwingen na, zoals incomplete ritten en mogelijke dubbele ritten.
6. Gebruik de tabellen per gebruiker, periode, klant en project voor verdere controle.
7. Ga naar `Export` om CSV-bestanden of een gecombineerde JSON-backup te maken.

De app verwijdert of corrigeert geen ritten automatisch. Waarschuwingen blijven zichtbaar zodat je ze zelf kunt beoordelen.

## Demo-Data

Op het uploadscherm staat de knop `Voorbeelddata laden`. Daarmee worden drie herkenbare demoexports geladen:

- Jan Demo - Q1 2026
- Sanne Demo - Q1 2026
- Testgebruiker Demo - Q1 2026

Deze demo-data bevat onder andere complete zakelijke ritten, een privérit, een incomplete rit, een rit zonder project en een mogelijke dubbele rit. Gebruik `Demo-data wissen` om alleen de demo-imports weer te verwijderen.

## Upload Naar GitHub

Je kunt de volledige projectmap zelf handmatig uploaden naar een nieuwe GitHub-repository.

Upload deze bestanden en mappen wel:

- `src`
- `docs`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `README.md`
- `.gitignore`

Upload deze map niet:

- `node_modules`

`node_modules` hoeft niet mee naar GitHub, omdat iedereen de afhankelijkheden opnieuw kan installeren met:

```bash
npm install
```

Een praktische route:

1. Maak op GitHub handmatig een nieuwe repository aan.
2. Zet deze projectmap lokaal onder Git-versiebeheer.
3. Commit de bestanden.
4. Koppel de GitHub-repository met de instructies die GitHub toont.
5. Push de bestanden naar GitHub.

Er is bewust geen automatische GitHub-koppeling in dit project gemaakt.

## Later Deployen Naar Vercel

Als je de app later online wilt zetten via Vercel:

1. Push het project eerst naar je eigen GitHub-repository.
2. Maak in Vercel een nieuw project aan.
3. Koppel de GitHub-repository.
4. Kies framework `Vite`.
5. Gebruik als build command:

```bash
npm run build
```

6. Gebruik als output folder:

```text
dist
```

Let op: zodra je de app online host, draait de app nog steeds in de browser, maar gebruikers openen hem wel via een online URL. Deel daarom alleen exports met mensen die de ritgegevens mogen verwerken.

## Importformaat

Het dashboard ondersteunt minimaal exportformaat `1.0` uit `zakelijke-km-logger`.

De hoofdstructuur is:

```json
{
  "appName": "Zakelijke KM Logger",
  "exportFormatVersion": "1.0",
  "appVersion": "1.0.0",
  "exportedAt": "...",
  "user": {},
  "period": {},
  "trips": []
}
```

Zie [docs/export-format.md](docs/export-format.md) voor de volledige beschrijving van het importformaat.

## Belangrijk

Dit dashboard is een hulpmiddel voor controle en bundeling. Het is geen boekhoudkundig, juridisch of fiscaal advies.

Controleer de data altijd voordat je exports deelt met je boekhouder of administratie. Incomplete ritten, ontbrekende gegevens en mogelijke dubbele ritten moeten handmatig worden beoordeeld. Alleen correcte en complete gegevens horen in een definitieve boekhoudkundige aanlevering.

# JSON Importformaat Voor KM Dashboard

Dit document beschrijft het JSON-formaat dat **km-dashboard** importeert uit **Zakelijke KM Logger**.

Het dashboard gebruikt deze bestanden om ritten van meerdere gebruikers te controleren, combineren en exporteren. De originele JSON-bestanden worden niet gewijzigd.

## Ondersteunde Versie

`km-dashboard` moet minimaal dit formaat ondersteunen:

```json
{ "exportFormatVersion": "1.0" }
```

Bestanden met `exportFormatVersion: "1.0"` moeten verwerkt kunnen worden. Een hogere of onbekende versie moet zichtbaar als controlepunt blijven.

## Hoofdstructuur

```json
{
  "appName": "Zakelijke KM Logger",
  "exportFormatVersion": "1.0",
  "appVersion": "1.0.0",
  "exportedAt": "2026-05-17T10:00:00.000Z",
  "user": { "name": "", "vehicle": "", "licensePlate": "", "defaultMileageRate": 0.23 },
  "period": { "from": "", "to": "" },
  "trips": []
}
```

De hoofdvelden zijn `appName`, `exportFormatVersion`, `appVersion`, `exportedAt`, `user`, `period` en `trips`. Voor importcontrole verwacht het dashboard minimaal `appName`, `exportFormatVersion`, `exportedAt`, `user`, `period` en `trips`. `trips` moet een array zijn.

## User En Period

`user.name` is de naam van de gebruiker, `user.vehicle` de voertuigomschrijving, `user.licensePlate` het optionele kenteken en `user.defaultMileageRate` het standaardtarief op exportmoment. Als `trip.userName` ontbreekt, mag het dashboard terugvallen op `user.name`.

`period.from` en `period.to` zijn exportgrenzen in `YYYY-MM-DD`. Bij een export over alles mogen ze leeg zijn en kan de rapportageperiode uit ritdatums worden afgeleid.

## Trips-array

Een rit kan deze veldnamen bevatten:

```json
{
  "id": "",
  "userName": "",
  "date": "",
  "startTime": "",
  "endTime": "",
  "startAddress": "",
  "endAddress": "",
  "startLat": null,
  "startLng": null,
  "endLat": null,
  "endLng": null,
  "customer": "",
  "project": "",
  "purpose": "",
  "odometerStart": null,
  "odometerEnd": null,
  "calculatedKm": null,
  "manualKm": null,
  "finalKm": 0,
  "returnTrip": false,
  "tripType": "zakelijk",
  "mileageRate": 0.23,
  "deductibleAmount": 0,
  "status": "compleet",
  "note": "",
  "createdAt": "",
  "updatedAt": ""
}
```

Verplichte ritvelden zijn `id`, `userName`, `date`, `startAddress`, `endAddress`, `purpose`, `finalKm`, `tripType`, `mileageRate`, `deductibleAmount`, `status`, `createdAt` en `updatedAt`. Een incomplete rit mag lege waarden hebben, maar ontbrekende veldnamen moeten als waarschuwing zichtbaar worden.

Optionele ritvelden zijn `startTime`, `endTime`, `startLat`, `startLng`, `endLat`, `endLng`, `customer`, `project`, `odometerStart`, `odometerEnd`, `calculatedKm`, `manualKm`, `returnTrip` en `note`.

## Validatie En Berekening

Het dashboard controleert geldige JSON, de hoofdstructuur, de appnaam, versie, trips-array en per rit de benodigde identiteit, datum, route, doel bij zakelijke ritten, type, status, kilometers, tarief en bedrag. Lege strings, `null`, extra velden en numerieke tekstwaarden mogen geen crash veroorzaken.

Voor rapportages is `finalKm` leidend. `calculatedKm` is een automatisch berekende afstand en `manualKm` een handmatig ingevoerde of gecorrigeerde waarde. Zakelijke kilometers tellen alleen mee als `tripType` `zakelijk` is, de rit niet als `incompleet` of `fout` is beoordeeld en `finalKm` positief is.

Het aftrekbare bedrag is:

```text
finalKm * mileageRate
```

Alleen zakelijke ritten zonder blokkerende fouten tellen mee voor aftrekbare totalen. Privéritten en incomplete ritten blijven zichtbaar, maar tellen niet mee in het definitieve bedrag.

## Incomplete En Dubbele Ritten

Een rit is inhoudelijk incompleet als belangrijke gegevens ontbreken, bijvoorbeeld datum, startadres, eindadres, doel bij zakelijke ritten of een positieve `finalKm`. Het dashboard importeert deze ritten wel en toont ze apart voor handmatige controle.

Mogelijke dubbele ritten worden gesignaleerd op meerdere overeenkomende kenmerken, waaronder gebruiker, `date`, `startAddress`, `endAddress`, `finalKm`, `customer`, `project` en `purpose`. Het dashboard verwijdert dubbele ritten nooit automatisch.

## Toekomstige Versies

Bestaande veldnamen mogen binnen `exportFormatVersion: "1.0"` niet zomaar van betekenis veranderen. Nieuwe optionele velden mogen worden toegevoegd. Onbekende extra velden in root, user, period of trips mogen de import niet breken. Een gewijzigde verplichte betekenis of berekening vraagt om een nieuwe `exportFormatVersion`.

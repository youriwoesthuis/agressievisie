# Merkgroep: werkafspraken voor drie sites

**Dit bestand staat in elke repo van de groep en is overal gelijk.** Wijzig het op
één plek en kopieer het naar de andere. Het geldt voor alle drie de merken, ook
voor actinmove.nl — dat heeft geen repo, maar valt wel onder deze afspraken.

Doel: de drie sites versterken elkaar in plaats van elkaar te beconcurreren, bij
klassieke zoekmachines én bij AI-antwoordsystemen.

Laatst gemeten en herzien: **24 augustus 2026**.

---

## 1. De drie merken en hun as

Alle drie zijn handelsnamen onder dezelfde KvK-inschrijving — geen aparte
rechtspersonen. Ze verschillen niet in onderwerp maar in **ordening**: elk merk
snijdt het onderwerp langs een andere as, en dus langs andere zoekopdrachten.

| Merk | Rol | Ordent op | Voorbeeldzoekopdrachten |
|---|---|---|---|
| **actinmove.nl** | moederbedrijf, breed communicatieaanbod | **verschijningsvorm** | "omgaan met telefonische agressie", "training fysieke agressie", "veilig huisbezoek", "agressieprotocol opstellen" |
| **bureauweerbaarenveilig.nl** | specialist, uitsluitend agressietraining | **beroepsgroep × niveau** | "agressietraining ambulancemedewerkers", "agressietraining zorg basis", "de-escalatietraining handhavers" |
| **agressievisie.nl** | kennisplatform, verkoopt niets | **informatie per sector en thema** | "agressie cijfers zorg", "wat is grensoverschrijdend gedrag", "de-escalatietechnieken onderzoek" |

Agressietraining is en blijft een van de best verkochte trainingen van Act in
Move. Die verkoop verhuist niet. Wat gescheiden is, is de zoekintentie waarop elk
merk mikt.

## 2. De drie regels

Deze afspraken houden de scheiding in stand. Ze zijn met een zoekopdracht te
controleren, en dat hoort bij elke nieuwe pagina te gebeuren.

1. **Act in Move gebruikt het woord "agressietraining" nooit** in een titel, H1 of
   meta-omschrijving. Thema-namen wel: "Omgaan met telefonische agressie".
2. **Bureau Weerbaar en Veilig publiceert nooit een pagina die op
   verschijningsvorm is geordend.** Beroepsgroep en niveau, altijd. Een thema als
   telefonische agressie komt hier alleen voor *binnen* een beroepsgroeppagina.
3. **AgressieVisie gebruikt het woord "training" nooit als paginatitel.** Kennis,
   cijfers, methodiek, wetgeving. Voor training verwijst het platform door.

## 3. Onderlinge links

- **AgressieVisie → Bureau** bij trainingsintentie, met expliciete vermelding dat
  het dezelfde organisatie is. Zonder die vermelding breekt het redactiestatuut.
- **AgressieVisie → Act in Move** bij bredere communicatie- en coachingvragen.
- **Act in Move → Bureau** vanaf de agressietrainingpagina's: wie het per
  beroepsgroep en niveau wil, gaat naar de specialist.
- **Bureau → Act in Move** uitsluitend vanuit de footer en `/over-ons/`, nooit
  vanaf een trainingspagina. De transactie moet op Bureau blijven.
- **Bureau → AgressieVisie** contextueel vanuit kennisbankartikelen, naar het
  specifieke achtergrondartikel, niet naar de homepage.

## 4. Schema.org

- **Geen** `parentOrganization` of `memberOf`: dat suggereert aparte
  rechtspersonen, en dat zijn het niet.
- Wel: op elke site dezelfde `legalName` (de KvK-naam), hetzelfde `address` en
  `telephone`, en onderling `sameAs` naar de andere twee domeinen.
- `name` is per site de eigen handelsnaam.
- `Course` hoort bij wie de training verkoopt. Bureau gebruikt het per
  beroepsgroep en niveau, Act in Move per thema. Dat botst niet, want het `about`
  verschilt.
- AgressieVisie gebruikt **nooit** `Course` of `Offer`. Het platform verkoopt niets.

## 5. llms.txt

Alle drie de sites hebben een `llms.txt` die **dezelfde drie-merkenstructuur**
beschrijft, met dezelfde rolverdeling als in hoofdstuk 1. Een AI-systeem dat één
van de drie sites leest, moet daaruit kunnen opmaken dat de andere twee bestaan
en waarvoor ze dienen.

## 6. Gemeten stand op 24 augustus 2026

De cijfers hieronder komen uit een volledige uitlezing van actinmove.nl (alle 91
URL's uit de sitemap, server-HTML zonder JavaScript uit te voeren) en uit de
repo's van de andere twee sites.

### actinmove.nl

- 91 URL's: 29 trainingen, 11 kennisbankartikelen, 10 teampagina's, 8 workshops,
  6 coaching, 3 advies, 14 vaste pagina's, plus categorie- en auteurspagina's
- 15 pagina's raken agressie commercieel, alle geordend op verschijningsvorm:
  weerbaarheid bij emoties en agressie (basis en verdieping), AIT (basis en
  verdieping), telefonische agressie, fysieke agressie, digitale agressie,
  grensoverschrijdend gedrag, verward gedrag bij middelengebruik, onbegrepen
  gedrag bij dementie, veilig huisbezoek, opvang en nazorg, agressie- en
  geweldsprotocol, incidentregistratie, traumagerelateerde begeleiding
- **"agressietraining": 2 keer op de hele site**, beide op `/kennisbank/`
- **"de-escalatie": 0 keer** op de agressiepagina's
- **0 sectorspecifieke agressiepagina's**
- Schema: `Article`, `WebPage`, `BreadcrumbList`, `WebSite`, `Person`,
  `CollectionPage`, `ProfilePage`, incidenteel `FAQPage`. **Geen `Course`.**
- 1 van de 91 pagina's linkt naar een zustermerk

### bureauweerbaarenveilig.nl

- 426 pagina's: 132 trainingen, 19 sectoren, 44 beroepsgroepen, 53
  kennisbankartikelen, 8 teamleden; 166 redirects
- Titels consequent "Agressietraining {sector}" en
  "agressietraining-{beroepsgroep}-{niveau}"
- Het eigen domein draait op dit moment nog een WordPress-wachtpagina

### agressievisie.nl

- 7 sectorpagina's, artikelen, methodieken en tools; titels consequent
  informatief, bijvoorbeeld "Agressie in de zorg: cijfers, signalen en aanpak"
- **0 links naar bureauweerbaarenveilig.nl**
- Verwijst voor training uitsluitend naar Act in Move

## 7. Wat hieruit volgt — open acties

1. **Geen redirects vanaf actinmove.nl.** De eerder veronderstelde
   zoekwoordoverlap bestaat niet: de assen verschillen. Act in Move houdt al zijn
   agressiepagina's. Zie hoofdstuk 8.
2. **Schema van actinmove.nl rechtzetten.** Alle 66 berichten staan als `Article`
   gemarkeerd, met een auteur genaamd "admin", en er is helemaal geen
   `Organization` op de site. Voor Google en AI-systemen is een training daarmee
   een blogartikel in plaats van een boekbare cursus, en is er niemand die hem
   aanbiedt. De volledige werkinstructie, met de gemeten code, de menupaden in
   Yoast 28.2 en de juiste volgorde, staat in
   **ACTINMOVE-WERKINSTRUCTIE.md** in de repo van bureauweerbaarenveilig.nl.
3. **Wachtpagina van bureauweerbaarenveilig.nl vervangen.** De huidige tekst
   belooft "trainingen, coaching en advies ... weerbaarheid, veiligheid en
   vitaliteit" — breder dan de positionering. Bij livegang moet daar
   agressietraining-taal staan.
4. **Links leggen.** AgressieVisie naar Bureau bij trainingsintentie, en Act in
   Move vanaf zijn agressiepagina's naar Bureau. De bestaande link op
   `/communicatie-trainingen/` wijst naar de www-variant terwijl de canonical op
   non-www staat: rechtzetten.
5. **llms.txt van AgressieVisie bijwerken.** Die beschrijft nu een groep van twee
   merken.
6. **Twee niveauladders naast elkaar.** Act in Move heeft basis en verdieping,
   Bureau heeft basis, gevorderd en expert. Geen zoekprobleem, wel verwarrend voor
   een inkoper die beide ziet. Nog te beslissen of dit gelijkgetrokken wordt.
7. **Gedeelde KvK-naam (`legalName`)** is nog niet ingevuld op de drie sites.

## 8. Wat hier is herzien

CLAUDE.md §3.5 stelde dat actinmove.nl al content over agressietraining heeft
"die qua zoekwoorden overlapt" met deze site, en §3.6 hield als open vraag of die
content moest verdwijnen, samengevoegd worden of via een canonical naar Bureau
moest wijzen.

De meting van 24 augustus 2026 laat zien dat die aanname niet klopt. Het woord
"agressietraining" komt twee keer voor op de hele site, op geen enkele
trainingspagina, en er is geen sectorspecifieke agressiepagina. De overlap zit in
het onderwerp, niet in de zoekopdrachten.

**Besluit: geen redirects, geen cross-domain canonicals, geen content weghalen.**
De scheiding wordt bewaakt met de drie regels uit hoofdstuk 2.

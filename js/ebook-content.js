// ─── Iconen per hoofdstuk (24x24 lijn-iconen, zelfde stijl als de rest van de site) ───
const CH_ICONS = {
  boek: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  alert: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  trap: '<path d="M3 21h4v-4h4v-4h4v-4h4V5h4"/>',
  oog: '<circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  hart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  klembord: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  vraag: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>',
  bladwijzer: '<path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  logo: '<path d="M4 4h16v16H4z" opacity="0"/>',
};

function icon(name, color) {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color || '#e0401f'}" stroke-width="2">${CH_ICONS[name]}</svg>`;
}

// ─── Visuele blokken (herbruikbaar in meerdere hoofdstukken) ───

function statRow(stats) {
  return `<div class="stat-row">${stats.map(s => `
    <div class="stat-box"><div class="stat-num">${s.num}</div><div class="stat-label">${s.label}</div></div>
  `).join('')}</div>`;
}

function checklistBlock(title, items) {
  return `
    <div class="check-block">
      <div class="check-block-title">${title}</div>
      ${items.map(i => `<div class="check-line"><span class="check-mark"></span><span>${i}</span></div>`).join('')}
    </div>
  `;
}

function ladderVisual() {
  const steps = [
    { nr: 9, fase: 3, naam: 'Samen de afgrond in' },
    { nr: 8, fase: 3, naam: 'Versplintering' },
    { nr: 7, fase: 3, naam: 'Beperkte vernietiging' },
    { nr: 6, fase: 2, naam: 'Dreigstrategieën' },
    { nr: 5, fase: 2, naam: 'Gezichtsverlies' },
    { nr: 4, fase: 2, naam: 'Imago en coalities' },
    { nr: 3, fase: 1, naam: 'Daden in plaats van woorden' },
    { nr: 2, fase: 1, naam: 'Debat en polemiek' },
    { nr: 1, fase: 1, naam: 'Verharding' },
  ];
  const kleur = { 1: '#f5a524', 2: '#e0701f', 3: '#b8300f' };
  return `
    <div class="ladder-visual">
      ${steps.map(s => `
        <div class="ladder-rung" style="border-left-color:${kleur[s.fase]};">
          <span class="ladder-num" style="background:${kleur[s.fase]};">${s.nr}</span>
          <span>${s.naam}</span>
        </div>
      `).join('')}
    </div>
    <div class="ladder-legend">
      <span><i style="background:#f5a524"></i> Fase 1: rationeel</span>
      <span><i style="background:#e0701f"></i> Fase 2: emotioneel</span>
      <span><i style="background:#b8300f"></i> Fase 3: destructief</span>
    </div>
  `;
}

function flowDiagram(steps) {
  return `
    <div class="flow-diagram">
      ${steps.map((s, i) => `
        ${i > 0 ? '<div class="flow-arrow">→</div>' : ''}
        <div class="flow-step">
          <div class="flow-letter">${s.letter}</div>
          <div class="flow-title">${s.titel}</div>
          <div class="flow-desc">${s.desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function sectorBars(rows) {
  return `
    <div class="sector-bars">
      ${rows.map(r => `
        <div class="sector-bar-row">
          <span class="sector-bar-label">${r.label}</span>
          <div class="sector-bar-track"><div class="sector-bar-fill" style="width:${r.pct}%;"></div></div>
          <span class="sector-bar-value">${r.value}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function pullQuote(text) {
  return `<div class="pull-quote">${text}</div>`;
}

// ─── Hoofdstukken ───

const EBOOK_CHAPTERS = [
  {
    titel: 'Inleiding',
    icoon: 'boek',
    inhoud: `
      <p>Agressie is van alle tijden, maar de context waarin het zich voordoet verandert voortdurend. Personeelstekorten in de zorg, oplopende druk in de klas, spanningen in het openbaar vervoer: overal waar mensen elkaar tegenkomen, kan spanning omslaan in agressie. Wie hierop wil anticiperen, heeft actuele kennis nodig, geen verouderde protocollen die ergens in een bureaula liggen.</p>
      <p>Dit e-book is geschreven voor iedereen die in zijn of haar werk met mensen te maken heeft: van zorgverlener tot docent, van baliemedewerker tot beveiliger. Het combineert wetenschappelijke inzichten met praktische handvatten, zodat je niet alleen weet wát er gebeurt tijdens een escalerende situatie, maar ook wat je er concreet aan kunt doen.</p>
      ${statRow([
        { num: '11', label: 'hoofdstukken' },
        { num: '6', label: 'sectoren belicht' },
        { num: '2', label: 'praktijkmodellen' },
      ])}
      <p>We beginnen bij de basis: wat is agressie eigenlijk, en hoe verloopt een escalatie? Daarna gaan we in op het herkennen van vroege signalen, effectieve de-escalatietechnieken, en de verschillen tussen sectoren. We sluiten af met praktische bouwstenen: hoe je nazorg organiseert en hoe je een eigen basisprotocol opzet.</p>
      <p>Dit is geen vervanging voor training. Het is een naslagwerk: iets om op terug te vallen, te delen met collega's, of te gebruiken als startpunt voor een gesprek binnen je team over hoe jullie met agressie omgaan.</p>
    `,
  },
  {
    titel: 'Wat is agressie?',
    icoon: 'alert',
    inhoud: `
      <p>Agressie is gedrag dat gericht is op het toebrengen van schade, intimidatie of dwang aan een ander, verbaal of fysiek, doelbewust of impulsief. Die laatste toevoeging is belangrijk: niet alle agressie is hetzelfde, en het onderscheid bepaalt vaak welke aanpak het beste werkt.</p>
      <h3>Instrumentele versus reactieve agressie</h3>
      <p>Instrumentele agressie wordt doelbewust ingezet als middel om iets te bereiken: een dreigement om een uitzondering af te dwingen, bijvoorbeeld. Reactieve agressie is impulsief, een directe reactie op een waargenomen bedreiging of provocatie, vaak zonder vooraf bedachte intentie. De-escalatie van reactieve agressie draait vooral om het verlagen van spanning; bij instrumentele agressie is het minstens zo belangrijk om helder te zijn over grenzen, zonder de situatie onnodig te laten escaleren.</p>
      <h3>Verbaal, fysiek en passief</h3>
      <p>Verbale agressie uit zich in schelden, dreigen of intimideren zonder fysiek contact. Fysieke agressie gaat een stap verder: slaan, duwen, vernieling. Minder zichtbaar, maar zeker zo schadelijk, is passieve agressie: sarcasme, tegenwerken, of expres traag reageren zonder openlijke confrontatie.</p>
      <h3>Het verschil met assertiviteit</h3>
      <p>Een veelgemaakte denkfout is het gelijkstellen van assertiviteit aan agressie. Assertiviteit is het respectvol opkomen voor eigen grenzen of behoeften, zonder de ander te schaden. Agressie gaat gepaard met een intentie om te schaden, intimideren of dwingen.</p>
      ${pullQuote('Iemand die stevig "nee" zegt, is niet per se agressief; iemand die dreigt als dat "nee" niet verandert, wel.')}
      <h3>De frustratie-agressietheorie</h3>
      <p>Een bekende psychologische verklaring is de frustratie-agressietheorie: agressie komt vaak voort uit geblokkeerde doelen of behoeften. Iemand die zich niet gehoord voelt, die een aanvraag ziet afgewezen, of die het gevoel heeft geen controle te hebben over een situatie, loopt een verhoogd risico op agressief gedrag als uitlaatklep voor die frustratie. Dit inzicht is direct bruikbaar: als je de onderliggende frustratie kunt adresseren, neemt de kans op escalatie af.</p>
    `,
  },
  {
    titel: 'De escalatieladder van Glasl',
    icoon: 'trap',
    inhoud: `
      <p>Conflictonderzoeker Friedrich Glasl ontwikkelde in 1997 een model dat wereldwijd navolging kreeg: de escalatieladder met negen treden, verdeeld over drie fasen. Hoe hoger op de ladder, hoe moeilijker de-escalatie wordt.</p>
      ${ladderVisual()}
      <h3>Fase 1: rationeel (treden 1-3)</h3>
      <p><strong>Verharding:</strong> standpunten lopen vast, maar er wordt nog met elkaar gepraat. <strong>Debat en polemiek:</strong> het gesprek wordt een wedstrijd om wie er gelijk heeft. <strong>Daden in plaats van woorden:</strong> praten heeft ogenschijnlijk geen zin meer; partijen confronteren elkaar met voldongen feiten.</p>
      <h3>Fase 2: emotioneel (treden 4-6)</h3>
      <p><strong>Imago en coalities:</strong> partijen zoeken bondgenoten, er ontstaan kampen. <strong>Gezichtsverlies:</strong> de ander wordt openlijk beschadigd, het gaat om eer en imago. <strong>Dreigstrategieën:</strong> er komen openlijke dreigementen en ultimatums.</p>
      <h3>Fase 3: destructief (treden 7-9)</h3>
      <p><strong>Beperkte vernietiging:</strong> schade toebrengen weegt zwaarder dan eigen verlies. <strong>Versplintering:</strong> het doel is het systeem van de ander te ontwrichten. <strong>Samen de afgrond in:</strong> beide partijen gaan ten onder, ook ten koste van zichzelf.</p>
      <h3>Waarom dit model bruikbaar is</h3>
      <p>Het grootste praktische nut van de escalatieladder is dat het je helpt te herkennen in welke fase een gesprek zich bevindt, en dus welke interventie nog kans van slagen heeft. In fase 1 werkt luisteren en erkennen vaak al voldoende. In fase 2 is gezichtsverlies vermijden cruciaal. In fase 3 gaat het niet meer om overtuigen, maar om veiligheid: schep afstand en schakel hulp in.</p>
    `,
  },
  {
    titel: 'Vroege signalen herkennen',
    icoon: 'oog',
    inhoud: `
      <p>Agressie ontstaat zelden uit het niets. Onderzoek naar escalatiegedrag laat een herkenbaar patroon zien van signalen die aan een uitbarsting voorafgaan. Wie deze signalen leert herkennen, kan vaak al ingrijpen vóórdat een situatie escaleert.</p>
      ${checklistBlock('Fysieke signalen', [
        'Verhoogde spierspanning (gebalde vuisten, stijve houding)',
        'Onrustig of dreigend ijsberen',
        'Opvallend dichterbij komen dan gebruikelijk',
        'Verandering in ademhaling (sneller, hoorbaar)',
        'Rood aangelopen gezicht of zichtbaar zweten',
        'Trillende handen of trillende stem',
      ])}
      ${checklistBlock('Verbale signalen', [
        'Stemvolume neemt toe, spreektempo versnelt',
        'Dreigende of intimiderende taal',
        'Herhaaldelijk dezelfde eis herhalen zonder ruimte voor dialoog',
        'Sarcasme of kleinerende opmerkingen',
        'Ongebruikelijk vloeken of schelden voor die persoon',
        'Plotselinge stiltes, afgewisseld met uitbarstingen',
      ])}
      ${checklistBlock('Gedragssignalen', [
        'Verminderd vermogen om instructies te verwerken',
        'Oogcontact vermijden óf juist opvallend fixeren',
        'Grenzen van persoonlijke ruimte overschrijden',
        'Plotselinge stemmingswisselingen',
        'Dingen vastpakken, gooien of hard neerzetten',
        'Herhaaldelijk naar de uitgang of naar anderen kijken',
      ])}
      ${checklistBlock('Signalen bij jezelf', [
        'Je hartslag versnelt of je ademhaling wordt oppervlakkig',
        'Je stem wordt harder of sneller',
        'Je voelt de neiging om te overtuigen in plaats van te luisteren',
        'Je wilt het gesprek zo snel mogelijk beëindigen',
      ])}
      <h3>Omgevingsfactoren</h3>
      <p>Niet alleen de persoon tegenover je, ook de omgeving speelt een rol: lange wachttijden of drukte, weinig privacy tijdens een gevoelig gesprek, eerder gegeven onduidelijke of tegenstrijdige informatie, en een beperkte vluchtroute of geen zichtbare collega's in de buurt vergroten het risico op escalatie.</p>
    `,
  },
  {
    titel: 'De-escalatietechnieken die werken',
    icoon: 'chat',
    inhoud: `
      <p>Niet elke de-escalatietechniek is even effectief. Onderzoek naar wat écht werkt in de eerste dertig seconden van een oplopend conflict, is minstens zo waardevol als goede bedoelingen.</p>
      <h3>De LSD-methode</h3>
      ${flowDiagram([
        { letter: 'L', titel: 'Luisteren', desc: 'Volledige aandacht, zonder oordeel' },
        { letter: 'S', titel: 'Samenvatten', desc: 'Toets of je het goed begrepen hebt' },
        { letter: 'D', titel: 'Doorvragen', desc: 'Achterhaal de vraag achter de vraag' },
      ])}
      <p>Deze volgorde is niet toevallig: eerst begrijpen, dan pas reageren.</p>
      <h3>Erkennen vóór oplossen</h3>
      <p>Een van de meest consistente onderzoeksbevindingen is dat het te snel aanbieden van een oplossing averechts werkt. Mensen in een staat van hoge spanning zijn vaak nog niet in staat om een oplossing te verwerken; eerst moet de emotionele lading dalen.</p>
      ${pullQuote('Erken altijd eerst de emotie, ook al ben je het niet eens met de eis of het standpunt van de ander.')}
      <h3>Toon, tempo en houding</h3>
      <p>Wat in de eerste fase van een oplopend gesprek telt, is minder de inhoud van wat gezegd wordt, en meer de toon, het tempo en de non-verbale houding van degene die reageert.</p>
      <h3>Het ABC-model</h3>
      ${flowDiagram([
        { letter: 'A', titel: 'Antecedent', desc: 'Wat ging eraan vooraf?' },
        { letter: 'B', titel: 'Behavior', desc: 'Het waarneembare gedrag zelf' },
        { letter: 'C', titel: 'Consequence', desc: 'Wat volgde, en jouw reactie' },
      ])}
      <p>Een reactie die het gedrag "beloont", bijvoorbeeld door snel toe te geven onder druk, vergroot de kans dat het patroon terugkeert.</p>
      <h3>Wanneer communicatie niet genoeg is</h3>
      <p>Niet elke situatie is met communicatie alleen op te lossen. Als een situatie ondanks de-escalatiepogingen verder escaleert, is de veiligheid van jezelf en anderen leidend: schep afstand, schakel hulp of beveiliging in, en volg het escalatieprotocol van je organisatie.</p>
    `,
  },
  {
    titel: 'Agressie per sector',
    icoon: 'grid',
    inhoud: `
      <p>Agressie speelt in vrijwel elke sector met publiekscontact, maar de aard en oorzaken verschillen. Een overzicht van de belangrijkste patronen per sector, met de cijfers die we op AgressieVisie volgen.</p>
      ${sectorBars([
        { label: 'Onderwijs (verbaal)', pct: 85, value: '85%' },
        { label: 'Beveiliging', pct: 67, value: '67%' },
        { label: 'Zorg & welzijn', pct: 57, value: '57%' },
        { label: 'Klantcontact', pct: 11, value: '11%' },
      ])}
      <h3>Zorg & welzijn</h3>
      <p>In 2024 had 57 procent van de medewerkers in zorg en welzijn te maken met agressie door patiënten of hun naasten, blijkt uit de AZW-werknemersenquête van het CBS. Spanningen lopen vaak op door wachttijden, onzekerheid over een diagnose, of gevoelens van machteloosheid.</p>
      <h3>Onderwijs</h3>
      <p>Onderzoek van CNV en EenVandaag onder ruim 450 onderwijsmedewerkers laat zien dat 85 procent verbaal geweld of dreigementen meemaakte, en 43 procent te maken kreeg met fysiek geweld.</p>
      <h3>Beveiliging & OV</h3>
      <p>Twee op de drie beveiligers in Nederland is inmiddels slachtoffer geweest van geweld of agressie. Bij de NS liep het aantal zware incidenten met personeel op van 1.043 in 2023 naar 1.132 in 2025, ondanks een lichte daling in het totaal aantal aangiftes tegen mensen met een publieke taak.</p>
      <h3>Klantcontact & retail</h3>
      <p>Volgens de Nationale Enquête Arbeidsomstandigheden 2025 kreeg 11 procent van de werknemers te maken met ongewenst gedrag door klanten, tegenover 4,9 procent door collega's.</p>
      <h3>Horeca & uitgaan</h3>
      <p>Alcohol, drukte en late uren maken deze sector extra kwetsbaar voor snel oplopende, soms plotselinge escalatie. Korte, frequente training sluit hier vaak beter aan dan een enkele jaarlijkse cursus.</p>
      <h3>Gemeenten & overheid</h3>
      <p>Bij publieksbalies en loketten ontstaat spanning vaak rond afgewezen aanvragen, lange wachttijden of onduidelijke procedures.</p>
    `,
  },
  {
    titel: 'Nazorg: wat te doen na een incident',
    icoon: 'hart',
    inhoud: `
      <p>De impact van een agressie-incident stopt niet zodra de situatie is gede-escaleerd. Onderzoek van Zembla en Universiteit Leiden laat zien dat zorginstellingen structureel tekortschieten in nazorg voor personeel, met een verhoogd risico op PTSS als gevolg.</p>
      <h3>Waarom nazorg zo belangrijk is</h3>
      <p>Medewerkers die een agressie-incident meemaken, ondervinden vaak pas uren tot dagen later de volle impact: concentratieverlies, prikkelbaarheid, of vermijdingsgedrag rond vergelijkbare situaties.</p>
      ${pullQuote('Het gevoel van steun door de organisatie blijkt een sterkere voorspeller van herstel dan de ernst van het incident zelf.')}
      <h3>Wat werkt</h3>
      <p>Organisaties die standaard een kort nagesprek voeren binnen 24 uur na een incident, ongeacht hoe "klein" het leek, zien minder langdurig verzuim dan organisaties die alleen bij zware incidenten nazorg bieden.</p>
      <h3>Een voorbeeld uit de praktijk</h3>
      <p>Bij defensie, politie en brandweer is nazorg beter geborgd via vaste protocollen, en wordt PTSS als gevolg van agressie of geweld op het werk daar erkend als beroepsziekte. Diezelfde erkenning en structurele aanpak ontbreekt in grote delen van andere sectoren nog.</p>
      ${checklistBlock('Praktische stappen', [
        'Meld elk incident, ook kleine, bij de leidinggevende of het aanspreekpunt agressiebeleid',
        'Bied altijd een kort nagesprek aan binnen 24 uur',
        'Verwijs bij aanhoudende klachten door naar professionele ondersteuning',
        'Evalueer periodiek gemelde incidenten om patronen te herkennen',
      ])}
    `,
  },
  {
    titel: 'Een basisprotocol opzetten',
    icoon: 'klembord',
    inhoud: `
      <p>Een goed agressieprotocol hoeft niet ingewikkeld te zijn, maar moet wel compleet zijn. Onderstaand stappenplan kun je gebruiken als basis voor je eigen organisatie; op AgressieVisie vind je ook een interactieve protocol-generator die dit automatisch voor je invult op basis van jouw sector.</p>
      ${checklistBlock('De acht bouwstenen van een basisprotocol', [
        'Doel en context: voor wie is het protocol, welk type agressie komt het meest voor?',
        'Belangrijkste aandachtspunten: welke risico\'s spelen concreet?',
        'Preventie: signalen structureel bespreken in werkoverleg',
        'Communicatie tijdens een incident: eerst erkennen, dan pas oplossen (LSD-methode)',
        'Bij fysieke dreiging: veiligheid gaat vóór alles',
        'Na een incident: laagdrempelige meldroute en vast nagesprek binnen 24 uur',
        'Rollen en organisatie: een vast aanspreekpunt agressiebeleid',
        'Borging en evaluatie: korte, frequente trainingsmomenten in plaats van één jaarlijkse sessie',
      ])}
      <p>Onderzoek laat zien dat korte, frequente oefenmomenten tot aanzienlijk beter vaardigheidsbehoud leiden dan één lange jaarlijkse trainingssessie. Neem dat mee in de opzet van je protocol: het gaat niet alleen om wát er op papier staat, maar ook om hoe vaak het geoefend wordt.</p>
    `,
  },
  {
    titel: 'Veelgestelde vragen',
    icoon: 'vraag',
    inhoud: `
      <h3>Wat zijn de eerste signalen van escalerende agressie?</h3>
      <p>De eerste signalen zijn vaak een combinatie van veranderende stemvolume en spreektempo, gesloten of juist expansieve lichaamstaal, en een verminderd vermogen om instructies te verwerken.</p>
      <h3>Wat is het verschil tussen agressie en assertiviteit?</h3>
      <p>Assertiviteit is het duidelijk en respectvol opkomen voor eigen grenzen, zonder de ander te schaden. Agressie gaat gepaard met een intentie om te schaden, intimideren of dwingen.</p>
      <h3>Welke de-escalatietechniek werkt het best?</h3>
      <p>Een combinatie van rustige, niet-onderdanige toon, het actief erkennen van de emotie van de ander, en het uitstellen van oplossingen tot de emotionele lading is gedaald.</p>
      <h3>Kan iedereen leren agressie te de-escaleren?</h3>
      <p>Ja. De-escaleren is een vaardigheid die met gerichte training en herhaling aan te leren is, net als elke andere praktische vaardigheid.</p>
      <h3>Wat moet ik doen als de-escaleren niet lukt?</h3>
      <p>Veiligheid gaat voor: schep afstand, schakel hulp of beveiliging in, en volg het escalatieprotocol van je organisatie.</p>
      <h3>Waar kan ik een training agressiehantering volgen?</h3>
      <p>Voor praktijkgerichte trainingen in agressiehantering en de-escalatie kun je terecht bij Act in Move Training & Coaching, gespecialiseerd in trainingen voor zorg, onderwijs, beveiliging & OV en het bedrijfsleven.</p>
    `,
  },
  {
    titel: 'Begrippenlijst',
    icoon: 'bladwijzer',
    inhoud: `
      <p><strong>Actief luisteren</strong>: Een luistertechniek waarbij je expliciet laat merken dat je de ander hoort en begrijpt.</p>
      <p><strong>Agressie</strong>: Gedrag gericht op het toebrengen van schade, intimidatie of dwang, verbaal of fysiek.</p>
      <p><strong>Assertiviteit</strong>: Het respectvol opkomen voor eigen grenzen zonder de ander te schaden.</p>
      <p><strong>De-escalatie</strong>: Technieken en gedrag gericht op het verlagen van spanning in een oplopende situatie.</p>
      <p><strong>Escalatiefase</strong>: De fase waarin spanning zichtbaar oploopt, voorafgaand aan een mogelijke uitbarsting.</p>
      <p><strong>Fysieke agressie</strong>: Agressief gedrag met daadwerkelijk fysiek geweld of dreiging daarmee.</p>
      <p><strong>Frustratie-agressietheorie</strong>: De theorie dat agressie vaak voortkomt uit geblokkeerde doelen of behoeften.</p>
      <p><strong>Grensoverschrijdend gedrag</strong>: Verzamelterm voor gedrag dat fysieke, sociale of emotionele grenzen overschrijdt.</p>
      <p><strong>Impulscontrole</strong>: Het vermogen om een directe, vaak agressieve reactie te onderdrukken of uit te stellen.</p>
      <p><strong>Instrumentele agressie</strong>: Agressie die doelbewust wordt ingezet als middel om een doel te bereiken.</p>
      <p><strong>Nazorg</strong>: Begeleiding en ondersteuning na een agressie-incident, gericht op emotioneel herstel.</p>
      <p><strong>Opwindingsfase (arousal)</strong>: De fysiologische staat van verhoogde spanning die aan agressief gedrag voorafgaat.</p>
      <p><strong>Passieve agressie</strong>: Indirecte uiting van vijandigheid, zoals sarcasme of tegenwerken.</p>
      <p><strong>Reactieve agressie</strong>: Impulsieve agressie als directe reactie op een waargenomen bedreiging.</p>
      <p><strong>Signaalherkenning</strong>: Het waarnemen van vroege signalen van oplopende spanning.</p>
      <p><strong>Trigger</strong>: Een gebeurtenis of prikkel die een agressieve reactie in gang zet.</p>
      <p><strong>Verbale agressie</strong>: Agressie geuit in taal, zoals schelden of dreigen, zonder fysiek contact.</p>
      <p><strong>Zelfregulatie</strong>: Het vermogen om eigen emoties en impulsen te reguleren.</p>
    `,
  },
  {
    titel: 'Over AgressieVisie & Act in Move',
    icoon: 'boek',
    inhoud: `
      <p>AgressieVisie is een kennisplatform, geen trainingsbureau. We volgen doorlopend wetenschappelijk onderzoek, signalen en trends rond agressie, zodat professionals die met mensen werken scherp blijven. Elk artikel op ons platform vermeldt de bron, zodat je zelf kunt doorlezen naar het achterliggende onderzoek.</p>
      <p>AgressieVisie is opgezet door Act in Move Training & Coaching, dé specialist in praktijkgerichte training en coaching op het gebied van agressiehantering en de-escalatie. Waar dit platform kennis en inzicht deelt, biedt Act in Move de praktische vaardigheden: trainingen, workshops en coaching op maat voor teams die dagelijks met agressie te maken hebben.</p>
      <p>Dit e-book is een startpunt, geen eindpunt. Op agressievisie.nl vind je doorlopend nieuwe artikelen, een interactieve escalatieladder en LSD-methode om te oefenen, een zelftest om je eigen signaalherkenning te toetsen, een protocol-generator, en een uitgebreid cijferoverzicht per sector.</p>
      ${pullQuote('Wil je deze kennis structureel laten landen in jouw team? Neem contact op met Act in Move Training & Coaching via actinmove.nl.')}
    `,
  },
];

// ─── Logo ───
const LOGO_SVG_LARGE = `<svg width="72" height="72" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e0401f"/><stop offset="100%" stop-color="#f5a524"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="#17171a"/><rect x="10" y="10" width="44" height="44" rx="12" fill="url(#g)"/><rect x="23" y="24" width="18" height="4" rx="2" fill="#ffffff" transform="rotate(35 32 26)"/><rect x="23" y="36" width="18" height="4" rx="2" fill="#ffffff" transform="rotate(-35 32 38)"/></svg>`;

function coverShapes() {
  return `
    <svg viewBox="0 0 300 140" width="220" height="103" style="margin:0 auto 20px;">
      <rect x="20" y="30" width="80" height="80" rx="14" fill="rgba(255,255,255,.18)" transform="rotate(-8 60 70)"/>
      <rect x="120" y="20" width="90" height="90" rx="14" fill="rgba(255,255,255,.28)" transform="rotate(6 165 65)"/>
      <circle cx="240" cy="90" r="30" fill="rgba(255,255,255,.22)"/>
    </svg>
  `;
}

function buildEbookDocument() {
  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<title>De complete gids voor het herkennen en hanteren van agressie | AgressieVisie</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1c1c1f; max-width: 780px; margin: 0 auto; padding: 0 24px 60px; line-height: 1.7; }
  .cover { background: linear-gradient(135deg, #e0401f 0%, #f5a524 100%); color: #fff; padding: 70px 40px; margin: 0 -24px 40px; text-align: center; }
  .cover h1 { font-size: 30px; margin: 8px 0 8px; max-width: 480px; margin-left: auto; margin-right: auto; }
  .cover p { font-size: 15px; opacity: .92; }
  .doc-header { display: flex; align-items: center; gap: 14px; margin: 40px 0 20px; padding-bottom: 16px; border-bottom: 2px solid #e4e4e8; }
  .doc-header .name { font-size: 18px; font-weight: 800; }
  .doc-header .tag { font-size: 12.5px; color: #6c6c75; }
  .toc { background: #f5f5f7; border-radius: 12px; padding: 24px 28px; margin-bottom: 40px; }
  .toc h2 { font-size: 16px; margin-bottom: 14px; }
  .toc-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e4e4e8; font-size: 14.5px; }
  .toc-row:last-child { border-bottom: none; }
  .toc-num { font-weight: 800; color: #b8300f; width: 22px; flex-shrink: 0; }
  .chapter { margin-bottom: 48px; page-break-inside: avoid; }
  .chapter-head { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #f5a524; padding-bottom: 10px; margin-bottom: 18px; }
  .chapter-icon-badge { width: 40px; height: 40px; border-radius: 12px; background: #fdf0e5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .chapter h2 { font-size: 21px; color: #b8300f; margin: 0; }
  .chapter h3 { font-size: 15.5px; margin: 20px 0 6px; color: #1c1c1f; }
  .chapter p { font-size: 14.5px; margin-bottom: 12px; }

  .stat-row { display: flex; gap: 16px; margin: 20px 0; flex-wrap: wrap; }
  .stat-box { flex: 1; min-width: 120px; background: #f5f5f7; border-radius: 10px; padding: 16px; text-align: center; }
  .stat-num { font-size: 26px; font-weight: 800; color: #b8300f; }
  .stat-label { font-size: 12.5px; color: #6c6c75; margin-top: 2px; }

  .check-block { background: #f5f5f7; border-radius: 10px; padding: 18px 20px; margin: 16px 0; }
  .check-block-title { font-weight: 800; font-size: 14.5px; margin-bottom: 10px; color: #b8300f; }
  .check-line { display: flex; align-items: flex-start; gap: 10px; padding: 5px 0; font-size: 14px; }
  .check-mark { width: 14px; height: 14px; border: 2px solid #e0401f; border-radius: 4px; flex-shrink: 0; margin-top: 3px; }

  .ladder-visual { display: flex; flex-direction: column; gap: 4px; margin: 20px 0; }
  .ladder-rung { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f5f5f7; border-left: 4px solid; border-radius: 6px; font-size: 13.5px; }
  .ladder-num { width: 22px; height: 22px; border-radius: 50%; color: #fff; font-weight: 800; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ladder-legend { display: flex; gap: 18px; margin-top: 10px; font-size: 12px; color: #6c6c75; flex-wrap: wrap; }
  .ladder-legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; }

  .flow-diagram { display: flex; align-items: center; gap: 6px; margin: 20px 0; flex-wrap: wrap; }
  .flow-step { flex: 1; min-width: 140px; background: #f5f5f7; border-radius: 10px; padding: 16px; text-align: center; }
  .flow-letter { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, #e0401f, #f5a524); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
  .flow-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
  .flow-desc { font-size: 12px; color: #6c6c75; }
  .flow-arrow { font-size: 18px; color: #e0401f; font-weight: 800; }

  .sector-bars { margin: 20px 0; }
  .sector-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .sector-bar-label { width: 140px; font-size: 13px; font-weight: 600; flex-shrink: 0; }
  .sector-bar-track { flex: 1; height: 10px; background: #e4e4e8; border-radius: 999px; overflow: hidden; }
  .sector-bar-fill { height: 100%; background: linear-gradient(135deg, #e0401f, #f5a524); border-radius: 999px; }
  .sector-bar-value { width: 40px; text-align: right; font-size: 13px; font-weight: 700; color: #b8300f; }

  .pull-quote { background: #fdf0e5; border-left: 4px solid #e0401f; border-radius: 8px; padding: 16px 20px; margin: 18px 0; font-size: 15px; font-style: italic; color: #5c3610; }

  .doc-footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e4e4e8; font-size: 12.5px; color: #6c6c75; text-align: center; }
</style>
</head>
<body>
  <div class="cover">
    ${coverShapes()}
    <h1>De complete gids voor het herkennen en hanteren van agressie</h1>
    <p>Een uitgave van AgressieVisie · ${datum}</p>
  </div>

  <div class="doc-header">
    ${LOGO_SVG_LARGE.replace('width="72" height="72"', 'width="36" height="36"')}
    <div>
      <div class="name">AgressieVisie</div>
      <div class="tag">Kennisplatform over agressie · agressievisie.nl · een initiatief van Act in Move Training & Coaching</div>
    </div>
  </div>

  <div class="toc">
    <h2>Inhoudsopgave</h2>
    ${EBOOK_CHAPTERS.map((c, i) => `<div class="toc-row"><span class="toc-num">${String(i + 1).padStart(2, '0')}</span><span>${c.titel}</span></div>`).join('')}
  </div>

  ${EBOOK_CHAPTERS.map((c, i) => `
    <div class="chapter">
      <div class="chapter-head">
        <span class="chapter-icon-badge">${icon(c.icoon)}</span>
        <h2>${i + 1}. ${c.titel}</h2>
      </div>
      ${c.inhoud}
    </div>
  `).join('')}

  <div class="doc-footer">
    Een uitgave van AgressieVisie, kennisplatform over agressie, onderdeel van Act in Move Training & Coaching.<br>
    agressievisie.nl · actinmove.nl
  </div>
</body>
</html>`;
}

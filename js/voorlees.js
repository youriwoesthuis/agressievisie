/*!
 * Voorlees-plugin — Nederlandse voorleesfunctie voor websites
 * Geen vertaling, geen externe servers, geen dependencies.
 * Gebruikt de spraaksynthese die al in de browser van de bezoeker zit.
 *
 * Installatie: zie README.md
 */
(function () {
  "use strict";

  // ─── Configuratie: eerst window.voorleesConfig (bijv. via WordPress wp_add_inline_script),
  // anders data-attributen op de eigen <script>-tag (handig voor niet-WordPress-installaties) ───
  var huidigScript = document.currentScript;
  var wpCfg = (typeof window.voorleesConfig === "object" && window.voorleesConfig) ? window.voorleesConfig : {};
  function attr(naam) { return huidigScript ? huidigScript.getAttribute(naam) : null; }
  var cfg = {
    target: wpCfg.target || attr("data-vl-target") || "",
    positie: wpCfg.positie || attr("data-vl-position") || "onder-rechts",
    kleur: wpCfg.kleur || attr("data-vl-kleur") || "",
    snelheid: parseFloat(wpCfg.snelheid || attr("data-vl-snelheid") || "1") || 1,
    knopTekst: wpCfg.knoptekst || attr("data-vl-knoptekst") || "Lees voor",
  };

  var BLOK_SELECTOR = "p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, dt, dd, figcaption, caption";
  var UITSLUIT_SELECTOR = "nav, header, footer, aside, script, style, noscript, iframe, form, button, [aria-hidden='true'], .vl-widget, #cookie-banner, [class*='cookie-banner'], [id*='cookie-consent']";
  var MIN_TEKENS = 3;

  // ─── Status ───
  var eenheden = []; // array van { el, tekst }
  var huidigeIndex = -1;
  var status = "gestopt"; // gestopt | leest | gepauzeerd
  var geinitialiseerd = false;
  var eenhedenKlaar = false;
  var beschikbareStem = null;
  var gekozenStemNaam = ""; // door bezoeker handmatig gekozen stem (leeg = automatische voorkeur)
  var stemZoekPoging = 0;

  // Bekende namen van vriendelijke/vrouwelijke Nederlandse stemmen bij grote browsers/besturingssystemen.
  // De Web Speech API geeft geen betrouwbaar "geslacht"-kenmerk, dus werken we met een naamlijst.
  var VOORKEUR_STEM_PATRONEN = [
    "fenna", "claire", "colette", "frieda", "lotte", "nathalie", "xenia",
    "female", "vrouw", "samantha"
  ];

  function vindDoelElement() {
    if (cfg.target) {
      var el = document.querySelector(cfg.target);
      if (el) return el;
    }
    var kandidaten = ["main", "[role='main']", "#content", ".content", "article"];
    for (var i = 0; i < kandidaten.length; i++) {
      var el2 = document.querySelector(kandidaten[i]);
      if (el2) return el2;
    }
    return document.body;
  }

  function isUitgesloten(el) {
    return !!el.closest(UITSLUIT_SELECTOR);
  }

  // ─── Tekst opdelen in zinnen ───
  var AFKORTINGEN = [
    "dhr", "mevr", "dr", "prof", "bijv", "o.a", "d.w.z", "nr", "afd", "etc",
    "jl", "a.s", "resp", "vgl", "zgn", "art", "blz", "ca", "excl", "incl", "min", "max"
  ];

  function zinnenSplitsen(tekst) {
    var fragmenten = [];
    var huidige = "";
    for (var i = 0; i < tekst.length; i++) {
      var teken = tekst.charAt(i);
      huidige += teken;
      var isEindeteken = (teken === "." || teken === "!" || teken === "?");
      if (!isEindeteken) continue;

      var volgende = tekst.charAt(i + 1);
      var isLaatsteTeken = (i === tekst.length - 1);
      if (!isLaatsteTeken && volgende !== " ") continue; // bijv. een decimaal getal of afkorting zonder spatie erna

      if (teken === ".") {
        var isAfkorting = AFKORTINGEN.some(function (a) {
          var staart = huidige.toLowerCase().slice(-(a.length + 1));
          return staart === a + ".";
        });
        if (isAfkorting) continue;
      }
      fragmenten.push(huidige);
      huidige = "";
    }
    if (huidige.length) fragmenten.push(huidige);
    return fragmenten;
  }

  function maakZinSpan(tekst) {
    var span = document.createElement("span");
    span.className = "vl-zin";
    span.textContent = tekst;
    maakKlikbaarOmVanafZinTeStarten(span);
    return span;
  }

  // Wrap alle eigen tekst van een blok-element (exclusief geneste blok-elementen) in
  // <span class="vl-zin">-elementen, één per zin. Bestaande opmaak (links, vet, cursief)
  // binnen het blok blijft intact: alleen de tekstnodes zelf worden vervangen.
  function verwerkTotZinnen(blokEl) {
    var walker = document.createTreeWalker(blokEl, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var ouderBlok = node.parentElement ? node.parentElement.closest(BLOK_SELECTOR) : null;
        if (ouderBlok && ouderBlok !== blokEl) return NodeFilter.FILTER_REJECT;
        if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var tekstNodes = [];
    var n;
    while ((n = walker.nextNode())) tekstNodes.push(n);

    var nieuweSpans = [];
    tekstNodes.forEach(function (textNode) {
      var fragmenten = zinnenSplitsen(textNode.textContent);
      var frag = document.createDocumentFragment();
      fragmenten.forEach(function (stuk) {
        if (!stuk.trim()) { frag.appendChild(document.createTextNode(stuk)); return; }
        var span = maakZinSpan(stuk);
        frag.appendChild(span);
        nieuweSpans.push(span);
      });
      textNode.parentNode.replaceChild(frag, textNode);
    });
    return nieuweSpans;
  }

  function verzamelLeeseenheden() {
    var doel = vindDoelElement();
    var alleBlokken = doel.querySelectorAll(BLOK_SELECTOR);
    var lijst = [];
    alleBlokken.forEach(function (blokEl) {
      if (isUitgesloten(blokEl)) return;

      if (blokEl.hasAttribute("data-vl-wired")) {
        // Al eerder verwerkt (bijv. bij een herscan): bestaande zin-spans hergebruiken —
        // tenzij de pagina zelf de inhoud intussen heeft vervangen (bijv. via innerHTML),
        // waardoor het blok wel als "verwerkt" gemarkeerd staat maar geen zin-spans meer bevat.
        var bestaandeSpans = blokEl.querySelectorAll(".vl-zin");
        if (bestaandeSpans.length) {
          bestaandeSpans.forEach(function (span) {
            if (span.closest(BLOK_SELECTOR) !== blokEl) return; // hoort bij een genest blok
            var tekst = (span.textContent || "").trim();
            if (tekst.length < MIN_TEKENS) return;
            lijst.push({ el: span, tekst: tekst });
          });
          return;
        }
        if (!(blokEl.textContent || "").trim()) return; // écht leeg, niets te doen
        // Geen zin-spans meer aanwezig terwijl er wel tekst is: opnieuw verwerken.
      }

      blokEl.setAttribute("data-vl-wired", "1");
      verwerkTotZinnen(blokEl).forEach(function (span) {
        var tekst = (span.textContent || "").trim();
        if (tekst.length < MIN_TEKENS) { span.replaceWith(span.textContent); return; }
        lijst.push({ el: span, tekst: tekst });
      });
    });
    return lijst;
  }

  function zoekIndexVoorElement(el) {
    for (var i = 0; i < eenheden.length; i++) {
      if (eenheden[i].el === el) return i;
    }
    return -1;
  }

  // Vangnet voor tekst die de pagina zelf ná de laatste scan heeft toegevoegd of vervangen
  // (bijv. een interactief onderdeel dat zijn inhoud ververst) en daardoor nog geen
  // klikbare zin-span heeft. Klikken op zulke tekst wordt hier alsnog opgepakt: forceer een
  // herscan en start bij de eerste zin van het aangeklikte blok.
  function verwerkKlikOpOnbewerkteInhoud(doel) {
    doel.addEventListener("click", function (e) {
      if (e.target.closest(".vl-zin")) return; // al afgehandeld door de eigen zin-klikhandler
      if (e.target.closest("a")) return;
      if (e.target.closest("button, input, select, textarea, label")) return;
      if (isUitgesloten(e.target)) return;
      var blokEl = e.target.closest(BLOK_SELECTOR);
      if (!blokEl) return;
      var selectie = window.getSelection ? window.getSelection().toString() : "";
      if (selectie.length > 0) return;

      initialiseerBijEersteGebruik(function () {
        eenhedenKlaar = false;
        zorgVoorEenheden();
        var eersteSpan = blokEl.querySelector(".vl-zin");
        if (!eersteSpan) return;
        var idx = zoekIndexVoorElement(eersteSpan);
        if (idx === -1) return;
        paneelOpenen();
        herstartVanaf(idx);
      });
    });
  }

  // Klik op een zin (geen link) in de hoofdinhoud: lees vanaf die zin verder.
  function maakKlikbaarOmVanafZinTeStarten(span) {
    span.addEventListener("click", function (e) {
      if (e.target.closest("a")) return; // een link binnen de zin blijft gewoon werken
      if (e.target.closest("button, input, select, textarea, label")) return;
      var selectie = window.getSelection ? window.getSelection().toString() : "";
      if (selectie.length > 0) return; // bezoeker was tekst aan het selecteren, niet aan het klikken om te starten

      initialiseerBijEersteGebruik(function () {
        var idx = zoekIndexVoorElement(span);
        if (idx === -1) {
          // De pagina kan de inhoud ná de laatste scan hebben gewijzigd (bijv. een
          // dynamisch vernieuwd onderdeel): forceer een herscan en probeer opnieuw
          // voordat de klik als "onbekend" wordt genegeerd.
          eenhedenKlaar = false;
          zorgVoorEenheden();
          idx = zoekIndexVoorElement(span);
        }
        if (idx === -1) return;
        paneelOpenen();
        herstartVanaf(idx);
      });
    });
  }

  // ─── Stemselectie: kies de beste beschikbare Nederlandse stem ───
  function alleNederlandseStemmen() {
    var stemmen = window.speechSynthesis.getVoices();
    if (!stemmen || !stemmen.length) return [];
    return stemmen.filter(function (s) { return /^nl/i.test(s.lang); });
  }

  function isVriendelijkeStemNaam(naam) {
    var n = naam.toLowerCase();
    return VOORKEUR_STEM_PATRONEN.some(function (p) { return n.indexOf(p) !== -1; });
  }

  function kiesNederlandseStem() {
    var nlStemmen = alleNederlandseStemmen();
    if (!nlStemmen.length) return null;

    // Als de bezoeker zelf een stem koos, gebruik die.
    if (gekozenStemNaam) {
      var gekozen = nlStemmen.filter(function (s) { return s.name === gekozenStemNaam; });
      if (gekozen.length) return gekozen[0];
    }

    // Anders: geef de voorkeur aan een stem in het Nederlands (Nederland) met een vriendelijke/vrouwelijke naam.
    var nederland = nlStemmen.filter(function (s) { return /nl-nl/i.test(s.lang); });
    var basis = nederland.length ? nederland : nlStemmen;
    var vriendelijk = basis.filter(function (s) { return isVriendelijkeStemNaam(s.name); });
    return (vriendelijk[0] || basis[0]);
  }

  function stemGereedmaken(callback) {
    var stem = kiesNederlandseStem();
    if (stem) { beschikbareStem = stem; vulStemKeuzelijst(); callback(true); return; }
    if (stemZoekPoging > 8) { callback(false); return; }
    stemZoekPoging++;
    setTimeout(function () {
      var s = kiesNederlandseStem();
      if (s) { beschikbareStem = s; vulStemKeuzelijst(); callback(true); }
      else { stemGereedmaken(callback); }
    }, 150);
  }

  function vulStemKeuzelijst() {
    if (!stemSelect) return;
    var nlStemmen = alleNederlandseStemmen();
    if (!nlStemmen.length) return;
    stemSelect.innerHTML = "";
    nlStemmen.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = s.name + (isVriendelijkeStemNaam(s.name) ? " (aanbevolen)" : "") + " — " + s.lang;
      if (beschikbareStem && s.name === beschikbareStem.name) opt.selected = true;
      stemSelect.appendChild(opt);
    });
    if (nlStemmen.length > 1) stemVeldWrap.style.display = "flex";
  }

  // ─── DOM van de widget opbouwen ───
  var widget, knop, paneel, statusEl, voortgangFill, waarschuwingEl, snelheidSelect, stemSelect, stemVeldWrap;
  var btnVorige, btnAfspelen, btnStop, btnVolgende;

  function iconSvg(pad, w) {
    w = w || 20;
    return '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + pad + "</svg>";
  }

  function bouwWidget() {
    widget = document.createElement("div");
    widget.className = "vl-widget";
    widget.setAttribute("data-vl-pos", cfg.positie);
    if (cfg.kleur) widget.style.setProperty("--vl-kleur", cfg.kleur);

    knop = document.createElement("button");
    knop.type = "button";
    knop.className = "vl-knop";
    knop.innerHTML =
      iconSvg('<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>').replace('fill="currentColor"', 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"') +
      "<span>" + cfg.knopTekst + "</span>";
    knop.setAttribute("aria-expanded", "false");
    knop.setAttribute("aria-label", cfg.knopTekst + " — voorleesfunctie openen");

    paneel = document.createElement("div");
    paneel.className = "vl-paneel";
    paneel.setAttribute("role", "region");
    paneel.setAttribute("aria-label", "Voorleesfunctie");

    statusEl = document.createElement("div");
    statusEl.className = "vl-status";
    statusEl.setAttribute("aria-live", "polite");
    statusEl.textContent = "Klaar om voor te lezen.";

    var voortgangTrack = document.createElement("div");
    voortgangTrack.className = "vl-voortgang-track";
    voortgangFill = document.createElement("div");
    voortgangFill.className = "vl-voortgang-fill";
    voortgangTrack.appendChild(voortgangFill);

    var knoppenrij = document.createElement("div");
    knoppenrij.className = "vl-knoppenrij";

    btnVorige = maakBedienKnop("Vorige zin", '<path d="M19 20 9 12l10-8v16Z"/><path d="M5 19V5"/>', false);
    btnAfspelen = maakBedienKnop("Starten", '<path d="M8 5v14l11-7L8 5Z"/>', true);
    btnStop = maakBedienKnop("Stoppen", '<rect x="6" y="6" width="12" height="12" rx="1"/>', false);
    btnVolgende = maakBedienKnop("Volgende zin", '<path d="M5 4l10 8-10 8V4Z"/><path d="M19 5v14"/>', false);
    var btnInstellingen = maakBedienKnop("Instellingen", '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', false);
    btnInstellingen.classList.add("vl-instellingen-knop");
    var sluitBtn = maakBedienKnop("Sluiten", '<path d="M18 6 6 18M6 6l12 12"/>', false);

    btnVorige.addEventListener("click", vorige);
    btnAfspelen.addEventListener("click", afspelenPauzeToggle);
    btnStop.addEventListener("click", stoppen);
    btnVolgende.addEventListener("click", volgende);
    btnInstellingen.addEventListener("click", function () {
      instellingenPop.classList.toggle("vl-open");
      btnInstellingen.setAttribute("aria-expanded", instellingenPop.classList.contains("vl-open") ? "true" : "false");
    });
    sluitBtn.addEventListener("click", function () { stoppen(); paneelSluiten(); });

    knoppenrij.appendChild(btnVorige);
    knoppenrij.appendChild(btnAfspelen);
    knoppenrij.appendChild(btnStop);
    knoppenrij.appendChild(btnVolgende);
    knoppenrij.appendChild(btnInstellingen);
    knoppenrij.appendChild(sluitBtn);

    // Instellingen (snelheid + stem): standaard verborgen, alleen zichtbaar via het tandwiel.
    var instellingenPop = document.createElement("div");
    instellingenPop.className = "vl-instellingen-pop";
    instellingenPop.setAttribute("role", "group");
    instellingenPop.setAttribute("aria-label", "Instellingen voorleesfunctie");

    var instellingenrij = document.createElement("div");
    instellingenrij.className = "vl-instellingenrij";
    var snelheidLabel = document.createElement("label");
    snelheidLabel.className = "vl-instelling-label";
    snelheidLabel.textContent = "Snelheid";
    snelheidLabel.setAttribute("for", "vl-snelheid-veld");
    snelheidSelect = document.createElement("select");
    snelheidSelect.id = "vl-snelheid-veld";
    snelheidSelect.className = "vl-select";
    [["0.75", "0,75×"], ["1", "1× (normaal)"], ["1.25", "1,25×"], ["1.5", "1,5×"]].forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0];
      opt.textContent = o[1];
      if (parseFloat(o[0]) === cfg.snelheid) opt.selected = true;
      snelheidSelect.appendChild(opt);
    });
    snelheidSelect.addEventListener("change", function () {
      cfg.snelheid = parseFloat(snelheidSelect.value) || 1;
      if (status === "leest") { herstartVanaf(huidigeIndex); }
    });
    instellingenrij.appendChild(snelheidLabel);
    instellingenrij.appendChild(snelheidSelect);

    stemVeldWrap = document.createElement("div");
    stemVeldWrap.className = "vl-instellingenrij vl-instellingenrij-stem";
    var stemLabel = document.createElement("label");
    stemLabel.className = "vl-instelling-label";
    stemLabel.textContent = "Stem";
    stemLabel.setAttribute("for", "vl-stem-veld");
    stemSelect = document.createElement("select");
    stemSelect.id = "vl-stem-veld";
    stemSelect.className = "vl-select";
    stemSelect.addEventListener("change", function () {
      gekozenStemNaam = stemSelect.value;
      beschikbareStem = kiesNederlandseStem();
      if (status === "leest") { herstartVanaf(huidigeIndex); }
    });
    stemVeldWrap.appendChild(stemLabel);
    stemVeldWrap.appendChild(stemSelect);
    stemVeldWrap.style.display = "none"; // pas tonen zodra er meerdere stemmen bekend zijn

    instellingenPop.appendChild(instellingenrij);
    instellingenPop.appendChild(stemVeldWrap);

    waarschuwingEl = document.createElement("div");
    waarschuwingEl.className = "vl-waarschuwing";
    waarschuwingEl.style.display = "none";

    paneel.appendChild(statusEl);
    paneel.appendChild(voortgangTrack);
    paneel.appendChild(knoppenrij);
    paneel.appendChild(instellingenPop);
    paneel.appendChild(waarschuwingEl);

    widget.appendChild(knop);
    widget.appendChild(paneel);
    document.body.appendChild(widget);

    knop.addEventListener("click", function () {
      if (widget.classList.contains("vl-open")) {
        stoppen();
        paneelSluiten();
      } else {
        paneelOpenen();
        afspelenPauzeToggle();
      }
    });
  }

  function maakBedienKnop(label, svgPad, isHoofd) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "vl-bedien-knop" + (isHoofd ? " vl-hoofd" : "");
    b.setAttribute("aria-label", label);
    b.title = label;
    b.innerHTML = iconSvg(svgPad, isHoofd ? 22 : 18).replace('fill="currentColor"', 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
    if (svgPad.indexOf("rect") !== -1) {
      // Stop-knop: gevuld vierkant, geen open lijn-stijl
      b.innerHTML = iconSvg(svgPad, isHoofd ? 22 : 18);
    }
    return b;
  }

  function paneelOpenen() {
    widget.classList.add("vl-open");
    knop.setAttribute("aria-expanded", "true");
  }
  function paneelSluiten() {
    widget.classList.remove("vl-open");
    knop.setAttribute("aria-expanded", "false");
  }

  // ─── Voorlezen ───
  function zorgVoorEenheden() {
    if (eenhedenKlaar) return;
    eenheden = verzamelLeeseenheden();
    eenhedenKlaar = true;
  }

  function initialiseerBijEersteGebruik(daarna) {
    zorgVoorEenheden();
    if (!eenheden.length) {
      statusEl.textContent = "Er is geen voorleesbare tekst gevonden op deze pagina.";
      return;
    }
    if (geinitialiseerd) { daarna(); return; }
    stemGereedmaken(function (gevonden) {
      geinitialiseerd = true;
      if (!gevonden) {
        waarschuwingEl.style.display = "block";
        waarschuwingEl.textContent = "Geen Nederlandse spraakstem gevonden op dit apparaat. Voorlezen kan in een andere taal klinken of niet beschikbaar zijn.";
      }
      daarna();
    });
  }

  function afspelenPauzeToggle() {
    if (status === "leest") {
      pauzeren();
      return;
    }
    if (status === "gepauzeerd") {
      hervatten();
      return;
    }
    initialiseerBijEersteGebruik(function () {
      if (!eenheden.length) return;
      speelVanaf(0);
    });
  }

  // Elke aanroep van speelVanaf verhoogt deze teller. Een utterance mag de keten alleen
  // voortzetten als zijn eigen generatie nog de meest recente is — zo negeren we het
  // "onend" van een utterance die inmiddels door een nieuwere actie is ingehaald
  // (bijv. cancel() bij vorige/volgende, of het wijzigen van snelheid/stem).
  var speelGeneratie = 0;

  function speelVanaf(index) {
    if (index < 0 || index >= eenheden.length) { stoppen(); return; }
    huidigeIndex = index;
    markeerActief(index);
    updateVoortgang();
    updateBedienUI("leest");
    status = "leest";

    speelGeneratie++;
    var dezeGeneratie = speelGeneratie;

    var eenheid = eenheden[index];
    var utt = new SpeechSynthesisUtterance(eenheid.tekst);
    utt.lang = "nl-NL";
    if (beschikbareStem) utt.voice = beschikbareStem;
    utt.rate = cfg.snelheid;
    utt.pitch = 1.04; // lichte, warme toon; blijft natuurlijk klinken
    utt.onend = function () {
      if (dezeGeneratie !== speelGeneratie) return; // verouderd: een nieuwere actie heeft dit al ingehaald
      if (status !== "leest") return;
      speelVanaf(index + 1);
    };
    utt.onerror = function () {
      if (dezeGeneratie !== speelGeneratie) return;
      if (status === "leest") speelVanaf(index + 1);
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
    statusEl.textContent = "Bezig met voorlezen — zin " + (index + 1) + " van " + eenheden.length + ".";
  }

  function herstartVanaf(index) {
    window.speechSynthesis.cancel();
    speelVanaf(index);
  }

  function pauzeren() {
    if (status !== "leest") return;
    window.speechSynthesis.pause();
    status = "gepauzeerd";
    updateBedienUI("gepauzeerd");
    statusEl.textContent = "Gepauzeerd bij zin " + (huidigeIndex + 1) + " van " + eenheden.length + ".";
  }

  function hervatten() {
    if (status !== "gepauzeerd") return;
    // pause()/resume() is niet overal even betrouwbaar; herstart de huidige alinea voor consistent gedrag.
    status = "leest";
    updateBedienUI("leest");
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      statusEl.textContent = "Voorlezen hervat.";
    } else {
      herstartVanaf(huidigeIndex);
    }
  }

  function stoppen() {
    speelGeneratie++; // eventuele nog lopende utterance definitief als verouderd markeren
    window.speechSynthesis.cancel();
    status = "gestopt";
    ontmarkeerActief();
    updateBedienUI("gestopt");
    updateVoortgang();
    statusEl.textContent = "Voorlezen gestopt.";
  }

  function vorige() {
    if (huidigeIndex <= 0) return;
    herstartVanaf(huidigeIndex - 1);
  }

  function volgende() {
    if (huidigeIndex >= eenheden.length - 1) { stoppen(); return; }
    herstartVanaf(huidigeIndex + 1);
  }

  function markeerActief(index) {
    ontmarkeerActief();
    var eenheid = eenheden[index];
    if (!eenheid) return;
    eenheid.el.classList.add("vl-actief");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    eenheid.el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  function ontmarkeerActief() {
    eenheden.forEach(function (e) { e.el.classList.remove("vl-actief"); });
  }

  function updateVoortgang() {
    if (!eenheden.length) { voortgangFill.style.width = "0%"; return; }
    var pct = huidigeIndex < 0 ? 0 : Math.round(((huidigeIndex + 1) / eenheden.length) * 100);
    voortgangFill.style.width = pct + "%";
  }

  function updateBedienUI(nieuweStatus) {
    var afspeelPad = nieuweStatus === "leest"
      ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>' // pauze-icoon
      : '<path d="M8 5v14l11-7L8 5Z"/>'; // afspelen-icoon
    btnAfspelen.innerHTML = iconSvg(afspeelPad, 22);
    btnAfspelen.setAttribute("aria-label", nieuweStatus === "leest" ? "Pauzeren" : "Starten");
    btnAfspelen.title = nieuweStatus === "leest" ? "Pauzeren" : "Starten";

    btnVorige.disabled = huidigeIndex <= 0;
    btnVolgende.disabled = eenheden.length ? huidigeIndex >= eenheden.length - 1 : true;
    btnStop.disabled = nieuweStatus === "gestopt";
  }

  // ─── Opstarten ───
  function start() {
    if (!("speechSynthesis" in window)) {
      return; // Browser ondersteunt geen spraaksynthese; plugin voegt zichzelf niet toe.
    }
    bouwWidget();
    updateBedienUI("gestopt");
    zorgVoorEenheden(); // meteen scannen zodat klikken op tekst direct werkt
    verwerkKlikOpOnbewerkteInhoud(vindDoelElement());
    volgDynamischeInhoud();
    if ("onvoiceschanged" in window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", function () {
        if (!geinitialiseerd) beschikbareStem = kiesNederlandseStem();
      });
    }
  }

  // Sommige pagina's laden hun hoofdinhoud pas ná het laden van de pagina zelf
  // (bijvoorbeeld via een fetch-aanroep). Herscan de inhoud automatisch zodra die
  // verschijnt, zolang de bezoeker nog niet met voorlezen is begonnen.
  function volgDynamischeInhoud() {
    if (!("MutationObserver" in window)) return;
    var doel = vindDoelElement();
    var herscanBezig = false;
    var herscanGepland = null;
    var observer = new MutationObserver(function () {
      // Alleen negeren als er op dit moment actief wordt voorgelezen/gepauzeerd; een
      // eerdere leessessie die inmiddels is gestopt mag geen latere wijzigingen blokkeren
      // (bijv. een interactieve tool op de pagina die later opnieuw inhoud vervangt).
      if (status !== "gestopt") return;
      // Voorkom een oneindige cyclus: het herscannen wrapt tekst in <span>'s, wat zelf weer
      // een DOM-wijziging is die deze observer opnieuw triggert. Eén geplande herscan per
      // rustmoment is genoeg; extra meldingen tijdens het verwerken worden genegeerd.
      if (herscanBezig) return;
      if (herscanGepland) clearTimeout(herscanGepland);
      herscanGepland = setTimeout(function () {
        herscanGepland = null;
        herscanBezig = true;
        eenhedenKlaar = false;
        zorgVoorEenheden();
        herscanBezig = false;
      }, 150);
    });
    observer.observe(doel, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 300000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

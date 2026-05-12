# 🌊 Van Oord: Automate or Sink
## Claude Code instructie — volledige spelspecificatie

---

## 1. Project context

We bouwen een **interactieve, coöperatieve, multiplayer browsergame** voor een training bij **Van Oord** (een grote Nederlandse internationale baggeraar / marine contractor). De doelgroep is **project controllers**: ze beheren de financiën van projecten van honderden miljoenen euro's per stuk, en voor elk groot project wordt een aparte BV opgezet.

**Leerdoel van het spel:** mindset shift. Spelers moeten gaan zien dat ze nu te veel handmatig werk doen (Excel, bonnetjes overtypen, elke projectopstart from scratch) en dat AI/automatisering hen daarvan kan bevrijden. Het spel maakt de pijn voelbaar én laat de winst zien.

**Setting:**
- Eenmalige live sessie van **30 minuten totaal**, waarvan ~10 minuten uitleg/demo door host en **15-20 minuten speeltijd**
- **30 spelers in 5 teams van 6**, elk team op één laptop
- Allemaal op hetzelfde bord, in dezelfde realtime sessie

**Belangrijk:** dit is een coöperatief spel. Teams werken naar een **gezamenlijke score** (de Automation Meter). Geen winnaars en verliezers — wel een collectieve uitkomst die laat zien hoe ver de groep is gekomen.

---

## 2. Technische stack

**Front-end:**
- Eén `index.html` bestand met **alle CSS en JavaScript inline** (geen build step, geen bundler)
- Vanilla JavaScript (geen React, geen Vue — houd het simpel en debugbaar)
- Firebase SDK via CDN `<script>` tag (geen npm install)

**Backend / sync:**
- **Firebase Realtime Database** voor gedeelde game state
- Geen eigen server nodig
- Authenticatie: anonymous auth of helemaal geen auth (sessiecode = entry)

**Hosting:**
- Het uiteindelijke `index.html` bestand wordt door de host (Thijs) op zijn eigen statische webserver geplaatst: `portal.anotherdimension.nl/van-oord/`
- Geen Node.js, geen PHP, geen server-side rendering — puur statische HTML die in de browser draait

**Browsers:**
- Moderne desktop browsers (Chrome, Edge, Firefox, Safari) op laptops
- Geen mobile-first nodig (alleen laptops), maar wel responsive zodat het werkt op verschillende laptop schermgroottes

**Firebase Realtime Database structuur (voorgesteld):**

```
sessions/
  {sessionCode}/                    # bijv. "VO-2847"
    status: "waiting" | "playing" | "ended"
    createdAt: <timestamp>
    startedAt: <timestamp>
    durationSeconds: 1200           # 20 minuten
    automationMeter: 0              # 0-100, collectieve score
    activeAutomations:
      receiptScanner: false
      autoReporting: false
      projectTemplate: false
      dataPipeline: false

    teams/
      {teamId}/                     # bijv. "team-1"
        name: "De Dredgers"
        color: "#FF6B35"
        position: 0                 # tile index op bord
        tokens: 10                  # startkapitaal
        inBudgetFreeze: false
        budgetFreezeRoundsLeft: 0
        connected: true
        lastSeen: <timestamp>

    eventLog/
      {eventId}/                    # voor visuele feedback
        type: "roll" | "question" | "automation" | "freeze" | "tokenTransfer"
        teamId: "team-1"
        data: { ... }
        timestamp: <timestamp>
```

**Firebase security rules (voor de eenmalige sessie):** open lezen/schrijven binnen de sessions tree. Geen gevoelige data, sessie is ephemeral.

---

## 3. Bestandsstructuur

```
/van-oord/
  index.html              ← alles in één bestand
  /assets/                ← optioneel: visuals (later toevoegen)
```

Dat is het. Eén HTML-bestand uploaden, klaar.

---

## 4. Twee schermen: host en speler

Het spel heeft **twee modi**, beide in hetzelfde HTML-bestand, via een URL parameter of intro-keuze:

### Host-scherm (`?mode=host`)
Te gebruiken door Thijs, geprojecteerd op een groot scherm in de zaal.

Toont:
- **Sessiecode** groot in beeld (bijv. `VO-2847`)
- **Lijst van ingelogde teams** (live, met aantal spelers indicator)
- **Knop "Start spel"** (start timer, zet status op "playing")
- Tijdens spel: **groot bord** met alle teams zichtbaar in real-time
- **Automation Meter** (grote voortgangsbalk)
- **Countdown timer**
- **Activity feed** (laatste 5 events: "Team Alpha verdiende 3 tokens op Palm Jumeirah")
- Knoppen: pauze, reset, force-end

### Speler-scherm (default `?mode=player` of geen parameter)
Voor elk team op hun eigen laptop.

Toont:
- **Intro**: invoerveld voor sessiecode + teamnaam
- Na inloggen: het **bord** (compact) + hun eigen team-status
- **Hun tokens** prominent
- **Dobbelsteen-knop** (alleen actief als het hun beurt is — zie open punten)
- Wanneer ze op een tile landen: een **modale popup** met het vakje-effect (vraag, betaal tokens, etc.)
- **Mini Automation Meter** (zelfde als host)

---

## 5. Gameplay flow

### Voor het spel
1. Host opent `?mode=host` op groot scherm
2. Host klikt "Maak nieuwe sessie" → systeem genereert sessiecode (`VO-XXXX`)
3. Sessiecode verschijnt groot in beeld
4. Teams openen de URL op hun laptops, voeren sessiecode + teamnaam in
5. Op host-scherm verschijnen ingelogde teams
6. Host klikt **Start** zodra alle teams binnen zijn

### Tijdens het spel
1. Timer start (20 minuten countdown)
2. Teams gooien dobbelsteen, pion beweegt
3. Vakje-effect wordt getriggerd (zie sectie 7)
4. Vraag/betaling/etc afgehandeld → tokens updaten → state syncen
5. Volgende team

### Einde van het spel
- Timer loopt af → status wordt "ended"
- Eindscherm toont de **Automation Meter** + boodschap (zie sectie 9)
- Host kan reset doen voor een nieuwe sessie

---

## 6. Het bord

**40 tiles** in een vierkant Monopoly-layout (10 per zijde, hoeken inbegrepen).

### Regio's (de "steden", elk een eigen kleur):

| Regio | Kleur (suggestie) |
|---|---|
| 🇦🇪 Dubai & Middle East | Goudgeel |
| 🇳🇱 Nederland & Noordzee | Oranje |
| 🇬🇧 United Kingdom | Donkerblauw |
| 🇩🇰🇧🇪 Scandinavië & België | Lichtblauw |
| 🌍 Emerging Markets | Groen |

### Projecten (de "straten"):

Elke regio krijgt 3-4 projecten. **Echte Van Oord projecten** — herkenbaar voor de doelgroep:

**Dubai & Middle East:**
- Palm Jumeirah ⭐⭐⭐
- The World Islands ⭐⭐
- Palm Deira ⭐⭐
- Jumana Island ⭐

**Nederland & Noordzee:**
- Maasvlakte 2 ⭐⭐⭐
- Borssele III & IV (offshore wind) ⭐⭐
- Hollandse Kust Noord ⭐⭐
- Oosterscheldekering ⭐

**United Kingdom:**
- Sofia Offshore Wind Farm (1.4 GW) ⭐⭐⭐
- Lincolnshire kustbescherming ⭐⭐
- Millport (Schotland) ⭐

**Scandinavië & België:**
- Norther Wind Farm (België) ⭐⭐
- Kriegers Flak (Denemarken) ⭐⭐
- Baltica 2 (Polen) ⭐⭐⭐

**Emerging Markets:**
- Suez Canal (Egypte) ⭐⭐⭐
- Tuas Mega Port (Singapore) ⭐⭐⭐
- Jakarta Island (Indonesië) ⭐⭐
- Greater Changhua (Taiwan) ⭐⭐

### Speciale tiles:

- **START** (hoek): elke ronde = +2 tokens
- **Budget Freeze 🔒** (hoek): zie sectie 8
- **Free Parking / Contingency Reserve** (hoek): kaart trekken
- **Go to Budget Freeze** (hoek): direct naar freeze tile
- **⛽ Fuel Station** (4x verspreid): -2 tokens (operationele kosten)
- **🤖 Automation Hub** (2-3x): hier kun je automatiseringen kopen
- **📋 Manual Work Penalty** (2x): -3 tokens (de pijn van handmatig werk)
- **🃏 Project Briefing** (4-5x): random kaart met situatie + bonus/penalty

**Verdeling op bord (40 tiles totaal):**
- 4 hoeken: Start, Budget Freeze, Contingency Reserve, Go to Freeze
- 16 project tiles
- 4 Fuel Stations
- 2-3 Automation Hubs
- 2 Manual Work Penalties
- 4-5 Project Briefings
- 5-7 Contingency Reserve / extra tiles

Pas dit aan zodat het netjes uitkomt op 40.

---

## 7. Vakje-effecten

### Landen op een projectvakje
1. Popup verschijnt met **situatie + meerkeuzevraag** (zie vragenbank)
2. Team kiest A/B/C/D
3. Correct antwoord → **+3 tokens**
4. Fout antwoord → **-1 token**
5. Korte uitleg in popup (1-2 zinnen) over waarom dit het juiste antwoord is — **dit is het leermoment**
6. Als een ánder team dit projectvakje als eerste correct beantwoordde, "bezitten" zij het project en krijgen **+1 token** wanneer iemand erop landt

### Landen op Fuel Station
- Automatisch -2 tokens (animatie, geen interactie)
- Tekst: "Operationele kosten voor je baggermachines"

### Landen op Manual Work Penalty
- Automatisch -3 tokens
- Random tekst uit een lijstje:
  - "Je hebt 200 bonnetjes handmatig overgetypt."
  - "Drie dagen besteed aan project-opstart zonder template."
  - "Excel-bestand crashte. Alles opnieuw doen."
  - "Maandafsluiting gemist door handmatige consolidatie."

### Landen op Automation Hub
- Popup met lijst van beschikbare automatiseringen
- Team kan er één kopen (als ze genoeg tokens hebben)
- Effect wordt collectief geactiveerd voor alle teams

### Landen op Project Briefing / Contingency Reserve
- Random kaart uit een gedefinieerde lijst (zie sectie 11)

### Langs START
- +2 tokens

### Op "Go to Budget Freeze"
- Direct naar Budget Freeze tile

---

## 8. Budget Freeze 🔒

Een team gaat in Budget Freeze in twee gevallen:
1. Hun tokens komen op 0 of lager
2. Ze landen op "Go to Budget Freeze"

**In Budget Freeze:**
- Team slaat 1 ronde over (kan niet bewegen)
- Krijgt een **Manual Work Challenge** popup: een vraag over een handmatig proces dat ze moeten automatiseren
- Correct antwoord → +3 tokens, weer vrij
- Fout antwoord → blijven nog 1 ronde, en krijgen een nieuwe vraag

---

## 9. Tokens en Automation Meter

### Tokens (per team)
- Start met **10 tokens**
- Verdienen door correcte vragen, START passeren, eigenaar van project zijn, sommige kaarten
- Verliezen door foute vragen, Fuel Station, Manual Work Penalty, sommige kaarten

### Automatiseringen (collectief)

Wanneer een team een automatisering "koopt" op een Automation Hub, geldt deze voor **alle teams**:

| Automatisering | Kosten | Collectief effect |
|---|---|---|
| 📄 Receipt Scanner | 5 tokens | Fuel Station kost -1 i.p.v. -2 |
| 📊 Auto-rapportage | 6 tokens | Manual Work Penalty -1 i.p.v. -3 |
| 🚀 Project Template AI | 7 tokens | Passeren START geeft +4 i.p.v. +2 |
| 🔗 Data Pipeline | 8 tokens | Correcte vraag geeft +4 i.p.v. +3 |

### Automation Meter (collectieve score)

- Begint op 0%
- Loopt op naarmate teams meer doen:
  - Correct antwoord: +2%
  - Automatisering gekocht: +10%
  - Manual Work Penalty: -1%
- Maximum 100%
- Toont real-time op host- én speler-scherm

### Eindscore

Bij einde timer:
- **0-30%** 🔴 *"Veel handmatig werk. Het project loopt uit de hand."*
- **30-70%** 🟡 *"Op de goede weg. Maar er is nog veel winst te halen."*
- **70-100%** 🟢 *"Project controllers van de toekomst. Van Oord is klaar voor morgen."*

---

## 10. Vragenbank

De vragenbank wordt geleverd als JSON-object. Per projectvakje is er minimaal 1 vraag. **14 vragen zijn al uitgewerkt** (Dubai, Nederland, UK, Scandinavië/België). **De overige 4 project-vragen zijn placeholders** — die vult Thijs later aan. Het spel moet wél werken met de placeholders, zodat we kunnen testen.

### Werkende vragen (gebruik deze letterlijk):

```json
{
  "questions": {
    "palm-jumeirah": [{
      "situation": "Op locatie in Dubai krijgt je team wekelijks 200 bonnetjes binnen van lokale leveranciers — fuel, catering, materiaal. Iemand typt ze nu één voor één over in Excel om ze te matchen aan PO's.",
      "question": "Wat is de slimste eerste stap?",
      "options": [
        { "text": "Een betere Excel-template met dropdowns maken", "correct": false },
        { "text": "Een AI-tool inzetten die foto's van bonnetjes uitleest, bedragen extraheert en matcht aan openstaande PO's", "correct": true },
        { "text": "Een extra administratief medewerker inhuren voor Dubai", "correct": false },
        { "text": "De leveranciers vragen om digitale facturen te sturen", "correct": false }
      ],
      "explanation": "Optie D klinkt logisch maar lost het probleem niet op de korte termijn op — leveranciers veranderen niet zomaar. OCR + AI doet dit nu, vandaag, zonder iemand anders erbij."
    }],

    "the-world-islands": [{
      "situation": "De maandafsluiting kost je drie volle dagen. Het grootste deel: cijfers uit het ERP halen, in Excel zetten, kruisverbanden maken, formatteren voor de directie.",
      "question": "Waar zit de grootste tijdwinst?",
      "options": [
        { "text": "Sneller leren werken met Excel sneltoetsen", "correct": false },
        { "text": "Het ERP-systeem laten upgraden", "correct": false },
        { "text": "Een Power BI dashboard bouwen dat de ERP-data automatisch ophaalt en de standaardrapporten genereert", "correct": true },
        { "text": "Een junior aannemen voor de data-handelingen", "correct": false }
      ],
      "explanation": "Sneltoetsen zijn pleisters. Het probleem is dat je elke maand hetzelfde werk opnieuw doet — dat is per definitie automatiseerbaar. Power BI doet dit éénmalig opzetten en dan voor altijd."
    }],

    "palm-deira": [{
      "situation": "Je project manager vraagt om een forecast-update. Je weet dat je hiervoor data nodig hebt uit vier systemen: ERP, planning, urenregistratie en de contractadministratie. Dat samenvoegen kost je een halve dag.",
      "question": "Wat doe je structureel?",
      "options": [
        { "text": "Een vaste tijdslot inplannen elke vrijdag voor forecasts", "correct": false },
        { "text": "De project manager vragen om eerder te vragen", "correct": false },
        { "text": "Een datakoppeling maken die de vier bronnen automatisch samenvoegt, zodat een forecast in 5 minuten klaar is", "correct": true },
        { "text": "Een Excel-macro schrijven die copy-paste-werk versnelt", "correct": false }
      ],
      "explanation": "Een macro op handmatig werk is nog steeds handmatig werk. De echte winst zit in dat je nooit meer hoeft te kopiëren — de data komt naar jou."
    }],

    "jumana-island": [{
      "situation": "Voor dit nieuwe project moet er een aparte BV worden opgezet. Je gaat aan de slag met een lege map en bouwt vanaf nul: rekeningschema, dashboard, rapportagestructuur, kostenposten. Net als bij het vorige project. En het project daarvoor.",
      "question": "Wat is er hier mis?",
      "options": [
        { "text": "Niets, elk project is uniek", "correct": false },
        { "text": "Er is geen standaard projectopstart-template — elke keer wordt het wiel opnieuw uitgevonden", "correct": true },
        { "text": "De BV had eerder opgezet moeten worden", "correct": false },
        { "text": "Het rekeningschema is te complex", "correct": false }
      ],
      "explanation": "Project controllers bij Van Oord zetten constant nieuwe BV's op. Eén keer een goede template maken (rekeningschema, dashboard, rapportageblok) bespaart elke nieuwe BV dagen. Dit is geen AI — dit is gewoon stoppen met dingen opnieuw doen."
    }],

    "maasvlakte-2": [{
      "situation": "Je project manager stuurt vrijdagmiddag een appje: 'Even snel: hoe staan we ervoor qua kosten?' Jij weet dat het antwoord 40 minuten werk is.",
      "question": "Wat is de échte oplossing?",
      "options": [
        { "text": "Hem antwoorden dat hij maandag een update krijgt", "correct": false },
        { "text": "Sneller leren waar de cijfers staan", "correct": false },
        { "text": "Een live dashboard maken dat hij zelf kan openen — dan stelt hij die vraag nooit meer", "correct": true },
        { "text": "Vragen of hij voortaan via mail wil vragen", "correct": false }
      ],
      "explanation": "De vraag is niet 'hoe beantwoord ik dit sneller', maar 'hoe zorg ik dat deze vraag niet meer bij mij hoeft te komen'. Self-service dashboards zijn de stille killer van last-minute vragen."
    }],

    "borssele": [{
      "situation": "Elke maand stuur je een Excel met 12 tabbladen door naar finance op het hoofdkantoor. Zij kopiëren delen daaruit naar hun eigen consolidatiemodel. Je weet dat ze regelmatig fouten maken bij het overtypen.",
      "question": "Wat los je op?",
      "options": [
        { "text": "Mooier opmaken zodat ze minder fout doen", "correct": false },
        { "text": "Een handleiding sturen erbij", "correct": false },
        { "text": "De data direct via een koppeling beschikbaar maken voor finance, zodat niemand meer overtypt", "correct": true },
        { "text": "Sneller doorsturen zodat ze meer tijd hebben", "correct": false }
      ],
      "explanation": "Dubbel werk = dubbel risico. Als twee mensen dezelfde cijfers handmatig in twee bestanden zetten, is de vraag niet óf er fouten komen — maar wanneer."
    }],

    "hollandse-kust-noord": [{
      "situation": "Je hebt 30 leveranciersfacturen op je bureau (lees: in je inbox als PDF). Per factuur moet je: bedrag controleren, koppelen aan PO, juiste kostencategorie kiezen, accorderen.",
      "question": "Hoe pak je dit aan met AI?",
      "options": [
        { "text": "De PDF's bundelen en in één keer doorlopen", "correct": false },
        { "text": "De leveranciers vragen om Excel-bijlagen", "correct": false },
        { "text": "AI-tool laten PDF's uitlezen, bedragen vergelijken met PO's, en alleen de twijfelgevallen aan jou voorleggen", "correct": true },
        { "text": "Een collega vragen om te helpen", "correct": false }
      ],
      "explanation": "Optie A is sneller fietsen op een platte band. Het idee is: AI doet 80% (de matches), jij doet alleen de 20% waar je écht nodig bent."
    }],

    "oosterscheldekering": [{
      "situation": "Je werkt aan een variance-analyse: waar wijken de werkelijke kosten af van budget, en waarom? Je staart al twee uur naar Excel met 4.000 regels en probeert patronen te zien.",
      "question": "Wat is een slimme AI-aanpak?",
      "options": [
        { "text": "Een grafiek maken om het visueel te zien", "correct": false },
        { "text": "De dataset naar een AI-assistent uploaden en vragen om de grootste afwijkingen en mogelijke oorzaken te identificeren", "correct": true },
        { "text": "Filteren op de top-10 grootste posten", "correct": false },
        { "text": "De project manager vragen wat hij denkt", "correct": false }
      ],
      "explanation": "AI is fenomenaal in patroonherkenning over grote datasets. Dat is precies waar jij twee uur aan verspilde."
    }],

    "sofia-offshore-wind": [{
      "situation": "Het Sofia-project loopt over meerdere jaren. Elke week update je een progress report. De cijfers veranderen, maar de structuur is altijd hetzelfde: opzet, status, risico's, forecast, afwijkingen.",
      "question": "Wat doe je?",
      "options": [
        { "text": "Een mooie Word-template maken", "correct": false },
        { "text": "Een geautomatiseerd rapport dat zichzelf elke week vult met de actuele cijfers uit het ERP", "correct": true },
        { "text": "De vorige week kopiëren en aanpassen", "correct": false },
        { "text": "Eerder beginnen op vrijdag", "correct": false }
      ],
      "explanation": "Een template is een formulier dat je nog steeds zelf invult. Een geautomatiseerd rapport is een formulier dat zichzelf invult. Voel het verschil."
    }],

    "lincolnshire": [{
      "situation": "Voor dit doorlopende project moet je elk kwartaal een uitgebreid rapport schrijven naar de Britse opdrachtgever (Environment Agency). Hetzelfde format, andere cijfers. Je besteedt er een hele dag aan.",
      "question": "Wat is de slimste route?",
      "options": [
        { "text": "Vragen of het in het Nederlands mag", "correct": false },
        { "text": "Een vast format afspreken met de klant", "correct": false },
        { "text": "AI laten een conceptversie schrijven op basis van de cijfers en jouw aantekeningen — jij reviewt en stuurt door", "correct": true },
        { "text": "De vorige rapporten als basis gebruiken", "correct": false }
      ],
      "explanation": "Een dag werk vs. een uur reviewen. Het rapport hoeft niet door jou geschreven te worden — het moet door jou geaccepteerd worden. Dat is iets anders."
    }],

    "millport": [{
      "situation": "Het project is klein maar er zit een lange staart aan: meer dan 80 kleine wijzigingen sinds de start. Iemand vraagt: 'Wat is de totale impact van alle wijzigingen op het oorspronkelijke budget?' Je hebt geen idee waar je moet beginnen.",
      "question": "Hoe pak je dit aan?",
      "options": [
        { "text": "Alle 80 wijzigingen handmatig optellen in een nieuw Excel", "correct": false },
        { "text": "Zeggen dat dit te veel werk is voor nu", "correct": false },
        { "text": "De change log naar een AI-assistent kopiëren en vragen om totaal, categorisering en grootste afwijkers", "correct": true },
        { "text": "Vragen of een collega kan helpen", "correct": false }
      ],
      "explanation": "AI is geen vervanger voor je oordeel — wel voor het uitzoekwerk dat eraan voorafgaat. Eerst de structuur eruit, dan jij eroverheen."
    }],

    "norther": [{
      "situation": "Dit project draait in samenwerking met meerdere partners. Elke partner heeft een eigen rapportageformat. Jij ontvangt drie verschillende Excels per maand en moet ze consolideren tot één dashboard.",
      "question": "Wat los je op?",
      "options": [
        { "text": "Vragen of iedereen jouw format wil gebruiken", "correct": false },
        { "text": "Een vierde Excel maken met alles erin", "correct": false },
        { "text": "Een tool inzetten die de drie formats inleest en automatisch consolideert, ongeacht hun structuur", "correct": true },
        { "text": "Elke maand drie uur reserveren voor de consolidatie", "correct": false }
      ],
      "explanation": "Optie A is hopen op gedragsverandering bij anderen. Werkt nooit. De truc is: jouw eigen werk slimmer maken, ongeacht wat de buren doen."
    }],

    "kriegers-flak": [{
      "situation": "De Deense opdrachtgever wil cost reports in een specifiek format dat afwijkt van wat jouw ERP uitspuugt. Iemand zet elke maand handmatig de cijfers over naar hun template.",
      "question": "Slimste oplossing?",
      "options": [
        { "text": "De Deense klant overtuigen om jouw format te accepteren", "correct": false },
        { "text": "Een conversie-script bouwen dat de ERP-output automatisch omzet naar hun template", "correct": true },
        { "text": "De ERP-export aanpassen", "correct": false },
        { "text": "Een trainee inwerken op deze taak", "correct": false }
      ],
      "explanation": "Externe klanten passen zich niet aan jou aan. Dat is een vast gegeven. Het slimme is: hun eis omarmen, en de vertaalslag automatiseren — één keer."
    }],

    "baltica-2": [{
      "situation": "Bij de start van dit Poolse project staat de klok stil terwijl jij de financiële structuur opzet. Het PM-team wacht op je: rekeningschema, kostencategorieën, dashboards, eerste forecast. Het kost je twee weken.",
      "question": "Hoe kan dit sneller bij het volgende project?",
      "options": [
        { "text": "Twee weken inplannen aan het begin van elk project", "correct": false },
        { "text": "Eerder beginnen, voordat de contracten getekend zijn", "correct": false },
        { "text": "Een herbruikbaar project-startpakket maken: template-BV, default dashboards, standaard kostencategorieën — drukt de opstart van weken naar dagen", "correct": true },
        { "text": "Een tweede project controller toewijzen aan de opstart", "correct": false }
      ],
      "explanation": "Elk groot Van Oord-project krijgt zijn eigen BV. Elke keer opnieuw vanaf nul beginnen is structureel zonde. Een template-pakket is geen luxe — het is een productiviteitsmultiplier."
    }]
  }
}
```

### Placeholder-vragen (4 projecten in Emerging Markets):

Voor de projecten **Suez Canal, Tuas Mega Port, Jakarta Island, en Greater Changhua** gebruikt het spel een **generieke placeholder-vraag**:

```json
{
  "_placeholder": {
    "situation": "[Placeholder: deze vraag wordt later aangevuld voor dit specifieke project.]",
    "question": "Wat is de slimste aanpak voor een handmatige terugkerende taak?",
    "options": [
      { "text": "Een betere Excel-template maken", "correct": false },
      { "text": "Het werk automatiseren met de juiste tool", "correct": true },
      { "text": "Iemand extra inhuren", "correct": false },
      { "text": "Wachten tot het systeem wordt vernieuwd", "correct": false }
    ],
    "explanation": "Placeholder — definitieve uitleg volgt."
  }
}
```

**Belangrijk voor Claude Code:** het spel moet probleemloos werken met deze placeholders. De Emerging Markets projecten staan gewoon op het bord, en wanneer een team erop landt, krijgt het de placeholder-vraag. Visueel mag een klein **🚧** icoontje aangeven dat dit een placeholder is.

### Manual Work Challenges (voor Budget Freeze): placeholders

Voor de Budget Freeze gebruikt het spel **tijdelijk dezelfde projectvragen** (random gekozen uit de pool). Een aparte set Manual Work Challenges schrijft Thijs later.

---

## 11. Contingency Reserve kaarten

Random kaart bij landen op Contingency Reserve tile. JSON:

```json
{
  "contingencyCards": [
    {
      "title": "Klantverzoek",
      "text": "Klant vraagt last-minute extra rapportage. Handmatig opstellen kost je team tijd.",
      "tokenChange": -3
    },
    {
      "title": "Slimme zet",
      "text": "Project controller gebruikt ChatGPT voor eerste conceptrapport. Tijdwinst voor het hele team.",
      "tokenChange": 2,
      "collective": true
    },
    {
      "title": "Excel-crash",
      "text": "Je consolidatiemodel crashte. Twee dagen werk kwijt.",
      "tokenChange": -3
    },
    {
      "title": "AI breakthrough",
      "text": "Je hebt een dashboard volledig geautomatiseerd. Het hele team profiteert.",
      "tokenChange": 3,
      "collective": true
    }
    /* ... uitbreiden naar 12-15 kaarten ... */
  ]
}
```

`collective: true` betekent: alle teams krijgen de bonus/penalty, niet alleen het team dat de kaart trok.

---

## 12. UI/UX richtlijnen

**Belangrijk:** Visuals worden later afgestemd. Voor nu: **functioneel, schoon, leesbaar**. Geen flashy animaties.

- **Donker thema** met heldere accenten (oceaan-vibe past bij Van Oord, maar houd het sober)
- Duidelijke typografie (system fonts zijn prima: -apple-system, Segoe UI, Roboto)
- Bord renderen als CSS grid (10x10 met hoeken), geen canvas/SVG nodig in deze versie
- Teampionnen: gekleurde cirkels met teamnaam erin
- Popups: modale dialogs met duidelijke buttons
- Animaties: minimaal, alleen voor dobbelsteen + token-verandering (subtiele +3 / -2 floaters)
- Geluid: **uitschakelbaar**, default uit (het is een professionele setting)

**Mobiel:** niet primair, maar laat het bord op een tablet of grote laptop nog werkbaar zijn.

---

## 12b. 3D rendering — het bord als fysiek speelveld

**Belangrijk:** Het bord moet er uitzien als een echt Monopoly-bord in 3D, met metalen pionnetjes die de Van Oord-werktuigen voorstellen. Dit geeft het spel het tastbare, herkenbare karakter dat past bij de doelgroep — dit zijn hun eigen machines.

### Technische keuze: Three.js

- Three.js via CDN (`<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`)
- Geen build step, geen npm
- Past in hetzelfde `index.html` bestand
- WebGL is standaard beschikbaar in alle moderne laptop-browsers

### Het 3D-bord

- **Plat speelvlak** (zoals een echte Monopoly-bord), licht gekanteld (~30 graden) voor diepte
- **40 tiles** als vierkante "vakken" met een lichte verhoging (alsof het bord-segmenten zijn)
- Tile-kleuren matchen de regio-kleuren uit sectie 6
- Tekst op tiles: projectnaam (gebruik Three.js `TextGeometry` of canvas-textures voor leesbaarheid)
- **Camera:** vaste isometrische view, kantelbaar/draaibaar met muis is bonus (later)
- **Verlichting:** ambient light + één directional light voor schaduwen op pionnen

### De pionnen — metalen Van Oord-werktuigen

Vijf teams = vijf verschillende pionnen. Allemaal in **zilver/metallic materiaal** (Three.js `MeshStandardMaterial` met hoge `metalness`, lage `roughness`) zodat ze er echt uitzien als die klassieke Monopoly-pionnen.

| Team | Pion | Beschrijving |
|---|---|---|
| 1 | 🚜 Graafmachine | Excavator met arm |
| 2 | 🚢 Hopper dredger | Schip (Van Oord's signature) |
| 3 | 🚛 Vrachtwagen | Truck |
| 4 | 🪣 Kiepwagen | Dumptruck met laadbak |
| 5 | 🏗️ Kraan | Heavy-lift kraan (denk: Svanen) |

**Modellen — twee opties:**

**Optie A: Procedureel gebouwd met Three.js primitives**
- Combineer `BoxGeometry`, `CylinderGeometry`, `ConeGeometry` om de werktuigen te bouwen
- Voordeel: geen externe bestanden, alles in `index.html`
- Nadeel: stilistisch (geen fotorealisme), maar dat past wel bij de "metalen Monopoly-pion" esthetiek
- **Dit is de aanbeveling voor de eerste versie**

**Optie B: GLB/GLTF modellen laden**
- Externe 3D-modellen (CC0 / royalty-free van bijv. Sketchfab, Poly Haven, of zelf gemaakt)
- Voordeel: ziet er beter uit
- Nadeel: extra bestanden, langere laadtijd, IP-risico
- **Later overwegen**

### Animaties

- **Pion beweegt over tiles:** smooth animatie van vakje naar vakje (lerp over ~1.5 sec, kleine "huppel" per stap voor tactiel gevoel)
- **Dobbelsteen rolt:** 3D dice die fysiek rolt naast het bord en stopt op een waarde
- **Token-verandering:** floating "+3" of "-2" tekst boven de pion die omhoog faded
- **Automation Meter:** kan 2D blijven (HTML overlay), hoeft niet in 3D

### Effecten (voor later — niet voor v1)

Markeer als toekomstig:
- 🌊 Watergolven onder de tiles in zee-regio's
- 💨 Stof bij landing op woestijn-tiles (Dubai)
- ⚡ Sparks bij Automation Hub aankoop
- 🎉 Confetti bij eindscore boven 70%
- 💡 Glow rond de actieve pion (waarvan het beurt is)

### Performance

- 5 pionnen + 40 tiles + 1 dobbelsteen = lage poly count, draait gerust op iedere laptop
- Gebruik `requestAnimationFrame` voor smooth 60fps
- Disable rendering wanneer de tab niet zichtbaar is (battery save)

### Layout met 3D + UI

- 3D scene vult het grootste deel van het scherm (centraal)
- HTML UI als overlay aan de zijkant en bovenkant:
  - Tokens per team (rechts)
  - Automation Meter (boven of onder)
  - Timer (rechtsboven)
  - Activity feed (rechts)
- Popups (vragen, kaarten) als HTML modals over de 3D-canvas heen

### Stappen voor Claude Code (3D-laag)

1. Bouw eerst de **2D-versie** (CSS grid bord, simpele pionnen) en zorg dat alle game logic werkt
2. Wanneer de game loop draait, **vervang het bord-rendering** door de Three.js versie
3. **Pionnen** als losse Three.js objects die je per team aanmaakt
4. Schrijf één functie `movePionTo(teamId, tileIndex)` die de animatie afhandelt
5. **Dobbelsteen** als laatste — eerst mag het ook een 2D widget zijn

Door eerst 2D te bouwen en dan 3D toe te voegen, kun je altijd nog terug als de tijd dringt.

---

## 13. Multiplayer details

- **Sessiecode genereren:** `VO-` + 4 willekeurige cijfers (`VO-4827`)
- **Teams joinen** via code + teamnaam, krijgen automatisch een unieke kleur uit een vooraf gedefinieerde lijst
- **Real-time sync:** Firebase Realtime Database, alle clients luisteren op de sessie-node
- **Wat als een laptop disconnect?** Andere teams kunnen doorspelen. Bij reconnect (zelfde teamnaam invoeren met zelfde sessiecode) opnieuw inhaken op de state. Geen state op het apparaat zelf — Firebase is de single source of truth.
- **Host-controles:** alleen vanaf host-scherm (start, pauze, reset, force-end)
- **Disconnect detectie:** elk team update elke 10 sec een `lastSeen` timestamp. Host ziet visueel als een team niet meer reageert.

---

## 14. Stappenplan voor Claude Code

1. **Setup:** maak `index.html` met basisstructuur, Firebase CDN imports, Three.js CDN import
2. **Firebase config:** lees uit een `<script>` blok bovenin (Thijs vult zijn projectkey in)
3. **Routing:** check URL parameter, render host- of speler-view
4. **Lobby:** host kan sessie maken, spelers kunnen joinen
5. **Bord 2D-versie:** CSS grid, 40 tiles met juiste typen (eerst werkend krijgen)
6. **Game loop in 2D:** dobbelsteen, beweging, tile-effects, vragen, tokens
7. **Automation Meter + automatiseringen kopen**
8. **Budget Freeze logica**
9. **Timer + eindscherm**
10. **Sync alles via Firebase**
11. **3D upgrade:** vervang 2D bord door Three.js scene (sectie 12b)
12. **Pionnen:** procedureel gebouwde metalen Van Oord-werktuigen
13. **Animaties:** pion-beweging, dobbelsteen-roll, token-floaters

Begin met een werkende **single-player demo** (host- en spelerview op één scherm, geen Firebase, 2D bord) om de game loop te testen, en voeg dan Firebase + 3D toe.

---

## 15. OPEN PUNTEN — beslissingen die we nog moeten nemen

Dit zijn punten waarover Thijs nog moet beslissen voordat het spel "af" is. Voor de eerste versie kun je een redelijke default nemen (aangegeven), maar markeer ze zodat ze later aanpasbaar zijn:

### 🟡 1. Turn-based of free-form?
**Vraag:** Spelen teams om de beurt (één tegelijk), of mag iedereen tegelijk dobbelen?

**Probleem:** Met 5 teams en 20 minuten is strict turn-based traag — elk team komt maar ~6 keer aan de beurt.

**Default voorstel:** Free-form. Elk team mag dobbelen wanneer ze willen (geen wachten). Dit voelt energiek en past bij de korte tijd. Token-transfers bij landen op andermans project gebeuren automatisch.

**Alternatief:** Korte turns met 30-sec timer per beurt.

### 🟡 2. Eén of twee dobbelstenen?
**Default voorstel:** Twee dobbelstenen (1-6 + 1-6 = 2-12), zoals Monopoly. Geeft meer variatie en past bij de metafoor.

### 🟡 3. Pionnen op zelfde tile?
**Vraag:** Wat als twee teams op hetzelfde vakje staan?

**Default voorstel:** Geen probleem, beide pionnen zichtbaar (offset). Beide kunnen onafhankelijk hun vakje-effect ondergaan.

### 🟡 4. Vragenbank — wie schrijft de rest?
**Status:** We hebben 3 voorbeeldvragen. Voor het volledige spel zijn er ~20-30 vragen nodig (1-2 per projecttile + Manual Work Challenges).

**Aanbeveling:** Thijs schrijft deze met Claude in een aparte sessie, gebaseerd op echte project-controller frustraties. Tot dan: hergebruik de 3 voorbeeldvragen.

### 🟡 5. Visuele identiteit
**Status:** "Daar hebben we het later over." Voor nu: functionele basis UI.

**Te beslissen:** kleurpalet, logo (Van Oord disclaimer?), illustraties bij projecten, pionnen-design.

### 🟡 6. Disclaimer / juridisch
**Vraag:** Is dit officieel Van Oord-materiaal of een externe training? Moet ergens "training tool, niet officieel Van Oord-materiaal" staan?

### 🟡 7. Taal
**Default voorstel:** Nederlands (doelgroep is Nederlandstalig, Thijs is Nederlands). Maar Van Oord is internationaal — eventueel later een EN-toggle?

### 🟡 8. Wat doen we met tied/eindsituatie?
**Vraag:** Als een team al hun tokens kwijt is en in Budget Freeze blijft hangen — kunnen ze niet meer bijdragen aan de Automation Meter?

**Default voorstel:** Ja, ze kunnen wel meedoen, maar trager. Manual Work Challenges helpen ze eruit. Geen permanente eliminatie.

### 🟡 9. Aantal Project Briefing kaarten / Contingency kaarten
**Default voorstel:** Begin met 12-15 kaarten in elke deck. Voldoende variatie voor 20 minuten spel.

### 🟡 10. Firebase tier
**Aandachtspunt:** Free tier is voldoende voor 30 spelers, maar de database moet wel **alleen voor de sessie open staan** (security rules). Na het event: rules dichtzetten of project pauzeren.

### 🟡 11. 3D pionnen — procedureel of modellen?
**Vraag:** Bouwen we de werktuigen procedureel met Three.js primitives (snel, geen externe bestanden), of laden we GLB-modellen?

**Default voorstel:** Procedureel voor v1. Het past bij de "metalen Monopoly-pion" esthetiek en houdt het bestand zelfstandig. Modellen overwegen als de v1 staat.

### 🟡 12. 3D camera-interactie
**Vraag:** Kan de gebruiker rond het bord draaien/zoomen, of staat de camera vast (isometric)?

**Default voorstel:** Vaste isometric view voor host. Spelers krijgen ook vaste view. Camera-controls toevoegen pas als gewenst — voorkomt dat spelers verdwalen.

---

## 16. Wat Claude Code mag aannemen

- Thijs heeft een Firebase project en kan een config-object aanleveren (apiKey, databaseURL, etc.). Laat een placeholder bovenaan staan.
- Het bestand wordt op `portal.anotherdimension.nl/van-oord/index.html` geplaatst.
- Doelgroep is professioneel (project controllers), dus de UI mag volwassen en sober zijn.
- Het hoeft geen mobiel-eerst te zijn.
- Er zijn geen tests of build-pipelines nodig — gewoon één werkend HTML-bestand.

---

**Einde instructie.**

Vragen? Stel ze voor je begint met bouwen. Anders: build het.

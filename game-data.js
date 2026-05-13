// ============================================================================
// VAN OORD — AUTOMATE OR SINK
// Game data: 22 verified Van Oord projects in 8 canonical Monopoly color groups.
// Every color group sits in one country (or one tightly coupled regional cluster
// where Van Oord has only single projects per country, like the BE/DK/PL wind
// trio). The two darkblue tiles — the Mayfair + Park Lane equivalents — are
// both Dutch megaprojects so the "most expensive" tier reads as one place.
//
// All 22 projects have been verified against public Van Oord / press sources
// (Aug 2025). Sources tracked in /docs/sources.md if added later.
// ============================================================================

window.GROUPS = {
  brown:     { name: 'UK Coastal Defence',      countries: 'United Kingdom',             color: '#8B5A2B', dark: '#4A2D10', text: '#FFFFFF' },
  lightblue: { name: 'Dutch Coastal Heritage',  countries: 'Netherlands',                color: '#A6D7E5', dark: '#3D6F7E', text: '#0B1E26' },
  pink:      { name: 'Dubai Islands',           countries: 'United Arab Emirates',       color: '#D9398B', dark: '#6A1846', text: '#FFFFFF' },
  orange:    { name: 'Dutch Offshore Wind',     countries: 'Netherlands',                color: '#F7941D', dark: '#7A4209', text: '#1B0903' },
  red:       { name: 'UK Major Works',          countries: 'United Kingdom',             color: '#ED1B24', dark: '#6A0810', text: '#FFFFFF' },
  yellow:    { name: 'North-Sea & Baltic Wind', countries: 'Belgium · Denmark · Poland', color: '#F8D300', dark: '#7A6800', text: '#1B1306' },
  green:     { name: 'Emerging Markets',        countries: 'Egypt · Singapore · Taiwan', color: '#1FB25A', dark: '#0A4A22', text: '#FFFFFF' },
  darkblue:  { name: 'Dutch Megaprojects',      countries: 'Netherlands',                color: '#0072BB', dark: '#003860', text: '#FFFFFF' },
};

// 40 tiles. Canonical Monopoly slot layout: 22 projects + 4 RR (fuel) + 2
// utilities (automation) + 2 tax (manual) + 6 chance/CC (briefing) + 4 corners.
window.TILES = [
  /* 0  */ { type: 'corner-start', name: 'GO' },

  /* 1  */ { type: 'project',    id: 'millport',              name: 'Millport (Scotland)',      group: 'brown',     stars: 1, archetype: 'lighthouse' },
  /* 2  */ { type: 'briefing',   name: 'Project Briefing' },
  /* 3  */ { type: 'project',    id: 'lincolnshire',          name: 'Lincolnshire Coast',       group: 'brown',     stars: 2, archetype: 'rock-armor' },
  /* 4  */ { type: 'manual',     name: 'Manual Work' },
  /* 5  */ { type: 'fuel',       name: 'Fuel Station' },
  /* 6  */ { type: 'project',    id: 'oosterscheldekering',   name: 'Oosterscheldekering',      group: 'lightblue', stars: 1, archetype: 'storm-barrier' },
  /* 7  */ { type: 'briefing',   name: 'Project Briefing' },
  /* 8  */ { type: 'project',    id: 'afsluitdijk',           name: 'Afsluitdijk',              group: 'lightblue', stars: 2, archetype: 'storm-barrier' },
  /* 9  */ { type: 'project',    id: 'marker-wadden',         name: 'Marker Wadden',            group: 'lightblue', stars: 2, archetype: 'archipelago' },

  /* 10 */ { type: 'corner-freeze', name: 'Budget Freeze' },

  /* 11 */ { type: 'project',    id: 'palm-deira',            name: 'Palm Deira',               group: 'pink',      stars: 2, archetype: 'palm-single' },
  /* 12 */ { type: 'automation', name: 'Automation Hub' },
  /* 13 */ { type: 'project',    id: 'the-world-islands',     name: 'The World Islands',        group: 'pink',      stars: 2, archetype: 'archipelago' },
  /* 14 */ { type: 'project',    id: 'palm-jumeirah',         name: 'Palm Jumeirah',            group: 'pink',      stars: 3, archetype: 'palm-cluster' },
  /* 15 */ { type: 'fuel',       name: 'Fuel Station' },
  /* 16 */ { type: 'project',    id: 'egmond-aan-zee',        name: 'Egmond aan Zee (OWEZ)',    group: 'orange',    stars: 1, archetype: 'wind-farm-2' },
  /* 17 */ { type: 'briefing',   name: 'Project Briefing' },
  /* 18 */ { type: 'project',    id: 'princess-amalia',       name: 'Princess Amalia (Q7)',     group: 'orange',    stars: 2, archetype: 'wind-farm-2' },
  /* 19 */ { type: 'project',    id: 'borssele',              name: 'Borssele III & IV',        group: 'orange',    stars: 3, archetype: 'wind-farm-3' },

  /* 20 */ { type: 'corner-contingency', name: 'Contingency Reserve' },

  /* 21 */ { type: 'project',    id: 'broomhill-sands',       name: 'Broomhill Sands',          group: 'red',       stars: 2, archetype: 'rock-armor' },
  /* 22 */ { type: 'briefing',   name: 'Project Briefing' },
  /* 23 */ { type: 'project',    id: 'aberdeen-south',        name: 'Aberdeen South Harbour',   group: 'red',       stars: 2, archetype: 'rock-armor' },
  /* 24 */ { type: 'project',    id: 'sofia-offshore-wind',   name: 'Sofia Wind Farm',          group: 'red',       stars: 3, archetype: 'wind-farm-3' },
  /* 25 */ { type: 'fuel',       name: 'Fuel Station' },
  /* 26 */ { type: 'project',    id: 'norther',               name: 'Norther (Belgium)',        group: 'yellow',    stars: 2, archetype: 'wind-farm-2' },
  /* 27 */ { type: 'project',    id: 'kriegers-flak',         name: 'Kriegers Flak (DK)',       group: 'yellow',    stars: 2, archetype: 'wind-farm-2' },
  /* 28 */ { type: 'automation', name: 'Automation Hub' },
  /* 29 */ { type: 'project',    id: 'baltica-2',             name: 'Baltica 2 (Poland)',       group: 'yellow',    stars: 3, archetype: 'wind-farm-3' },

  /* 30 */ { type: 'corner-go-freeze', name: 'Go to Budget Freeze' },

  /* 31 */ { type: 'project',    id: 'greater-changhua',      name: 'Greater Changhua (TW)',    group: 'green',     stars: 2, archetype: 'wind-farm-3' },
  /* 32 */ { type: 'project',    id: 'ain-sokhna',            name: 'Ain Sokhna',               group: 'green',     stars: 3, archetype: 'canal-ship' },
  /* 33 */ { type: 'briefing',   name: 'Project Briefing' },
  /* 34 */ { type: 'project',    id: 'tuas-mega-port',        name: 'Tuas Mega Port',           group: 'green',     stars: 3, archetype: 'port-crane' },
  /* 35 */ { type: 'fuel',       name: 'Fuel Station' },
  /* 36 */ { type: 'briefing',   name: 'Project Briefing' },
  /* 37 */ { type: 'project',    id: 'maasvlakte-2',          name: 'Maasvlakte 2',             group: 'darkblue',  stars: 3, archetype: 'container-port' },
  /* 38 */ { type: 'manual',     name: 'Manual Work' },
  /* 39 */ { type: 'project',    id: 'hollandse-kust-noord',  name: 'Hollandse Kust Noord',     group: 'darkblue',  stars: 3, archetype: 'wind-farm-3' },
];

// ============================================================================
// Questions — 17 real, 5 placeholders. English. Each tied to a project tile by id.
// ============================================================================

window.QUESTIONS = {
  // ---- DUBAI ISLANDS (pink) ----
  'palm-jumeirah': {
    situation: 'On site in Dubai, your team gets 200 receipts a week from local suppliers — fuel, catering, materials. Someone is currently typing each one into Excel by hand to match them against POs.',
    question: 'What is the smartest first move?',
    options: [
      { text: 'Build a better Excel template with dropdowns',                                                                  correct: false },
      { text: 'Use an AI tool that reads photos of the receipts, extracts amounts and matches them to open POs',               correct: true  },
      { text: 'Hire one extra admin person for the Dubai office',                                                              correct: false },
      { text: 'Ask the suppliers to send digital invoices instead',                                                            correct: false },
    ],
    explanation: 'Option D sounds reasonable, but supplier behaviour will not change overnight. OCR + AI does this today, without adding a person to the team.',
  },
  'the-world-islands': {
    situation: 'Your monthly close takes three full days. Most of that time goes to pulling numbers out of the ERP, dropping them into Excel, building cross-references and formatting reports for the directors.',
    question: 'Where is the biggest time win?',
    options: [
      { text: 'Learn Excel shortcuts faster',                                                                  correct: false },
      { text: 'Upgrade the ERP system',                                                                        correct: false },
      { text: 'Build a Power BI dashboard that pulls ERP data automatically and generates the standard reports', correct: true  },
      { text: 'Hire a junior to handle the data wrangling',                                                    correct: false },
    ],
    explanation: 'Shortcuts are bandaids. The real problem is that you redo the same work every month — that is automatable by definition. Set up Power BI once, benefit forever.',
  },
  'palm-deira': {
    situation: 'Your project manager wants a forecast update. To produce it you need data from four systems: ERP, planning, time tracking and contract admin. Merging them takes you half a day.',
    question: 'What do you fix structurally?',
    options: [
      { text: 'Block a fixed Friday slot for forecasts',                                                       correct: false },
      { text: 'Ask the PM to give you more lead time',                                                         correct: false },
      { text: 'Build a data link that pulls and merges the four sources, so a forecast takes 5 minutes',      correct: true  },
      { text: 'Write an Excel macro that speeds up the copy-paste work',                                       correct: false },
    ],
    explanation: 'A macro on top of manual work is still manual work. The win is that you never copy again — the data comes to you.',
  },

  // ---- DUTCH COASTAL HERITAGE (lightblue) ----
  'oosterscheldekering': {
    situation: 'You are doing a variance analysis: where does actual cost deviate from budget, and why? You have been staring at a 4,000-row Excel for two hours, hunting for patterns.',
    question: 'What is a smart AI move?',
    options: [
      { text: 'Make a chart to spot it visually',                                                               correct: false },
      { text: 'Upload the dataset to an AI assistant and ask it to surface the biggest deviations and likely causes', correct: true  },
      { text: 'Filter to the top-10 line items by absolute value',                                              correct: false },
      { text: 'Ask the PM what he thinks is driving it',                                                        correct: false },
    ],
    explanation: 'AI is excellent at pattern recognition across large datasets. That is exactly the two hours you just wasted.',
  },
  'afsluitdijk': {
    situation: 'The Afsluitdijk renovation is a 25-year DBFM contract. The Levvel consortium (Van Oord + BAM + Rebel) is responsible for design, construction, financing AND 25 years of maintenance. You will close the books on this every year for a quarter of a century.',
    question: 'What do you set up on day one?',
    options: [
      { text: 'Hire a permanent team dedicated to Afsluitdijk admin',                                               correct: false },
      { text: 'Build automated reporting + a forecast model linked to the ERP from day one — anything manual gets multiplied by 25', correct: true  },
      { text: 'Use Excel for now; revisit the structure in year three',                                              correct: false },
      { text: 'Wait for Rijkswaterstaat to dictate the reporting format',                                            correct: false },
    ],
    explanation: 'A 25-year contract amplifies every inefficiency by 25×. Anything you set up by hand on day one becomes a quarter of a century of pain. Get the structure right and automate it before the first invoice lands.',
  },
  'marker-wadden': {
    situation: 'Marker Wadden is a brand-new kind of Van Oord project — building biodiversity islands from sediment in the IJsselmeer for Natuurmonumenten. There is no template for the unusual cost categories (eco-monitoring, vegetation surveys, bird counts). The PM team is waiting for your reporting structure before they can start.',
    question: 'Smartest move?',
    options: [
      { text: 'Force-fit the costs into the standard dredging chart of accounts',                                       correct: false },
      { text: 'Co-design a reporting structure with the PM team — and make it reusable for the next nature-positive project', correct: true  },
      { text: 'Email head office and wait for guidance',                                                                correct: false },
      { text: 'Use a separate Excel and consolidate manually each month',                                               correct: false },
    ],
    explanation: 'New project types need new categories. The trick is to build it once, build it well, and make it reusable. The next nature-positive job is already being scoped — your structure is the head start.',
  },

  // ---- DUTCH OFFSHORE WIND (orange) ----
  'egmond-aan-zee': {
    situation: 'Egmond aan Zee (OWEZ) was Van Oord\'s first offshore wind installation, back in 2007. You still have all the project files. The next project (Princess Amalia, same client, similar approach) starts in three months.',
    question: 'What do you do with the OWEZ data?',
    options: [
      { text: 'Archive it — every project is unique anyway',                                                                correct: false },
      { text: 'Build a knowledge base + cost-baseline from OWEZ that the Princess Amalia team can fork and adjust',         correct: true  },
      { text: 'Email a few key contacts to the Princess Amalia team',                                                       correct: false },
      { text: 'Print the financial reports and hand them over in a binder',                                                 correct: false },
    ],
    explanation: 'Every "next project" is faster if the previous project\'s data is structured for reuse. Knowledge transfer needs a data structure — not a chat over coffee.',
  },
  'princess-amalia': {
    situation: 'Princess Amalia (Q7) is jointly owned by Eneco and Mitsubishi. Quarterly cost reports go to both partners — each in their own template. You maintain both Excels by hand. Last quarter Mitsubishi spotted a €40k discrepancy between the two reports — you spent two days reconciling.',
    question: 'Smart approach?',
    options: [
      { text: 'Ask both partners to standardise on one shared template',                                  correct: false },
      { text: 'One source in the ERP; an export script produces both formats',                            correct: true  },
      { text: 'Build one mega-template combining all fields from both partner formats',                   correct: false },
      { text: 'Maintain two separate Excels but cross-check each one against the other',                  correct: false },
    ],
    explanation: 'When data lives in two places, it diverges. The answer is one source with many outputs — never two sources you sync by hand.',
  },
  'borssele': {
    situation: 'Every month you send a 12-tab Excel to head-office finance. They copy parts of it into their consolidation model — and you know they regularly mistype.',
    question: 'What do you actually fix?',
    options: [
      { text: 'Format it more clearly so they make fewer mistakes',                                             correct: false },
      { text: 'Send a manual along with the file',                                                              correct: false },
      { text: 'Make the data available to finance via a direct link, so nobody retypes anything',              correct: true  },
      { text: 'Send it earlier so they have more time',                                                         correct: false },
    ],
    explanation: 'Double work means double the risk. When two people maintain the same numbers in two files, the question is not whether mistakes happen — it is when.',
  },

  // ---- UK MAJOR WORKS (red) ----
  'sofia-offshore-wind': {
    situation: 'Sofia runs over multiple years. Every week you produce a progress report. The numbers change, the structure does not: setup, status, risks, forecast, variances.',
    question: 'What do you do?',
    options: [
      { text: 'Build a pretty Word template',                                                                   correct: false },
      { text: 'Build an automated report that populates itself each week from live ERP data',                  correct: true  },
      { text: 'Copy last week and edit the relevant numbers',                                                   correct: false },
      { text: 'Just start earlier on Friday',                                                                   correct: false },
    ],
    explanation: 'A template is a form you still have to fill in. An automated report is a form that fills itself in. Feel the difference.',
  },
  'lincolnshire': {
    situation: 'Quarterly report to the Environment Agency for the Lincolnshire coastal protection contract. Same format, different numbers. It eats a full day every quarter — including the half hour explaining to your junior why three numbers always differ from last time.',
    question: 'How do you turn a day into an hour?',
    options: [
      { text: 'Outsource the report writing to an external agency',                                       correct: false },
      { text: 'AI drafts the report from the numbers; you review and send',                               correct: true  },
      { text: 'Block a Tuesday each quarter and bash it out',                                             correct: false },
      { text: 'Use last quarter\'s report as a template and update the numbers',                          correct: false },
    ],
    explanation: 'A day of writing vs. an hour of reviewing. The report does not need to be written by you — it needs to be approved by you. Those are different jobs.',
  },
  'millport': {
    situation: 'The project is small but has a long tail: 80+ small change orders since kick-off. Someone asks: "what is the total impact of all changes on the original budget?" You have no idea where to start.',
    question: 'How do you tackle this?',
    options: [
      { text: 'Add all 80 changes by hand in a new Excel',                                                       correct: false },
      { text: 'Say it is too much work right now',                                                               correct: false },
      { text: 'Paste the change log into an AI assistant; ask for total, categorisation and biggest outliers',  correct: true  },
      { text: 'Ask a colleague to help out',                                                                     correct: false },
    ],
    explanation: 'AI does not replace your judgement — it replaces the digging that precedes it. Get the structure out first; you go in on top of it.',
  },

  // ---- NORTH-SEA & BALTIC WIND (yellow) ----
  'norther': {
    situation: 'This project runs with multiple partners. Each partner uses their own reporting format. You get three different Excels per month and have to consolidate them into one dashboard.',
    question: 'What do you fix?',
    options: [
      { text: 'Ask everyone to use your format',                                                                correct: false },
      { text: 'Make a fourth Excel that has everything',                                                        correct: false },
      { text: 'Bring in a tool that ingests the three formats and consolidates automatically — whatever shape they send',  correct: true  },
      { text: 'Block three hours every month for the consolidation',                                            correct: false },
    ],
    explanation: 'Option A is hoping other people will change. They will not. The trick: make your own work smarter, regardless of what the neighbours do.',
  },
  'kriegers-flak': {
    situation: 'The Danish energy ministry wants cost reports in their own format — different from what your ERP exports. Someone retypes the numbers into the client template every month, plus DKK conversion logic on top. Last quarter the client added two new disclosure fields to their template — you propagated the change manually.',
    question: 'Smartest solution?',
    options: [
      { text: 'Convince the client to accept your standard format',                            correct: false },
      { text: 'Build a conversion script: ERP export in, client template out',                 correct: true  },
      { text: 'Have IFS customised to export directly in the client format',                   correct: false },
      { text: 'Hire a junior dedicated to the monthly transcription',                          correct: false },
    ],
    explanation: 'External clients do not adapt to you — that is a given. Two ways to embrace their requirement: customise your ERP (slow, expensive, fragile) or own a small translation script (yours to control). Pick the one you control.',
  },
  'baltica-2': {
    situation: 'At Baltica 2 kick-off the clock stands still while you set up the financial structure. The PM team is waiting on you: chart of accounts, cost categories, dashboards, first forecast. It takes you two weeks.',
    question: 'How can this be faster on the next project?',
    options: [
      { text: 'Block two weeks at the start of every new project',                                               correct: false },
      { text: 'Start earlier — before contracts are signed',                                                    correct: false },
      { text: 'Build a reusable project-startup pack: template BV, default dashboards, standard cost categories — go from weeks to days', correct: true  },
      { text: 'Assign a second PC to the kick-off',                                                              correct: false },
    ],
    explanation: 'Every big Van Oord project gets its own BV. Starting from zero each time is structural waste. A startup pack is not a luxury — it is a productivity multiplier.',
  },

  // ---- DUTCH MEGAPROJECTS (darkblue) ----
  'maasvlakte-2': {
    situation: 'Your PM messages you Friday afternoon: "Quick one — where are we on costs?" You know the answer takes 40 minutes of work.',
    question: 'What is the real solution?',
    options: [
      { text: 'Reply that he gets an update on Monday',                                                         correct: false },
      { text: 'Get faster at finding the numbers',                                                              correct: false },
      { text: 'Build a live dashboard he can open himself — then he will never ask again',                     correct: true  },
      { text: 'Ask him to send these questions by email instead',                                               correct: false },
    ],
    explanation: 'The question is not "how do I answer faster", but "how do I make sure I am not the bottleneck". Self-service dashboards are the silent killer of last-minute questions.',
  },
  'hollandse-kust-noord': {
    situation: 'You have 30 supplier invoices on your desk (read: in your inbox, as PDFs). Each one: check the amount, link to a PO, pick the right cost category, approve.',
    question: 'How would you tackle this with AI?',
    options: [
      { text: 'Batch all the PDFs and run through them in one sitting',                                         correct: false },
      { text: 'Ask the suppliers for Excel attachments instead',                                                correct: false },
      { text: 'Let an AI tool read the PDFs, match against POs, and only flag the edge cases for your review', correct: true  },
      { text: 'Ask a colleague to help out',                                                                    correct: false },
    ],
    explanation: 'Option A is pedalling harder on a flat tyre. The idea: AI does the 80% (the matches), you only handle the 20% where you actually add value.',
  },

  // ---- UK MAJOR WORKS (red) — added in batch 1 ----
  'broomhill-sands': {
    situation: 'Broomhill Sands pays per m³ of sand placed on the beach. The Environment Agency surveys before and after; you survey too. The two surveys never agree exactly — usually within 2%, occasionally 6%. On a £14M contract a 2% gap is £280k. The EA\'s hydrographic surveyor disputes your bathymetric data classification on every milestone.',
    question: 'What ends the dispute cycle?',
    options: [
      { text: 'Send your raw survey data to the EA each month for them to verify',                              correct: false },
      { text: 'Hire a third-party surveyor to act as referee',                                                  correct: false },
      { text: 'Process both surveys through one AI-assisted analysis — every discrepancy traced to its grid cell', correct: true  },
      { text: 'Accept their numbers to keep the relationship sweet',                                            correct: false },
    ],
    explanation: 'Disputes survive in the gap between two opinions. Eliminate the gap: same data, same processing, same conclusion. Whoever owns the explanation owns the outcome.',
  },

  'aberdeen-south': {
    situation: 'Aberdeen South Harbour breakwater consumes 1.4M tonnes of armour rock. Each truck delivery from the quarry must meet spec: weight per piece (3–8 tonnes), gradation, density. Your QC engineer at the quay measures roughly 15% by hand-held device — passing rock goes into the structure, failing rock goes back. Two surveyors clock 60-hour weeks. Quarry is supplying ~20 truckloads a day.',
    question: 'How do you keep the breakwater on spec without burning out the surveyors?',
    options: [
      { text: 'Add a third QC surveyor',                                                       correct: false },
      { text: 'Mount AI vision at the unloading bay; surveyors review only the failures',     correct: true  },
      { text: 'Trust the quarry\'s certificates and move to spot checks only',                correct: false },
      { text: 'Accept rocks within 90% of spec to keep the line moving',                      correct: false },
    ],
    explanation: 'A vision system never gets tired at hour 50. Surveyors stay in the loop where they add value — judging the borderline ones — instead of measuring the obvious ones.',
  },

  // ---- EMERGING MARKETS (green) — added in batch 1 ----
  'greater-changhua': {
    situation: 'Greater Changhua is your second offshore wind project for Ørsted — 100+ monopile foundations across a 30 km² field. Each install generates a 60-page report: pile verticality, penetration depth, position offset, hammer-energy log, soil resistance. The design team in Rotterdam manually cross-checks each report against the design tolerance spec (also 60 pages). Two engineers full-time, one report a day each.',
    question: 'What changes the math here?',
    options: [
      { text: 'Add a third engineer in Rotterdam to clear the backlog',                          correct: false },
      { text: 'Auto-compare each install report against the spec; flag only deviations',         correct: true  },
      { text: 'Move the design tolerance spec into a structured database for easier lookup',     correct: false },
      { text: 'Skip the cross-check on installs that visibly look fine on inspection',           correct: false },
    ],
    explanation: 'The compliance check is dumb work. The judgement call on a deviation is engineering work. AI takes the first hour of the engineer\'s day; you spend the next two on the items that matter.',
  },

  'ain-sokhna': {
    situation: 'Ain Sokhna is a 14-month reclamation contract on the Suez side, USD-denominated. Local subcontractors invoice in EGP, and your milestone payments convert at the actual transfer date. On your last Egyptian project the pound devalued 22% mid-contract — you absorbed €1.4M unhedged. Treasury wants earlier visibility this time.',
    question: 'Where do you put your effort?',
    options: [
      { text: 'Hedge the full contract value upfront with a 12-month forward',                            correct: false },
      { text: 'Set a treasury alert when EGP/USD exposure crosses €100k',                                 correct: true  },
      { text: 'Have the PM chase faster milestone sign-offs every month',                                 correct: false },
      { text: 'Switch your local subcontractors to USD invoicing so they carry the FX risk',              correct: false },
    ],
    explanation: 'Hedging is one tool. The controllable variable is time-to-cash — that is a dashboard problem, not a treasury problem. The €1.4M last time was a visibility miss, not a hedging miss.',
  },

  'tuas-mega-port': {
    situation: 'Tuas is a 25-year programme in 5 phases. By year 3 you are sitting on 1,400 change orders — design tweaks from PSA Singapore, consortium partner requests, regulatory updates. Each change goes through: technical impact → cost re-estimate → commercial agreement → ERP booking. Your two junior controllers in Rotterdam are six weeks behind on the booking step.',
    question: 'What changes the bottleneck?',
    options: [
      { text: 'Hire a third junior to clear the backlog',                                       correct: false },
      { text: 'AI agent does classification + cost draft; seniors do the commercial decisions', correct: true  },
      { text: 'Switch to weekly batch processing of changes',                                   correct: false },
      { text: 'Push back on PSA to reduce the number of change orders',                         correct: false },
    ],
    explanation: '1,400 changes in three years is not a junior\'s job — it is a system\'s job. Free the seniors to make the commercial calls; the seniors are the ones the client actually pays for.',
  },

  // ---- placeholder for projects without a specific question yet ----
  _placeholder: {
    situation: '[Placeholder — a project-specific question will be added later for this tile.]',
    question: 'What is the smartest approach to a recurring manual task?',
    options: [
      { text: 'Build a better Excel template',                                                                  correct: false },
      { text: 'Automate the work with the right tool',                                                          correct: true  },
      { text: 'Hire someone extra',                                                                             correct: false },
      { text: 'Wait until the system gets upgraded',                                                            correct: false },
    ],
    explanation: 'Placeholder — final explanation to follow.',
  },
};

// ============================================================================
// Automations (collective unlocks).
// ============================================================================

window.AUTOMATIONS = [
  { id: 'receiptScanner',  name: 'Receipt Scanner',  desc: 'OCR + AI reads receipts and matches them to POs.', effect: 'Fuel cost −1 instead of −2', cost: 5 },
  { id: 'autoReporting',   name: 'Auto Reporting',   desc: 'The monthly report fills itself from the ERP.',    effect: 'Manual Work −1 instead of −3', cost: 6 },
  { id: 'projectTemplate', name: 'Project Template', desc: 'New BV setup goes from weeks to days.',            effect: 'Pass GO gives +4 instead of +2', cost: 7 },
  { id: 'dataPipeline',    name: 'Data Pipeline',    desc: 'Four source systems, one live dashboard.',         effect: 'Correct answer gives +4 instead of +3', cost: 8 },
];

// ============================================================================
// Briefing cards.
// ============================================================================

window.BRIEFINGS = [
  { title: 'Client request',       text: 'Client asks for a last-minute extra report. Building it manually eats your team\'s evening.',  tokenChange: -3, kind: 'pain' },
  { title: 'Smart move',           text: 'A PC uses AI to draft the first version of the report. Time saved for the whole team.',         tokenChange:  2, kind: 'win',  collective: true },
  { title: 'Excel crash',          text: 'Your consolidation model crashed. Two days of work, gone.',                                     tokenChange: -3, kind: 'pain' },
  { title: 'AI breakthrough',      text: 'You fully automated a dashboard. The whole team benefits.',                                     tokenChange:  3, kind: 'win',  collective: true },
  { title: 'Audit findings',       text: 'External auditor finds unexplained variances. Two days of reconciliation work.',               tokenChange: -2, kind: 'pain' },
  { title: 'New hire',             text: 'Trainee starts — two weeks of onboarding on manual processes before they help.',               tokenChange: -1, kind: 'pain' },
  { title: 'Dashboard live',       text: 'Power BI dashboard goes live. PMs stop sending Friday-afternoon DMs.',                          tokenChange:  3, kind: 'win' },
  { title: 'OCR working',          text: '200 receipts this week — 195 auto-processed. Five edge cases for you.',                         tokenChange:  2, kind: 'win' },
  { title: 'Month-end',            text: 'Working late again. Everyone pitches in.',                                                      tokenChange: -2, kind: 'pain' },
  { title: 'Forecast in 5',        text: 'Data pipeline working: forecast in five minutes flat.',                                         tokenChange:  2, kind: 'win' },
  { title: 'New BV up',            text: 'Project-startup pack used. BV setup in three days instead of three weeks.',                    tokenChange:  3, kind: 'win',  collective: true },
  { title: 'Version chaos',        text: 'Three Excels emailed back and forth. Nobody knows which one is the truth.',                    tokenChange: -2, kind: 'pain' },
];

window.MANUAL_WORK_TEXTS = [
  'You retyped 200 receipts by hand.',
  'Three days lost to project startup without a template.',
  'Excel crashed. Doing it all over again.',
  'Month-end missed because of manual consolidation.',
  'Four hours copying numbers from system A to system B.',
];

// ============================================================================
// Five team pawns — Van Oord equipment.
// ============================================================================

window.TEAM_DEFS = [
  { id: 'team-1', name: 'The Dredgers',  pawn: 'excavator', color: '#FF6B35', accent: '#FFB78A' },
  { id: 'team-2', name: 'The Hoppers',   pawn: 'ship',      color: '#4DD0E1', accent: '#A6E8F0' },
  { id: 'team-3', name: 'The Haulers',   pawn: 'truck',     color: '#F4C430', accent: '#FBE38A' },
  { id: 'team-4', name: 'The Tippers',   pawn: 'dumptruck', color: '#A85EFF', accent: '#D4AFFF' },
  { id: 'team-5', name: 'The Liftcrew',  pawn: 'crane',     color: '#3FE08B', accent: '#9FF0C5' },
];

window.CONSTANTS = {
  STARTING_TOKENS: 10,
  PASS_START_BONUS: 2,
  PASS_START_BONUS_AUTOMATED: 4,
  CORRECT_REWARD: 3,
  CORRECT_REWARD_AUTOMATED: 4,
  WRONG_PENALTY: 1,
  FUEL_COST: 2,
  FUEL_COST_AUTOMATED: 1,
  MANUAL_COST: 3,
  MANUAL_COST_AUTOMATED: 1,
  METER_CORRECT: 2,
  METER_AUTOMATION: 10,
  METER_MANUAL: -1,
};

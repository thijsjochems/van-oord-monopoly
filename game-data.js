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
    situation: 'On site in Dubai, your team gets 200 receipts a week from local suppliers — fuel, catering, materials. Someone is currently typing each one into Excel by hand to match them against open POs.',
    question: 'Where do you start?',
    options: [
      { text: 'Build a better Excel template with dropdowns and validation',           correct: false },
      { text: 'Use AI that reads receipt photos and matches them to open POs',          correct: true  },
      { text: 'Hire one extra admin person dedicated to the Dubai office',              correct: false },
      { text: 'Ask suppliers to switch to digital invoices going forward',              correct: false },
    ],
    explanation: 'Option D sounds reasonable, but supplier behaviour will not change overnight. OCR + AI does this today, without adding a person to the team.',
  },
  'the-world-islands': {
    situation: 'Your monthly close on the World Islands portfolio takes three full days. Most of that time goes to pulling numbers out of the ERP, dropping them into Excel, building cross-references and formatting reports for the directors.',
    question: 'Where is the biggest time win?',
    options: [
      { text: 'Learn Excel shortcuts faster',                                              correct: false },
      { text: 'Upgrade the ERP system',                                                    correct: false },
      { text: 'Build a Power BI dashboard fed straight from the ERP',                      correct: true  },
      { text: 'Hire a junior to handle the data wrangling',                                correct: false },
    ],
    explanation: 'Shortcuts are bandaids. The real problem is that you redo the same work every month — automatable by definition. Set up Power BI once, benefit forever.',
  },
  'palm-deira': {
    situation: 'Palm Deira is back from hibernation: original 2008 scope, revised 2014, mothballed 2018, restart 2024. Three different reporting templates along the way, three different chart-of-accounts revisions. Senior management asks: "What is cumulative cost-to-date vs the original 2008 baseline?" The 2008 controller is retired.',
    question: 'How do you reconstruct the picture?',
    options: [
      { text: 'Read all historical reports yourself; reconcile manually',         correct: false },
      { text: 'Track down the retired controller for context',                    correct: false },
      { text: 'Have AI reconcile the historical reports to the 2008 baseline',    correct: true  },
      { text: 'Reset to 2024 as the new baseline going forward',                  correct: false },
    ],
    explanation: 'Messy historical data in inconsistent formats is the textbook AI use case. Your job is judgement on the edge cases — not pulling the data into one shape.',
  },

  // ---- DUTCH COASTAL HERITAGE (lightblue) ----
  'oosterscheldekering': {
    situation: 'Oosterscheldekering is in year 16 of the 25-year maintenance contract. Annual variance review: actual maintenance spend vs forecast. 4,000 work-order rows across three sub-contractor categories. Board wants the top three structural deviations explained in a one-pager by Friday.',
    question: 'How do you find them?',
    options: [
      { text: 'Filter the spreadsheet to the top-20 line items',                                  correct: false },
      { text: 'Ask an AI assistant to surface structural patterns and categorise root causes',    correct: true  },
      { text: 'Build a pivot table grouped by sub-contractor and category',                       correct: false },
      { text: 'Ask the maintenance manager what he thinks is driving the variances',              correct: false },
    ],
    explanation: 'Big numbers are easy to find. Patterns are hard. AI can spot 47 small overruns sharing one root cause; a pivot table never will. Your job is to validate the pattern and write the commentary, not to find it.',
  },
  'afsluitdijk': {
    situation: 'Afsluitdijk renovation is a 25-year contract. The Levvel consortium (Van Oord + BAM + Rebel) designs, builds, finances AND maintains. You will close the books on this every year for a quarter of a century.',
    question: 'What do you set up on day one?',
    options: [
      { text: 'Hire a permanent admin team dedicated to the 25-year reporting',                  correct: false },
      { text: 'Build automated reporting and a live forecast model on day one — anything manual gets multiplied by 25', correct: true  },
      { text: 'Use Excel for now; revisit the reporting structure in year three or four',         correct: false },
      { text: 'Wait for Rijkswaterstaat to dictate their preferred reporting format',             correct: false },
    ],
    explanation: 'A 25-year contract amplifies every inefficiency by 25×. Anything you set up by hand on day one becomes a quarter of a century of pain. Get the structure right and automate it before the first invoice lands.',
  },
  'marker-wadden': {
    situation: 'Marker Wadden is a brand-new kind of Van Oord project — biodiversity islands built from sediment in the IJsselmeer for Natuurmonumenten. No template for the unusual cost categories (eco-monitoring, vegetation surveys, bird counts). The PM team is waiting for your reporting structure before they can start.',
    question: 'How do you stand it up in days, not weeks?',
    options: [
      { text: 'Force-fit the costs into the standard dredging chart of accounts',                  correct: false },
      { text: 'Hand-build a chart of accounts from scratch using first principles',                correct: false },
      { text: 'Brief AI on the project scope; ask for a draft chart of accounts you can iterate',  correct: true  },
      { text: 'Email head office and wait for guidance',                                            correct: false },
    ],
    explanation: 'Structure-from-scratch is exactly what AI is for. Your brain stays free for the parts only you can do — talking to the PM, judging which categories matter, picking what to track.',
  },

  // ---- DUTCH OFFSHORE WIND (orange) ----
  'egmond-aan-zee': {
    situation: 'Egmond aan Zee (OWEZ) was Van Oord\'s first offshore wind installation back in 2007. You still have the project files: cost baseline, supplier contracts, post-mortems, lessons learned. The next North Sea wind tender is being prepared — same kind of installation work, similar conditions.',
    question: 'What do you do with the OWEZ data?',
    options: [
      { text: 'Archive it — every project is unique anyway',                                  correct: false },
      { text: 'Build a structured knowledge base from OWEZ that the next tender team can fork', correct: true  },
      { text: 'Email a few key contacts to the next tender team',                              correct: false },
      { text: 'Send a folder of select PDFs to the next tender team',                          correct: false },
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
    situation: 'Every month you send a 12-tab Borssele Excel to head-office finance. They copy parts of it into their consolidation model — and you know they regularly mistype.',
    question: 'What do you actually fix?',
    options: [
      { text: 'Format it more clearly so they make fewer mistakes',                              correct: false },
      { text: 'Send a manual along with the file',                                                correct: false },
      { text: 'Make the data available to finance via a direct link — nobody retypes',            correct: true  },
      { text: 'Send it earlier so they have more time',                                           correct: false },
    ],
    explanation: 'Double work means double the risk. When two people maintain the same numbers in two files, the question is not whether mistakes happen — it is when.',
  },

  // ---- UK MAJOR WORKS (red) ----
  'sofia-offshore-wind': {
    situation: 'Sofia runs over multiple years. Every week you produce a progress report for the steering committee. Numbers change, structure does not: setup, status, risks, forecast, variances. Friday afternoons disappear into Word.',
    question: 'How do you stop rewriting it every week?',
    options: [
      { text: 'Build a pretty Word template with placeholders for the numbers',                  correct: false },
      { text: 'Build a weekly report that auto-fills from live ERP data',                         correct: true  },
      { text: 'Copy last week and edit the relevant numbers',                                     correct: false },
      { text: 'Just start earlier on Friday',                                                     correct: false },
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
    situation: 'The Millport project is small but has a long tail: 80+ small change orders since kick-off. Someone asks: "What is the total impact of all changes on the original budget?" You have no idea where to start.',
    question: 'How do you tackle this?',
    options: [
      { text: 'Add all 80 changes by hand into a new Excel and total them',                       correct: false },
      { text: 'Say it is too much work right now and push back',                                   correct: false },
      { text: 'Paste the change log into AI; ask for totals, categories, biggest outliers',       correct: true  },
      { text: 'Ask a colleague to help you go through them all',                                  correct: false },
    ],
    explanation: 'AI does not replace your judgement — it replaces the digging that precedes it. Get the structure out first; you go in on top of it.',
  },

  // ---- NORTH-SEA & BALTIC WIND (yellow) ----
  'norther': {
    situation: 'Norther is the offshore wind farm you and Engie own together. Both partners produce monthly cost reports — yours from IFS, theirs from their own template. Consolidating both into the joint board pack eats the full first week of every month. The board sees numbers when the project is already in mid-month — every steering decision is two weeks late.',
    question: 'What unblocks this?',
    options: [
      { text: 'Push the board meeting back a week so consolidation has more runway',                correct: false },
      { text: 'Hire a junior controller dedicated to the first-week consolidation work',            correct: false },
      { text: 'Automate the consolidation; pack ready Monday week 1',                                correct: true  },
      { text: 'Negotiate a unified reporting template with Engie',                                   correct: false },
    ],
    explanation: 'Consolidation is not your value-add — analysis is. The board needs numbers fresh, not perfect. Automate the input, get back the first week of the month.',
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
      { text: 'Block two weeks at the start of every new project as standard',                       correct: false },
      { text: 'Start earlier — before the contract is signed',                                        correct: false },
      { text: 'Build a reusable startup pack — template BV, default dashboards, standard categories', correct: true  },
      { text: 'Assign a second project controller to the kick-off',                                   correct: false },
    ],
    explanation: 'Every big Van Oord project gets its own BV. Starting from zero each time is structural waste. A startup pack is not a luxury — it is a productivity multiplier.',
  },

  // ---- DUTCH MEGAPROJECTS (darkblue) ----
  'maasvlakte-2': {
    situation: 'Your Maasvlakte 2 PM messages you Friday 16:14: "Quick one — where are we on costs?" You know the answer takes 40 minutes of digging.',
    question: 'What is the real fix?',
    options: [
      { text: 'Reply that he gets an update on Monday',                                  correct: false },
      { text: 'Get faster at finding the numbers',                                        correct: false },
      { text: 'Build a live dashboard he can open himself — he never asks again',         correct: true  },
      { text: 'Ask him to send these questions by email instead',                         correct: false },
    ],
    explanation: 'The question is not "how do I answer faster" but "how do I stop being the bottleneck". Self-service dashboards are the silent killer of last-minute questions.',
  },
  'hollandse-kust-noord': {
    situation: 'Hollandse Kust Noord is operational. You run two Crew Transfer Vessels at €8k/day each. Weather windows for technician transfers are short and unpredictable — typically 4-6 useful hours per day, sometimes zero. Last winter you logged 47 standby-only days. CFO wants 20% off CTV cost this year.',
    question: 'Where is the lever?',
    options: [
      { text: 'Negotiate lower day rates with the CTV provider',                                          correct: false },
      { text: 'Add a third CTV to spread the workload',                                                    correct: false },
      { text: 'Use weather + tide + crew schedules + ML to predict productive days; schedule accordingly', correct: true  },
      { text: 'Switch to helicopter transfers for time-critical jobs',                                     correct: false },
    ],
    explanation: '20% cost reduction is not a contract negotiation — it is a planning problem. ML on three data streams beats human gut feel on whether tomorrow is worth the sail.',
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
  { id: 'receiptScanner',  name: 'Receipt Scanner',  desc: 'OCR + AI reads receipts and matches them to PO\'s. No more retyping.', effect: 'Fuel cost −1 instead of −2',           cost: 5 },
  { id: 'autoReporting',   name: 'Auto Reporting',   desc: 'The monthly report fills itself from the ERP. Friday afternoons free.', effect: 'Manual Work −1 instead of −3',         cost: 6 },
  { id: 'projectTemplate', name: 'Project Template', desc: 'Reusable startup pack for every new BV. Days, not weeks.',             effect: 'Pass GO gives +4 instead of +2',         cost: 7 },
  { id: 'dataPipeline',    name: 'Data Pipeline',    desc: 'Four source systems → one live dashboard. PMs self-serve.',             effect: 'Correct answer gives +4 instead of +3', cost: 8 },
];

// ============================================================================
// Briefing cards.
// ============================================================================

window.BRIEFINGS = [
  { title: 'Client request',       text: 'Client asks for a last-minute extra report. Building it manually eats your team\'s evening.',         tokenChange: -3, kind: 'pain' },
  { title: 'Smart move',           text: 'A controller drafts the report with AI. Done in 30 minutes instead of 4 hours.',                       tokenChange:  2, kind: 'win'  },
  { title: 'Excel crash',          text: 'Your consolidation model crashed. Two days of work, gone.',                                            tokenChange: -3, kind: 'pain' },
  { title: 'AI breakthrough',      text: 'You fully automated a dashboard. The whole team benefits.',                                            tokenChange:  3, kind: 'win',  collective: true },
  { title: 'Audit findings',       text: 'External auditor finds unexplained variances. Two days of reconciliation work.',                       tokenChange: -2, kind: 'pain' },
  { title: 'New hire',             text: 'Trainee starts — two weeks of manual-process onboarding before they help.',                            tokenChange: -2, kind: 'pain' },
  { title: 'Dashboard live',       text: 'Power BI dashboard goes live. PMs stop sending Friday-afternoon DMs to anyone.',                       tokenChange:  3, kind: 'win',  collective: true },
  { title: 'OCR running',          text: 'OCR live across all sites. 195 receipts auto-processed this week, you handle the five edge cases.',  tokenChange:  2, kind: 'win',  collective: true },
  { title: 'Month-end grind',      text: 'Month-end. Working late. Everyone pitches in. The pizza is on the company.',                          tokenChange: -2, kind: 'pain', collective: true },
  { title: 'Forecast in 5',        text: 'Data pipeline working: forecast in five minutes flat.',                                                tokenChange:  2, kind: 'win'  },
  { title: 'New BV up',            text: 'Project-startup pack used. BV setup in three days instead of three weeks.',                            tokenChange:  3, kind: 'win',  collective: true },
  { title: 'Version chaos',        text: 'Three Excels emailed back and forth. Nobody knows which one is the truth.',                            tokenChange: -2, kind: 'pain' },
  { title: 'Cash-flow flag',       text: 'AI flagged the Q3 cash-flow dip in your forecast. Two weeks\' notice instead of two weeks of fire-fighting.', tokenChange:  3, kind: 'win',  collective: true },
  { title: 'Onboarding pack',      text: 'Onboarding video pack live. New hires productive in three days, not three weeks.',                     tokenChange:  2, kind: 'win',  collective: true },
  { title: 'Audit assist',         text: 'AI summarised four audit memos in 12 minutes. Auditor closed without follow-up.',                      tokenChange:  3, kind: 'win'  },
];

window.MANUAL_WORK_TEXTS = [
  'You retyped 200 receipts by hand.',
  'Three days lost to project startup without a template.',
  'Excel crashed. Doing it all over again.',
  'Month-end missed because of manual consolidation.',
  'Four hours copying numbers from system A to system B.',
  'Whole afternoon chasing one €847 mismatch.',
  'Reconciliation done. Auditor asks for it again in a different format.',
  'Tab `Final_v3_REAL_use_this` opened by mistake.',
  'PM forwards your spreadsheet to the client without checking. Now you explain.',
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

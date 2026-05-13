// ============================================================================
// UI + game actions. Single file so events and DOM stay close together.
// All DOM nodes referenced by data-role attributes set in index.html.
// ============================================================================

(function () {
  const GS = window.GameState;
  const C = window.CONSTANTS;
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => document.querySelectorAll(q);

  // ----- module-level references -----
  let board;        // Board3D.Board instance
  const $top = {
    code:     null,
    timerVal: null,
    timerWrap:null,
    start:    null,
    pause:    null,
    reset:    null,
    skipEnd:  null,
  };
  const $host = {
    h1:       null,
    sub:      null,
    teams:    null,
    feed:     null,
  };
  const $player = {
    tabs:     null,
    body:     null,
  };
  const $footer = {
    meter:    null,
    meterVal: null,
    meterLbl: null,
  };
  const $modal = $('#modal-host');

  let timerInterval = null;
  let busyTeams = new Set(); // team ids currently mid-animation
  let lastRoll = null;
  let modalQueue = [];
  let modalShowing = false;
  let mounted = false;
  let mountCtx = { role: 'solo', myTeamId: null, sessionCode: null, mode: 'solo' };
  let endShown = false;
  // Modes that should NOT show host-style admin controls (pause/reset/start)
  const SPECTATOR_MODES = new Set(['demo', 'player']);

  // ============================================================================
  // Mount
  // ============================================================================
  function mount(ctx) {
    if (mounted) return;
    mounted = true;
    if (ctx) mountCtx = Object.assign({ role: 'solo', myTeamId: null, sessionCode: null, mode: 'solo' }, ctx);
    // Spectator modes (demo / player) hide host-style admin controls so the
    // page stops feeling like an admin panel.
    if (SPECTATOR_MODES.has(mountCtx.mode)) {
      document.body.classList.add('spectator');
    }
    // resolve dom
    $top.code      = $('[data-role="session-code"]');
    $top.timerVal  = $('[data-role="timer-val"]');
    $top.timerWrap = $('[data-role="timer"]');
    $top.start     = $('[data-role="btn-start"]');
    $top.pause     = $('[data-role="btn-pause"]');
    $top.reset     = $('[data-role="btn-reset"]');
    $host.h1       = $('[data-role="host-title"]');
    $host.sub      = $('[data-role="host-sub"]');
    $host.teams    = $('[data-role="teams-list"]');
    $host.feed     = $('[data-role="feed"]');
    $player.tabs   = $('[data-role="player-tabs"]');
    $player.body   = $('[data-role="player-body"]');
    $footer.meter  = $('[data-role="meter-fill"]');
    $footer.meterVal = $('[data-role="meter-value"]');
    $footer.meterLbl = $('[data-role="meter-label"]');

    // build the board
    board = new window.Board3D.Board($('[data-role="board"]'));
    board.setPawns(GS.state.teams);

    // fade out the board orbit-hint after first interaction or 8 sec
    const hint = $('[data-role="board-hint"]');
    if (hint) {
      const fadeHint = () => hint.classList.add('fade');
      $('[data-role="board"]').addEventListener('mousedown', fadeHint, { once: true });
      $('[data-role="board"]').addEventListener('wheel', fadeHint, { once: true });
      setTimeout(fadeHint, 8000);
    }

    // hookup top bar controls
    $top.start.addEventListener('click', startSession);
    $top.pause.addEventListener('click', togglePause);
    $top.reset.addEventListener('click', () => resetSession());

    // render initial
    renderAll();

    // listen to state changes
    GS.subscribe((ev) => {
      if (ev.kind === 'reset') {
        board.setPawns(GS.state.teams);
        modalQueue = [];
        modalShowing = false;
        $modal.innerHTML = '';
        $modal.style.display = 'none';
      }
      if (ev.kind === 'pot' && board && board.setPotValue) {
        board.setPotValue(GS.state.pot, ev.delta || 0);
      }
      if (ev.kind === 'pot-cleared' && board && board.setPotValue) {
        board.setPotValue(0, 0);
      }
      // Remote-driven end of game (host's timer hit 0, status flipped to 'ended')
      if (ev.kind === 'status' && GS.state.status === 'ended' && !endShown) {
        endShown = true;
        showEndScreen();
      }
      // Auto-start timer on remote status flip to 'playing' (e.g., host resumed)
      if (ev.kind === 'status' && GS.state.status === 'playing' && !timerInterval) {
        startTimer();
      }
      // Selective rendering: timer ticks fire every second (host pushes
      // timerRemaining → all clients get a 'timer' notify). Re-rendering the
      // host panel and player panel each tick causes the feed to flicker via
      // innerHTML wipes — so for timer-only updates, just refresh the topbar.
      if (ev.kind === 'timer') {
        renderTopbar();
        return;
      }
      renderAll();
    });

    // In multiplayer, the host already flipped status to "playing" via the lobby
    // Start button — kick off the timer immediately so we don't need an extra
    // click in the game view.
    if (GS.state.status === 'playing' && !timerInterval) {
      startTimer();
    }

    // Demo mode: auto-flip to playing so a single shared link is ready to play
    // without anyone clicking Start.
    if (mountCtx.autoStart && GS.state.status === 'lobby') {
      startSession();
    }
  }

  // ============================================================================
  // Render helpers
  // ============================================================================
  function renderAll() {
    renderTopbar();
    renderHostPanel();
    renderPlayerPanel();
    renderFooter();
  }

  function renderTopbar() {
    const s = GS.state;
    $top.code.textContent = s.sessionCode;
    const m = Math.floor(s.timerRemaining / 60).toString().padStart(2, '0');
    const sec = Math.floor(s.timerRemaining % 60).toString().padStart(2, '0');
    $top.timerVal.textContent = `${m}:${sec}`;
    if (s.timerRemaining <= 60 && s.status === 'playing') $top.timerWrap.classList.add('urgent');
    else $top.timerWrap.classList.remove('urgent');

    $top.start.textContent = s.status === 'lobby'  ? 'Start session' :
                             s.status === 'paused' ? 'Resume'        : 'Running…';
    $top.start.disabled = (s.status === 'playing' || s.status === 'ended');
    $top.pause.disabled = !(s.status === 'playing' || s.status === 'paused');
    $top.pause.textContent = s.status === 'paused' ? 'Resume' : 'Pause';
  }

  function renderHostPanel() {
    const s = GS.state;
    $host.h1.textContent = s.status === 'lobby'  ? 'Lobby'        :
                           s.status === 'playing'? 'Live session' :
                           s.status === 'paused' ? 'Paused'       : 'Session ended';
    $host.sub.textContent = s.status === 'lobby' ?
      'Players are joining. Hit start when everyone is in.' :
      `${s.teams.length} teams · avg ${Math.round(s.teams.reduce((a, t) => a + t.tokens, 0) / s.teams.length)} tokens`;

    // teams list
    $host.teams.innerHTML = '';
    s.teams.forEach((t) => {
      const row = document.createElement('div');
      row.className = 'team-row' + (t.freezeRounds > 0 ? ' freeze' : '');
      row.innerHTML = `
        <span class="dot" style="background:${t.color}"></span>
        <span class="name">${t.name}</span>
        <span class="pos">tile ${String(t.position).padStart(2, '0')}</span>
        <span class="tok">${t.tokens}</span>
      `;
      $host.teams.appendChild(row);
    });

    // feed
    $host.feed.innerHTML = '';
    const now = Date.now();
    for (const ev of s.eventLog) {
      const it = document.createElement('div');
      it.className = `feed-item ${ev.tone}`;
      const ago = Math.round((now - ev.timestamp) / 1000);
      it.innerHTML = `
        <span class="dot"></span>
        <span class="txt">${ev.text}</span>
        <span class="when">${ago}s</span>
      `;
      $host.feed.appendChild(it);
    }
  }

  function renderPlayerPanel() {
    const s = GS.state;
    const isPlayer = mountCtx.role === 'player';
    const isHost   = mountCtx.role === 'host';

    // In player mode, lock the active team to the joined team and don't render tabs.
    if (isPlayer && mountCtx.myTeamId) {
      const myIdx = s.teams.findIndex((t) => t.id === mountCtx.myTeamId);
      if (myIdx >= 0) s.activeTeamIndex = myIdx;
    }

    // tabs (hide in player mode — they only have one team)
    $player.tabs.innerHTML = '';
    if (!isPlayer) {
      s.teams.forEach((t, i) => {
        const tab = document.createElement('button');
        tab.className = 'player-tab' + (i === s.activeTeamIndex ? ' active' : '');
        tab.innerHTML = `
          <span class="pawn-icon">${pawnEmoji(t.pawn)}</span>
          <span class="dot" style="background:${t.color}"></span>
          <span class="nm">${t.name.replace(/^(The|De) /, '')}</span>
        `;
        tab.addEventListener('click', () => {
          s.activeTeamIndex = i;
          renderPlayerPanel();
        });
        $player.tabs.appendChild(tab);
      });
    }

    // body
    const team = s.teams[s.activeTeamIndex];
    if (!team) {
      $player.body.innerHTML = `<div class="you-card"><div class="eyebrow">Waiting</div><div class="name">No team yet</div></div>`;
      return;
    }
    const here = window.TILES[team.position];
    const tileLabel = here.type === 'project' ? here.name : here.name;
    $player.body.innerHTML = '';

    // you card
    const youCard = document.createElement('div');
    youCard.className = 'you-card';
    youCard.style.setProperty('--team-color', team.color);
    youCard.innerHTML = `
      <div class="eyebrow">Your team</div>
      <div class="name">${team.name}</div>
      <div class="pawn-line">${pawnEmoji(team.pawn)} ${pawnName(team.pawn)}</div>
    `;
    $player.body.appendChild(youCard);

    // tokens
    const tokens = document.createElement('div');
    tokens.className = 'tokens-display';
    tokens.innerHTML = `
      <div class="big">${team.tokens}</div>
      <div class="meta">
        <span class="lbl">Your tokens</span>
        <span class="here">${tileLabel}</span>
        <span class="pos">tile ${String(team.position).padStart(2, '0')} / 39</span>
      </div>
    `;
    $player.body.appendChild(tokens);

    // dice
    const dice = document.createElement('div');
    dice.className = 'dice-area';
    dice.innerHTML = `
      <div class="dice-cubes">
        <div class="die" data-role="die1">${lastRoll ? lastRoll.d1 : '?'}</div>
        <div class="die" data-role="die2">${lastRoll ? lastRoll.d2 : '?'}</div>
      </div>
      <div class="last-roll" data-role="last-roll">${lastRoll ? `${lastRoll.d1} + ${lastRoll.d2} = ${lastRoll.total}` : 'Ready to roll'}</div>
      <button class="roll-btn" data-role="roll-btn">${team.freezeRounds > 0 ? 'Manual Work Challenge' : 'Roll dice'}</button>
    `;
    $player.body.appendChild(dice);

    const rollBtn = dice.querySelector('[data-role="roll-btn"]');
    rollBtn.disabled = isHost || s.status !== 'playing' || busyTeams.has(team.id);
    if (isHost) rollBtn.textContent = 'Host view (read-only)';
    rollBtn.addEventListener('click', () => onRoll(team));

    // mini meter
    const mini = document.createElement('div');
    mini.className = 'mini-meter';
    mini.innerHTML = `
      <div class="row"><span class="lbl">Automation Meter</span><span class="val">${s.automationMeter}%</span></div>
      <div class="bar"><div class="fill" style="width:${s.automationMeter}%"></div></div>
    `;
    $player.body.appendChild(mini);

    // automations active
    const al = document.createElement('div');
    al.className = 'automations-list';
    al.innerHTML = `<div class="lbl">Automations</div>`;
    for (const a of window.AUTOMATIONS) {
      const r = document.createElement('div');
      const on = s.activeAutomations[a.id];
      r.className = 'aut-row' + (on ? ' active' : '');
      r.innerHTML = `
        <span class="mark"></span>
        <span class="nm${on ? '' : ' dim'}">${a.name}</span>
        <span class="cost">${on ? 'ON' : a.cost + 't'}</span>
      `;
      al.appendChild(r);
    }
    $player.body.appendChild(al);
  }

  function renderFooter() {
    const s = GS.state;
    $footer.meter.style.width = s.automationMeter + '%';
    $footer.meterVal.textContent = s.automationMeter + '%';
    let label = '';
    if (s.automationMeter < 30)      label = 'Lots of manual work';
    else if (s.automationMeter < 70) label = 'On the right track';
    else                             label = 'Ready for tomorrow';
    $footer.meterLbl.textContent = `Automation Meter · ${label}`;
  }

  // Inline SVG silhouette for the excavator — unicode has no excavator emoji,
  // and 🚜 (tractor) misrepresents the 3D pawn. Other pawns map cleanly to emoji.
  const EXCAVATOR_SVG = '<svg viewBox="0 0 24 18" width="20" height="15" fill="currentColor" style="display:inline-block;vertical-align:-3px;"><rect x="2" y="13" width="14" height="3.5" rx="1.5"/><rect x="5" y="7.5" width="6" height="5.5" rx="0.5"/><path d="M11 9 L19 3 L21 5 L12.5 11 Z"/><path d="M19 3 L22.5 3 L22 6 L19.5 5 Z"/></svg>';
  function pawnEmoji(p) {
    if (p === 'excavator') return EXCAVATOR_SVG;
    return ({ ship: '🚢', truck: '🚛', dumptruck: '🪣', crane: '🏗️' })[p] || '⚙️';
  }
  function pawnName(p) {
    return ({ excavator: 'Excavator', ship: 'Hopper dredger', truck: 'Truck', dumptruck: 'Dumptruck', crane: 'Heavy-lift crane' })[p] || 'Pawn';
  }

  // ============================================================================
  // Session control
  // ============================================================================
  function startSession() {
    const s = GS.state;
    if (s.status === 'lobby') {
      GS.setStatus('playing');
      GS.logEvent('Session started. Good luck.', { tone: 'system' });
    } else if (s.status === 'paused') {
      GS.setStatus('playing');
      GS.logEvent('Session resumed.', { tone: 'system' });
    }
    startTimer();
    renderAll();
  }

  function togglePause() {
    const s = GS.state;
    if (s.status === 'playing') {
      GS.setStatus('paused');
      GS.logEvent('Session paused.', { tone: 'system' });
    } else if (s.status === 'paused') {
      GS.setStatus('playing');
      GS.logEvent('Session resumed.', { tone: 'system' });
    }
    renderAll();
  }

  function resetSession(opts = {}) {
    if (timerInterval) clearInterval(timerInterval);
    GS.resetAll(opts);
    lastRoll = null;
    endShown = false;
    busyTeams.clear();
  }

  function startTimer() {
    // In multiplayer, only the host runs the countdown — players read
    // timerRemaining from Firebase via the snapshot listener.
    if (mountCtx.role === 'player') return;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const s = GS.state;
      if (s.status !== 'playing') return;
      GS.setTimerRemaining(s.timerRemaining - 1);
      if (s.timerRemaining <= 0) {
        GS.setTimerRemaining(0);
        GS.setStatus('ended');
        clearInterval(timerInterval);
        timerInterval = null;
        if (!endShown) { endShown = true; showEndScreen(); }
      }
      renderTopbar();
    }, 1000);
  }

  // ============================================================================
  // Roll & move
  // ============================================================================
  async function onRoll(team) {
    if (GS.state.status !== 'playing') return;
    if (busyTeams.has(team.id)) return;
    busyTeams.add(team.id);
    renderPlayerPanel();

    // Budget freeze: must answer a Manual Work Challenge first
    if (team.freezeRounds > 0) {
      busyTeams.delete(team.id);
      renderPlayerPanel();
      openModal(buildFreezeChallengeModal(team));
      return;
    }

    // animate dice
    const dieEls = [
      document.querySelector('[data-role="die1"]'),
      document.querySelector('[data-role="die2"]'),
    ];
    if (dieEls[0]) dieEls[0].classList.add('rolling');
    if (dieEls[1]) dieEls[1].classList.add('rolling');
    const rollDur = 700 / (GS.state.diceSpeed || 1);
    await new Promise((r) => setTimeout(r, rollDur));

    let d1, d2;
    if (GS.state.forceDice != null) {
      const total = Math.max(2, Math.min(12, GS.state.forceDice));
      d1 = Math.min(6, Math.max(1, total - 1));
      d2 = total - d1;
    } else {
      d1 = 1 + Math.floor(Math.random() * 6);
      d2 = 1 + Math.floor(Math.random() * 6);
    }
    const total = d1 + d2;
    lastRoll = { d1, d2, total };
    if (dieEls[0]) dieEls[0].classList.remove('rolling');
    if (dieEls[1]) dieEls[1].classList.remove('rolling');
    if (dieEls[0]) dieEls[0].textContent = d1;
    if (dieEls[1]) dieEls[1].textContent = d2;

    GS.logEvent(`${team.name} rolls ${d1} + ${d2} = ${total}.`, { teamId: team.id });

    // compute target and pass-start
    const from = team.position;
    const target = (from + total) % window.TILES.length;
    const passedStart = (from + total) >= window.TILES.length;

    if (passedStart && from !== 0) {
      const bonus = GS.state.activeAutomations.projectTemplate ? C.PASS_START_BONUS_AUTOMATED : C.PASS_START_BONUS;
      GS.changeTokens(team.id, bonus, 'pass-start');
      team.laps = (team.laps || 0) + 1;
      floatCoin(team.id, `+${bonus}`, 'win');
      GS.logEvent(`${team.name} passes GO (+${bonus} tokens).`, { teamId: team.id, tone: 'win' });
    }

    // animate pawn movement
    board.diceSpeedMultiplier = GS.state.diceSpeed || 1;
    await board.movePawnTo(team.id, target, GS.state.teams);
    GS.setTeamPosition(team.id, target, team.laps || 0);
    renderPlayerPanel();
    renderHostPanel();

    // trigger tile effect
    const tile = window.TILES[target];
    await triggerTileEffect(team, tile, target);

    busyTeams.delete(team.id);
    renderPlayerPanel();
  }

  // ============================================================================
  // Tile effects
  // ============================================================================
  async function triggerTileEffect(team, tile, idx) {
    const s = GS.state;
    if (tile.type === 'corner-start') {
      GS.logEvent(`${team.name} lands on GO.`, { teamId: team.id, tone: 'system' });
      return;
    }
    if (tile.type === 'corner-freeze') {
      // landing on Budget Freeze (not sent there) — just a visit
      GS.logEvent(`${team.name} is just visiting Budget Freeze.`, { teamId: team.id, tone: 'system' });
      return;
    }
    if (tile.type === 'corner-go-freeze') {
      GS.logEvent(`${team.name} sent to Budget Freeze.`, { teamId: team.id, tone: 'pain' });
      // teleport to tile 10
      await board.movePawnTo(team.id, 10, s.teams);
      GS.setTeamPosition(team.id, 10, team.laps || 0);
      GS.setTeamFreeze(team.id, 1);
      renderHostPanel();
      return;
    }
    if (tile.type === 'corner-contingency') {
      // Free Parking — collect the pot if any
      if (s.pot > 0) {
        const collected = s.pot;
        GS.clearPot();
        GS.changeTokens(team.id, collected, 'free-parking');
        floatCoin(team.id, `+${collected}`, 'win');
        if (board.collectPot) board.collectPot(team.id, s.teams);
        GS.logEvent(`${team.name} lands on Free Parking — collects ${collected} tokens from the pot!`, { teamId: team.id, tone: 'win' });
      } else {
        // pot empty — still a small reward of a briefing card
        const card = randomBriefing();
        await openModalP(buildBriefingModal(team, card));
      }
      return;
    }
    if (tile.type === 'fuel') {
      const cost = s.activeAutomations.receiptScanner ? C.FUEL_COST_AUTOMATED : C.FUEL_COST;
      GS.changeTokens(team.id, -cost, 'fuel');
      GS.addToPot(cost);
      floatCoin(team.id, `−${cost}`, 'pain');
      GS.logEvent(`${team.name} pays fuel cost: −${cost} tokens (→ pot).`, { teamId: team.id, tone: 'pain' });
      checkFreeze(team);
      return;
    }
    if (tile.type === 'manual') {
      const cost = s.activeAutomations.autoReporting ? C.MANUAL_COST_AUTOMATED : C.MANUAL_COST;
      const flavor = window.MANUAL_WORK_TEXTS[Math.floor(Math.random() * window.MANUAL_WORK_TEXTS.length)];
      GS.changeTokens(team.id, -cost, 'manual');
      GS.addToPot(cost);
      GS.changeMeter(C.METER_MANUAL);
      floatCoin(team.id, `−${cost}`, 'pain');
      GS.logEvent(`${team.name}: "${flavor}" (−${cost} → pot).`, { teamId: team.id, tone: 'pain' });
      checkFreeze(team);
      return;
    }
    if (tile.type === 'automation') {
      await openModalP(buildAutomationModal(team));
      return;
    }
    if (tile.type === 'briefing') {
      const card = randomBriefing();
      await openModalP(buildBriefingModal(team, card));
      return;
    }
    if (tile.type === 'project') {
      await openModalP(buildQuestionModal(team, tile));
      return;
    }
  }

  function checkFreeze(team) {
    if (team.tokens <= 0 && team.freezeRounds === 0) {
      GS.setTeamFreeze(team.id, 1);
      GS.logEvent(`${team.name} enters Budget Freeze — out of tokens.`, { teamId: team.id, tone: 'pain' });
    }
  }

  function randomBriefing() {
    return window.BRIEFINGS[Math.floor(Math.random() * window.BRIEFINGS.length)];
  }

  // ============================================================================
  // Modals
  // ============================================================================
  function openModalP(node) {
    return new Promise((resolve) => {
      modalQueue.push({ node, resolve });
      tryShowNextModal();
    });
  }

  function openModal(node) {
    return openModalP(node);
  }

  function tryShowNextModal() {
    if (modalShowing) return;
    const next = modalQueue.shift();
    if (!next) {
      $modal.style.display = 'none';
      $modal.innerHTML = '';
      return;
    }
    modalShowing = true;
    $modal.style.display = 'grid';
    $modal.innerHTML = '';
    $modal.appendChild(next.node);
    next.node.dataset.resolver = '1';
    next._resolve = next.resolve;
    $modal._pending = next;
  }

  function closeModal() {
    const pending = $modal._pending;
    modalShowing = false;
    $modal.innerHTML = '';
    $modal.style.display = 'none';
    if (pending) pending._resolve();
    tryShowNextModal();
  }

  // ---- question modal
  function buildQuestionModal(team, tile) {
    const group = window.GROUPS[tile.group];
    const q = window.QUESTIONS[tile.id] || window.QUESTIONS['_placeholder'];
    const isPlaceholder = !window.QUESTIONS[tile.id];

    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.style.setProperty('--region-color', group.color);
    wrap.style.setProperty('--region-text', group.text || '#0E1A22');

    let answered = false;

    const stars = '★'.repeat(tile.stars) + '☆'.repeat(3 - tile.stars);
    wrap.innerHTML = `
      <div class="modal-head">
        <div>
          <div class="eye">${group.name} · ${stars}${isPlaceholder ? ' · 🚧' : ''}</div>
          <div class="title">${tile.name}</div>
        </div>
        <div style="font-family:var(--t-display);font-weight:900;font-size:28px;color:${group.text || '#0E1A22'};opacity:0.7;">${team.name}</div>
      </div>
      <div class="modal-body">
        <p class="situation">${q.situation}</p>
        <h3 class="question">${q.question}</h3>
        <div class="options"></div>
      </div>
      <div class="modal-foot">
        <span class="delta" data-role="delta"></span>
        <button class="continue" data-role="continue" style="display:none">Continue</button>
      </div>
    `;
    const optsWrap = wrap.querySelector('.options');
    const deltaEl  = wrap.querySelector('[data-role="delta"]');
    const cont     = wrap.querySelector('[data-role="continue"]');

    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.innerHTML = `<span class="letter">${'ABCD'[i]}.</span><span>${opt.text}</span>`;
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        // mark all
        [...optsWrap.children].forEach((c, j) => {
          c.disabled = true;
          if (q.options[j].correct) c.classList.add('correct');
          else if (j === i) c.classList.add('wrong');
        });
        // award/penalty
        const correct = opt.correct;
        const C = window.CONSTANTS;
        const reward = GS.state.activeAutomations.dataPipeline ? C.CORRECT_REWARD_AUTOMATED : C.CORRECT_REWARD;
        const delta = correct ? reward : -C.WRONG_PENALTY;
        GS.changeTokens(team.id, delta, correct ? 'correct' : 'wrong');
        if (correct) {
          GS.changeMeter(C.METER_CORRECT);
          floatCoin(team.id, `+${reward}`, 'win');
          GS.logEvent(`${team.name} answers ${tile.name} correctly (+${reward}).`, { teamId: team.id, tone: 'win' });
          // ownership
          if (!team.ownedProjects[tile.id]) {
            GS.addOwnedProject(team.id, tile.id);
          }
        } else {
          GS.addToPot(C.WRONG_PENALTY);
          floatCoin(team.id, `−${C.WRONG_PENALTY}`, 'pain');
          GS.logEvent(`${team.name} misses ${tile.name} (−${C.WRONG_PENALTY} → pot).`, { teamId: team.id, tone: 'pain' });
        }
        // explanation
        const ex = document.createElement('div');
        ex.className = 'explanation';
        ex.innerHTML = `<span class="eyebrow">The lesson</span>${q.explanation}`;
        wrap.querySelector('.modal-body').appendChild(ex);
        deltaEl.textContent = (correct ? `+${reward}` : `−${C.WRONG_PENALTY}`) + ' tokens';
        deltaEl.className = 'delta ' + (correct ? 'win' : 'pain');
        cont.style.display = 'inline-block';
        checkFreeze(team);
        renderAll();
      });
      optsWrap.appendChild(b);
    });

    cont.addEventListener('click', closeModal);
    return wrap;
  }

  // ---- automation hub
  function buildAutomationModal(team) {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `
      <div class="modal-head" style="background:var(--bg-2);">
        <div>
          <div class="eye">Automation Hub</div>
          <div class="title">Buy an upgrade</div>
        </div>
        <div style="font-family:var(--t-mono);font-size:12px;color:var(--fg-2);text-align:right;">
          ${team.name}<br>
          <span style="color:var(--accent);font-size:20px;font-family:var(--t-display);font-weight:900;">${team.tokens}</span> tokens
        </div>
      </div>
      <div class="modal-body">
        <p class="situation">Any purchase here applies to <strong>every team</strong>. That is the whole point — one team buys, everyone benefits.</p>
        <div class="auts-grid"></div>
      </div>
      <div class="modal-foot">
        <span></span>
        <button class="continue" data-role="continue">Continue</button>
      </div>
    `;
    const grid = wrap.querySelector('.auts-grid');
    for (const a of window.AUTOMATIONS) {
      const owned = GS.state.activeAutomations[a.id];
      const can = !owned && team.tokens >= a.cost;
      const card = document.createElement('div');
      card.className = 'aut-card' + (owned ? ' owned' : (can ? '' : ' locked'));
      card.innerHTML = `
        <div class="body">
          <div class="nm">${a.name}</div>
          <div class="ds">${a.desc}</div>
          <div class="ef">${a.effect}</div>
        </div>
        <div class="cost">${owned ? '' : a.cost}</div>
      `;
      if (can) {
        card.addEventListener('click', () => {
          GS.setAutomation(a.id, true);
          GS.changeTokens(team.id, -a.cost, 'automation-buy');
          GS.changeMeter(window.CONSTANTS.METER_AUTOMATION);
          GS.logEvent(`${team.name} buys "${a.name}" for the whole team (−${a.cost} tokens, +10%).`, { teamId: team.id, tone: 'win' });
          floatCoin(team.id, `−${a.cost}`, 'pain');
          renderAll();
          // refresh modal content
          const newWrap = buildAutomationModal(team);
          $modal.innerHTML = '';
          $modal.appendChild(newWrap);
          $modal._pending.node = newWrap;
        });
      }
      grid.appendChild(card);
    }
    wrap.querySelector('[data-role="continue"]').addEventListener('click', closeModal);
    return wrap;
  }

  // ---- briefing
  function buildBriefingModal(team, card) {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    const kind = card.kind || (card.tokenChange > 0 ? 'win' : 'pain');
    const headBg = kind === 'win' ? 'rgba(63,224,139,0.18)' : 'rgba(255,84,54,0.18)';
    wrap.innerHTML = `
      <div class="modal-head" style="background:${headBg};">
        <div>
          <div class="eye">${card.collective ? 'Affects all teams' : 'Project Briefing'}</div>
          <div class="title">${card.title}</div>
        </div>
        <div style="font-family:var(--t-display);font-weight:900;font-size:22px;color:${kind === 'win' ? 'var(--positive)' : 'var(--negative)'}">
          ${card.tokenChange > 0 ? '+' : ''}${card.tokenChange}
        </div>
      </div>
      <div class="modal-body">
        <div class="briefing-card ${kind}">
          <span class="ribbon">${card.collective ? 'EVERY TEAM' : team.name.toUpperCase() + ' ONLY'}</span>
          <div class="text">${card.text}</div>
        </div>
      </div>
      <div class="modal-foot">
        <span class="delta ${kind}">${card.tokenChange > 0 ? '+' : ''}${card.tokenChange} tokens</span>
        <button class="continue" data-role="continue">Continue</button>
      </div>
    `;
    wrap.querySelector('[data-role="continue"]').addEventListener('click', () => {
      if (card.collective) {
        GS.changeAllTokens(card.tokenChange, 'briefing');
        for (const t of GS.state.teams) {
          floatCoin(t.id, (card.tokenChange > 0 ? '+' : '') + card.tokenChange, kind);
          checkFreeze(t);
        }
      } else {
        GS.changeTokens(team.id, card.tokenChange, 'briefing');
        floatCoin(team.id, (card.tokenChange > 0 ? '+' : '') + card.tokenChange, kind);
        checkFreeze(team);
      }
      renderAll();
      closeModal();
    });
    return wrap;
  }

  // ---- freeze challenge (re-uses a project question, random)
  function buildFreezeChallengeModal(team) {
    // pick a random working question
    const keys = Object.keys(window.QUESTIONS).filter((k) => k !== '_placeholder');
    const key = keys[Math.floor(Math.random() * keys.length)];
    const q = window.QUESTIONS[key];

    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `
      <div class="modal-head" style="background:var(--bg-2);">
        <div>
          <div class="eye">Manual Work Challenge · Budget Freeze ❄</div>
          <div class="title">Answer to escape the freeze</div>
        </div>
      </div>
      <div class="modal-body">
        <p class="situation">${q.situation}</p>
        <h3 class="question">${q.question}</h3>
        <div class="options"></div>
      </div>
      <div class="modal-foot">
        <span class="delta" data-role="delta"></span>
        <button class="continue" data-role="continue" style="display:none">Continue</button>
      </div>
    `;
    const optsWrap = wrap.querySelector('.options');
    const cont = wrap.querySelector('[data-role="continue"]');
    const deltaEl = wrap.querySelector('[data-role="delta"]');
    let answered = false;

    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.innerHTML = `<span class="letter">${'ABCD'[i]}.</span><span>${opt.text}</span>`;
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        [...optsWrap.children].forEach((c, j) => {
          c.disabled = true;
          if (q.options[j].correct) c.classList.add('correct');
          else if (j === i) c.classList.add('wrong');
        });
        if (opt.correct) {
          GS.changeTokens(team.id, 3, 'freeze-out');
          GS.setTeamFreeze(team.id, 0);
          floatCoin(team.id, '+3', 'win');
          GS.logEvent(`${team.name} escapes Budget Freeze (+3 tokens).`, { teamId: team.id, tone: 'win' });
          deltaEl.textContent = '+3 tokens · free!'; deltaEl.className = 'delta win';
        } else {
          GS.setTeamFreeze(team.id, (team.freezeRounds || 0) + 1);
          floatCoin(team.id, '−1', 'pain');
          GS.changeTokens(team.id, -1, 'freeze-fail');
          GS.logEvent(`${team.name} stays in Budget Freeze.`, { teamId: team.id, tone: 'pain' });
          deltaEl.textContent = 'Still frozen · −1';
          deltaEl.className = 'delta pain';
        }
        const ex = document.createElement('div');
        ex.className = 'explanation';
        ex.innerHTML = `<span class="eyebrow">The lesson</span>${q.explanation}`;
        wrap.querySelector('.modal-body').appendChild(ex);
        cont.style.display = 'inline-block';
        renderAll();
      });
      optsWrap.appendChild(b);
    });
    cont.addEventListener('click', closeModal);
    return wrap;
  }

  // ============================================================================
  // Coin floaters
  // ============================================================================
  function floatCoin(teamId, label, kind) {
    if (!board) return;
    const pawn = board.pawns.get(teamId);
    if (!pawn) return;
    // project pawn world position to screen
    const vec = new THREE.Vector3(pawn.position.x, pawn.position.y + 2, pawn.position.z);
    vec.project(board.camera);
    const boardEl = document.querySelector('[data-role="board"]');
    const rect = boardEl.getBoundingClientRect();
    const x = (vec.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-vec.y * 0.5 + 0.5) * rect.height + rect.top;
    const el = document.createElement('div');
    el.className = `coin-floater ${kind}`;
    el.textContent = label;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
    board.pulsePawn(teamId);
  }

  // ============================================================================
  // End screen
  // ============================================================================
  function showEndScreen() {
    const m = GS.state.automationMeter;
    let cls, verdict, blurb;
    if (m >= 70) {
      cls = 'green';
      verdict = 'Project controllers of the future.';
      blurb = '15-minute forecasts. Auto-closed month-end. New BV setup in days. This is what good looks like — take it back to your real projects on Monday.';
    } else if (m >= 30) {
      cls = 'yellow';
      verdict = 'On the right track.';
      blurb = 'A few smart automations are running. Plenty more leverage on the table — pick the manual process that hurts most, automate that one this quarter.';
    } else {
      cls = 'red';
      verdict = 'Drowning in spreadsheets.';
      blurb = 'Too much manual work. The good news: every flat tyre has an AI/automation fix. Pick one, ship it, then come back.';
    }
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `
      <div class="end-screen ${cls}">
        <div style="font-family:var(--t-mono);font-size:11px;color:var(--fg-3);letter-spacing:3px;text-transform:uppercase;">Final score</div>
        <div class="pct">${m}%</div>
        <div class="verdict">${verdict}</div>
        <div class="blurb">${blurb}</div>
        <button class="continue" data-role="continue">New session</button>
      </div>
    `;
    wrap.querySelector('[data-role="continue"]').addEventListener('click', () => {
      closeModal();
      resetSession();
    });
    openModalP(wrap);
  }

  // public api
  window.UI = {
    mount,
    resetSession,
    startSession,
    showEndScreen,
    boardRef: () => board,
    debugRoll: (teamIndex = 0, force = null) => {
      const t = GS.state.teams[teamIndex];
      if (force != null) GS.state.forceDice = force;
      onRoll(t);
    },
  };
})();

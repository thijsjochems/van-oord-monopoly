// ============================================================================
// Lobby + screen routing. Decides what to show based on URL params, runs the
// landing/host/player lobby flow, and hands off to UI.mount() when the host
// starts the session.
//
// URL modes:
//   ?mode=host                  → host console (generates sessiecode)
//   ?mode=player&code=VO-1234   → player join screen (code prefilled if given)
//   ?mode=solo                  → bypass lobby, play locally (dev / single-laptop)
//   ?mode=demo                  → bypass lobby AND auto-start the timer (sharable
//                                  one-link preview — no host interaction needed)
//   (no params)                 → landing page with three big choices
// ============================================================================

(function () {
  const $ = (q, r = document) => r.querySelector(q);

  const lobbyEl = $('[data-role="lobby-screen"]');
  const gameEl  = $('[data-role="game-screen"]');

  // ---- public ---------------------------------------------------------------
  function start() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'solo') return showGame({ solo: true });
    if (mode === 'demo') return showGame({ solo: true, autoStart: true });
    if (mode === 'host') return renderHostLobby();
    if (mode === 'player') return renderPlayerLobby(params.get('code') || '');
    return renderLanding();
  }

  // ---- screen toggle --------------------------------------------------------
  let gameShown = false;
  function showGame(ctx = {}) {
    // Idempotent — the lobby's status-watch listener fires on every snapshot
    // once status === 'playing'. Without this guard, _hydrateGameState would
    // overwrite local state on every Firebase update, defeating the per-field
    // diff in Sync.bindGameState (no pawn animation, no pot crane, etc.).
    if (gameShown) return;
    gameShown = true;
    lobbyEl.style.display = 'none';
    gameEl.hidden = false;
    // Push session data into local GameState before mounting the board so the
    // right teams / sessioncode / status appear from frame 1.
    if (!ctx.solo && window.Sync.isLive() && window.Sync.snapshot()) {
      _hydrateGameState(window.Sync.snapshot());
    }
    const urlMode = new URLSearchParams(window.location.search).get('mode') || 'landing';
    requestAnimationFrame(() => {
      if (window.UI && !window.UI._mounted) {
        window.UI.mount({
          role: window.Sync.role() || 'solo',
          myTeamId: window.Sync.myTeamId(),
          sessionCode: window.Sync.sessionCode(),
          autoStart: !!ctx.autoStart,
          mode: urlMode, // 'solo' | 'demo' | 'host' | 'player' | 'landing'
        });
        window.UI._mounted = true;
        // Start two-way binding to Firebase AFTER mount so animations have a
        // board to play on.
        if (!ctx.solo && window.Sync.isLive()) {
          window.Sync.bindGameState();
        }
      }
    });
  }

  function _hydrateGameState(snap) {
    const GS = window.GameState;
    GS.state.sessionCode = window.Sync.sessionCode();
    GS.state.timerSeconds   = (snap.timerMinutes || 20) * 60;
    GS.state.timerRemaining = snap.timerRemaining ?? GS.state.timerSeconds;
    GS.state.automationMeter = snap.automationMeter || 0;
    GS.state.pot = snap.pot || 0;
    GS.state.activeAutomations = Object.assign(
      { receiptScanner: false, autoReporting: false, projectTemplate: false, dataPipeline: false },
      snap.activeAutomations || {},
    );
    GS.state.status = snap.status === 'playing' ? 'playing' : 'lobby';

    if (snap.teams) {
      const teams = Object.values(snap.teams)
        .filter((t) => t && t.id && t.claimedBy)
        .sort((a, b) => (a.id || '').localeCompare(b.id || ''));
      GS.state.teams = teams.map((t) => ({
        id: t.id,
        name: t.name,
        pawn: t.pawn,
        color: t.color,
        accent: t.accent,
        position: t.position || 0,
        tokens: t.tokens ?? window.CONSTANTS.STARTING_TOKENS,
        freezeRounds: t.freezeRounds || 0,
        ownedProjects: t.ownedProjects || {},
        laps: t.laps || 0,
      }));
      // Player view: focus on own team
      const myId = window.Sync.myTeamId();
      const myIdx = GS.state.teams.findIndex((t) => t.id === myId);
      GS.state.activeTeamIndex = myIdx >= 0 ? myIdx : 0;
    }
    GS.notify({ kind: 'remote-init' });
  }

  // ---- LANDING --------------------------------------------------------------
  function renderLanding() {
    lobbyEl.style.display = '';
    lobbyEl.innerHTML = `
      <div class="landing">
        <div class="landing-hero">
          <div class="brand-mark big">VO</div>
          <h1>Automate or Sink</h1>
          <p class="tagline">Coöperatieve training voor Van Oord project controllers.</p>
        </div>
        <div class="landing-cta">
          <a class="cta-card host" href="?mode=host">
            <div class="ic">🖥️</div>
            <div class="t">Start as host</div>
            <div class="s">Open this on the big screen in the room</div>
          </a>
          <a class="cta-card player" href="?mode=player">
            <div class="ic">🎮</div>
            <div class="t">Join as player</div>
            <div class="s">Each team on their own laptop</div>
          </a>
        </div>
        <a class="solo-link" href="?mode=solo">solo / dev mode →</a>
      </div>
    `;
  }

  // ---- HOST LOBBY -----------------------------------------------------------
  function renderHostLobby() {
    lobbyEl.style.display = '';
    lobbyEl.innerHTML = `
      <div class="host-lobby">
        <header class="lb-head">
          <div class="brand-mark">VO</div>
          <div class="t">Host console</div>
          <div class="sub">Project the URL and code on the big screen.</div>
        </header>
        <section class="big-code-card">
          <div class="eyebrow">Session code</div>
          <div class="big-code" data-role="big-code">VO-····</div>
          <div class="join-url">
            Players join at <code data-role="join-url">…</code>
          </div>
        </section>
        <section class="teams-section">
          <div class="eyebrow">Teams (<span data-role="team-count">0</span> / 5 joined)</div>
          <div class="team-cards" data-role="team-cards"></div>
        </section>
        <footer class="lb-foot">
          <div class="status-line" data-role="status-line">Creating session…</div>
          <button class="btn-primary big" data-role="start-btn" disabled>Start session</button>
        </footer>
      </div>
    `;

    window.Sync.createSession()
      .then((code) => {
        const url = `${window.location.origin}${window.location.pathname}?mode=player&code=${code}`;
        $('[data-role="big-code"]').textContent = code;
        $('[data-role="join-url"]').textContent = url;
        $('[data-role="status-line"]').textContent = 'Waiting for teams to join…';
        window.Sync.onSnapshot((snap) => _renderHostTeams(snap));
      })
      .catch((err) => {
        $('[data-role="status-line"]').textContent = 'Error: ' + err.message;
        console.error(err);
      });

    $('[data-role="start-btn"]').addEventListener('click', () => {
      window.Sync.startGame();
    });

    window.Sync.onSnapshot((snap) => {
      if (snap && snap.status === 'playing') showGame();
    });
  }

  function _renderHostTeams(snap) {
    const grid = $('[data-role="team-cards"]');
    if (!grid) return;
    grid.innerHTML = '';
    let joined = 0;
    for (const def of window.TEAM_DEFS) {
      const team = (snap?.teams || {})[def.id];
      const taken = team && team.claimedBy;
      if (taken) joined++;
      const card = document.createElement('div');
      card.className = 'team-card' + (taken ? ' joined' : ' empty');
      card.style.setProperty('--team-color', def.color);
      card.innerHTML = `
        <div class="row1">
          <span class="dot"></span>
          <span class="pawn">${_pawnEmoji(def.pawn)}</span>
        </div>
        <div class="nm">${taken ? _escape(team.name) : def.name}</div>
        <div class="status">${taken ? 'JOINED' : 'OPEN'}</div>
      `;
      grid.appendChild(card);
    }
    $('[data-role="team-count"]').textContent = joined;
    $('[data-role="start-btn"]').disabled = joined < 1;
    if (joined === 0) {
      $('[data-role="status-line"]').textContent = 'Waiting for teams to join…';
    } else {
      $('[data-role="status-line"]').textContent =
        `${joined} team${joined === 1 ? '' : 's'} joined. Click Start when everyone is in.`;
    }
  }

  // ---- PLAYER LOBBY ---------------------------------------------------------
  // One laptop per group → no per-team display-name form, no submit button.
  // Type the session code, the five team cards appear; tap one and you're in.
  function renderPlayerLobby(prefillCode) {
    lobbyEl.style.display = '';
    lobbyEl.innerHTML = `
      <div class="player-lobby">
        <header class="lb-head">
          <div class="brand-mark">VO</div>
          <div class="t">Join the session</div>
        </header>
        <div class="field">
          <label class="lbl">Session code</label>
          <input type="text" value="${_escape(prefillCode)}" placeholder="VO-1234"
                 maxlength="7" autocomplete="off" inputmode="latin"
                 data-role="code-input" class="code-input">
        </div>
        <div class="field">
          <label class="lbl">Tap your team</label>
          <div class="team-pick big" data-role="team-pick"></div>
        </div>
        <div class="status-line" data-role="status-line"></div>
      </div>
    `;

    _renderTeamPickerEmpty();
    const codeInput = $('[data-role="code-input"]');
    if (prefillCode) _refreshTeamPicker(prefillCode);
    codeInput.addEventListener('input', _debounce(() => {
      _refreshTeamPicker(codeInput.value);
    }, 350));
  }

  function _renderTeamPickerEmpty() {
    const wrap = $('[data-role="team-pick"]');
    if (!wrap) return;
    wrap.innerHTML = `<div class="hint">Enter a session code to see which teams are still open.</div>`;
  }

  let _pickToken = 0;
  async function _refreshTeamPicker(rawCode) {
    const code = String(rawCode || '').toUpperCase().trim();
    const wrap = $('[data-role="team-pick"]');
    if (!wrap) return;
    if (!/^VO-\d{4}$/.test(code)) {
      _renderTeamPickerEmpty();
      $('input[name="teamId"]').value = '';
      return;
    }
    const myToken = ++_pickToken;
    wrap.innerHTML = `<div class="hint">Checking session…</div>`;
    let snap;
    try {
      snap = await window.Sync.peekSession(code);
    } catch (e) {
      if (myToken !== _pickToken) return;
      wrap.innerHTML = `<div class="hint err">Network error.</div>`;
      return;
    }
    if (myToken !== _pickToken) return;
    if (!snap) {
      wrap.innerHTML = `<div class="hint err">No session found for <b>${_escape(code)}</b>.</div>`;
      return;
    }
    if (snap.status !== 'lobby') {
      wrap.innerHTML = `<div class="hint err">Session is already running.</div>`;
      return;
    }
    const taken = {};
    for (const tid of Object.keys(snap.teams || {})) {
      const t = snap.teams[tid];
      if (t && t.claimedBy && t.claimedBy !== window.Sync.CLIENT_ID) taken[tid] = t.name || tid;
    }
    wrap.innerHTML = '';
    for (const def of window.TEAM_DEFS) {
      const isTaken = !!taken[def.id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'team-pill big' + (isTaken ? ' taken' : '');
      btn.style.setProperty('--team-color', def.color);
      btn.disabled = isTaken;
      btn.innerHTML = `
        <span class="pawn">${_pawnEmoji(def.pawn)}</span>
        <span class="nm">${def.name}</span>
        <span class="state">${isTaken ? 'TAKEN' : 'TAP TO JOIN'}</span>
      `;
      btn.addEventListener('click', async () => {
        if (isTaken) return;
        const status = $('[data-role="status-line"]');
        status.textContent = 'Joining as ' + def.name + '…';
        // disable all team pills while the join is in flight
        wrap.querySelectorAll('.team-pill').forEach((p) => p.disabled = true);
        try {
          await window.Sync.joinSession(code, def.id, def.name);
          renderPlayerWaiting();
        } catch (err) {
          status.textContent = 'Could not join: ' + err.message;
          // re-enable picker so the user can try another team / fix the code
          _refreshTeamPicker(code);
        }
      });
      wrap.appendChild(btn);
    }
  }

  function renderPlayerWaiting() {
    const teamId = window.Sync.myTeamId();
    const def = window.TEAM_DEFS.find((t) => t.id === teamId);
    lobbyEl.innerHTML = `
      <div class="player-lobby waiting">
        <header class="lb-head">
          <div class="brand-mark">VO</div>
          <div class="t">You're in.</div>
        </header>
        <div class="big-team-card" style="--team-color:${def.color}">
          <div class="dot"></div>
          <div class="nm">${_escape(def.name)}</div>
          <div class="pawn">${_pawnEmoji(def.pawn)}</div>
        </div>
        <div class="status-line big">Waiting for the host to start the session…</div>
      </div>
    `;
    window.Sync.onSnapshot((snap) => {
      if (snap && snap.status === 'playing') showGame();
    });
  }

  // ---- helpers --------------------------------------------------------------
  // Inline SVG for excavator (no good unicode option). Same logic as ui.js.
  const _EXCAVATOR_SVG = '<svg viewBox="0 0 24 18" width="20" height="15" fill="currentColor" style="display:inline-block;vertical-align:-3px;"><rect x="2" y="13" width="14" height="3.5" rx="1.5"/><rect x="5" y="7.5" width="6" height="5.5" rx="0.5"/><path d="M11 9 L19 3 L21 5 L12.5 11 Z"/><path d="M19 3 L22.5 3 L22 6 L19.5 5 Z"/></svg>';
  function _pawnEmoji(p) {
    if (p === 'excavator') return _EXCAVATOR_SVG;
    return ({ ship: '🚢', truck: '🚛', dumptruck: '🪣', crane: '🏗️' })[p] || '⚙️';
  }
  function _escape(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
    })[c]);
  }
  function _debounce(fn, ms) {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  window.Lobby = { start, showGame };
})();

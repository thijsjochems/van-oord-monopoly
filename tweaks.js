// ============================================================================
// Tweaks panel — vanilla DOM, implements the standard tweak-mode protocol.
// Persists choices via __edit_mode_set_keys.
// ============================================================================

(function () {
  const GS = window.GameState;

  const TWEAKS = /*EDITMODE-BEGIN*/{
    "teamCount": 5,
    "timerMinutes": 20,
    "diceSpeed": 1.0,
    "automationReceiptScanner": false,
    "automationAutoReporting": false,
    "automationProjectTemplate": false,
    "automationDataPipeline": false,
    "forceDice": 0
  }/*EDITMODE-END*/;

  // ---- apply tweak side-effects -----------------------------------
  function applyTweak(key, value) {
    if (key === 'teamCount') {
      GS.state.teamCount = value;
      GS.resetTeams(value);
      const board = window.UI.boardRef();
      if (board) board.setPawns(GS.state.teams);
      GS.notify({ kind: 'teams-changed' });
    }
    if (key === 'timerMinutes') {
      GS.state.timerSeconds = value * 60;
      if (GS.state.status === 'lobby') GS.state.timerRemaining = value * 60;
      GS.notify({ kind: 'timer-changed' });
    }
    if (key === 'diceSpeed') {
      GS.state.diceSpeed = value;
      const board = window.UI.boardRef();
      if (board) board.diceSpeedMultiplier = value;
    }
    if (key === 'forceDice') {
      GS.state.forceDice = value === 0 ? null : value;
    }
    if (key.startsWith('automation')) {
      const map = {
        automationReceiptScanner: 'receiptScanner',
        automationAutoReporting:  'autoReporting',
        automationProjectTemplate:'projectTemplate',
        automationDataPipeline:   'dataPipeline',
      };
      GS.state.activeAutomations[map[key]] = value;
      if (value) GS.changeMeter(0); // trigger ui update
      GS.notify({ kind: 'automations-changed' });
    }
  }

  function setTweak(key, value) {
    TWEAKS[key] = value;
    applyTweak(key, value);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
  }

  // ---- panel DOM ---------------------------------------------------
  const panel = document.createElement('div');
  panel.className = 'tweaks';
  panel.innerHTML = `
    <div class="hd">
      <span class="t">Tweaks</span>
      <button data-role="close" title="Close">×</button>
    </div>
    <div class="bd">
      <div class="group">
        <div class="lbl">Number of teams</div>
        <div class="seg" data-role="seg-teamCount"></div>
      </div>
      <div class="group">
        <div class="lbl">Timer (minutes)</div>
        <div class="seg" data-role="seg-timer"></div>
      </div>
      <div class="group">
        <div class="lbl">Pawn speed</div>
        <div class="seg" data-role="seg-speed"></div>
      </div>
      <div class="group">
        <div class="lbl">Force dice total (debug)</div>
        <div class="seg" data-role="seg-force"></div>
      </div>
      <div class="group">
        <div class="lbl">Force automations on</div>
        <div class="row"><span class="nm">Receipt Scanner</span><div class="toggle" data-role="t-receiptScanner"></div></div>
        <div class="row"><span class="nm">Auto Reporting</span><div class="toggle" data-role="t-autoReporting"></div></div>
        <div class="row"><span class="nm">Project Template</span><div class="toggle" data-role="t-projectTemplate"></div></div>
        <div class="row"><span class="nm">Data Pipeline</span><div class="toggle" data-role="t-dataPipeline"></div></div>
      </div>
      <div class="group">
        <div class="lbl">Demo actions</div>
        <button class="tweak-btn" data-role="skip-end" style="width:100%;">Skip to end screen</button>
        <button class="tweak-btn" data-role="reset" style="width:100%;margin-top:6px;">Reset session</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  function makeSeg(host, options, currentKey, onPick) {
    host.innerHTML = '';
    for (const opt of options) {
      const b = document.createElement('button');
      b.textContent = opt.label;
      b.className = opt.value === currentKey ? 'active' : '';
      b.addEventListener('click', () => onPick(opt.value));
      host.appendChild(b);
    }
  }

  function renderPanel() {
    makeSeg(
      panel.querySelector('[data-role="seg-teamCount"]'),
      [{ label: '3', value: 3 }, { label: '5', value: 5 }],
      TWEAKS.teamCount,
      (v) => { setTweak('teamCount', v); renderPanel(); },
    );
    makeSeg(
      panel.querySelector('[data-role="seg-timer"]'),
      [{ label: '5', value: 5 }, { label: '10', value: 10 }, { label: '20', value: 20 }],
      TWEAKS.timerMinutes,
      (v) => { setTweak('timerMinutes', v); renderPanel(); },
    );
    makeSeg(
      panel.querySelector('[data-role="seg-speed"]'),
      [{ label: '0.5×', value: 0.5 }, { label: '1×', value: 1.0 }, { label: '2×', value: 2.0 }, { label: '4×', value: 4.0 }],
      TWEAKS.diceSpeed,
      (v) => { setTweak('diceSpeed', v); renderPanel(); },
    );
    makeSeg(
      panel.querySelector('[data-role="seg-force"]'),
      [{ label: 'OFF', value: 0 }, { label: '1', value: 1 }, { label: '3', value: 3 }, { label: '7', value: 7 }, { label: '12', value: 12 }],
      TWEAKS.forceDice,
      (v) => { setTweak('forceDice', v); renderPanel(); },
    );
    setToggle('t-receiptScanner',   'automationReceiptScanner');
    setToggle('t-autoReporting',    'automationAutoReporting');
    setToggle('t-projectTemplate',  'automationProjectTemplate');
    setToggle('t-dataPipeline',     'automationDataPipeline');
  }

  function setToggle(role, key) {
    const el = panel.querySelector(`[data-role="${role}"]`);
    el.classList.toggle('on', !!TWEAKS[key]);
    el.onclick = () => { setTweak(key, !TWEAKS[key]); renderPanel(); };
  }

  // ---- demo buttons -----------------------------------------------
  panel.querySelector('[data-role="skip-end"]').addEventListener('click', () => {
    GS.state.status = 'ended';
    GS.state.timerRemaining = 0;
    if (window.UI.showEndScreen) window.UI.showEndScreen();
  });
  panel.querySelector('[data-role="reset"]').addEventListener('click', () => {
    window.UI.resetSession({ timerMinutes: TWEAKS.timerMinutes });
  });

  // ---- protocol ----------------------------------------------------
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.type) return;
    if (e.data.type === '__activate_edit_mode')   panel.classList.add('open');
    if (e.data.type === '__deactivate_edit_mode') panel.classList.remove('open');
  });
  panel.querySelector('[data-role="close"]').addEventListener('click', () => {
    panel.classList.remove('open');
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  });

  // Tweak-toggle UI button for when running standalone (not in OM frame)
  const toggle = document.createElement('button');
  toggle.className = 'tweaks-toggle';
  toggle.textContent = '⚙ Tweaks';
  toggle.addEventListener('click', () => panel.classList.toggle('open'));
  document.body.appendChild(toggle);

  // apply persisted tweaks on boot
  for (const k of Object.keys(TWEAKS)) applyTweak(k, TWEAKS[k]);
  renderPanel();

  // Announce availability
  window.parent.postMessage({ type: '__edit_mode_available' }, '*');
})();

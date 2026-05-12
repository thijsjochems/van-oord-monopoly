// ============================================================================
// Game state + reactive store. Single source of truth.
// ============================================================================

(function () {
  const listeners = new Set();

  function notify(event) {
    for (const fn of listeners) {
      try { fn(event); } catch (e) { console.error(e); }
    }
  }

  // ---- state ----
  const state = {
    status: 'lobby', // lobby | playing | ended | paused
    sessionCode: 'VO-' + Math.floor(1000 + Math.random() * 9000),
    timerSeconds: 20 * 60,
    timerRemaining: 20 * 60,
    automationMeter: 0,
    pot: 0,           // Free Parking jackpot — accumulates lost tokens, collected by team landing on tile 20
    activeAutomations: {
      receiptScanner: false,
      autoReporting: false,
      projectTemplate: false,
      dataPipeline: false,
    },
    teams: [],          // { id, name, pawn, color, accent, position, tokens, freeze: { rounds }, ownedProjects: Set }
    activeTeamIndex: 0, // which team you are currently "playing as"
    eventLog: [],       // last 12 events
    teamCount: 5,
    diceSpeed: 1.0,     // multiplier
    forceDice: null,    // null or number
    lastRoll: null,     // { d1, d2, total }
    isAnimating: false,
    activeModal: null,  // describes the open popup, e.g. { kind: 'question', ... }
  };

  function buildTeam(def) {
    return {
      id: def.id,
      name: def.name,
      pawn: def.pawn,
      color: def.color,
      accent: def.accent,
      position: 0,
      tokens: window.CONSTANTS.STARTING_TOKENS,
      freezeRounds: 0,
      ownedProjects: {},
      laps: 0,
    };
  }

  function resetTeams(count) {
    state.teams = window.TEAM_DEFS.slice(0, count).map(buildTeam);
    state.activeTeamIndex = 0;
  }

  function resetAll(opts = {}) {
    state.status = 'lobby';
    state.sessionCode = 'VO-' + Math.floor(1000 + Math.random() * 9000);
    state.timerSeconds = (opts.timerMinutes ?? 20) * 60;
    state.timerRemaining = state.timerSeconds;
    state.automationMeter = 0;
    state.activeAutomations = { receiptScanner: false, autoReporting: false, projectTemplate: false, dataPipeline: false };
    state.eventLog = [];
    state.lastRoll = null;
    state.activeModal = null;
    resetTeams(state.teamCount);
    notify({ kind: 'reset' });
  }

  // ---- event log ----
  function logEvent(text, opts = {}) {
    state.eventLog.unshift({
      text,
      teamId: opts.teamId || null,
      tone: opts.tone || 'neutral', // win | pain | neutral | system
      timestamp: Date.now(),
    });
    if (state.eventLog.length > 12) state.eventLog.length = 12;
    notify({ kind: 'log' });
  }

  // ---- sync helpers ----
  // Each mutation pushes the relevant slice to Firebase if Sync is live and we
  // are not already applying a remote update (otherwise we'd echo).
  function _pushTeam(teamId, partial) {
    if (state._applyingRemote) return;
    if (!window.Sync || !window.Sync.isLive() || !window.Sync.sessionCode()) return;
    window.Sync.pushTeam(teamId, partial);
  }
  function _pushSession(partial) {
    if (state._applyingRemote) return;
    if (!window.Sync || !window.Sync.isLive() || !window.Sync.sessionCode()) return;
    window.Sync.pushSession(partial);
  }

  // ---- token / meter ----
  function changeTokens(teamId, delta, reason) {
    const team = state.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.tokens += delta;
    if (team.tokens < 0) team.tokens = 0;
    notify({ kind: 'tokens', teamId, delta, reason });
    _pushTeam(teamId, { tokens: team.tokens });
  }

  function changeAllTokens(delta, reason) {
    for (const t of state.teams) {
      t.tokens += delta;
      if (t.tokens < 0) t.tokens = 0;
    }
    notify({ kind: 'tokens-all', delta, reason });
    // multi-path update so all teams are written in one round-trip
    const updates = {};
    for (const t of state.teams) updates[`teams/${t.id}/tokens`] = t.tokens;
    _pushSession(updates);
  }

  function changeMeter(delta) {
    state.automationMeter = Math.max(0, Math.min(100, state.automationMeter + delta));
    notify({ kind: 'meter' });
    _pushSession({ automationMeter: state.automationMeter });
  }

  function addToPot(amount) {
    if (amount <= 0) return;
    state.pot += amount;
    notify({ kind: 'pot', delta: amount });
    _pushSession({ pot: state.pot });
  }

  function clearPot() {
    const v = state.pot;
    state.pot = 0;
    notify({ kind: 'pot-cleared', collected: v });
    _pushSession({ pot: 0 });
    return v;
  }

  // ---- per-team setters (used by ui.js) ----
  function setTeamPosition(teamId, position, laps) {
    const team = state.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.position = position;
    if (laps != null) team.laps = laps;
    notify({ kind: 'position', teamId });
    _pushTeam(teamId, { position, laps: team.laps || 0 });
  }
  function setTeamFreeze(teamId, rounds) {
    const team = state.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.freezeRounds = rounds;
    notify({ kind: 'freeze', teamId });
    _pushTeam(teamId, { freezeRounds: rounds });
  }
  function addOwnedProject(teamId, projectId) {
    const team = state.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.ownedProjects = team.ownedProjects || {};
    team.ownedProjects[projectId] = true;
    _pushTeam(teamId, { ownedProjects: team.ownedProjects });
  }
  function setAutomation(id, value) {
    state.activeAutomations[id] = value;
    notify({ kind: 'automations' });
    _pushSession({ [`activeAutomations/${id}`]: value });
  }
  function setStatus(status) {
    state.status = status;
    notify({ kind: 'status' });
    _pushSession({ status });
  }
  function setTimerRemaining(remaining) {
    state.timerRemaining = remaining;
    _pushSession({ timerRemaining: remaining });
  }

  // ---- subscribe ----
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function snapshot() {
    return state;
  }

  function activeTeam() {
    return state.teams[state.activeTeamIndex];
  }

  // ---- init ----
  resetTeams(state.teamCount);

  window.GameState = {
    state,
    snapshot,
    activeTeam,
    subscribe,
    notify,
    resetAll,
    resetTeams,
    logEvent,
    changeTokens,
    changeAllTokens,
    changeMeter,
    addToPot,
    clearPot,
    setTeamPosition,
    setTeamFreeze,
    addOwnedProject,
    setAutomation,
    setStatus,
    setTimerRemaining,
  };
})();

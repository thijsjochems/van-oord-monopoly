// ============================================================================
// Firebase sync layer. Wraps all Realtime Database access so the rest of the
// app only ever calls window.Sync.*.
//
// Stage 2a scope: lobby only — create / join / list teams / start session.
// Stage 2b will add gameplay sync (positions, tokens, meter, pot, rolls).
//
// Database shape:
//   sessions/
//     VO-1234/
//       status: "lobby" | "playing" | "paused" | "ended"
//       createdAt, startedAt
//       hostClientId
//       timerMinutes, timerRemaining
//       automationMeter, pot
//       activeAutomations: { receiptScanner, autoReporting, ... }
//       teams/
//         team-1/ { id, name, pawn, color, accent, position, tokens,
//                   freezeRounds, ownedProjects, claimedBy, lastSeen }
//       eventLog/  (push-id keyed)
//       lastRoll: { teamId, d1, d2, total, ts }
// ============================================================================

(function () {
  if (typeof firebase === 'undefined' || !window.DB) {
    console.warn('Firebase not initialized — Sync will be inert.');
    window.Sync = makeInert();
    return;
  }
  const DB = window.DB;
  const TS = firebase.database.ServerValue.TIMESTAMP;

  // Stable per-tab client id so a refresh keeps your team claim.
  const CLIENT_ID = (() => {
    let id = sessionStorage.getItem('vo-client-id');
    if (!id) {
      id = 'c_' + Math.random().toString(36).slice(2, 11);
      sessionStorage.setItem('vo-client-id', id);
    }
    return id;
  })();

  let sessionCode = null;
  let role        = null;   // 'host' | 'player'
  let myTeamId    = null;
  let listeners   = [];
  let lastSnap    = null;
  let unsub       = null;

  // ---- session lifecycle ----------------------------------------------------
  function genSessionCode() {
    return 'VO-' + Math.floor(1000 + Math.random() * 9000);
  }

  async function createSession(opts = {}) {
    // Try a few codes in case of (very rare) collision with an existing session.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = genSessionCode();
      const ref = DB.ref(`sessions/${code}`);
      const snap = await ref.once('value');
      if (snap.exists()) continue;
      const initial = {
        status: 'lobby',
        createdAt: TS,
        hostClientId: CLIENT_ID,
        timerMinutes: opts.timerMinutes || 20,
        timerRemaining: (opts.timerMinutes || 20) * 60,
        automationMeter: 0,
        pot: 0,
        activeAutomations: {
          receiptScanner: false,
          autoReporting: false,
          projectTemplate: false,
          dataPipeline: false,
        },
      };
      await ref.set(initial);
      sessionCode = code;
      role = 'host';
      _attachListener();
      return code;
    }
    throw new Error('Could not generate a unique session code.');
  }

  async function joinSession(code, teamId, displayName) {
    code = String(code || '').toUpperCase().trim();
    const ref = DB.ref(`sessions/${code}`);
    const snap = await ref.once('value');
    if (!snap.exists()) throw new Error('Session not found.');
    const data = snap.val();
    if (data.status !== 'lobby') throw new Error('Session has already started.');

    const def = (window.TEAM_DEFS || []).find((t) => t.id === teamId);
    if (!def) throw new Error('Unknown team.');

    const teamRef = DB.ref(`sessions/${code}/teams/${teamId}`);
    const existing = (data.teams || {})[teamId];
    if (existing && existing.claimedBy && existing.claimedBy !== CLIENT_ID) {
      throw new Error('That team is already taken.');
    }

    const teamData = {
      id: def.id,
      name: (displayName || def.name).slice(0, 30),
      pawn: def.pawn,
      color: def.color,
      accent: def.accent,
      position: 0,
      tokens: window.CONSTANTS.STARTING_TOKENS,
      freezeRounds: 0,
      ownedProjects: null,
      laps: 0,
      claimedBy: CLIENT_ID,
      lastSeen: TS,
    };
    await teamRef.set(teamData);
    sessionCode = code;
    role = 'player';
    myTeamId = teamId;
    _attachListener();
    return { sessionCode, teamId };
  }

  function leaveTeam() {
    if (!sessionCode || !myTeamId) return Promise.resolve();
    return DB.ref(`sessions/${sessionCode}/teams/${myTeamId}`).remove();
  }

  // Read-only peek at a session (used by player lobby to populate the team picker).
  async function peekSession(code) {
    code = String(code || '').toUpperCase().trim();
    if (!/^VO-\d{4}$/.test(code)) return null;
    const snap = await DB.ref(`sessions/${code}`).once('value');
    return snap.val();
  }

  // ---- snapshot subscription ------------------------------------------------
  function _attachListener() {
    if (unsub) unsub();
    if (!sessionCode) return;
    const ref = DB.ref(`sessions/${sessionCode}`);
    const handler = (snap) => {
      lastSnap = snap.val();
      for (const fn of listeners) {
        try { fn(lastSnap); } catch (e) { console.error(e); }
      }
    };
    ref.on('value', handler);
    unsub = () => ref.off('value', handler);
  }

  function onSnapshot(fn) {
    listeners.push(fn);
    if (lastSnap) fn(lastSnap);
    return () => { listeners = listeners.filter((f) => f !== fn); };
  }

  // ---- mutations ------------------------------------------------------------
  function pushSession(partial) {
    if (!sessionCode) return Promise.resolve();
    return DB.ref(`sessions/${sessionCode}`).update(partial);
  }
  function pushTeam(teamId, partial) {
    if (!sessionCode || !teamId) return Promise.resolve();
    return DB.ref(`sessions/${sessionCode}/teams/${teamId}`).update(partial);
  }
  function pushEvent(event) {
    if (!sessionCode) return Promise.resolve();
    return DB.ref(`sessions/${sessionCode}/eventLog`).push({ ...event, timestamp: TS });
  }

  // ---- session control (host-only in practice, but enforced by UI) ----------
  function startGame() { return pushSession({ status: 'playing', startedAt: TS }); }
  function pauseGame() { return pushSession({ status: 'paused' }); }
  function resumeGame() { return pushSession({ status: 'playing' }); }
  function endGame()   { return pushSession({ status: 'ended' }); }

  async function resetSession() {
    if (!sessionCode) return;
    const ref = DB.ref(`sessions/${sessionCode}`);
    await ref.update({
      status: 'lobby',
      timerRemaining: (lastSnap?.timerMinutes || 20) * 60,
      automationMeter: 0,
      pot: 0,
      activeAutomations: { receiptScanner: false, autoReporting: false, projectTemplate: false, dataPipeline: false },
      lastRoll: null,
      startedAt: null,
    });
    // wipe gameplay subtrees, leave teams claimed
    await ref.child('eventLog').remove();
    if (lastSnap?.teams) {
      const updates = {};
      for (const tid of Object.keys(lastSnap.teams)) {
        updates[`teams/${tid}/position`]      = 0;
        updates[`teams/${tid}/tokens`]        = window.CONSTANTS.STARTING_TOKENS;
        updates[`teams/${tid}/freezeRounds`]  = 0;
        updates[`teams/${tid}/laps`]          = 0;
        updates[`teams/${tid}/ownedProjects`] = null;
      }
      await ref.update(updates);
    }
  }

  // ---- inert fallback (no Firebase) -----------------------------------------
  function makeInert() {
    const noop = () => Promise.resolve();
    return {
      CLIENT_ID: 'inert',
      createSession: () => Promise.reject(new Error('Firebase not loaded.')),
      joinSession:   () => Promise.reject(new Error('Firebase not loaded.')),
      peekSession:   () => Promise.resolve(null),
      leaveTeam: noop,
      onSnapshot: () => () => {},
      pushSession: noop, pushTeam: noop, pushEvent: noop,
      startGame: noop, pauseGame: noop, resumeGame: noop, endGame: noop, resetSession: noop,
      bindGameState: () => {},
      sessionCode: () => null, role: () => null, myTeamId: () => null,
      isHost: () => false, snapshot: () => null, isLive: () => false,
    };
  }

  // ---- two-way binding to GameState ----------------------------------------
  // Subscribes to the session snapshot and applies remote changes to local
  // state. The `_applyingRemote` flag in GameState ensures the resulting
  // notify() doesn't echo back to Firebase.
  let bound = false;
  function bindGameState() {
    if (bound) return;
    bound = true;
    onSnapshot((snap) => {
      const GS = window.GameState;
      if (!GS || !snap) return;
      if (GS.state._applyingRemote) return;
      GS.state._applyingRemote = true;
      try {
        _applyRemote(GS, snap);
      } catch (e) {
        console.error('applyRemote failed:', e);
      } finally {
        GS.state._applyingRemote = false;
      }
    });
  }

  function _applyRemote(GS, snap) {
    const s = GS.state;

    // ---- session-level scalars ----
    if (snap.automationMeter != null && snap.automationMeter !== s.automationMeter) {
      s.automationMeter = snap.automationMeter;
      GS.notify({ kind: 'meter' });
    }
    if (snap.pot != null && snap.pot !== s.pot) {
      const delta = snap.pot - s.pot;
      s.pot = snap.pot;
      if (delta > 0)      GS.notify({ kind: 'pot', delta });
      else if (delta < 0) GS.notify({ kind: 'pot-cleared', collected: -delta });
    }
    if (snap.activeAutomations) {
      let changed = false;
      for (const id in snap.activeAutomations) {
        if (s.activeAutomations[id] !== snap.activeAutomations[id]) {
          s.activeAutomations[id] = snap.activeAutomations[id];
          changed = true;
        }
      }
      if (changed) GS.notify({ kind: 'automations' });
    }
    if (snap.timerRemaining != null && snap.timerRemaining !== s.timerRemaining) {
      s.timerRemaining = snap.timerRemaining;
      GS.notify({ kind: 'timer' });
    }
    if (snap.status && snap.status !== s.status) {
      s.status = snap.status;
      GS.notify({ kind: 'status' });
    }

    // ---- per-team ----
    if (snap.teams) {
      for (const tid in snap.teams) {
        const remote = snap.teams[tid];
        const local = s.teams.find((t) => t.id === tid);
        if (!local) continue;

        if (remote.tokens != null && remote.tokens !== local.tokens) {
          local.tokens = remote.tokens;
          GS.notify({ kind: 'tokens', teamId: tid, delta: 0, reason: 'remote' });
        }
        if (remote.freezeRounds != null && remote.freezeRounds !== local.freezeRounds) {
          local.freezeRounds = remote.freezeRounds;
          GS.notify({ kind: 'freeze', teamId: tid });
        }
        if (remote.ownedProjects) {
          local.ownedProjects = Object.assign({}, remote.ownedProjects);
        }
        if (remote.laps != null && remote.laps !== local.laps) {
          local.laps = remote.laps;
        }

        // Position change → animate the pawn from current to target.
        //
        // Critical: bump local.position to the target IMMEDIATELY (before the
        // animation kicks off). Pass the original position as fromIdx to the
        // animator. Reason: snapshots may keep arriving while the ~1.5s hop
        // animation runs (a single roll triggers several Firebase writes —
        // tokens, meter, etc.). Without the immediate bump those snapshots
        // would still see a position diff (local=old, remote=new) and queue
        // additional duplicate animations.
        if (remote.position != null && remote.position !== local.position) {
          const fromPos = local.position;
          const targetPos = remote.position;
          local.position = targetPos;
          const board = window.UI && window.UI.boardRef && window.UI.boardRef();
          if (board && s.status === 'playing') {
            board.movePawnTo(tid, targetPos, s.teams, { fromIdx: fromPos })
              .then(() => GS.notify({ kind: 'position', teamId: tid }));
          } else {
            GS.notify({ kind: 'position', teamId: tid });
          }
        }
      }
    }
  }

  // ---- public api -----------------------------------------------------------
  window.Sync = {
    CLIENT_ID,
    createSession, joinSession, peekSession, leaveTeam,
    onSnapshot,
    pushSession, pushTeam, pushEvent,
    startGame, pauseGame, resumeGame, endGame, resetSession,
    bindGameState,
    sessionCode: () => sessionCode,
    role:        () => role,
    myTeamId:    () => myTeamId,
    isHost:      () => role === 'host',
    snapshot:    () => lastSnap,
    isLive:      () => true,
  };
})();

// ============================================================================
// Bootstrap. Loaded last so all globals are defined. Lobby decides whether to
// show the landing/host/player lobby or jump straight to the game.
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  window.Lobby.start();
});

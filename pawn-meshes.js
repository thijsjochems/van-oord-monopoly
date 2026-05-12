// ============================================================================
// Pawn builders — five Van Oord vehicles in chunky-metallic Monopoly style.
// All scaled to roughly ~1.5 unit tall and ~1.2 unit footprint so they read
// from the host camera.
//
// Pawns are built in metallic silver with a colored "team band" so each team
// is still distinguishable. Material is shared per team.
// ============================================================================

(function () {
  const T = THREE;

  function tealoy(color) {
    return new T.MeshStandardMaterial({ color, metalness: 0.88, roughness: 0.28 });
  }
  function paint(color) {
    return new T.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.45 });
  }
  // dark gunmetal for windows / undercarriage
  const dark   = new T.MeshStandardMaterial({ color: 0x12181E, metalness: 0.6, roughness: 0.35 });
  const tracks = new T.MeshStandardMaterial({ color: 0x1B2229, metalness: 0.4, roughness: 0.75 });

  function mesh(geo, mat) {
    const m = new T.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function g(name) { const x = new T.Group(); x.name = name; return x; }

  // ============================================================================
  // 1. Excavator (graafmachine) — tracks + cabin + boom + bucket
  // ============================================================================
  function buildExcavator(steel, accent) {
    const root = g('excavator');
    // tracks
    for (const side of [-1, 1]) {
      const track = mesh(new T.BoxGeometry(1.3, 0.32, 0.32), tracks);
      track.position.set(0, 0.16, side * 0.34);
      root.add(track);
      // wheels along track
      for (let i = 0; i < 5; i++) {
        const w = mesh(new T.CylinderGeometry(0.16, 0.16, 0.05, 12), steel);
        w.rotation.z = Math.PI / 2;
        w.position.set(-0.55 + i * 0.27, 0.16, side * 0.34);
        root.add(w);
      }
    }
    // body base (rotating turret base)
    const turret = mesh(new T.CylinderGeometry(0.42, 0.5, 0.16, 16), steel);
    turret.position.y = 0.42;
    root.add(turret);
    // cabin
    const cab = mesh(new T.BoxGeometry(0.55, 0.5, 0.55), steel);
    cab.position.set(-0.05, 0.74, 0.08);
    root.add(cab);
    // cabin window (wraparound)
    const win = mesh(new T.BoxGeometry(0.56, 0.32, 0.56), dark);
    win.position.set(-0.05, 0.82, 0.08);
    root.add(win);
    // counterweight at back
    const cw = mesh(new T.BoxGeometry(0.32, 0.34, 0.6), accent);
    cw.position.set(-0.55, 0.66, 0);
    root.add(cw);
    // boom (upper arm)
    const boomGroup = g('boom');
    boomGroup.position.set(0.18, 0.62, -0.2);
    const boom = mesh(new T.BoxGeometry(0.92, 0.16, 0.16), accent);
    boom.position.set(0.4, 0.32, 0);
    boom.rotation.z = 0.45;
    boomGroup.add(boom);
    // stick (lower arm)
    const stick = mesh(new T.BoxGeometry(0.6, 0.13, 0.13), accent);
    stick.position.set(0.92, 0.05, 0);
    stick.rotation.z = -0.45;
    boomGroup.add(stick);
    // bucket
    const bucket = mesh(new T.BoxGeometry(0.18, 0.22, 0.32), steel);
    bucket.position.set(1.12, -0.18, 0);
    boomGroup.add(bucket);
    const teeth = mesh(new T.BoxGeometry(0.04, 0.06, 0.32), accent);
    teeth.position.set(1.21, -0.27, 0);
    boomGroup.add(teeth);
    root.add(boomGroup);
    return root;
  }

  // ============================================================================
  // 2. Hopper dredger ship — long hull, bridge aft, suction pipe
  // ============================================================================
  function buildShip(steel, accent) {
    const root = g('ship');
    // hull (long box, slightly tapered bow)
    const hull = mesh(new T.BoxGeometry(2.2, 0.42, 0.7), steel);
    hull.position.y = 0.42;
    root.add(hull);
    // bow (chevron)
    const bow = mesh(new T.ConeGeometry(0.42, 0.6, 4), steel);
    bow.rotation.z = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(1.4, 0.42, 0);
    root.add(bow);
    // water line stripe
    const stripe = mesh(new T.BoxGeometry(2.25, 0.06, 0.72), accent);
    stripe.position.y = 0.24;
    root.add(stripe);
    // deck (hopper hold cover)
    const deck = mesh(new T.BoxGeometry(1.4, 0.04, 0.6), accent);
    deck.position.set(0.18, 0.65, 0);
    root.add(deck);
    // bridge superstructure
    const b1 = mesh(new T.BoxGeometry(0.45, 0.35, 0.62), steel);
    b1.position.set(-0.78, 0.8, 0);
    root.add(b1);
    const b2 = mesh(new T.BoxGeometry(0.42, 0.3, 0.5), steel);
    b2.position.set(-0.78, 1.12, 0);
    root.add(b2);
    // bridge windows
    const winBand = mesh(new T.BoxGeometry(0.44, 0.14, 0.51), dark);
    winBand.position.set(-0.78, 1.18, 0);
    root.add(winBand);
    // funnel/stack
    const stack = mesh(new T.CylinderGeometry(0.1, 0.1, 0.35, 12), accent);
    stack.position.set(-0.95, 1.5, 0);
    root.add(stack);
    // suction pipe arm out the side (signature hopper detail)
    const pipe = mesh(new T.CylinderGeometry(0.06, 0.06, 1.1, 10), steel);
    pipe.rotation.z = Math.PI / 2 + 0.2;
    pipe.position.set(0.2, 0.5, 0.55);
    pipe.rotation.y = Math.PI / 2 - 0.3;
    root.add(pipe);
    // crane on bow
    const crane = mesh(new T.BoxGeometry(0.5, 0.06, 0.06), steel);
    crane.position.set(0.7, 0.95, 0);
    crane.rotation.z = -0.4;
    root.add(crane);
    const cranePost = mesh(new T.CylinderGeometry(0.04, 0.05, 0.4, 8), steel);
    cranePost.position.set(0.55, 0.85, 0);
    root.add(cranePost);
    return root;
  }

  // ============================================================================
  // 3. Truck — cab + flatbed with cargo
  // ============================================================================
  function buildTruck(steel, accent) {
    const root = g('truck');
    // chassis
    const chass = mesh(new T.BoxGeometry(2.0, 0.12, 0.6), dark);
    chass.position.y = 0.28;
    root.add(chass);
    // wheels
    for (const x of [-0.7, 0.7]) {
      for (const z of [-0.32, 0.32]) {
        const w = mesh(new T.CylinderGeometry(0.18, 0.18, 0.08, 14), tracks);
        w.rotation.x = Math.PI / 2;
        w.position.set(x, 0.18, z);
        root.add(w);
        const hub = mesh(new T.CylinderGeometry(0.06, 0.06, 0.1, 8), steel);
        hub.rotation.x = Math.PI / 2;
        hub.position.set(x, 0.18, z);
        root.add(hub);
      }
    }
    // cab
    const cab = mesh(new T.BoxGeometry(0.55, 0.55, 0.6), steel);
    cab.position.set(0.7, 0.62, 0);
    root.add(cab);
    // windshield
    const ws = mesh(new T.BoxGeometry(0.18, 0.32, 0.55), dark);
    ws.position.set(0.95, 0.65, 0);
    root.add(ws);
    // cab roof accent
    const stripe = mesh(new T.BoxGeometry(0.55, 0.06, 0.6), accent);
    stripe.position.set(0.7, 0.9, 0);
    root.add(stripe);
    // cargo container
    const cargo = mesh(new T.BoxGeometry(1.1, 0.6, 0.6), accent);
    cargo.position.set(-0.25, 0.65, 0);
    root.add(cargo);
    // cargo ridges
    for (let i = 0; i < 5; i++) {
      const ridge = mesh(new T.BoxGeometry(0.02, 0.58, 0.62), steel);
      ridge.position.set(-0.7 + i * 0.22, 0.65, 0);
      root.add(ridge);
    }
    // bull bar
    const bull = mesh(new T.BoxGeometry(0.06, 0.18, 0.6), steel);
    bull.position.set(1.02, 0.42, 0);
    root.add(bull);
    return root;
  }

  // ============================================================================
  // 4. Dumptruck — cab + tipping bed
  // ============================================================================
  function buildDumptruck(steel, accent) {
    const root = g('dumptruck');
    // chassis
    const chass = mesh(new T.BoxGeometry(1.8, 0.14, 0.7), dark);
    chass.position.y = 0.32;
    root.add(chass);
    // big wheels (offroad)
    for (const x of [-0.55, 0.55]) {
      for (const z of [-0.42, 0.42]) {
        const w = mesh(new T.CylinderGeometry(0.26, 0.26, 0.18, 14), tracks);
        w.rotation.x = Math.PI / 2;
        w.position.set(x, 0.26, z);
        root.add(w);
      }
    }
    // dual rear wheels — second wheel just inboard
    for (const z of [-0.34, 0.34]) {
      const w = mesh(new T.CylinderGeometry(0.26, 0.26, 0.14, 14), tracks);
      w.rotation.x = Math.PI / 2;
      w.position.set(-0.78, 0.26, z);
      root.add(w);
    }
    // cab (offset forward, lower than dumptruck because mining-style)
    const cab = mesh(new T.BoxGeometry(0.5, 0.45, 0.62), steel);
    cab.position.set(0.6, 0.62, 0);
    root.add(cab);
    const ws = mesh(new T.BoxGeometry(0.16, 0.28, 0.55), dark);
    ws.position.set(0.78, 0.65, 0);
    root.add(ws);
    // dump bed — large, slightly tilted up at back
    const bed = mesh(new T.BoxGeometry(1.2, 0.5, 0.78), accent);
    bed.position.set(-0.2, 0.7, 0);
    bed.rotation.z = 0.06;
    root.add(bed);
    // pile of dirt/rocks in bed
    for (let i = 0; i < 6; i++) {
      const r = mesh(new T.DodecahedronGeometry(0.1 + Math.random() * 0.04, 0), tracks);
      r.position.set(-0.5 + Math.random() * 0.7, 0.95 + Math.random() * 0.1, (Math.random() - 0.5) * 0.5);
      r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      root.add(r);
    }
    // hydraulic piston ram going to bed
    const ram = mesh(new T.CylinderGeometry(0.05, 0.05, 0.45, 8), steel);
    ram.rotation.z = -Math.PI / 4;
    ram.position.set(0.15, 0.6, 0);
    root.add(ram);
    return root;
  }

  // ============================================================================
  // 5. Heavy-lift crane (Svanen-style) — two-leg gantry with hook
  // ============================================================================
  function buildCrane(steel, accent) {
    const root = g('crane');
    // two A-frames, one each end
    for (const x of [-0.55, 0.55]) {
      // legs splayed slightly
      for (const side of [-1, 1]) {
        const leg = mesh(new T.BoxGeometry(0.08, 1.8, 0.08), steel);
        leg.position.set(x, 0.9, side * 0.22);
        leg.rotation.x = side * -0.08;
        root.add(leg);
      }
    }
    // cross-bracing on each frame
    for (const x of [-0.55, 0.55]) {
      for (let i = 0; i < 3; i++) {
        const b = mesh(new T.BoxGeometry(0.05, 0.04, 0.46), accent);
        b.position.set(x, 0.4 + i * 0.5, 0);
        root.add(b);
      }
    }
    // top spans connecting the two A-frames
    for (const side of [-1, 1]) {
      const span = mesh(new T.BoxGeometry(1.4, 0.1, 0.1), accent);
      span.position.set(0, 1.7, side * 0.22);
      root.add(span);
    }
    // platform base (ship hull pretending crane sits on it)
    const base = mesh(new T.BoxGeometry(1.7, 0.18, 0.8), steel);
    base.position.y = 0.09;
    root.add(base);
    // waterline accent
    const wl = mesh(new T.BoxGeometry(1.72, 0.04, 0.82), accent);
    wl.position.y = 0.02;
    root.add(wl);
    // hoist hook hanging in middle
    const cable = mesh(new T.CylinderGeometry(0.012, 0.012, 0.7, 6), dark);
    cable.position.set(0, 1.3, 0);
    root.add(cable);
    const hook = mesh(new T.BoxGeometry(0.12, 0.18, 0.12), steel);
    hook.position.set(0, 0.92, 0);
    root.add(hook);
    // suspended load (turbine foundation)
    const load = mesh(new T.CylinderGeometry(0.12, 0.16, 0.2, 10), accent);
    load.position.set(0, 0.78, 0);
    root.add(load);
    return root;
  }

  // ============================================================================
  // Dispatch
  // ============================================================================
  function buildPawn(kind, color, accentColor) {
    const steel  = tealoy(0xC2CCD4);
    const accent = paint(color);
    let pawn;
    switch (kind) {
      case 'excavator': pawn = buildExcavator(steel, accent); break;
      case 'ship':      pawn = buildShip(steel, accent); break;
      case 'truck':     pawn = buildTruck(steel, accent); break;
      case 'dumptruck': pawn = buildDumptruck(steel, accent); break;
      case 'crane':     pawn = buildCrane(steel, accent); break;
      default:          pawn = buildExcavator(steel, accent);
    }
    // little colored disc under pawn to identify team from above
    const disc = new T.Mesh(
      new T.CylinderGeometry(0.55, 0.55, 0.04, 24),
      new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, roughness: 0.6 }),
    );
    disc.position.y = 0.02;
    disc.receiveShadow = true;
    pawn.add(disc);
    pawn.userData.disc = disc;
    // ring on top of disc
    const ring = new T.Mesh(
      new T.TorusGeometry(0.5, 0.04, 6, 24),
      new T.MeshStandardMaterial({ color: accentColor || 0xFFFFFF, emissive: accentColor || 0xFFFFFF, emissiveIntensity: 0.5, roughness: 0.4 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    pawn.add(ring);
    return pawn;
  }

  window.PawnMeshes = { buildPawn };
})();

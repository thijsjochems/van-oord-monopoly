// ============================================================================
// Tile-top mini dioramas. Procedural Three.js geometry per archetype.
// All measurements assume a tile playfield of ~3.4 units wide × ~5.2 deep
// (the local coordinate space of side-tile groups; corner tiles get ~5.2×5.2).
// "Up" is +Y. Mini features sit on top of the tile base (which is at Y=0.4).
// ============================================================================

(function () {
  const T = THREE;

  // Shared materials so we don't recreate per tile.
  const M = {
    sand:        new T.MeshStandardMaterial({ color: 0xE8B86F, roughness: 0.95 }),
    sandLight:   new T.MeshStandardMaterial({ color: 0xF2CD8F, roughness: 0.95 }),
    palmTrunk:   new T.MeshStandardMaterial({ color: 0x6A4324, roughness: 0.85 }),
    palmFrond:   new T.MeshStandardMaterial({ color: 0x4A8F3A, roughness: 0.8 }),
    sea:         new T.MeshStandardMaterial({ color: 0x1B4E6A, roughness: 0.55, metalness: 0.1 }),
    seaDark:     new T.MeshStandardMaterial({ color: 0x0E3147, roughness: 0.6 }),
    foam:        new T.MeshStandardMaterial({ color: 0xC8E3EA, roughness: 0.9 }),
    turbineWhite:new T.MeshStandardMaterial({ color: 0xF1F5F7, roughness: 0.45, metalness: 0.05 }),
    turbineDark: new T.MeshStandardMaterial({ color: 0x2A323A, roughness: 0.6 }),
    concrete:    new T.MeshStandardMaterial({ color: 0xB5B0A6, roughness: 0.9 }),
    rust:        new T.MeshStandardMaterial({ color: 0xB04A1E, roughness: 0.85 }),
    steel:       new T.MeshStandardMaterial({ color: 0x8B96A2, roughness: 0.35, metalness: 0.85 }),
    steelDark:   new T.MeshStandardMaterial({ color: 0x4A555F, roughness: 0.4, metalness: 0.8 }),
    containerR:  new T.MeshStandardMaterial({ color: 0xC83A2A, roughness: 0.7 }),
    containerB:  new T.MeshStandardMaterial({ color: 0x2A6FA8, roughness: 0.7 }),
    containerG:  new T.MeshStandardMaterial({ color: 0x4A8F3A, roughness: 0.7 }),
    containerY:  new T.MeshStandardMaterial({ color: 0xE2B43A, roughness: 0.7 }),
    grass:       new T.MeshStandardMaterial({ color: 0x4A7A3E, roughness: 0.95 }),
    grassDark:   new T.MeshStandardMaterial({ color: 0x2E4E28, roughness: 0.95 }),
    rock:        new T.MeshStandardMaterial({ color: 0x7A7066, roughness: 0.95 }),
    rockDark:    new T.MeshStandardMaterial({ color: 0x55504A, roughness: 0.95 }),
    asphalt:     new T.MeshStandardMaterial({ color: 0x2C2F33, roughness: 0.95 }),
    lightOn:     new T.MeshStandardMaterial({ color: 0xFFE7A0, emissive: 0xFFC640, emissiveIntensity: 1.5, roughness: 0.3 }),
    gold:        new T.MeshStandardMaterial({ color: 0xE0B260, roughness: 0.3, metalness: 0.85 }),
    domeWhite:   new T.MeshStandardMaterial({ color: 0xF6F0E0, roughness: 0.5 }),
    accentGreen: new T.MeshStandardMaterial({ color: 0x3FE08B, emissive: 0x1F7B45, emissiveIntensity: 0.6, roughness: 0.4 }),
    accentRed:   new T.MeshStandardMaterial({ color: 0xFF5436, emissive: 0x7A1E0B, emissiveIntensity: 0.6, roughness: 0.4 }),
    accentBlue:  new T.MeshStandardMaterial({ color: 0x4DD0E1, emissive: 0x195766, emissiveIntensity: 0.6, roughness: 0.4 }),
  };

  // ---------------------------------------------------------------- helpers
  function group(name) {
    const g = new T.Group();
    g.name = name;
    return g;
  }

  function mesh(geo, mat) {
    const m = new T.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Place a small sea base under offshore archetypes
  function seaPad(w, d) {
    const g = group('sea');
    const sea = mesh(new T.BoxGeometry(w, 0.08, d), M.sea);
    sea.position.y = 0.04;
    sea.receiveShadow = true;
    sea.castShadow = false;
    g.add(sea);
    // foam ridges that lap back and forth
    for (let i = 0; i < 3; i++) {
      const f = mesh(new T.BoxGeometry(w * 0.7, 0.012, 0.05), M.foam);
      f.position.set((Math.random() - 0.5) * w * 0.3, 0.085, (i - 1) * d * 0.25);
      f.userData.foamLap = { baseZ: f.position.z, baseX: f.position.x, amp: 0.1, phase: i * 1.7, speed: 0.6 + i * 0.25 };
      g.add(f);
    }
    return g;
  }

  // ---------------------------------------------------------------- wind turbine
  function windTurbine(scale = 1) {
    const g = group('turbine');
    // foundation (transition piece) — yellow industrial cylinder
    const found = mesh(new T.CylinderGeometry(0.18 * scale, 0.22 * scale, 0.3 * scale, 12), M.containerY);
    found.position.y = 0.15 * scale;
    g.add(found);
    // tower — tapered
    const tower = mesh(new T.CylinderGeometry(0.08 * scale, 0.16 * scale, 1.6 * scale, 14), M.turbineWhite);
    tower.position.y = 1.1 * scale;
    g.add(tower);
    // nacelle (along +X)
    const nacelle = mesh(new T.BoxGeometry(0.42 * scale, 0.18 * scale, 0.18 * scale), M.turbineWhite);
    nacelle.position.set(0.06 * scale, 1.93 * scale, 0);
    g.add(nacelle);
    // hub (front of nacelle)
    const hub = mesh(new T.SphereGeometry(0.08 * scale, 12, 10), M.turbineDark);
    hub.position.set(0.22 * scale, 1.93 * scale, 0);
    g.add(hub);
    // rotor — spins around its local X (which is also world X here)
    const rotor = group('rotor');
    rotor.position.set(0.26 * scale, 1.93 * scale, 0);
    for (let i = 0; i < 3; i++) {
      const arm = group('arm');
      // blade: long in Y, thin in X and Z (tapered look)
      const b = mesh(new T.BoxGeometry(0.05 * scale, 0.78 * scale, 0.07 * scale), M.turbineWhite);
      b.position.set(0, 0.42 * scale, 0);
      arm.add(b);
      // arm pivots so the three blades sit in YZ plane, 120° apart
      arm.rotation.x = (i * Math.PI * 2) / 3;
      rotor.add(arm);
    }
    g.add(rotor);
    g.userData.spinX = rotor;
    return g;
  }

  // ---------------------------------------------------------------- palm tree
  function palmTree(scale = 1) {
    const g = group('palm');
    // trunk — curved-ish (slight tilt) cylinder
    const trunk = mesh(new T.CylinderGeometry(0.06 * scale, 0.10 * scale, 1.1 * scale, 10), M.palmTrunk);
    trunk.position.y = 0.55 * scale;
    trunk.rotation.z = 0.08;
    g.add(trunk);
    // ring detail
    for (let i = 0; i < 4; i++) {
      const r = mesh(new T.TorusGeometry(0.08 * scale, 0.012 * scale, 6, 12), M.palmTrunk);
      r.position.y = 0.25 * scale + i * 0.22 * scale;
      r.rotation.x = Math.PI / 2;
      g.add(r);
    }
    // fronds — 7 elongated rounded boxes radiating outward+down
    const frondCount = 7;
    for (let i = 0; i < frondCount; i++) {
      const f = mesh(new T.BoxGeometry(0.06 * scale, 0.04 * scale, 0.55 * scale), M.palmFrond);
      const ang = (i / frondCount) * Math.PI * 2;
      const droop = 0.4;
      f.position.set(Math.cos(ang) * 0.25 * scale, 1.12 * scale - droop * 0.04 * scale, Math.sin(ang) * 0.25 * scale);
      // point outward + droop tip downward by rotating around horizontal axis perpendicular to direction
      f.rotation.y = -ang + Math.PI / 2;
      f.rotation.x = -0.55;
      g.add(f);
    }
    // coconut cluster
    for (let i = 0; i < 3; i++) {
      const c = mesh(new T.SphereGeometry(0.05 * scale, 8, 6), M.palmTrunk);
      const ang = (i / 3) * Math.PI * 2;
      c.position.set(Math.cos(ang) * 0.08 * scale, 1.06 * scale, Math.sin(ang) * 0.08 * scale);
      g.add(c);
    }
    return g;
  }

  // ---------------------------------------------------------------- island sand mound
  function sandMound(w, d, h = 0.18, mat = M.sand) {
    const g = group('mound');
    const base = mesh(new T.CylinderGeometry(Math.min(w, d) * 0.55, Math.min(w, d) * 0.5, h, 18), mat);
    base.position.y = h / 2;
    g.add(base);
    return g;
  }

  // ---------------------------------------------------------------- container stack
  function containerStack(rows = 2, cols = 3, height = 2) {
    const g = group('containers');
    const mats = [M.containerR, M.containerB, M.containerG, M.containerY];
    const cw = 0.36, cd = 0.18, ch = 0.16;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < cols; x++) {
        for (let z = 0; z < rows; z++) {
          if (Math.random() < 0.12 && y === height - 1) continue; // gap at top
          const m = mesh(new T.BoxGeometry(cw, ch, cd), mats[(x + z + y) % 4]);
          m.position.set(
            (x - (cols - 1) / 2) * (cw + 0.02),
            ch / 2 + y * (ch + 0.01),
            (z - (rows - 1) / 2) * (cd + 0.02),
          );
          g.add(m);
        }
      }
    }
    return g;
  }

  // ---------------------------------------------------------------- gantry crane
  function gantryCrane(scale = 1) {
    const g = group('gantry');
    // two A-frame legs
    for (const side of [-1, 1]) {
      const leg1 = mesh(new T.BoxGeometry(0.04, 1.0 * scale, 0.04), M.steel);
      leg1.position.set(side * 0.32, 0.5 * scale, -0.18);
      g.add(leg1);
      const leg2 = mesh(new T.BoxGeometry(0.04, 1.0 * scale, 0.04), M.steel);
      leg2.position.set(side * 0.32, 0.5 * scale, 0.18);
      g.add(leg2);
    }
    // top beam
    const beam = mesh(new T.BoxGeometry(1.2 * scale, 0.06, 0.06), M.containerR);
    beam.position.y = 1.0 * scale;
    g.add(beam);
    // boom out over water
    const boom = mesh(new T.BoxGeometry(0.7 * scale, 0.05, 0.05), M.containerR);
    boom.position.set(0.55 * scale, 1.05 * scale, 0);
    g.add(boom);
    // Trolley assembly — animated (slides along boom, container bobs)
    const trolley = group('trolleyAssembly');
    const cart = mesh(new T.BoxGeometry(0.1, 0.06, 0.18), M.steelDark);
    cart.position.set(0, 0.97 * scale, 0);
    trolley.add(cart);
    const cable = mesh(new T.CylinderGeometry(0.005, 0.005, 0.5, 6), M.steelDark);
    cable.position.set(0, 0.72 * scale, 0);
    trolley.add(cable);
    const hung = mesh(new T.BoxGeometry(0.36, 0.16, 0.18), M.containerB);
    hung.position.set(0, 0.49 * scale, 0);
    trolley.add(hung);
    trolley.userData.gantryTrolley = {
      centerX: 0.2 * scale,
      amplitudeX: 0.55 * scale,
      period: 4.5,
    };
    trolley.userData.containerLift = { mesh: hung, cable: cable };
    g.add(trolley);
    return g;
  }

  // ---------------------------------------------------------------- storm-surge barrier (Oosterscheldekering)
  function stormBarrier() {
    const g = group('barrier');
    // water on either side of the barrier
    const water = mesh(new T.BoxGeometry(2.4, 0.04, 1.6), M.sea);
    water.position.set(0, 0.02, 0);
    g.add(water);
    // foam strips that lap against the barrier
    for (let i = 0; i < 4; i++) {
      const f = mesh(new T.BoxGeometry(1.8, 0.012, 0.05), M.foam);
      f.position.set(0, 0.06, -0.55 + i * 0.36);
      f.userData.foamLap = { baseZ: f.position.z, baseX: 0, amp: 0.08, phase: i * 1.3, speed: 0.55 + i * 0.18 };
      g.add(f);
    }
    // four heavy pillars with gate doors between
    for (let i = 0; i < 4; i++) {
      const pillar = mesh(new T.BoxGeometry(0.18, 0.55, 0.6), M.concrete);
      pillar.position.set((i - 1.5) * 0.55, 0.275, 0);
      g.add(pillar);
      // top platform connecting
      if (i < 3) {
        const top = mesh(new T.BoxGeometry(0.55, 0.06, 0.6), M.concrete);
        top.position.set((i - 1.5) * 0.55 + 0.275, 0.58, 0);
        g.add(top);
      }
      // gate door (partially lowered) between pillars
      if (i < 3) {
        const door = mesh(new T.BoxGeometry(0.5, 0.32, 0.06), M.steel);
        door.position.set((i - 1.5) * 0.55 + 0.275, 0.18, -0.15);
        g.add(door);
      }
    }
    return g;
  }

  // ---------------------------------------------------------------- rock armor pile (Lincolnshire)
  function rockArmor() {
    const g = group('rocks');
    // water foreground with lapping foam
    const water = mesh(new T.BoxGeometry(2.4, 0.04, 0.7), M.sea);
    water.position.set(0, 0.02, 0.55);
    g.add(water);
    for (let i = 0; i < 3; i++) {
      const f = mesh(new T.BoxGeometry(1.8, 0.012, 0.05), M.foam);
      f.position.set(0, 0.06, 0.3 + i * 0.18);
      f.userData.foamLap = { baseZ: f.position.z, baseX: 0, amp: 0.12, phase: i * 1.5, speed: 0.6 + i * 0.2 };
      g.add(f);
    }
    const positions = [
      [-0.5, 0, -0.1],   [-0.2, 0, 0.1],  [0.1, 0, -0.15], [0.4, 0, 0.05],   [0.6, 0, -0.1],
      [-0.35, 0.18, 0],  [0,    0.18, 0], [0.3, 0.18, 0.05],
      [-0.1, 0.34, 0.02], [0.18, 0.34, -0.02],
      [0.05, 0.5, 0],
    ];
    for (const [x, y, z] of positions) {
      const r = mesh(new T.DodecahedronGeometry(0.13 + Math.random() * 0.05, 0), Math.random() > 0.5 ? M.rock : M.rockDark);
      r.position.set(x, y + 0.13, z);
      r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      g.add(r);
    }
    return g;
  }

  // ---------------------------------------------------------------- lighthouse (Millport)
  function lighthouse() {
    const g = group('lighthouse');
    // rocky base
    const base = mesh(new T.CylinderGeometry(0.4, 0.5, 0.18, 16), M.rockDark);
    base.position.y = 0.09;
    g.add(base);
    // white tower with red stripes
    const tower = mesh(new T.CylinderGeometry(0.13, 0.18, 1.4, 18), M.turbineWhite);
    tower.position.y = 0.88;
    g.add(tower);
    for (let i = 0; i < 3; i++) {
      const stripe = mesh(new T.CylinderGeometry(0.14, 0.17 - i * 0.013, 0.18, 18), M.accentRed);
      stripe.position.y = 0.35 + i * 0.45;
      g.add(stripe);
    }
    // gallery
    const gall = mesh(new T.CylinderGeometry(0.18, 0.18, 0.05, 18), M.steelDark);
    gall.position.y = 1.6;
    g.add(gall);
    // lamp room
    const lamp = mesh(new T.CylinderGeometry(0.12, 0.12, 0.16, 12), M.lightOn);
    lamp.position.y = 1.71;
    g.add(lamp);
    // cap
    const cap = mesh(new T.ConeGeometry(0.14, 0.2, 12), M.accentRed);
    cap.position.y = 1.9;
    g.add(cap);
    // rotating beam — two opposing cones of warm light
    const beamMat = new T.MeshBasicMaterial({ color: 0xFFE7A0, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false });
    const beams = group('beams');
    for (const sign of [1, -1]) {
      const cone = new T.Mesh(new T.ConeGeometry(0.55, 2.4, 14, 1, true), beamMat);
      cone.rotation.z = sign * Math.PI / 2;
      cone.position.set(sign * 1.2, 1.71, 0);
      beams.add(cone);
    }
    beams.position.set(0, 0, 0);
    beams.userData.beamRotate = true;
    g.add(beams);
    // small water lap circle around base
    const ripple = mesh(new T.RingGeometry(0.55, 0.7, 24), new T.MeshBasicMaterial({ color: 0xC8E3EA, transparent: true, opacity: 0.4, side: T.DoubleSide }));
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 0.01;
    ripple.userData.ripplePulse = { baseScale: 1.0, amp: 0.25, speed: 1.1 };
    g.add(ripple);
    return g;
  }

  // ---------------------------------------------------------------- canal + ship (Suez)
  function canalShip() {
    const g = group('canal');
    // sandy banks
    const bankA = mesh(new T.BoxGeometry(2.4, 0.14, 0.45), M.sand);
    bankA.position.set(0, 0.07, -0.7);
    g.add(bankA);
    const bankB = mesh(new T.BoxGeometry(2.4, 0.14, 0.45), M.sand);
    bankB.position.set(0, 0.07, 0.7);
    g.add(bankB);
    // water strip
    const water = mesh(new T.BoxGeometry(2.4, 0.04, 1.0), M.sea);
    water.position.set(0, 0.04, 0);
    g.add(water);
    // ship hull
    const hull = mesh(new T.BoxGeometry(0.95, 0.16, 0.3), M.steelDark);
    hull.position.set(0.05, 0.16, 0);
    g.add(hull);
    // deck
    const deck = mesh(new T.BoxGeometry(0.9, 0.04, 0.26), M.concrete);
    deck.position.set(0.05, 0.27, 0);
    g.add(deck);
    // bridge
    const bridge = mesh(new T.BoxGeometry(0.18, 0.16, 0.18), M.turbineWhite);
    bridge.position.set(-0.25, 0.36, 0);
    g.add(bridge);
    // smokestack
    const stack = mesh(new T.CylinderGeometry(0.05, 0.05, 0.18, 10), M.containerR);
    stack.position.set(-0.32, 0.41, 0);
    g.add(stack);
    // bow
    const bow = mesh(new T.ConeGeometry(0.18, 0.2, 4), M.steelDark);
    bow.rotation.z = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0.6, 0.18, 0);
    g.add(bow);
    return g;
  }

  // ---------------------------------------------------------------- tropical-island
  function tropicalIsland() {
    const g = group('tropical');
    const m = sandMound(2.4, 1.2, 0.16, M.sandLight);
    g.add(m);
    // green canopy
    const can = mesh(new T.CylinderGeometry(0.55, 0.6, 0.1, 14), M.grass);
    can.position.y = 0.2;
    g.add(can);
    // little palms
    const p1 = palmTree(0.55); p1.position.set(-0.2, 0.16, 0.1); g.add(p1);
    const p2 = palmTree(0.45); p2.position.set(0.25, 0.16, -0.1); g.add(p2);
    return g;
  }

  // ---------------------------------------------------------------- archipelago (World Islands)
  function archipelago() {
    const g = group('archipelago');
    // many tiny sand spots arranged loosely like a world map
    const seeds = [
      [-0.7, -0.1, 0.45], [-0.4, 0.05, 0.5], [-0.1, -0.05, 0.45],
      [-0.6, 0, 0.15], [-0.3, 0.08, 0.18], [-0.05, -0.05, 0.18], [0.25, 0, 0.22],
      [-0.55, -0.05, -0.15], [-0.2, 0.05, -0.18], [0.15, -0.05, -0.13], [0.45, 0.05, -0.18],
      [-0.4, 0, -0.45], [-0.05, 0.05, -0.4], [0.3, -0.05, -0.45], [0.65, 0, -0.4],
    ];
    for (const [x, y, z] of seeds) {
      const r = 0.07 + Math.random() * 0.07;
      const isle = mesh(new T.CylinderGeometry(r, r * 0.85, 0.08, 10), Math.random() > 0.6 ? M.sandLight : M.sand);
      isle.position.set(x, 0.04, z);
      g.add(isle);
    }
    return g;
  }

  // ---------------------------------------------------------------- island with dome resort (Jumana)
  function islandResort() {
    const g = group('resort');
    g.add(sandMound(1.8, 1.0, 0.16, M.sandLight));
    // central dome
    const dome = mesh(new T.SphereGeometry(0.22, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.domeWhite);
    dome.position.set(0, 0.16, 0);
    g.add(dome);
    const golden = mesh(new T.SphereGeometry(0.05, 8, 6), M.gold);
    golden.position.set(0, 0.38, 0);
    g.add(golden);
    // two pavilions
    for (const x of [-0.4, 0.4]) {
      const p = mesh(new T.BoxGeometry(0.18, 0.12, 0.18), M.turbineWhite);
      p.position.set(x, 0.22, 0);
      g.add(p);
      const roof = mesh(new T.ConeGeometry(0.16, 0.12, 4), M.accentRed);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(x, 0.34, 0);
      g.add(roof);
    }
    // palm
    const palm = palmTree(0.45);
    palm.position.set(0.15, 0.16, 0.25);
    g.add(palm);
    return g;
  }

  // ---------------------------------------------------------------- Palm Jumeirah cluster — trunk-and-fronds island shape
  function palmCluster() {
    const g = group('palm-cluster');
    // sand trunk shape (a long sand bar)
    const trunk = mesh(new T.BoxGeometry(0.45, 0.1, 1.6), M.sandLight);
    trunk.position.set(0, 0.05, 0);
    g.add(trunk);
    // crescent breakwater (a big arc) — represented as two arc segments using torus slices
    const arc = mesh(new T.TorusGeometry(1.0, 0.05, 6, 28, Math.PI * 0.6), M.concrete);
    arc.rotation.x = Math.PI / 2;
    arc.position.set(0, 0.06, 0);
    arc.rotation.z = -Math.PI / 2;
    g.add(arc);
    // fronds (small angled sand strips)
    for (let i = 0; i < 4; i++) {
      const z = -0.55 + i * 0.35;
      for (const side of [-1, 1]) {
        const f = mesh(new T.BoxGeometry(0.6, 0.07, 0.1), M.sandLight);
        f.position.set(side * 0.35, 0.05, z);
        f.rotation.y = side * 0.5;
        g.add(f);
      }
    }
    // 2 little palms
    const p = palmTree(0.4);
    p.position.set(0, 0.1, -0.4);
    g.add(p);
    const p2 = palmTree(0.35);
    p2.position.set(0, 0.1, 0.4);
    g.add(p2);
    return g;
  }

  // ---------------------------------------------------------------- Palm Deira / single palm
  function palmSingle() {
    const g = group('palm-single');
    g.add(sandMound(1.5, 0.8, 0.12, M.sandLight));
    const p = palmTree(0.7);
    p.position.set(0, 0.12, 0);
    g.add(p);
    // tiny tower beside it
    const tower = mesh(new T.BoxGeometry(0.18, 0.5, 0.18), M.gold);
    tower.position.set(0.45, 0.37, 0.15);
    g.add(tower);
    const tip = mesh(new T.ConeGeometry(0.13, 0.18, 6), M.gold);
    tip.position.set(0.45, 0.7, 0.15);
    g.add(tip);
    return g;
  }

  // ---------------------------------------------------------------- wind farm (offshore)
  function windFarm(count) {
    const g = group('farm');
    g.add(seaPad(2.4, 1.4));
    const positions =
      count === 1 ? [[0, 0]]
      : count === 2 ? [[-0.5, 0.15], [0.5, -0.15]]
      : [[-0.7, 0.2], [0, -0.2], [0.7, 0.15]];
    for (const [x, z] of positions) {
      const t = windTurbine(0.85);
      t.position.set(x, 0.1, z);
      // all face roughly the same direction (a slight variance reads natural)
      t.rotation.y = -0.15 + Math.random() * 0.3;
      // randomize starting blade angle so they don't all rotate in sync
      const rotor = t.userData.spinX;
      if (rotor) rotor.rotation.x = Math.random() * Math.PI * 2;
      g.add(t);
    }
    return g;
  }

  // ---------------------------------------------------------------- container port (Maasvlakte)
  function containerPort() {
    const g = group('port');
    // sea on one side, quay on other
    const sea = mesh(new T.BoxGeometry(2.4, 0.06, 0.5), M.sea);
    sea.position.set(0, 0.03, 0.55);
    g.add(sea);
    const quay = mesh(new T.BoxGeometry(2.4, 0.12, 0.85), M.concrete);
    quay.position.set(0, 0.06, -0.18);
    g.add(quay);
    // container stacks
    const cs1 = containerStack(2, 3, 2);
    cs1.position.set(-0.55, 0.13, -0.3);
    g.add(cs1);
    const cs2 = containerStack(2, 2, 3);
    cs2.position.set(0.55, 0.13, -0.3);
    g.add(cs2);
    // gantry crane reaching over water
    const cr = gantryCrane(0.85);
    cr.position.set(0, 0.13, 0.45);
    cr.rotation.y = Math.PI / 2;
    g.add(cr);
    return g;
  }

  // ---------------------------------------------------------------- port crane (Tuas)
  function portCrane() {
    const g = group('port-crane');
    g.add(containerStack(2, 3, 1).translateY(0.1).translateZ(-0.35));
    const cr = gantryCrane(0.9);
    cr.position.set(0, 0.1, 0.2);
    g.add(cr);
    // sea strip
    const sea = mesh(new T.BoxGeometry(2.4, 0.06, 0.4), M.sea);
    sea.position.set(0, 0.03, 0.6);
    g.add(sea);
    return g;
  }

  // ---------------------------------------------------------------- specials (fuel, automation hub, manual, briefing)
  function fuelStation() {
    const g = group('fuel');
    // pump body
    const body = mesh(new T.BoxGeometry(0.45, 0.6, 0.3), M.accentRed);
    body.position.y = 0.3;
    g.add(body);
    // top display
    const disp = mesh(new T.BoxGeometry(0.4, 0.16, 0.26), M.turbineWhite);
    disp.position.y = 0.7;
    g.add(disp);
    // pump nozzle
    const noz = mesh(new T.BoxGeometry(0.06, 0.18, 0.04), M.steelDark);
    noz.position.set(0.24, 0.4, 0);
    g.add(noz);
    // base puddle (oil)
    const pud = mesh(new T.CircleGeometry(0.4, 18), M.asphalt);
    pud.rotation.x = -Math.PI / 2;
    pud.position.y = 0.005;
    g.add(pud);
    return g;
  }

  function automationHub() {
    const g = group('hub');
    // metallic disc base
    const disc = mesh(new T.CylinderGeometry(0.55, 0.55, 0.08, 24), M.steel);
    disc.position.y = 0.04;
    g.add(disc);
    // inner ring glow
    const ring = mesh(new T.TorusGeometry(0.4, 0.04, 6, 28), M.accentGreen);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.09;
    g.add(ring);
    // central pillar
    const pillar = mesh(new T.CylinderGeometry(0.12, 0.16, 0.7, 8), M.steelDark);
    pillar.position.y = 0.43;
    g.add(pillar);
    // floating cube
    const cube = mesh(new T.BoxGeometry(0.28, 0.28, 0.28), M.accentGreen);
    cube.position.y = 0.95;
    cube.userData.bobY = { base: 0.95, amplitude: 0.08, period: 2.2 };
    cube.userData.spinY = true;
    g.add(cube);
    return g;
  }

  function manualWork() {
    const g = group('manual');
    // stack of papers
    for (let i = 0; i < 12; i++) {
      const p = mesh(new T.BoxGeometry(0.34 + Math.random() * 0.04, 0.012, 0.46 + Math.random() * 0.04), M.turbineWhite);
      p.position.set((Math.random() - 0.5) * 0.04, 0.012 + i * 0.011, (Math.random() - 0.5) * 0.04);
      p.rotation.y = (Math.random() - 0.5) * 0.2;
      g.add(p);
    }
    // tilted laptop crashed
    const laptop = mesh(new T.BoxGeometry(0.4, 0.025, 0.28), M.steelDark);
    laptop.position.set(0.05, 0.2, -0.2);
    laptop.rotation.z = -0.3;
    g.add(laptop);
    const screen = mesh(new T.BoxGeometry(0.4, 0.25, 0.025), M.accentRed);
    screen.position.set(0.18, 0.32, -0.2);
    screen.rotation.z = -0.3;
    g.add(screen);
    return g;
  }

  function briefingCard() {
    const g = group('briefing');
    // clipboard
    const board = mesh(new T.BoxGeometry(0.5, 0.04, 0.7), M.steelDark);
    board.position.y = 0.02;
    g.add(board);
    const paper = mesh(new T.BoxGeometry(0.42, 0.012, 0.6), M.turbineWhite);
    paper.position.y = 0.045;
    g.add(paper);
    // clip
    const clip = mesh(new T.BoxGeometry(0.16, 0.04, 0.06), M.steel);
    clip.position.set(0, 0.07, -0.3);
    g.add(clip);
    // a couple of lines on paper
    for (let i = 0; i < 4; i++) {
      const ln = mesh(new T.BoxGeometry(0.32, 0.002, 0.018), M.steelDark);
      ln.position.set(-0.02, 0.052, -0.18 + i * 0.1);
      g.add(ln);
    }
    return g;
  }

  // ---------------------------------------------------------------- corner pieces
  function cornerStart() {
    const g = group('start');
    // arrow plate
    const plate = mesh(new T.CylinderGeometry(0.85, 0.85, 0.08, 32), M.accentGreen);
    plate.position.y = 0.04;
    g.add(plate);
    // big arrow (chevron)
    const arrow = group('arrow');
    const head = mesh(new T.ConeGeometry(0.4, 0.5, 4), M.turbineWhite);
    head.rotation.y = Math.PI / 4;
    head.rotation.x = Math.PI / 2;
    head.position.y = 0.12;
    arrow.add(head);
    const tail = mesh(new T.BoxGeometry(0.35, 0.06, 0.5), M.turbineWhite);
    tail.position.set(0, 0.12, 0.3);
    arrow.add(tail);
    arrow.rotation.y = Math.PI;
    g.add(arrow);
    return g;
  }

  function cornerFreeze() {
    const g = group('freeze');
    // padlock body
    const body = mesh(new T.BoxGeometry(0.6, 0.5, 0.3), M.accentBlue);
    body.position.y = 0.35;
    g.add(body);
    // shackle (torus half)
    const shackle = mesh(new T.TorusGeometry(0.2, 0.06, 8, 16, Math.PI), M.steel);
    shackle.rotation.x = Math.PI / 2;
    shackle.position.y = 0.6;
    g.add(shackle);
    // ice base
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const shard = mesh(new T.ConeGeometry(0.08, 0.18, 5), M.accentBlue);
      shard.position.set(Math.cos(ang) * 0.4, 0.09, Math.sin(ang) * 0.4);
      shard.rotation.x = (Math.random() - 0.5) * 0.3;
      shard.rotation.z = (Math.random() - 0.5) * 0.3;
      g.add(shard);
    }
    return g;
  }

  function cornerContingency() {
    const g = group('contingency');
    // vault disc + question mark
    const disc = mesh(new T.CylinderGeometry(0.7, 0.7, 0.1, 24), M.gold);
    disc.position.y = 0.05;
    g.add(disc);
    // big question mark as 3 boxes (vertical bar + dot + curve approximation)
    const stem = mesh(new T.BoxGeometry(0.12, 0.45, 0.12), M.steelDark);
    stem.position.set(0, 0.35, 0);
    g.add(stem);
    const top = mesh(new T.TorusGeometry(0.18, 0.06, 6, 14, Math.PI), M.steelDark);
    top.position.set(0, 0.62, 0);
    top.rotation.x = -Math.PI / 2;
    top.rotation.y = Math.PI / 2;
    g.add(top);
    const dot = mesh(new T.BoxGeometry(0.12, 0.12, 0.12), M.steelDark);
    dot.position.set(0, 0.08, 0);
    g.add(dot);
    return g;
  }

  function cornerGoFreeze() {
    const g = group('go-freeze');
    // warning triangle + small padlock
    const tri = mesh(new T.ConeGeometry(0.55, 0.1, 3), M.accentRed);
    tri.position.y = 0.05;
    g.add(tri);
    // arrow pointing to freeze
    const head = mesh(new T.ConeGeometry(0.18, 0.3, 4), M.turbineWhite);
    head.rotation.y = Math.PI / 4;
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 0.22, 0.05);
    g.add(head);
    const tail = mesh(new T.BoxGeometry(0.14, 0.05, 0.3), M.turbineWhite);
    tail.position.set(0, 0.22, 0.3);
    g.add(tail);
    return g;
  }

  // ============================================================================
  // Dispatch
  // ============================================================================
  function buildTileTop(tile) {
    if (tile.type === 'corner-start')        return cornerStart();
    if (tile.type === 'corner-freeze')       return cornerFreeze();
    if (tile.type === 'corner-contingency')  return cornerContingency();
    if (tile.type === 'corner-go-freeze')    return cornerGoFreeze();
    if (tile.type === 'fuel')                return fuelStation();
    if (tile.type === 'automation')          return automationHub();
    if (tile.type === 'manual')              return manualWork();
    if (tile.type === 'briefing')            return briefingCard();
    // projects by archetype
    if (tile.archetype === 'palm-cluster')    return palmCluster();
    if (tile.archetype === 'palm-single')     return palmSingle();
    if (tile.archetype === 'archipelago')     return archipelago();
    if (tile.archetype === 'island-resort')   return islandResort();
    if (tile.archetype === 'wind-farm-1')     return windFarm(1);
    if (tile.archetype === 'wind-farm-2')     return windFarm(2);
    if (tile.archetype === 'wind-farm-3')     return windFarm(3);
    if (tile.archetype === 'container-port')  return containerPort();
    if (tile.archetype === 'port-crane')      return portCrane();
    if (tile.archetype === 'storm-barrier')   return stormBarrier();
    if (tile.archetype === 'rock-armor')      return rockArmor();
    if (tile.archetype === 'lighthouse')      return lighthouse();
    if (tile.archetype === 'canal-ship')      return canalShip();
    if (tile.archetype === 'tropical-island') return tropicalIsland();
    return group('empty');
  }

  window.TileMeshes = { buildTileTop, materials: M };
})();

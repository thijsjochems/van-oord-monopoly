// ============================================================================
// 3D board — Three.js scene, tile layout, pawn placement, animation loop.
// Public API exposed as window.Board3D.
// ============================================================================

(function () {
  const T = THREE;

  // ----- dimensions (units) -----
  const CORNER = 4.5;
  const TILE_W = 3.0;   // along the edge
  const TILE_D = 4.5;   // radial (into board)
  const TILE_H = 0.4;
  const BAND_H = 0.05;
  const HALF = CORNER / 2 + 9 * TILE_W / 2 + CORNER / 2; // half side
  // = 4.5/2 + 13.5 + 4.5/2 = 18.0
  const BOARD_HALF = HALF; // 18

  // ============================================================================
  // Geometry / position helper
  // ============================================================================
  function tileTransform(idx) {
    // Returns { x, z, w, d, rotY, side, isCorner }
    const t = window.TILES[idx];
    const isCorner = (idx % 10) === 0;
    let side; // 0=bottom 1=left 2=top 3=right
    let along; // position along the side, 0=first non-corner, 8=last
    let x, z, rotY;
    if (idx === 0)        { side = 0; }
    else if (idx <= 9)    { side = 0; along = idx - 1; }
    else if (idx === 10)  { side = 1; }
    else if (idx <= 19)   { side = 1; along = idx - 11; }
    else if (idx === 20)  { side = 2; }
    else if (idx <= 29)   { side = 2; along = idx - 21; }
    else if (idx === 30)  { side = 3; }
    else                  { side = 3; along = idx - 31; }

    // corner positions (centers) — corner tiles are axis-aligned, not rotated 45°
    const cornerCenter = BOARD_HALF - CORNER / 2; // = 15.75
    if (isCorner) {
      if (idx === 0)  { x =  cornerCenter; z =  cornerCenter; }
      if (idx === 10) { x = -cornerCenter; z =  cornerCenter; }
      if (idx === 20) { x = -cornerCenter; z = -cornerCenter; }
      if (idx === 30) { x =  cornerCenter; z = -cornerCenter; }
      rotY = 0;
      return { x, y: 0, z, w: CORNER, d: CORNER, rotY, side: -1, isCorner: true };
    }

    // side-tile center along the edge: corner is at ±15.75, first side tile is offset by CORNER/2 + TILE_W/2
    const firstAlong = BOARD_HALF - CORNER - TILE_W / 2; // 18 - 4.5 - 1.5 = 12.0
    const alongPos = firstAlong - along * TILE_W; // for player going from corner toward next corner
    const radial = BOARD_HALF - TILE_D / 2;        // 18 - 2.25 = 15.75

    // side 0 (bottom): x = alongPos goes from +12 to -12, z = +15.75, rotY = 0
    if (side === 0) { x = alongPos;   z =  radial;  rotY = 0; }
    if (side === 1) { x = -radial;    z = alongPos; rotY = -Math.PI / 2; }
    if (side === 2) { x = -alongPos;  z = -radial;  rotY = Math.PI; }
    if (side === 3) { x =  radial;    z = -alongPos; rotY =  Math.PI / 2; }

    return { x, y: 0, z, w: TILE_W, d: TILE_D, rotY, side, isCorner: false };
  }

  // Five-spot pattern (dice-face 5) for non-corner tiles. Slot 0 sits dead-centre,
  // slots 1-4 form a tight square around it. All slots stay well inside the
  // tile bounds (tile is 3.0 wide × 4.5 deep, edges at ±1.5 / ±2.25).
  const SLOT_PATTERN_SIDE = [
    { x:  0.0, z:  0.5 },  // 0: centre (slightly toward outer edge for label visibility)
    { x: -0.7, z: -0.1 },  // 1: NW
    { x:  0.7, z: -0.1 },  // 2: NE
    { x: -0.7, z:  1.1 },  // 3: SW
    { x:  0.7, z:  1.1 },  // 4: SE
  ];

  function getPawnSpot(idx, pawnIndex, teams) {
    // Returns world-space position for a pawn on this tile.
    //
    // Slot assignment is dynamic: the first pawn that sits on a tile (by team
    // index) takes the centre slot; siblings cluster around. Pawn alone on a
    // tile → slot 0 → centred. This matches the "physical board" feel the user
    // asked for, instead of every team always sitting in a fixed lane.
    const tf = tileTransform(idx);
    const totalPawns = Array.isArray(teams) ? teams.length : teams;

    // Find which teams currently occupy this tile, sorted by team index. Always
    // include the moving pawn so its slot is stable across the hop animation.
    let slotIndex = pawnIndex;
    let occupantCount = totalPawns;
    if (Array.isArray(teams)) {
      const occupants = [];
      for (let i = 0; i < teams.length; i++) {
        if (i === pawnIndex || teams[i].position === idx) occupants.push(i);
      }
      occupants.sort((a, b) => a - b);
      slotIndex = Math.max(0, occupants.indexOf(pawnIndex));
      occupantCount = occupants.length;
    }

    // Deterministic pseudo-random jitter (stable across re-renders).
    const seedX = Math.sin(pawnIndex * 17.3 + idx * 41.7) * 43758.5453;
    const seedZ = Math.sin(pawnIndex * 29.1 + idx * 11.3) * 43758.5453;
    const seedR = Math.sin(pawnIndex * 7.9  + idx * 5.5)  * 43758.5453;
    const jx = ((seedX - Math.floor(seedX)) - 0.5) * 0.20;
    const jz = ((seedZ - Math.floor(seedZ)) - 0.5) * 0.20;
    const jr = ((seedR - Math.floor(seedR)) - 0.5) * 0.5;

    let localX, localZ;
    if (tf.isCorner) {
      // Corner: slot 0 centred, others on a ring around the centre.
      if (slotIndex === 0) {
        localX = jx * 0.4;
        localZ = jz * 0.4;
      } else {
        const ringSpots = Math.max(1, occupantCount - 1);
        const ang = ((slotIndex - 1) / ringSpots) * Math.PI * 2 + 0.3;
        const r = 1.1;
        localX = Math.cos(ang) * r + jx * 0.3;
        localZ = Math.sin(ang) * r + jz * 0.3;
      }
    } else {
      // Side tile: dice-5 pattern, all slots within tile bounds.
      const slot = SLOT_PATTERN_SIDE[slotIndex % SLOT_PATTERN_SIDE.length];
      localX = slot.x + jx;
      localZ = slot.z + jz;
    }

    // rotate local to world
    const cos = Math.cos(tf.rotY), sin = Math.sin(tf.rotY);
    const wx = tf.x + localX * cos + localZ * sin;
    const wz = tf.z + (-localX * sin + localZ * cos);
    return { x: wx, y: TILE_H + 0.02, z: wz, rotY: tf.rotY + jr };
  }

  // ============================================================================
  // Canvas label texture
  // ============================================================================
  function makeLabelTexture(text, regionColor, textColor, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = regionColor || '#0E1A22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // top + bottom rules
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, 0, canvas.width, 6);
    ctx.fillRect(0, canvas.height - 6, canvas.width, 6);

    if (options.placeholder) {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('🚧', 24, 42);
    }
    if (options.eyebrow) {
      ctx.fillStyle = textColor;
      ctx.font = '600 22px "Archivo", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(options.eyebrow.toUpperCase(), 24, 42);
    }

    // ---- project name (auto-fit so long labels don't overflow) ----
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Tighter horizontal margin: previous 60px wasn't enough for long single
    // words like Oosterscheldekering once they got mapped onto the slightly-
    // narrower-than-canvas tile plane. 110px reads with comfortable margin.
    const maxW = canvas.width - 110;
    // Vertical space available for the name (leave room for stars/eyebrow at top, subtitle at bottom).
    const reservedTop    = (options.stars || options.placeholder || options.eyebrow) ? 60 : 30;
    const reservedBottom = options.subtitle ? 80 : 30;
    const maxH = canvas.height - reservedTop - reservedBottom;

    function wrapAt(size) {
      ctx.font = `bold ${size}px "Archivo", sans-serif`;
      const words = (text || '').split(' ');
      const out = [];
      let cur = '';
      for (const w of words) {
        const trial = cur ? cur + ' ' + w : w;
        if (ctx.measureText(trial).width > maxW && cur) {
          out.push(cur);
          cur = w;
        } else {
          cur = trial;
        }
      }
      if (cur) out.push(cur);
      return out;
    }

    // Step font size down until both width AND height fit. Drop floor from 30
    // to 22 so 19-letter single-word labels (Oosterscheldekering) survive.
    let size = 62;
    let lines = wrapAt(size);
    let lh = size * 1.05;
    while (size > 22) {
      const tooWide = lines.some((ln) => ctx.measureText(ln).width > maxW);
      const tooTall = lines.length * lh > maxH;
      if (!tooWide && !tooTall) break;
      size -= 4;
      lines = wrapAt(size);
      lh = size * 1.05;
    }
    ctx.font = `bold ${size}px "Archivo", sans-serif`;

    const nameCenterY = options.subtitle ? (canvas.height * 0.42) : (canvas.height / 2 + 16);
    const startY = nameCenterY - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => ctx.fillText(ln.toUpperCase(), canvas.width / 2, startY + i * lh));

    // ---- subtitle (country) — smaller, under the name ----
    if (options.subtitle) {
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.75;
      ctx.font = '600 24px "Archivo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(options.subtitle.toUpperCase(), canvas.width / 2, canvas.height - 38);
      // hairline above subtitle
      ctx.globalAlpha = 0.35;
      ctx.fillRect(canvas.width / 2 - 70, canvas.height - 62, 140, 1.5);
      ctx.globalAlpha = 1;
    }

    const tex = new T.CanvasTexture(canvas);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  // Wide canvas so corner labels ("Budget Freeze", "Free Parking", "Go to Freeze")
  // fit comfortably along the diagonal of the corner tile without clipping.
  function makeBigLabel(text, sub /*, color (legacy, ignored) */) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1A2530';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Auto-shrink the main text so it fits the canvas width (no more clipping
    // on long labels). Starts large, steps down to a readable minimum.
    const maxW = canvas.width - 80;
    let mainSize = 120;
    while (mainSize > 56) {
      ctx.font = `bold ${mainSize}px "Archivo", sans-serif`;
      if (ctx.measureText((text || '').toUpperCase()).width <= maxW) break;
      mainSize -= 6;
    }
    ctx.font = `bold ${mainSize}px "Archivo", sans-serif`;
    ctx.fillText((text || '').toUpperCase(), canvas.width / 2, sub ? 170 : canvas.height / 2);

    if (sub) {
      ctx.font = '600 38px "Archivo", sans-serif';
      ctx.fillStyle = 'rgba(26,37,48,0.65)';
      ctx.fillText(sub.toUpperCase(), canvas.width / 2, 280);
    }
    const tex = new T.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }

  // ============================================================================
  // Build a single tile
  // ============================================================================
  function buildTile(idx) {
    const tile = window.TILES[idx];
    const tf = tileTransform(idx);
    const root = new T.Group();
    root.position.set(tf.x, 0, tf.z);
    root.rotation.y = tf.rotY;
    root.userData.tile = tile;
    root.userData.idx = idx;

    // ---- base plate
    const baseMat = new T.MeshStandardMaterial({ color: 0xF1ECE2, roughness: 0.85 });
    const base = new T.Mesh(new T.BoxGeometry(tf.w, TILE_H, tf.d), baseMat);
    base.position.y = TILE_H / 2;
    base.castShadow = false;
    base.receiveShadow = true;
    root.add(base);

    // ---- region color band (only for project tiles)
    if (tile.type === 'project') {
      const group = window.GROUPS[tile.group];
      const bandMat = new T.MeshStandardMaterial({ color: group.color, roughness: 0.55 });
      // wider, slightly taller band
      const band = new T.Mesh(new T.BoxGeometry(tf.w, BAND_H * 1.6, 1.5), bandMat);
      band.position.set(0, TILE_H + BAND_H * 0.8, tf.d / 2 - 0.75);
      band.receiveShadow = true;
      root.add(band);
      // label plane — name + small country subtitle below.
      // Per-tile `country` overrides the group default, so e.g. Millport can
      // show "Scotland" instead of the group's "United Kingdom".
      const tex = makeLabelTexture(tile.name, group.color, group.text || '#0E1A22', {
        placeholder: tile.placeholder,
        subtitle: tile.country || group.countries,
      });
      const labelMat = new T.MeshBasicMaterial({ map: tex, transparent: false });
      const label = new T.Mesh(new T.PlaneGeometry(tf.w - 0.1, 1.65), labelMat);
      label.rotation.x = -Math.PI / 2;
      label.position.set(0, TILE_H + BAND_H * 1.62, tf.d / 2 - 0.75);
      root.add(label);
    } else if (tile.type === 'fuel') {
      const tex = makeLabelTexture('Fuel Station', '#1A2530', '#FFB78A', { eyebrow: '−2 tokens' });
      const lm = new T.MeshBasicMaterial({ map: tex });
      const lbl = new T.Mesh(new T.PlaneGeometry(tf.w - 0.1, 1.45), lm);
      lbl.rotation.x = -Math.PI / 2;
      lbl.position.set(0, TILE_H + 0.005, tf.d / 2 - 0.65);
      root.add(lbl);
    } else if (tile.type === 'manual') {
      const tex = makeLabelTexture('Manual Work', '#2A1A22', '#FF9AB0', { eyebrow: '−3 tokens' });
      const lm = new T.MeshBasicMaterial({ map: tex });
      const lbl = new T.Mesh(new T.PlaneGeometry(tf.w - 0.1, 1.45), lm);
      lbl.rotation.x = -Math.PI / 2;
      lbl.position.set(0, TILE_H + 0.005, tf.d / 2 - 0.65);
      root.add(lbl);
    } else if (tile.type === 'automation') {
      const tex = makeLabelTexture('Automation Hub', '#0E2A1E', '#9FF0C5', { eyebrow: 'Buy upgrade' });
      const lm = new T.MeshBasicMaterial({ map: tex });
      const lbl = new T.Mesh(new T.PlaneGeometry(tf.w - 0.1, 1.45), lm);
      lbl.rotation.x = -Math.PI / 2;
      lbl.position.set(0, TILE_H + 0.005, tf.d / 2 - 0.65);
      root.add(lbl);
    } else if (tile.type === 'briefing') {
      const tex = makeLabelTexture('Briefing', '#1B2030', '#B7C2E0', { eyebrow: 'Draw a card' });
      const lm = new T.MeshBasicMaterial({ map: tex });
      const lbl = new T.Mesh(new T.PlaneGeometry(tf.w - 0.1, 1.45), lm);
      lbl.rotation.x = -Math.PI / 2;
      lbl.position.set(0, TILE_H + 0.005, tf.d / 2 - 0.65);
      root.add(lbl);
    } else if (tile.type && tile.type.indexOf('corner-') === 0) {
      // Corner labels: wide-thin plane laid flat, rotated 45° around the tile's
      // vertical axis so the text reads along the corner's diagonal. Diagonal
      // gives ~6.4u of length to use within the 4.5u corner tile vs ~3.5u for
      // axis-aligned. That space is what stops "Budget Freeze" from clipping.
      const cornerCopy = {
        'corner-start':       { main: 'GO',           sub: '+2 tokens'        },
        'corner-freeze':      { main: 'Budget Freeze', sub: 'skip 1 turn'     },
        'corner-contingency': { main: 'Free Parking',  sub: 'collect the pot' },
        'corner-go-freeze':   { main: 'Go to Freeze',  sub: 'go directly'     },
      }[tile.type];
      // Mirror sign per corner so the diagonal points outward consistently.
      const diagSign = (idx === 0 || idx === 20) ? -1 : +1;
      const tex = makeBigLabel(cornerCopy.main, cornerCopy.sub);
      const lm = new T.MeshBasicMaterial({ map: tex, transparent: true });
      const lbl = new T.Mesh(new T.PlaneGeometry(4.6, 1.7), lm);
      lbl.rotation.x = -Math.PI / 2;
      lbl.rotation.z = diagSign * Math.PI / 4;
      lbl.position.set(0, TILE_H + 0.005, 0);
      root.add(lbl);
    }

    // ---- diorama on top
    const top = window.TileMeshes.buildTileTop(tile);
    top.position.set(0, TILE_H, -tf.d / 2 + (tf.isCorner ? 0 : (tf.d - 1.5) / 2 + 0.7));
    // for non-corner tiles place diorama in inner portion of tile, centered, away from label
    if (!tf.isCorner) {
      top.position.set(0, TILE_H, -0.55);
    } else {
      top.position.set(0, TILE_H, 0);
    }
    // scale corner pieces up a bit since they have more space
    if (tf.isCorner) top.scale.setScalar(0.9);
    root.add(top);

    return root;
  }

  // ============================================================================
  // Main board class
  // ============================================================================
  class Board {
    constructor(container) {
      this.container = container;
      this.tiles = [];
      this.pawns = new Map();
      this.tickFns = [];
      this.movingPawns = [];
      this.diceSpeedMultiplier = 1.0;

      this._initScene();
      this._buildBoard();
      this._handleResize();
      this._initOrbit();
      this._startLoop();
    }

    _initScene() {
      const scene = new T.Scene();
      scene.background = new T.Color(0x050B14);
      scene.fog = new T.Fog(0x050B14, 60, 130);
      this.scene = scene;

      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      const cam = new T.PerspectiveCamera(38, w / h, 0.1, 250);
      this.target = new T.Vector3(0, -2, 0);
      this.spherical = { radius: 60, theta: 0, phi: 0.95 }; // phi: 0=horizontal, PI/2=top-down
      this.minRadius = 22;
      this.maxRadius = 130;
      this.minPhi = 0.18;
      this.maxPhi = 1.40;
      this._applySpherical(cam);
      this.camera = cam;

      const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      this.container.appendChild(renderer.domElement);
      this.renderer = renderer;

      // ---- lights
      const hemi = new T.HemisphereLight(0x6FB0D0, 0x1A2530, 0.45);
      scene.add(hemi);
      const sun = new T.DirectionalLight(0xFFE7C2, 1.05);
      sun.position.set(22, 38, 18);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -36;
      sun.shadow.camera.right = 36;
      sun.shadow.camera.top = 36;
      sun.shadow.camera.bottom = -36;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 120;
      sun.shadow.bias = -0.0005;
      scene.add(sun);
      // rim accent
      const rim = new T.DirectionalLight(0x4DD0E1, 0.4);
      rim.position.set(-22, 12, -18);
      scene.add(rim);

      // ---- water plane underneath (ocean halo around board)
      const water = new T.Mesh(
        new T.PlaneGeometry(140, 140),
        // Lifted from #09202E → #1B4E6A so the water reads as a clearly lit
        // ocean halo around the board. The board frame + inner panel stay
        // dark, giving a "dark island floating on lighter water" hierarchy.
        new T.MeshStandardMaterial({ color: 0x1B4E6A, roughness: 0.55, metalness: 0.4 }),
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = -0.25;
      water.receiveShadow = true;
      scene.add(water);

      // ---- board frame (slightly bigger than tile array, with subtle border)
      const boardSize = BOARD_HALF * 2 + 0.4;
      const frame = new T.Mesh(
        new T.BoxGeometry(boardSize, 0.3, boardSize),
        new T.MeshStandardMaterial({ color: 0x0C1B26, roughness: 0.9 }),
      );
      frame.position.y = 0.1;
      frame.receiveShadow = true;
      scene.add(frame);

      // center plate (inside the tile ring) with subtle Van Oord wordmark
      const innerSize = (BOARD_HALF - TILE_D) * 2; // 27
      const inner = new T.Mesh(
        new T.PlaneGeometry(innerSize, innerSize),
        new T.MeshStandardMaterial({ color: 0x0F2230, roughness: 0.7 }),
      );
      inner.rotation.x = -Math.PI / 2;
      inner.position.y = TILE_H + 0.001;
      inner.receiveShadow = true;
      scene.add(inner);

      // ---- Van Oord logo banner (real SVG from vanoord.com, not a custom wordmark) ----
      // The SVG is loaded async; we redraw the canvas + flag the texture once the
      // image is ready. Until then the banner shows just the tagline.
      const logoCanvas = document.createElement('canvas');
      logoCanvas.width = 1024;
      logoCanvas.height = 320;
      const lc = logoCanvas.getContext('2d');
      const logoTex = new T.CanvasTexture(logoCanvas);
      logoTex.anisotropy = 8;

      function drawVoBanner(voImg) {
        lc.clearRect(0, 0, 1024, 320);
        lc.textAlign = 'center';
        lc.textBaseline = 'middle';
        if (voImg) {
          // Real VO logo is 240x80 (3:1). Scale to fit the upper half of the canvas.
          const h = 150;
          const w = h * (240 / 80); // = 450
          lc.drawImage(voImg, (1024 - w) / 2, 20, w, h);
        }
        // yellow rule + tagline below the logo
        lc.fillStyle = '#FFCD00';
        lc.fillRect(200, 200, 624, 6);
        lc.font = '900 56px "Archivo", sans-serif';
        lc.fillStyle = '#FFCD00';
        lc.fillText('AUTOMATE  ·  OR SINK', 512, 252);
        logoTex.needsUpdate = true;
      }
      drawVoBanner(null); // initial render with tagline only
      const voImg = new Image();
      voImg.onload = () => drawVoBanner(voImg);
      voImg.src = 'logos/van-oord.svg';

      const banner = new T.Mesh(
        new T.PlaneGeometry(14, 4.4),
        new T.MeshBasicMaterial({ map: logoTex, transparent: true }),
      );
      banner.rotation.x = -Math.PI / 2;
      banner.position.set(0, TILE_H + 0.014, -6.0);
      scene.add(banner);
      const bannerB = banner.clone();
      bannerB.position.z = 6.0;
      bannerB.rotation.z = Math.PI;
      scene.add(bannerB);

      // ---- Subtle Another Dimension mark in two opposite corners of the inner panel ----
      const adCanvas = document.createElement('canvas');
      adCanvas.width = 256;
      adCanvas.height = 256;
      const adCtx = adCanvas.getContext('2d');
      const adTex = new T.CanvasTexture(adCanvas);
      adTex.anisotropy = 8;
      const adImg = new Image();
      adImg.onload = () => {
        adCtx.clearRect(0, 0, 256, 256);
        adCtx.drawImage(adImg, 0, 0, 256, 256);
        adTex.needsUpdate = true;
      };
      adImg.src = 'logos/another-dimension-mark.svg';

      const adMat = new T.MeshBasicMaterial({ map: adTex, transparent: true, opacity: 0.55 });
      // small mark in the corner of the inner panel where nothing else lives
      const adA = new T.Mesh(new T.PlaneGeometry(1.6, 1.6), adMat);
      adA.rotation.x = -Math.PI / 2;
      adA.position.set(-12, TILE_H + 0.013, -12);
      scene.add(adA);
      const adB = adA.clone();
      adB.position.set(12, TILE_H + 0.013, 12);
      scene.add(adB);

      // ---- Chance + Community Chest card stacks ----
      this._buildCardStacks(scene);
      // ---- Free Parking pot + delivery crane ----
      this._buildPot(scene);
    }

    _buildBoard() {
      for (let i = 0; i < window.TILES.length; i++) {
        const tile = buildTile(i);
        this.scene.add(tile);
        this.tiles.push(tile);
      }
    }

    // ----- center card stacks (Chance / Community Chest) -----
    _buildCardStacks(scene) {
      const T = THREE;
      function makeCardTexture(label, color) {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 384;
        const ctx = c.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 256, 384);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, 256, 6);
        ctx.fillRect(0, 378, 256, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 38px "Archivo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = label.split(' ');
        const lh = 44;
        const startY = 192 - ((lines.length - 1) * lh) / 2;
        lines.forEach((ln, i) => ctx.fillText(ln.toUpperCase(), 128, startY + i * lh));
        // icon mark
        ctx.font = 'bold 64px "Archivo", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText('?', 128, 90);
        return new T.CanvasTexture(c);
      }

      function buildStack(label, color, x, z, rotY) {
        const g = new T.Group();
        g.position.set(x, TILE_H + 0.02, z);
        g.rotation.y = rotY;
        // card stack: ~10 thin layered boxes
        const cardW = 3.0, cardD = 2.0, cardH = 0.06;
        for (let i = 0; i < 10; i++) {
          const m = new T.Mesh(
            new T.BoxGeometry(cardW, cardH, cardD),
            new T.MeshStandardMaterial({ color, roughness: 0.7 }),
          );
          m.position.y = cardH / 2 + i * cardH * 0.98;
          // slight rotation jitter for stacked-card look
          m.rotation.y = (Math.sin(i * 7.3) * 0.04);
          m.castShadow = true;
          m.receiveShadow = true;
          g.add(m);
        }
        // top card with label
        const topTex = makeCardTexture(label, color);
        topTex.anisotropy = 8;
        const top = new T.Mesh(
          new T.PlaneGeometry(cardW * 0.94, cardD * 0.94),
          new T.MeshBasicMaterial({ map: topTex }),
        );
        top.rotation.x = -Math.PI / 2;
        top.position.y = cardH * 10 + 0.01;
        g.add(top);
        return g;
      }

      // Chance: orange, top-right of inner panel
      const chance = buildStack('Chance', 0xE85D1A, 9, -9, -Math.PI / 5);
      scene.add(chance);
      // Community Chest: warm yellow, bottom-left of inner panel
      const cc = buildStack('Community Chest', 0xC79A1F, -9, 9, Math.PI / 5);
      scene.add(cc);
    }

    // ----- Free Parking pot (center) -----
    _buildPot(scene) {
      const T = THREE;
      const pot = new T.Group();
      pot.position.set(0, TILE_H + 0.04, 0);

      // base pedestal disc
      const pedestal = new T.Mesh(
        new T.CylinderGeometry(1.4, 1.6, 0.18, 24),
        new T.MeshStandardMaterial({ color: 0x1A2A36, roughness: 0.6, metalness: 0.4 }),
      );
      pedestal.position.y = 0.09;
      pedestal.receiveShadow = true;
      pot.add(pedestal);
      // gold ring inset
      const ring = new T.Mesh(
        new T.TorusGeometry(1.2, 0.04, 6, 28),
        new T.MeshStandardMaterial({ color: 0xFFCD00, emissive: 0xFFCD00, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.7 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.18;
      pot.add(ring);

      // coin container
      const coins = new T.Group();
      coins.position.y = 0.18;
      pot.add(coins);
      pot.userData.coinsGroup = coins;
      pot.userData.coinCount = 0;

      // value label texture
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 512;
      labelCanvas.height = 128;
      const ctx = labelCanvas.getContext('2d');
      const labelTex = new T.CanvasTexture(labelCanvas);
      labelTex.anisotropy = 8;
      const labelMesh = new T.Mesh(
        new T.PlaneGeometry(2.4, 0.6),
        new T.MeshBasicMaterial({ map: labelTex, transparent: true }),
      );
      labelMesh.rotation.x = -Math.PI / 2;
      labelMesh.position.y = 0.2;
      labelMesh.position.z = 0.001;
      pot.add(labelMesh);
      pot.userData.labelCtx = ctx;
      pot.userData.labelTex = labelTex;
      pot.userData.labelCanvas = labelCanvas;

      // ---- Sky grabber: clamshell on a cable that descends from above to drop coins ----
      const skyAnchor  = 8;    // grabber's rest height (high above the pot, pot-local Y)
      const dropAnchor = 0.7;  // grabber's lowered height (just above the coin pile)
      const cableTop   = 14;   // top anchor of the cable, well above the camera
      const steelMat = new T.MeshStandardMaterial({ color: 0xC2CCD4, metalness: 0.9, roughness: 0.25 });
      const cableMat = new T.MeshStandardMaterial({ color: 0x1B2229, roughness: 0.85 });
      const jawMat   = new T.MeshStandardMaterial({ color: 0xFFCD00, metalness: 0.6, roughness: 0.4 });

      // Cable: thin cylinder spanning from cableTop down to the grabber. Length is
      // controlled per-frame via scale.y (CylinderGeometry length 1 → scale.y = length).
      const cable = new T.Mesh(
        new T.CylinderGeometry(0.025, 0.025, 1, 6),
        cableMat,
      );
      const restCableLen = cableTop - skyAnchor;
      cable.scale.y = restCableLen;
      cable.position.y = (cableTop + skyAnchor) / 2;
      pot.add(cable);

      // Grabber assembly hanging at the bottom of the cable.
      const grabber = new T.Group();
      grabber.position.y = skyAnchor;
      pot.add(grabber);

      // Hook block / pulley at the top of the grabber
      const block = new T.Mesh(new T.BoxGeometry(0.24, 0.14, 0.24), steelMat);
      block.position.y = 0.07;
      block.castShadow = true;
      grabber.add(block);

      // Two clamshell jaws — pivot at the block, swing outward to "open"
      const leftJaw  = new T.Group();
      const rightJaw = new T.Group();
      leftJaw.position.set(-0.05, 0, 0);
      rightJaw.position.set( 0.05, 0, 0);
      grabber.add(leftJaw);
      grabber.add(rightJaw);
      function buildJaw(side) {
        const g = new T.Group();
        // tapered shell
        const shell = new T.Mesh(new T.BoxGeometry(0.18, 0.30, 0.26), jawMat);
        shell.position.set(side * 0.09, -0.16, 0);
        shell.castShadow = true;
        g.add(shell);
        // teeth strip at the bottom edge
        const teeth = new T.Mesh(new T.BoxGeometry(0.18, 0.05, 0.26), steelMat);
        teeth.position.set(side * 0.09, -0.33, 0);
        g.add(teeth);
        return g;
      }
      leftJaw.add(buildJaw(-1));
      rightJaw.add(buildJaw( 1));

      pot.userData.grabber = { root: grabber, cable, leftJaw, rightJaw, skyAnchor, dropAnchor, cableTop };

      this.pot = pot;
      scene.add(pot);
      this._renderPotLabel(0);
    }

    _renderPotLabel(value) {
      if (!this.pot) return;
      const ctx = this.pot.userData.labelCtx;
      const canvas = this.pot.userData.labelCanvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('FREE PARKING POT', canvas.width / 2, 30);
      ctx.fillStyle = value > 0 ? '#FFCD00' : 'rgba(255,255,255,0.45)';
      ctx.font = 'bold 70px "Archivo", sans-serif';
      ctx.fillText(value > 0 ? String(value) : '—', canvas.width / 2, 86);
      this.pot.userData.labelTex.needsUpdate = true;
    }

    setPotValue(value, animateDelta = 0) {
      if (!this.pot) return;
      this._renderPotLabel(value);
      const coins = this.pot.userData.coinsGroup;
      const target = Math.min(20, value);
      const T = THREE;
      // remove excess (pot was collected)
      while (coins.children.length > target) {
        const last = coins.children[coins.children.length - 1];
        coins.remove(last);
      }
      // add new coins — delivered one at a time by the crane
      while (coins.children.length < target) {
        const idx = coins.children.length;
        const coin = new T.Mesh(
          new T.CylinderGeometry(0.18, 0.18, 0.05, 14),
          new T.MeshStandardMaterial({ color: 0xFFCD00, metalness: 0.85, roughness: 0.3, emissive: 0x7A6800, emissiveIntensity: 0.3 }),
        );
        const angle = idx * 0.6;
        const radius = 0.1 + (idx % 6) * 0.08;
        const finalY = idx * 0.04 + 0.02;
        coin.position.set(Math.cos(angle) * radius, finalY, Math.sin(angle) * radius);
        coin.rotation.y = Math.random() * Math.PI;
        coin.rotation.z = (Math.random() - 0.5) * 0.2;
        coin.castShadow = true;
        coin.userData._final = { x: coin.position.x, y: finalY, z: coin.position.z };
        coins.add(coin);
        if (animateDelta > 0) {
          this._animateCraneDrop(coin);
        }
      }
    }

    // Coins can arrive in bursts (e.g. fuel −2, manual −3). Drops are batched —
    // one descent of the grabber releases the entire current cluster.
    _animateCraneDrop(coin) {
      this._dropQueue = this._dropQueue || [];
      this._dropQueue.push(coin);
      if (this._dropping || this._dropPending) return;
      this._dropPending = true;
      // Tiny delay coalesces coins added in the same JS tick into one batch.
      setTimeout(() => {
        this._dropPending = false;
        if (!this._dropping) this._processNextDropBatch();
      }, 40);
    }

    _processNextDropBatch() {
      const batch = this._dropQueue || [];
      this._dropQueue = [];
      if (!batch.length) { this._dropping = false; return; }
      this._dropping = true;
      this._runDropAnimation(batch, () => {
        this._dropping = false;
        if (this._dropQueue && this._dropQueue.length) {
          // more coins arrived during the previous animation — schedule the next batch
          this._dropPending = true;
          setTimeout(() => {
            this._dropPending = false;
            if (!this._dropping) this._processNextDropBatch();
          }, 40);
        }
      });
    }

    _runDropAnimation(coins, done) {
      const G = this.pot && this.pot.userData.grabber;
      if (!G) {
        coins.forEach((c) => {
          const f = c.userData._final;
          c.position.set(f.x, f.y, f.z);
        });
        if (done) done();
        return;
      }
      const { skyAnchor, dropAnchor, cableTop, root: grabber, cable, leftJaw, rightJaw } = G;
      const COINS_LOCAL_Y = 0.18;
      const HOLD_OFFSET   = 0.22;
      const STAGGER_MS    = 110; // delay between sequential coin releases within a batch

      // phase durations (ms) — collectively ~2.0–2.5s for a typical 1–3 coin drop
      const T_DESCEND = 950;
      const T_OPEN    = 280;
      const T_HOLD    = 140;
      const T_FALL    = 600;
      const T_RETRACT = 650;

      const t1 = T_DESCEND;
      const t2 = t1 + T_OPEN;
      const t3 = t2 + T_HOLD + T_FALL + (coins.length - 1) * STAGGER_MS;
      const t4 = t3 + T_RETRACT;

      const setGrabberY = (y) => {
        grabber.position.y = y;
        const len = Math.max(0.05, cableTop - y);
        cable.scale.y = len;
        cable.position.y = (cableTop + y) / 2;
      };

      // initial state: grabber high, jaws closed, all coins invisible
      setGrabberY(skyAnchor);
      leftJaw.rotation.z  = 0;
      rightJaw.rotation.z = 0;
      coins.forEach((c) => { c.visible = false; });

      const start = performance.now();
      const step = () => {
        const t = performance.now() - start;

        if (t < t1) {
          // phase 1 — grabber descends
          const p = t / t1;
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          setGrabberY(skyAnchor + (dropAnchor - skyAnchor) * e);
        } else if (t < t2) {
          // phase 2 — jaws open, coins appear stacked just under the grabber
          const p = (t - t1) / T_OPEN;
          leftJaw.rotation.z  =  p * 0.85;
          rightJaw.rotation.z = -p * 0.85;
          coins.forEach((c, i) => {
            c.visible = true;
            c.position.set(0, dropAnchor - COINS_LOCAL_Y - HOLD_OFFSET - i * 0.06, 0);
          });
        } else if (t < t3) {
          // phase 3 — coins fall into the pot, lightly staggered
          coins.forEach((c, i) => {
            const releaseT = t2 + T_HOLD + i * STAGGER_MS;
            if (t < releaseT) return;
            const fall = Math.min(1, (t - releaseT) / T_FALL);
            const e = fall * fall; // gravity
            const startY = dropAnchor - COINS_LOCAL_Y - HOLD_OFFSET - i * 0.06;
            const f = c.userData._final;
            c.position.set(f.x * e, startY + (f.y - startY) * e, f.z * e);
          });
        } else if (t < t4) {
          // phase 4 — grabber retracts, jaws close
          coins.forEach((c) => {
            const f = c.userData._final;
            c.position.set(f.x, f.y, f.z);
          });
          const p = (t - t3) / T_RETRACT;
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          setGrabberY(dropAnchor + (skyAnchor - dropAnchor) * e);
          leftJaw.rotation.z  =  0.85 * (1 - p);
          rightJaw.rotation.z = -0.85 * (1 - p);
        } else {
          // settle
          coins.forEach((c) => {
            const f = c.userData._final;
            c.position.set(f.x, f.y, f.z);
          });
          setGrabberY(skyAnchor);
          leftJaw.rotation.z  = 0;
          rightJaw.rotation.z = 0;
          if (done) done();
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    collectPot(teamId, teams) {
      // animation: lift all coins into the pawn, then clear
      if (!this.pot) return;
      const pawn = this.pawns.get(teamId);
      if (!pawn) return;
      const coins = this.pot.userData.coinsGroup;
      const start = performance.now();
      const dur = 800;
      const startPositions = coins.children.map((c) => ({ x: c.position.x, y: c.position.y, z: c.position.z }));
      const targetX = pawn.position.x - this.pot.position.x;
      const targetZ = pawn.position.z - this.pot.position.z;
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / dur);
        const ease = t * t;
        coins.children.forEach((c, i) => {
          const sp = startPositions[i];
          c.position.x = sp.x + (targetX - sp.x) * ease;
          c.position.z = sp.z + (targetZ - sp.z) * ease;
          c.position.y = sp.y + Math.sin(t * Math.PI) * 1.4 + 0.5 * ease;
        });
        if (t < 1) requestAnimationFrame(step);
        else {
          // clear all coins
          while (coins.children.length) coins.remove(coins.children[0]);
          this._renderPotLabel(0);
        }
      };
      requestAnimationFrame(step);
    }

    setPawns(teams) {
      // clear previous pawns AND tile-frame markers
      for (const [, p] of this.pawns) this.scene.remove(p);
      this.pawns.clear();
      if (this.tileMarkers) {
        for (const [, m] of this.tileMarkers) this.scene.remove(m);
      }
      this.tileMarkers = new Map();

      teams.forEach((team, i) => {
        const pawn = window.PawnMeshes.buildPawn(team.pawn, parseInt(team.color.slice(1), 16), parseInt(team.accent.slice(1), 16));
        pawn.userData.teamId = team.id;
        pawn.userData.teamIndex = i;
        pawn.scale.setScalar(0.65);
        const spot = getPawnSpot(team.position, i, teams);
        pawn.position.set(spot.x, spot.y, spot.z);
        pawn.rotation.y = spot.rotY;
        this.scene.add(pawn);
        this.pawns.set(team.id, pawn);

        // Tile-frame marker in team colour, sits on the tile to make pawn
        // location instantly readable across the board.
        const colorInt = parseInt(team.color.slice(1), 16);
        const marker = this._buildTileMarker(colorInt);
        this._snapMarkerToTile(marker, team.position);
        this.scene.add(marker);
        this.tileMarkers.set(team.id, marker);
      });
    }

    refreshPawnPositions(teams) {
      teams.forEach((team, i) => {
        const pawn = this.pawns.get(team.id);
        if (!pawn) return;
        const spot = getPawnSpot(team.position, i, teams);
        pawn.position.set(spot.x, spot.y, spot.z);
        pawn.rotation.y = spot.rotY;
        const marker = this.tileMarkers && this.tileMarkers.get(team.id);
        if (marker) this._snapMarkerToTile(marker, team.position);
      });
    }

    // ----- Tile-frame markers (per-team highlight of current tile) -----
    _buildTileMarker(colorInt) {
      const T = THREE;
      const mat = new T.MeshStandardMaterial({
        color: colorInt, emissive: colorInt, emissiveIntensity: 0.85,
        transparent: true, opacity: 0.95, roughness: 0.45,
      });
      const g = new T.Group();
      // Marker is sized for SIDE tiles by default; we scale at snap time for corners.
      const w = TILE_W * 0.96;
      const d = TILE_D * 0.96;
      const t = 0.08; // strip thickness
      const h = 0.05; // raised above tile
      // 4 thin strips forming an outline
      const top    = new T.Mesh(new T.BoxGeometry(w, h, t), mat);
      const bottom = new T.Mesh(new T.BoxGeometry(w, h, t), mat);
      top.position.set(0, 0,  d / 2 - t / 2);
      bottom.position.set(0, 0, -d / 2 + t / 2);
      const left  = new T.Mesh(new T.BoxGeometry(t, h, d - 2 * t), mat);
      const right = new T.Mesh(new T.BoxGeometry(t, h, d - 2 * t), mat);
      left.position.set(-w / 2 + t / 2, 0, 0);
      right.position.set( w / 2 - t / 2, 0, 0);
      g.add(top, bottom, left, right);
      g.userData.baseW = w;
      g.userData.baseD = d;
      return g;
    }

    _snapMarkerToTile(marker, idx) {
      const tf = tileTransform(idx);
      marker.position.set(tf.x, TILE_H + 0.04, tf.z);
      marker.rotation.y = tf.rotY;
      // Scale up for corner tiles (which are square and bigger than side tiles).
      const targetW = tf.isCorner ? CORNER * 0.96 : TILE_W * 0.96;
      const targetD = tf.isCorner ? CORNER * 0.96 : TILE_D * 0.96;
      marker.scale.x = targetW / marker.userData.baseW;
      marker.scale.z = targetD / marker.userData.baseD;
    }

    _pulseMarker(marker) {
      const start = performance.now();
      const dur = 650;
      const baseSx = marker.scale.x;
      const baseSz = marker.scale.z;
      const baseY  = marker.position.y;
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / dur);
        const grow = 1 + Math.sin(t * Math.PI) * 0.18;
        marker.scale.x = baseSx * grow;
        marker.scale.z = baseSz * grow;
        marker.position.y = baseY + Math.sin(t * Math.PI) * 0.06;
        if (t < 1) requestAnimationFrame(step);
        else {
          marker.scale.x = baseSx;
          marker.scale.z = baseSz;
          marker.position.y = baseY;
        }
      };
      requestAnimationFrame(step);
    }

    // Animate a pawn from its current tile to a target tile, hopping tile-by-tile.
    // Per-team serialization: if a previous call is still running, this one waits
    // for it to finish first. The optional `opts.fromIdx` lets the caller pin the
    // starting tile explicitly — necessary for remote-driven animations where
    // local.position has already been bumped to the target (so subsequent
    // snapshots don't re-trigger the diff and queue a duplicate animation).
    async movePawnTo(teamId, toIdx, teams, opts) {
      this._pawnAnim = this._pawnAnim || {};
      while (this._pawnAnim[teamId]) {
        try { await this._pawnAnim[teamId]; } catch (e) { /* swallow */ }
      }
      const pawn = this.pawns.get(teamId);
      if (!pawn) return;
      const team = teams.find((t) => t.id === teamId);
      const teamIndex = teams.findIndex((t) => t.id === teamId);
      if (!team) return;
      const fromIdx = (opts && opts.fromIdx != null) ? opts.fromIdx : team.position;
      if (fromIdx === toIdx) return;

      const run = (async () => {
        let cur = fromIdx;
        const total = window.TILES.length;
        while (cur !== toIdx) {
          cur = (cur + 1) % total;
          await this._hopPawn(pawn, cur, teamIndex, teams);
        }
      })();
      this._pawnAnim[teamId] = run;
      try {
        await run;
        // Snap the team's tile marker to the new tile and pulse it for visibility.
        const marker = this.tileMarkers && this.tileMarkers.get(teamId);
        if (marker) {
          this._snapMarkerToTile(marker, toIdx);
          this._pulseMarker(marker);
        }
      } finally {
        this._pawnAnim[teamId] = null;
      }
    }

    _hopPawn(pawn, idx, pawnIndex, teams) {
      const spot = getPawnSpot(idx, pawnIndex, teams);
      const from = { x: pawn.position.x, y: pawn.position.y, z: pawn.position.z, ry: pawn.rotation.y };
      const to = { x: spot.x, y: spot.y, z: spot.z, ry: spot.rotY };
      // unwrap rotation
      while (to.ry - from.ry > Math.PI) to.ry -= Math.PI * 2;
      while (to.ry - from.ry < -Math.PI) to.ry += Math.PI * 2;
      const duration = 240 / this.diceSpeedMultiplier;
      return new Promise((resolve) => {
        const start = performance.now();
        let resolved = false;
        const finish = () => {
          if (resolved) return;
          resolved = true;
          pawn.position.set(to.x, to.y, to.z);
          pawn.rotation.y = to.ry;
          resolve();
        };
        const step = () => {
          if (resolved) return;
          const t = Math.min(1, (performance.now() - start) / duration);
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          pawn.position.x = from.x + (to.x - from.x) * ease;
          pawn.position.z = from.z + (to.z - from.z) * ease;
          pawn.position.y = from.y + (to.y - from.y) * ease + Math.sin(t * Math.PI) * 0.35;
          pawn.rotation.y = from.ry + (to.ry - from.ry) * ease;
          if (t < 1) requestAnimationFrame(step); else finish();
        };
        requestAnimationFrame(step);
        // safety: if RAF gets paused (e.g. tab hidden), still resolve
        setTimeout(finish, duration + 200);
      });
    }

    pulsePawn(teamId) {
      const pawn = this.pawns.get(teamId);
      if (!pawn) return;
      const disc = pawn.userData.disc;
      if (!disc) return;
      const start = performance.now();
      const dur = 800;
      const baseY = pawn.position.y;
      const animate = () => {
        const t = Math.min(1, (performance.now() - start) / dur);
        pawn.position.y = baseY + Math.sin(t * Math.PI) * 0.18;
        if (t < 1) requestAnimationFrame(animate);
        else pawn.position.y = baseY;
      };
      requestAnimationFrame(animate);
    }

    _handleResize() {
      const onResize = () => {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      this._onResize = onResize;
    }

    _applySpherical(cam) {
      const c = cam || this.camera;
      const { radius, theta, phi } = this.spherical;
      // phi: 0 = on horizon (Y=0), PI/2 = top-down (Y=radius)
      const y = Math.sin(phi) * radius + this.target.y;
      const horiz = Math.cos(phi) * radius;
      const x = Math.sin(theta) * horiz + this.target.x;
      const z = Math.cos(theta) * horiz + this.target.z;
      c.position.set(x, y, z);
      c.lookAt(this.target);
    }

    _initOrbit() {
      const T = THREE;
      const dom = this.renderer.domElement;
      dom.style.cursor = 'grab';
      let dragging = false;
      let panning = false;
      let lastX = 0, lastY = 0;

      const beginRotate = (x, y) => { dragging = true; lastX = x; lastY = y; dom.style.cursor = 'grabbing'; };
      const beginPan    = (x, y) => { panning  = true; lastX = x; lastY = y; dom.style.cursor = 'move'; };

      const panBy = (dx, dy) => {
        // Move target in camera-relative XZ plane
        const forward = new T.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0; forward.normalize();
        const right = new T.Vector3();
        right.crossVectors(forward, new T.Vector3(0, 1, 0));
        right.normalize();
        const scale = this.spherical.radius * 0.0017;
        this.target.addScaledVector(right, -dx * scale);
        this.target.addScaledVector(forward, dy * scale);
        // clamp so user can't pan too far off-board
        const lim = 30;
        this.target.x = Math.max(-lim, Math.min(lim, this.target.x));
        this.target.z = Math.max(-lim, Math.min(lim, this.target.z));
        this._applySpherical();
      };

      const onDown = (e) => {
        if (e.button === 1 || e.shiftKey || e.button === 2) {
          beginPan(e.clientX, e.clientY);
        } else {
          beginRotate(e.clientX, e.clientY);
        }
        e.preventDefault();
      };
      const onMove = (e) => {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        if (dragging) {
          this.spherical.theta -= dx * 0.006;
          this.spherical.phi   = Math.max(this.minPhi, Math.min(this.maxPhi, this.spherical.phi + dy * 0.005));
          this._applySpherical();
        } else if (panning) {
          panBy(dx, dy);
        }
      };
      const onUp = () => {
        dragging = false;
        panning = false;
        dom.style.cursor = 'grab';
      };
      const onWheel = (e) => {
        e.preventDefault();
        const factor = Math.exp(e.deltaY * 0.0015);
        this.spherical.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.spherical.radius * factor));
        this._applySpherical();
      };

      dom.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      dom.addEventListener('wheel', onWheel, { passive: false });
      // suppress right-click context menu so right-drag can pan
      dom.addEventListener('contextmenu', (e) => e.preventDefault());

      // touch
      let touchDist = 0;
      let touchPanning = false;
      const onTouchStart = (e) => {
        if (e.touches.length === 1) {
          dragging = true;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          dragging = false;
          touchPanning = true;
          touchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
          lastX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
      };
      const onTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && dragging) {
          const dx = e.touches[0].clientX - lastX;
          const dy = e.touches[0].clientY - lastY;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
          this.spherical.theta -= dx * 0.006;
          this.spherical.phi   = Math.max(this.minPhi, Math.min(this.maxPhi, this.spherical.phi + dy * 0.005));
          this._applySpherical();
        } else if (e.touches.length === 2) {
          const newDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
          const newCx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const newCy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          // zoom
          const factor = touchDist / Math.max(1, newDist);
          touchDist = newDist;
          this.spherical.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.spherical.radius * factor));
          // pan with two-finger movement
          panBy(newCx - lastX, newCy - lastY);
          lastX = newCx; lastY = newCy;
          this._applySpherical();
        }
      };
      const onTouchEnd = () => { dragging = false; touchPanning = false; };
      dom.addEventListener('touchstart', onTouchStart, { passive: false });
      dom.addEventListener('touchmove', onTouchMove, { passive: false });
      dom.addEventListener('touchend', onTouchEnd);

      // reset on double-click
      dom.addEventListener('dblclick', () => {
        this.spherical = { radius: 60, theta: 0, phi: 0.95 };
        this.target.set(0, -2, 0);
        this._applySpherical();
      });
    }

    _startLoop() {
      let last = performance.now();
      let windGustT = 0; // accumulator for gust events
      let nextGust = 4 + Math.random() * 5;
      let windFactor = 1.0;
      const loop = () => {
        const now = performance.now();
        const dt = (now - last) / 1000;
        last = now;
        // ---- wind gust dynamics: target moves slowly, gust events spike it ----
        windGustT += dt;
        if (windGustT > nextGust) {
          windGustT = 0;
          nextGust = 5 + Math.random() * 7;
          windFactor = 2.2 + Math.random() * 0.6; // gust spike
        }
        // exponential decay of windFactor back to baseline 1.0
        windFactor += (1.0 - windFactor) * Math.min(1, dt * 1.2);

        // Animation traversal
        this.scene.traverse((obj) => {
          if (!obj.userData) return;
          // spinX — rotors of wind turbines (subject to gusts)
          if (obj.userData.spinX) {
            obj.userData.spinX.rotation.x += dt * 1.4 * windFactor;
          }
          if (obj.userData.spinY) {
            obj.rotation.y += dt * 0.8;
          }
          if (obj.userData.bobY) {
            const { base, amplitude, period } = obj.userData.bobY;
            if (!obj.userData._bobT) obj.userData._bobT = now;
            const tt = (now - obj.userData._bobT) / 1000;
            obj.position.y = base + Math.sin(tt * (Math.PI * 2 / period)) * amplitude;
          }
          // beamRotate — lighthouse beam
          if (obj.userData.beamRotate) {
            obj.rotation.y += dt * 1.4;
          }
          // foamLap — water foam strips
          if (obj.userData.foamLap) {
            const { baseZ, baseX, amp, phase, speed } = obj.userData.foamLap;
            const t = now / 1000;
            obj.position.z = baseZ + Math.sin(t * speed + phase) * amp;
            obj.position.x = baseX + Math.cos(t * (speed * 0.6) + phase * 1.3) * amp * 0.6;
          }
          // ripplePulse — pulsing ring (lighthouse base, etc.)
          if (obj.userData.ripplePulse) {
            const { baseScale, amp, speed } = obj.userData.ripplePulse;
            if (!obj.userData._rT) obj.userData._rT = now;
            const tt = (now - obj.userData._rT) / 1000;
            const s = baseScale + Math.sin(tt * speed) * amp;
            obj.scale.set(s, s, s);
            obj.material.opacity = 0.35 + Math.sin(tt * speed + 0.3) * 0.15;
          }
          // gantryTrolley — slide along boom
          if (obj.userData.gantryTrolley) {
            const { centerX, amplitudeX, period } = obj.userData.gantryTrolley;
            if (!obj.userData._gT0) obj.userData._gT0 = now;
            const tt = (now - obj.userData._gT0) / 1000;
            obj.position.x = centerX + Math.sin(tt * (Math.PI * 2 / period)) * amplitudeX;
            // container Y wobbles at twice the cycle
            const lift = obj.userData.containerLift;
            if (lift) {
              const liftY = 0.49 + Math.sin(tt * (Math.PI * 4 / period) + Math.PI) * 0.12;
              if (lift.mesh) lift.mesh.position.y = liftY;
              if (lift.cable) {
                const cableLen = 0.97 - liftY;
                lift.cable.scale.y = cableLen / 0.5;
                lift.cable.position.y = (0.97 + liftY) / 2;
              }
            }
          }
        });
        this.renderer.render(this.scene, this.camera);
        this._raf = requestAnimationFrame(loop);
      };
      loop();
    }

    setCameraAngle(angleDeg, height = 38, distance = 32) {
      const rad = angleDeg * Math.PI / 180;
      this.camera.position.set(Math.sin(rad) * distance, height, Math.cos(rad) * distance);
      this.camera.lookAt(0, 0, 0);
    }
  }

  window.Board3D = { Board, tileTransform, getPawnSpot };
})();

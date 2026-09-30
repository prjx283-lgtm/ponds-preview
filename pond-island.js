// Ponds: the pond island renderer (koi, water palettes, buildIsland). Shared by pond-examples.html and ponds-layout.html.
const col = h => { const n = parseInt(h.slice(1), 16); return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
const shade = (c, k) => { const r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255, f = v => Math.min(255, Math.round(v * k)); return ((255 << 24) | (f(b) << 16) | (f(g) << 8) | f(r)) >>> 0; };
const B4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]], bay = (x, y) => (B4[y & 3][x & 3] + .5) / 16;

// ---------- koi: 11 body segments, the nearest segment decides the colour ----------
const WH = "#fbf6ef", RD = "#ff4a3d", BK = "#20202a";
const KOI = {
  kohaku: { body: [WH, RD, RD, WH, WH, "#ff5a3a", "#ff5a3a", WH, WH, WH, WH], fin: "#eef3ff" },
  sakura: { body: ["#fff4f4", "#ff6f96", "#ff5a86", "#fff4f4", "#ff7aa0", "#ff7aa0", "#fff4f4", "#fff4f4", "#ff8fb0", "#fff4f4", "#fff4f4"], fin: "#ffe6ee" },
  tancho: { body: [WH, "#ff3f4a", WH, WH, WH, WH, WH, WH, WH, WH, WH], fin: "#eef3ff" },
  gold:   { body: ["#ffe9a0", "#ffd866", "#ffcc4a", "#ffc43a", "#ffbe34", "#ffb82e", "#ffb028", "#ffaa24", "#ffa420", "#ff9e1c", "#ff9818"], fin: "#fff0b8" },
  showa:  { body: [BK, RD, WH, BK, RD, WH, BK, WH, BK, WH, BK], fin: "#3a3a48" },
  orange: { body: ["#ffb060", "#ffa048", "#ff9438", "#ff8c30", "#ff862a", "#ff8026", "#ff7a22", "#ff761e", "#ff721c", "#ff6e1a", "#ff6a18"], fin: "#ffc890" },
};
class Koi {
  constructor(spec, x, y, a, v){ this.c = spec.body.map(col); this.fin = col(spec.fin); this.x = x; this.y = y; this.a = a; this.v = v; this.turn = 0; this.ph = Math.random() * 10; this.trail = []; for (let j = 0; j < 30; j++) this.trail.push([x - Math.cos(a) * j * .5, y - Math.sin(a) * j * .5]); }
  step(ok){
    const L = 6, px = this.x + Math.cos(this.a) * L, py = this.y + Math.sin(this.a) * L;
    if (!ok(px, py)) { const left = ok(this.x + Math.cos(this.a - .7) * L, this.y + Math.sin(this.a - .7) * L); this.a += left ? -.2 : .2; this.turn = 0; }
    else { if (Math.random() < .035) this.turn = (Math.random() - .5) * .09; this.a += this.turn; }
    const nx = this.x + Math.cos(this.a) * this.v, ny = this.y + Math.sin(this.a) * this.v;
    if (ok(nx, ny)) { this.x = nx; this.y = ny; }
    const [lx, ly] = this.trail[0]; if (Math.hypot(this.x - lx, this.y - ly) >= .5) { this.trail.unshift([this.x, this.y]); this.trail.length = 30; }
  }
  draw(buf, W, H, open, tick){
    const R = [1.35, 1.75, 1.95, 1.95, 1.85, 1.65, 1.4, 1.15, .95, .75, .6], pts = R.map((_, s) => this.trail[s * 2]), body = new Map();
    pts.forEach(([x, y], s) => { const r = R[s]; for (let Y = Math.floor(y - r); Y <= Math.floor(y + r); Y++) for (let X = Math.floor(x - r); X <= Math.floor(x + r); X++) {
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const d = Math.hypot(X + .5 - x, Y + .5 - y) / r; if (d > 1) continue; const i = Y * W + X, cur = body.get(i); if (!cur || d < cur.d) body.set(i, { d, s, X, Y }); } });
    body.forEach(({ X, Y }) => { if (X + 1 >= W || Y + 2 >= H) return; const j = (Y + 2) * W + X + 1; if (open(j) && !body.has(j)) buf[j] = shade(buf[j], .66); });
    const fins = [], [tx, ty] = pts[10], [qx, qy] = pts[8], ta = Math.atan2(ty - qy, tx - qx), wig = Math.sin(tick * .5 + this.ph) * .3;
    [ta + .6 + wig, ta - .6 + wig].forEach(a => { for (let j = 1; j <= 3; j++) fins.push([Math.floor(tx + Math.cos(a) * j), Math.floor(ty + Math.sin(a) * j)]); });
    const [hx, hy] = pts[0], [sx, sy] = pts[3], [fx, fy] = pts[2], ba = Math.atan2(sy - hy, sx - hx), fl = ((tick + (this.ph * 10 | 0)) >> 3) & 1 ? .25 : 0;
    [ba + 1.15 + fl, ba - 1.15 - fl].forEach(a => { for (let j = 2.2; j <= 3.4; j += .6) fins.push([Math.floor(fx + Math.cos(a) * j), Math.floor(fy + Math.sin(a) * j)]); });
    fins.forEach(([X, Y]) => { if (X < 0 || Y < 0 || X >= W || Y >= H) return; const i = Y * W + X; if (open(i) && !body.has(i)) buf[i] = this.fin; });
    body.forEach(({ s }, i) => { if (!open(i)) return; const c = this.c[s], edge = !body.has(i + 1) || !body.has(i + W); buf[i] = edge ? shade(c, .86) : c; });
  }
}

// ---------- D: the pond island ----------
const WATER = {
  blue:  { top0: "#15247a", top1: "#1d3aa6", body: "#2386ec", lite: "#45aaf6", edge: "#8ad8ff", rip: "#1d3aa6", ripRows: 2, glint: "#ffffff", thick: false, ring: false, crescent: true },
  light: { top0: "#0f6c72", top1: "#15959c", body: "#22cedc", lite: "#22cedc", edge: "#a6f0f4", rip: "#a6f0f4", ripRows: 1, glint: "#ffffff", thick: true, ring: true, crescent: false },
};
// opts: seed (grass variation), roof (hex, the pond token's colour), koi (names, one per fish), clear (transparent sky, no motifs),
// field (a pond on the ground: no floating underside or outline, bare grass left transparent so the field shows through),
// patch (a mossy patch on the ground: outlined, no floating underside)
function buildIsland(canvas, WT, opts = {}){
  if (opts.field || opts.patch) opts = { ...opts, clear: true };
  const W = 128, H = 104; canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d"), img = ctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer);
  const P = { bg0: "#e6f1f2", bg1: "#dae8eb", mot: "#fafdfd",
    O: "#0c383c", g0: "#115c3c", g1: "#1a843e", g2: "#2aa845", g3: "#56c94a", g4: "#a4e86a", wh: "#f6fff2",
    d0: "#3a2414", d1: "#5c3a1e", d2: "#7c5230", st: "#a39a8c", rimD: "#5e3310", rimL: "#8b5a2e",
    l1: "#16662e", l2: "#2d9a3a", l3: "#62c64c", lw: "#ffffff", lp: "#f7a3c4", lq: "#e0668a", ly: "#ffd23f",
    cat0: "#4a2812", cat1: "#7a4622", cat2: "#b07440", tr0: "#3a2412", tr1: "#6a3e1e", tr2: "#9a6436" };
  const K = {}; for (const k in P) K[k] = col(P[k]);
  const Wc = {}; ["top0", "top1", "body", "lite", "edge", "rip", "glint"].forEach(k => Wc[k] = col(WT[k]));
  const HP = { O: "#2e1a0e", "1": "#4a2a14", "2": "#6e3e1c", "3": "#9a5c2a", "4": "#c47e3c", b: "#3a2412", w: "#6a3e1e", W: "#9a6436", T: "#c08650", e: "#e0b078", d: "#5a3418", k: "#ffd23f", p: "#ffd27a", P: "#fff2c0", s: "#8a8580", S: "#bdb8b0", f: "#f7a3c4", F: "#ffffff", g: "#56c94a" };
  const CM = {}; for (const k in HP) CM[k] = col(HP[k]);
  if (opts.roof) { const b = col(opts.roof); CM.O = shade(b, .3); CM["1"] = shade(b, .5); CM["2"] = shade(b, .72); CM["3"] = b; CM["4"] = shade(b, 1.3); }
  let sd = opts.seed ?? 7; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, rr = (a, b) => a + (b - a) * rnd();
  const S = new Uint32Array(W * H), L = new Uint8Array(W * H), M = new Uint8Array(W * H), OBJ = new Uint8Array(W * H), DRAWN = new Uint8Array(W * H); // L: 0 sky, 1 ground, 2 underside, 4 object on sky
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const put = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (!inb(x, y)) return; const i = y * W + x; S[i] = c; DRAWN[i] = 1; if (M[i]) OBJ[i] = 1; if (L[i] === 0) L[i] = 4; };
  const grid = (rows, x0, y0, map, onlyWater) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === "." || map[ch] === undefined) return; const X = x0 + x, Y = y0 + y; if (onlyWater && !(inb(X, Y) && M[Y * W + X])) return; put(X, Y, map[ch]); }));

  // flat pale sky
  S.fill(opts.clear ? 0 : K.bg0);

  // island: grass top, earth underside, dark silhouette line
  const icx = 64, icy = 64, irx = 58, iry = 26;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x + .5 - icx) / irx, dy = (y + .5 - icy) / iry, a = Math.atan2(dy, dx), r = 1 + .025 * Math.sin(5 * a + 1) + .02 * Math.sin(9 * a);
    if (dx * dx + dy * dy >= r * r) continue; const i = y * W + x; L[i] = 1;
    S[i] = opts.field ? K.g2 : dy > .74 + .05 * Math.sin(x * .4) ? K.g1 : (dx * .6 + dy < -.55 + .06 * Math.sin(x * .5 + y)) ? K.g3 : K.g2; }
  const gBot = new Int16Array(W).fill(-1), gTop = new Int16Array(W).fill(-1);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (L[y * W + x] === 1) { if (gTop[x] < 0) gTop[x] = y; gBot[x] = y; }
  if (!opts.field) {
  if (!opts.patch) for (let x = 0; x < W; x++) { if (gBot[x] < 0) continue; const dx = (x + .5 - icx) / irx, depth = Math.max(2, Math.round(2 + 6 * (1 - dx * dx) + Math.sin(x * .7) * .8));
    for (let k = 1; k <= depth; k++) { const y = gBot[x] + k; if (!inb(x, y)) continue; const i = y * W + x; L[i] = 2; S[i] = k === 1 ? K.g0 : k === depth ? K.O : k === 2 ? K.d2 : k >= depth - 1 ? K.d0 : K.d1; } }
  [22, 40, 58, 76, 94].forEach(x => { const y = gBot[x] + 3; if (L[y * W + x] === 2 && L[(y + 1) * W + x] === 2) { S[y * W + x] = K.st; if (L[y * W + x + 1] === 2) S[y * W + x + 1] = K.st; } });
  { const S2 = S.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (L[i] !== 1 && L[i] !== 2) continue; if ([[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => !inb(x + a, y + b) || L[(y + b) * W + x + a] === 0)) S2[i] = K.O; } S.set(S2); }
  for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (L[i] === 1 && S[i] !== K.O && S[i - W] === K.O) S[i] = K.g3; }
  }

  // pond
  const pcx = 58, pcy = 72, prx = 36, pry = 13;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x + .5 - pcx) / prx, dy = (y + .5 - pcy) / pry, a = Math.atan2(dy, dx), r = 1 + .05 * Math.sin(2 * a + 1) + .035 * Math.sin(3 * a + 2.5); if (dx * dx + dy * dy < r * r && L[y * W + x] === 1) M[y * W + x] = 1; }
  const Din = new Int16Array(W * H).fill(999); { const q = []; for (let i = 0; i < W * H; i++) if (!M[i]) { Din[i] = 0; q.push(i); } let h = 0; while (h < q.length) { const i = q[h++], x = i % W, y = i / W | 0; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b]) => { const X = x + a, Y = y + b; if (!inb(X, Y)) return; const j = Y * W + X; if (Din[j] > Din[i] + 1) { Din[j] = Din[i] + 1; q.push(j); } }); } }
  const ringOn = (x, y) => Math.floor((Math.atan2((y + .5 - pcy) / pry, (x + .5 - pcx) / prx) + Math.PI) * 5) % 3 !== 0;
  for (let y = 3; y < H - 2; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!M[i]) continue; const dx = (x + .5 - pcx) / prx, dy = (y + .5 - pcy) / pry;
    let c = WT.crescent && dx * .45 + dy > .5 + .05 * Math.sin(x * .6) ? Wc.lite : Wc.body;
    if (!M[i - 1] || !M[i + 1] || !M[i + 2 * W]) c = Wc.lite;
    if (WT.ring && Din[i] === 3 && y > pcy - 5 && ringOn(x, y)) c = Wc.edge;
    if (!M[i + W]) c = Wc.edge;
    if (WT.thick && !M[i - 3 * W]) c = Wc.top1;
    if (!M[i - 2 * W]) c = WT.thick ? Wc.top0 : Wc.top1;
    if (!M[i - W]) c = Wc.top0; S[i] = c; }
  // the far bank: two rows of earth above the water
  for (let y = 1; y < H - 2; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (M[i] || L[i] !== 1) continue;
    if (M[i + W] || (y < pcy && (M[i - 1] || M[i + 1]))) S[i] = K.rimD; else if (M[i + 2 * W] && y < pcy) S[i] = K.rimL; }
  const wTop = new Int16Array(W).fill(-1), wBot = new Int16Array(W).fill(-1); for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (M[y * W + x]) { if (wTop[x] < 0) wTop[x] = y; wBot[x] = y; }
  const bare = (x, y) => inb(x, y) && L[y * W + x] === 1 && !M[y * W + x] && S[y * W + x] !== K.O && S[y * W + x] !== K.rimD && S[y * W + x] !== K.rimL;

  // ground tufts and flowers
  for (let gy = 0; gy < H; gy += 6) for (let gx = 0; gx < W; gx += 7) { const x = gx + (rnd() * 5 | 0), y = gy + (rnd() * 4 | 0); const ok = [[0,1],[1,0],[2,1],[1,1],[1,2]].every(([a, b]) => bare(x + a, y + b) && !M[(y + b + 2) * W + x + a]); if (!ok || rnd() < .35) continue; put(x, y + 1, K.g1); put(x + 1, y, K.g3); put(x + 2, y + 1, K.g1); }
  [[20, 58, K.lw], [44, 56, K.ly], [100, 76, K.lw], [30, 86, K.ly], [74, 87, K.lw], [118, 66, K.lp], [97, 62, K.ly], [12, 62, K.lp], [90, 84, K.lp]].forEach(([x, y, c]) => { if (!bare(x, y) || !bare(x, y + 1)) return; put(x, y, c); put(x, y + 1, K.g1); });

  // lily pads and lotus, flat on the water
  const PAD_L = ["..33332..", ".3332222.", "333222...", "3322221..", ".2222111.", "..11111.."], PAD_S = [".3332..", "33222..", "3322221", ".22111.", "..111.."];
  const LOTUS = [".w.w.", "wpwpw", "qpypq", ".qqq."], BUD = [".p.", "pwp", "qpq"];
  const padMap = { "1": K.l1, "2": K.l2, "3": K.l3 }, flMap = { w: K.lw, p: K.lp, q: K.lq, y: K.ly }, shMap = { "1": Wc.top1, "2": Wc.top1, "3": Wc.top1 };
  [[30, 71, PAD_L], [47, 78, PAD_S], [60, 65, PAD_S], [64, 77, PAD_L]].forEach(([x, y, g]) => { grid(g, x + 1, y + 1, shMap, true); grid(g, x, y, padMap, true); });
  grid(LOTUS, 32, 68, flMap); grid(BUD, 62, 63, flMap); grid(BUD, 67, 75, flMap);

  // vegetation
  const TONE = [[K.g0, K.g1], [K.g1, K.g2], [K.g2, K.g3], [K.g3, K.g4]];
  const blade = ({ x: bx, y: by, h, lean, w, tone, hi }) => { const [body, lite] = TONE[tone];
    for (let j = 0; j < h; j++) { const t = j / Math.max(1, h - 1), cx = bx + lean * t * t, hw = w * .5 * Math.pow(1 - t, .8); let xl = Math.round(cx - hw), xr = Math.round(cx + hw) - 1; if (xr < xl) xr = xl;
      for (let x = xl; x <= xr; x++) { let c = body; if (x === xl && xr > xl) c = K.O; else if (x === xr && xr - xl >= 2) c = lite; if (j >= h - 2) c = lite; if (hi && x === xr && xr > xl && t > .25 && t < .7) c = K.wh; put(x, by - j, c); } } };
  const cattail = ({ x: bx, y: by, h, lean }) => { for (let j = 0; j < h; j++) { const t = j / (h - 1), x = Math.round(bx + lean * t), y = by - j;
      if (j < h - 7 || j === h - 1) { put(x, y, K.g1); if (j < h * .4) put(x - 1, y, K.O); } else { put(x, y, K.cat0); put(x + 1, y, j === h - 2 ? K.cat2 : K.cat1); } } };
  // leafy clusters: the front circle wins, a dark line where a front cluster overlaps a back one
  const blob = (circles, flowers) => { const px = new Map();
    circles.forEach(([cx, cy, r], ci) => { for (let Y = Math.floor(cy - r); Y <= Math.ceil(cy + r); Y++) for (let X = Math.floor(cx - r); X <= Math.ceil(cx + r); X++) { if (!inb(X, Y) || Math.hypot(X + .5 - cx, Y + .5 - cy) > r) continue; const i = Y * W + X, cur = px.get(i); if (cur === undefined || circles[cur][1] <= cy) px.set(i, ci); } });
    px.forEach((ci, i) => { const X = i % W, Y = i / W | 0, [cx, cy, r] = circles[ci], l = -((X + .5 - cx) * .8 + (Y + .5 - cy) * 1.1) / r;
      let c = l > .72 ? K.g4 : l > .2 ? K.g3 : l > -.4 ? K.g2 : K.g1;
      if ([i + 1, i - 1, i + W, i - W].some(j => !px.has(j))) c = K.O;
      else if ([i + W, i + 1, i - 1].some(j => { const cj = px.get(j); return cj !== ci && circles[cj][1] > cy; })) c = K.g0;
      put(X, Y, c); });
    (flowers || []).forEach(([x, y, c]) => put(x, y, c)); };
  const objs = [], isG = (x, y) => inb(x, y) && L[y * W + x] === 1 && !M[y * W + x];
  const addB = b => objs.push({ y: b.y, draw: () => blade(b) });
  for (let n = 0, t = 0; n < 40 && t < 4000; t++) { const x = Math.round(rr(10, 60)); if (gTop[x] < 0) continue; const y = wTop[x] > 0 ? wTop[x] - Math.round(rr(1, 8)) : gTop[x] + Math.round(rr(3, 10)); if (!isG(x, y)) continue;
    addB({ x, y, h: Math.round(rr(9, 19) + (x < 30 ? 4 : 0)), lean: rr(-3, 3), w: rnd() < .5 ? 2 : 3, tone: rnd() < .45 ? 0 : 1, hi: rnd() < .18 }); n++; }
  for (let n = 0, t = 0; n < 11 && t < 2000; t++) { const x = Math.round(rr(6, 18)); if (gTop[x] < 0) continue; const y = Math.round(rr(gTop[x] + 3, gBot[x] - 1)); if (!isG(x, y)) continue; addB({ x, y, h: Math.round(rr(10, 20)), lean: rr(-5, 1), w: rnd() < .5 ? 2 : 3, tone: 1 + (rnd() < .5 ? 1 : 0), hi: rnd() < .25 }); n++; }
  for (let n = 0, t = 0; n < 14 && t < 3000; t++) { const x = Math.round(rr(96, 122)); if (gTop[x] < 0) continue; const y = Math.round(rr(Math.max(gTop[x] + 3, 56), gBot[x] - 1)); if (!isG(x, y)) continue; addB({ x, y, h: Math.round(rr(6, 14)), lean: rr(-1, 4), w: rnd() < .5 ? 2 : 3, tone: 1 + (rnd() < .5 ? 1 : 0), hi: rnd() < .2 }); n++; }
  for (let n = 0, t = 0; n < 7 && t < 800; t++) { const x = Math.round(rr(102, 118)), y = Math.round(rr(50, 56)); if (!isG(x, y)) continue; addB({ x, y, h: Math.round(rr(4, 8)), lean: rr(-2, 2), w: 3, tone: 1, hi: false }); n++; }
  if (!opts.field) for (let x = 14; x < 114; x += 3 + (rnd() * 3 | 0)) { const y = gBot[x] - Math.round(rr(0, 2)); if (!isG(x, y)) continue; const h = Math.round(rr(3, 6)), tone = rnd() < .5 ? 2 : 3; addB({ x, y, h, lean: -2.2, w: 3, tone, hi: false }); addB({ x: x + 1, y, h: h - 1, lean: 2.2, w: 3, tone, hi: false }); }
  for (let x = 30; x < 86; x += 6 + (rnd() * 4 | 0)) { if (wBot[x] < 0) continue; const y = wBot[x] + 2; if (!isG(x, y)) continue; addB({ x, y, h: Math.round(rr(3, 6)), lean: rr(-1.5, 1.5), w: 3, tone: 2, hi: false }); }
  [[26, 66, 16, -1], [29, 62, 20, -1.5], [36, 60, 17, .5], [96, 70, 18, 1.5], [97, 76, 13, 1]].forEach(([x, y, h, lean]) => objs.push({ y, draw: () => cattail({ x, y, h, lean }) }));
  const BUSH = [
    [56, [[57, 50, 4], [61, 52, 3.5], [54, 53, 3]], [[56, 48, K.lp], [60, 50, K.lw]]],
    [61, [[94, 56, 3.5], [97, 58, 3]], [[93, 54, K.lw]]],
    [73, [[104, 64, 5], [110, 62, 4], [113, 67, 4], [107, 69, 4]], [[103, 61, K.lp], [110, 60, K.lw], [112, 65, K.lp]]],
    [81, [[96, 78, 3.5], [100, 77, 3]], []],
    [74, [[14, 68, 4], [18, 71, 3.5]], [[13, 66, K.lw]]],
  ];
  BUSH.forEach(([y, c, f]) => objs.push({ y, draw: () => blob(c, f) }));
  objs.push({ y: 52, draw: () => {
    for (let y = 38; y <= 52; y++) { put(109, y, K.tr0); put(110, y, K.tr1); put(111, y, K.tr2); } put(108, 52, K.tr1); put(112, 52, K.tr1); put(112, 51, K.tr0);
    blob([[112, 29, 7], [104, 33, 6.5], [119, 34, 5.5], [100, 40, 5], [107, 40, 6], [116, 41, 5.5]], [[111, 26, K.lw], [103, 31, K.lp], [118, 33, K.lw]]); } });

  // the house: wooden shingle roof, log walls with log ends at the corners, two windows, a door and a lantern
  const roofL = [".......OOOOOOOO", ".....OO44444444", "....O3332333233", "....O2222222222", "...O33233323332", "...O22222222222", "..O333233323332", "..O222222222222", ".O3233323332333", ".O2222222222222", "O33323332333233", "O11111111111111"];
  const dim = { "4": "3", "3": "2", "2": "1" }, HOUSE = roofL.map(r => r + [...r].reverse().map(ch => dim[ch] || ch).join(""));
  for (let r = 0; r < 12; r++) { let row = ""; for (let x = 0; x < 30; x++) { let ch = "."; const m = (r - 1) % 3;
    if (x >= 2 && x <= 27) ch = r === 0 ? "b" : m === 0 ? "T" : m === 1 ? "W" : "w";
    if ((x === 1 || x === 28) && r > 0) ch = m === 1 ? "e" : m === 0 ? "w" : ".";
    for (const wx of [3, 20]) {
      if (x >= wx && x <= wx + 6 && r >= 3 && r <= 7) ch = (x === wx || x === wx + 6 || r === 3 || r === 7 || x === wx + 3 || r === 5) ? "b" : (x === wx + 1 && r === 4) ? "P" : "p";
      if (x >= wx && x <= wx + 6 && r === 8) ch = "fgFgfgF"[x - wx];
      if (x >= wx - 1 && x <= wx + 7 && r === 9) ch = (x === wx - 1 || x === wx + 7) ? "b" : "w"; }
    if (x >= 12 && x <= 17 && r >= 3) ch = (x === 12 || x === 17 || r === 3) ? "b" : (x === 16 && r === 7) ? "k" : (x === 13 && r === 4) ? "W" : "d";
    if (x === 10 && (r === 4 || r === 5)) ch = r === 4 ? "b" : "k";
    row += ch; } HOUSE.push(row); }
  HOUSE.push([...Array(30)].map((_, x) => x === 1 || x === 28 ? "O" : x > 1 && x < 28 ? ((x >> 1) & 1 ? "s" : "S") : ".").join(""));
  // PX, PW: the pontoon's left edge and width (as wide as the door); PE: its last deck row
  const HX = 63, HY = 29, PX = HX + 12, PW = 6, PE = 67;
  objs.push({ y: HY + 24, draw: () => {
    for (let y = HY + 25; y <= HY + 27; y++) for (let x = HX + 23; x <= HX + 31; x++) if (isG(x, y)) put(x, y, K.g1);
    grid(HOUSE, HX, HY, CM); } });
  // a small porch and a short pontoon into the water
  objs.push({ y: PE + 1, draw: () => {
    for (let y = HY + 25; y <= HY + 26; y++) for (let x = HX + 10; x <= HX + 19; x++) put(x, y, y === HY + 25 ? CM.e : (x - HX) % 4 === 0 ? CM.w : CM.T);
    for (let x = HX + 10; x <= HX + 19; x++) if (x < PX || x >= PX + PW) put(x, HY + 27, CM.b);
    for (let y = HY + 27; y <= PE; y++) { const seam = (y - HY) % 3 === 0; for (let x = PX; x < PX + PW; x++) put(x, y, x === PX || x === PX + PW - 1 ? CM.b : seam ? CM.w : x === PX + 1 ? CM.e : x === PX + PW - 2 ? CM.W : CM.T); if (M[y * W + PX + PW]) put(PX + PW, y, Wc.top0); }
    for (let x = PX; x < PX + PW; x++) { put(x, PE + 1, CM.b); if (M[(PE + 2) * W + x]) put(x, PE + 2, Wc.top0); }
    [PX, PX + PW - 1].forEach(x => { put(x, PE - 3, CM.e); for (let y = PE - 2; y <= PE; y++) put(x, y, x === PX ? CM.T : CM.w); put(x, PE + 2, CM.b); put(x, PE + 3, CM.b); }); } });
  objs.sort((a, b) => a.y - b.y).forEach(o => o.draw());

  // motifs in the sky
  const RING = [".###.", "#...#", "#...#", "#...#", ".###."], DIA = ["..#..", ".#.#.", "#...#", ".#.#.", "..#.."];
  if (!opts.clear) [[9, 9, RING], [52, 8, DIA], [80, 6, RING], [4, 40, DIA], [120, 60, DIA], [118, 88, RING], [12, 92, DIA], [60, 98, RING], [32, 24, RING]].forEach(([x0, y0, g]) => g.forEach((r, y) => [...r].forEach((ch, x) => { const X = x0 + x, Y = y0 + y; if (ch === "#" && inb(X, Y) && L[Y * W + X] === 0) S[Y * W + X] = K.mot; })));
  const SPK = opts.clear ? [] : [[27, 16, 0], [66, 18, 9], [124, 20, 5], [5, 74, 13], [106, 97, 3], [44, 34, 7], [94, 14, 11], [36, 97, 15]];

  if (opts.field) for (let i = 0; i < W * H; i++) if (L[i] === 1 && !M[i] && !DRAWN[i] && S[i] === K.g2) S[i] = 0;

  const open = i => M[i] && !OBJ[i];
  const ok = (x, y) => { const X = Math.round(x), Y = Math.round(y); return inb(X, Y) && M[Y * W + X] && Din[Y * W + X] >= 3 && !(X >= PX - 3 && X <= PX + PW + 3 && Y <= PE + 6); };
  const SPOTS = [[44, 74, 0], [58, 70, 3], [52, 79, 1.6], [36, 76, 4.5]];
  const kois = (opts.koi || ["sakura", "kohaku", "gold", "tancho"]).map((n, j) => { let [x, y, a] = SPOTS[j] || [];
    if (x === undefined) { let t = 0; do { x = rr(pcx - prx * .7, pcx + prx * .7); y = rr(pcy - pry * .6, pcy + pry * .6); } while (!(ok(x, y) && Din[Math.round(y) * W + Math.round(x)] >= 5) && ++t < 300); a = rr(0, 6.283); }
    return new Koi(KOI[n], x, y, a, .28 + Math.random() * .08); });
  const RIP = []; for (let r = 0; r < 6; r++) { const oy = -8 + r * 3; for (let ox = -30 + (r % 2) * 6; ox < 30; ox += 12) RIP.push([ox + ((r * 7 + ox + 30) % 3), oy, 4 + ((r + ox) & 1) * 2, (r * 5 + ox + 30) & 15]); }
  const GL = [[-20, -3, "diag", 0], [-9, 3, "dash", 8], [6, -4, "diag", 15], [14, 5, "plus", 4], [-15, 7, "dash", 20], [0, 8, "diag", 11], [22, 0, "dot", 17], [-26, 1, "dot", 25], [-3, -6, "plus", 22], [10, 1, "dash", 27]];
  const GP = { diag: [[0, 0], [1, -1], [2, -2]], dash: [[0, 0], [1, 0], [2, 0]], plus: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]], dot: [[0, 0]] };
  let tick = 0;
  const frame = () => {
    tick++; buf.set(S);
    RIP.forEach(([ox, oy, w, ph]) => { const off = Math.round(Math.sin((tick + ph * 4) * .09) * 1.4), y = pcy + oy, x0 = pcx + ox + off; for (let r = 0; r < WT.ripRows; r++) for (let x = x0 + r; x < x0 + w - r; x++) { const i = (y + r) * W + x; if (open(i) && Din[i] >= 2) buf[i] = Wc.rip; } });
    const pr = (tick >> 3) & 1; [[PX - 1 - pr, PE + 3], [PX + 1 + pr, PE + 3], [PX + PW - 2 - pr, PE + 3], [PX + PW + pr, PE + 3]].forEach(([x, y]) => { const i = y * W + x; if (open(i)) buf[i] = Wc.edge; });
    kois.forEach(k => { k.step(ok); k.draw(buf, W, H, open, tick); });
    GL.forEach(([ox, oy, kind, ph]) => { if ((tick + ph) % 30 >= 20) return; GP[kind].forEach(([a, b]) => { const i = (pcy + oy + b) * W + pcx + ox + a; if (open(i)) buf[i] = Wc.glint; }); });
    SPK.forEach(([x, y, ph]) => { const arm = ((tick + ph * 4) >> 4) & 1 ? 2 : 1; [[0, 0], ...[1, 2].slice(0, arm).flatMap(j => [[j, 0], [-j, 0], [0, j], [0, -j]])].forEach(([a, b]) => { const X = x + a, Y = y + b; if (inb(X, Y) && L[Y * W + X] === 0) buf[Y * W + X] = K.mot; }); });
    ctx.putImageData(img, 0, 0);
  };
  frame.kois = kois; // island-local koi positions, so a tag can follow one fish
  return frame;
}


// ---------- the pill colour: the most common real colour in a token's logo ----------
// Skips transparent, near-white and near-black pixels (backgrounds, letters, outlines); saturated colours weigh a bit more.
function dominantColor(src){
  const n = 32, c = document.createElement("canvas"); c.width = c.height = n;
  const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(src, 0, 0, n, n);
  const d = x.getImageData(0, 0, n, n).data, B = new Map();
  for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; if (d[i + 3] < 128) continue;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if ((mx > 235 && mn > 220) || mx < 28) continue;
    const k = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4), e = B.get(k) || { n: 0, r: 0, g: 0, b: 0, w: 0 };
    e.n++; e.r += r; e.g += g; e.b += b; e.w += .4 + (mx - mn) / mx; B.set(k, e); }
  let best = null; B.forEach(e => { if (!best || e.w > best.w) best = e; }); if (!best) return "#0c383c";
  const h = v => Math.round(v / best.n).toString(16).padStart(2, "0"); return "#" + h(best.r) + h(best.g) + h(best.b);
}
const inkFor = hex => { const n = parseInt(hex.slice(1), 16), l = (.2126 * (n >> 16) + .7152 * ((n >> 8) & 255) + .0722 * (n & 255)) / 255; return l > .62 ? "#10141a" : "#ffffff"; };
const darkerHex = (hex, k) => "#" + [16, 8, 0].map(s => Math.round(((parseInt(hex.slice(1), 16) >> s) & 255) * k).toString(16).padStart(2, "0")).join("");

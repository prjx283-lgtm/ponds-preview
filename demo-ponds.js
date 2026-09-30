// Ponds: demo ponds for the prototypes. Made-up tickers and demo logos; pill colours are picked from the logos.
// Needs pond-island.js first, and the fonts loaded (the demo logos use Unbounded).
function makeDemoPonds(n){
  const BASE = [
    { t: "PONDS",  name: "Ponds",  logo: ["#ffd23f", "#b8860b"], fish: 9, pct: 4.1, liq: 64,  age: 9, ours: true },
    { t: "MOSS",   name: "Moss",   logo: ["#4f8a3a", "#2e5a22"], fish: 7, pct: 2.8, liq: 31,  age: 7, frenzy: "1h 42m" },
    { t: "KERO",   name: "Kero",   logo: ["#c0392b", "#7a1f16"], fish: 6, pct: 2.2, liq: 22,  age: 8 },
    { t: "LILY",   name: "Lily",   logo: ["#d0608a", "#fff0f6"], fish: 5, pct: 1.9, liq: 18,  age: 5 },
    { t: "NAMI",   name: "Nami",   logo: ["#2a8a9a", "#123f48"], fish: 4, pct: 1.2, liq: 12,  age: 6 },
    { t: "PEBBLE", name: "Pebble", logo: ["#7d7a8a", "#d9d6e2"], fish: 4, pct: .9,  liq: 9,   age: 3 },
    { t: "DRIP",   name: "Drip",   logo: ["#3a5ac8", "#9fc0ff"], fish: 3, pct: .7,  liq: 7,   age: 4 },
    { t: "REED",   name: "Reed",   logo: ["#c9a227", "#5a4a10"], fish: 2, pct: .5,  liq: 4,   age: 2 },
    { t: "PLUM",   name: "Plum",   logo: ["#7a4aa0", "#f2c14e"], fish: 2, pct: .3,  liq: 3,   age: 1 },
    { t: "SPLASH", name: "Splash", logo: ["#e07a2a", "#2a9df4"], fish: 1, pct: .1,  liq: 1.4, age: 0 },
  ];
  const MORE = ["BOG", "FERN", "TADPO", "MIRE", "DUCKY", "RIPPLE", "OTTER", "SWAMP", "HERON", "NEWT", "CRANE", "LOTUS", "ALGAE", "MINNOW", "SNAIL", "CLAM", "PUDDLE", "WILLOW", "CREEK", "MARSH", "DEW", "FOG", "GLOOP", "BLOOP", "GUPPY", "SHRIMP", "CRAB", "EEL", "PIKE", "CARP", "TROUT", "PERCH", "SQUID", "WADER", "LAGOON", "BROOK", "GEYSER", "DELTA", "RAPIDS", "SPRAY"];
  const hsl = (h, s, l) => { const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); }; return "#" + f(0) + f(8) + f(4); };
  let sd = 99; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
  const P = BASE.slice(0, Math.min(n, 10)).map(o => ({ ...o }));
  MORE.slice(0, Math.max(0, n - 10)).forEach((t, j) => { const h = (j * 47 + 20) % 360, pct = +(.05 + rnd() * rnd() * 3).toFixed(2);
    P.push({ t, name: t[0] + t.slice(1).toLowerCase(), logo: [hsl(h, .55, .48), hsl(h, .5, .25)], fish: Math.max(1, Math.round(pct * 2 + rnd() * 2)), pct, liq: +(1 + pct * 11 + rnd() * 3).toFixed(1), age: rnd() * 6 | 0, frenzy: j === 3 ? "22m" : undefined }); });
  const KOI_ORDER = ["kohaku", "gold", "sakura", "tancho", "showa", "orange"];
  const makeLogo = p => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    x.fillStyle = p.logo[1]; x.beginPath(); x.arc(32, 32, 32, 0, 7); x.fill(); x.fillStyle = p.logo[0]; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.font = "900 30px Unbounded"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(p.t[0], 32, 34); return c; };
  P.forEach((p, i) => {
    p.logoCanvas = makeLogo(p); p.pc = dominantColor(p.logoCanvas); p.ink = inkFor(p.pc); p.edge = darkerHex(p.pc, .62);
    const koi = [...Array(Math.min(8, p.fish))].map((_, j) => KOI_ORDER[(i + j) % KOI_ORDER.length]);
    // build(mode): "island" floats, "patch" is a mossy patch on the ground, "field" blends into a grass field
    p.build = mode => { const canvas = document.createElement("canvas"); return { canvas, frame: buildIsland(canvas, WATER.blue, { seed: 7 + i * 13, roof: p.ours ? null : p.pc, koi, clear: true, field: mode === "field", patch: mode === "patch" }) }; };
    ({ canvas: p.canvas, frame: p.frame } = p.build("island"));
  });
  return P;
}

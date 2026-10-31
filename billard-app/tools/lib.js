// Läuft im Browser-Kontext des Spiels (nutzt runSim, AIM_PTS, R, W, H, …)
window.GEN = (() => {
  let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const setSeed = s => { seed = s; for (let i = 0; i < 5; i++) rnd(); };
  const mk = (cue, balls) => [{n: 0, x: cue[0], y: cue[1], vx: 0, vy: 0, on: true}].concat(balls.map(b => ({n: b[0], x: b[1], y: b[2], vx: 0, vy: 0, on: true})));
  const inTable = (x, y, m) => x > R + m && x < W - R - m && y > R + m && y < H - R - m;
  const nearPocket = (x, y, d) => POCKETS.some(p => Math.hypot(p.x - x, p.y - y) < d);
  const free = (pts, x, y, d) => pts.every(p => Math.hypot(p[0] - x, p[1] - y) > d);
  const ghost = (bx, by, k) => { const ap = AIM_PTS[k]; let ux = ap.x - bx, uy = ap.y - by; const d = Math.hypot(ux, uy); ux /= d; uy /= d; return {gx: bx - ux * 2 * R, gy: by - uy * 2 * R, ux, uy, d}; };
  const pathClear = (pts, x1, y1, x2, y2, skip) => { const ex = x2 - x1, ey = y2 - y1, l2 = ex * ex + ey * ey || 1e-9;
    return pts.every((p, i) => { if (skip.includes(i)) return true; let t = clamp(((p[0] - x1) * ex + (p[1] - y1) * ey) / l2, 0, 1); return Math.hypot(x1 + t * ex - p[0], y1 + t * ey - p[1]) > 2 * R + 0.5; }); };
  const sim = (bs, sh) => runSim(bs, sh, false);
  const potted = (S, n) => S.ev.potted.some(p => p.n === n);
  const r2 = v => Math.round(v * 100) / 100, r6 = v => Math.round(v * 1e6) / 1e6;
  const shotOut = s => ({angle: r6(s.angle), power: s.power, sx: s.sx || 0, sy: s.sy || 0});
  const ballsOut = bs => bs.filter(b => b.n > 0).map(b => [b.n, r2(b.x), r2(b.y)]);
  // Prüft einen Stoß gegen die Regeln einer Herausforderung (wie im Spiel)
  function check(lv, bs, S, need) {
    const ev = S.ev;
    if (ev.cuePotted || ev.first === null) return false;
    if ((lv.bomb || []).some(b => ev.touched.has(b))) return false;
    if (lv.pocket && ev.potted.some(p => lv.pocket[p.n] !== undefined && lv.pocket[p.n] !== p.pocket)) return false;
    if ((lv.order || lv.first) && ev.first !== need[0]) return false;
    if (lv.kick && !ev.kick) return false;
    if (lv.bank && ev.potted.some(p => need.includes(p.n) && !(ev.railCount[p.n] > 0))) return false;
    return true;
  }
  function targetsOf(lv, on) {
    let arr = [...on];
    if (lv.targets) arr = arr.filter(n => lv.targets.includes(n)); else if (lv.bomb) arr = arr.filter(n => !lv.bomb.includes(n));
    if (lv.first && arr.length) return on.has(lv.first) ? [lv.first] : arr;
    if (lv.order && arr.length) return [Math.min(...arr)];
    return arr;
  }
  const leftOf = (lv, bs) => { const on = new Set(bs.filter(b => b.on && b.n > 0).map(b => b.n)); let arr = [...on]; if (lv.targets) arr = arr.filter(n => lv.targets.includes(n)); else if (lv.bomb) arr = arr.filter(n => !lv.bomb.includes(n)); return arr.length; };
  // Gieriger Löser: beste Stöße nacheinander (für Abräum-Level)
  function solveGreedy(lv, maxShots) {
    let bs = mk(lv.cue, lv.balls); const sol = [];
    for (let shot = 0; shot < maxShots; shot++) {
      const on = new Set(bs.filter(b => b.on && b.n > 0).map(b => b.n)), need = targetsOf(lv, on), cue = bs.find(b => b.n === 0);
      const angles = new Set();
      const tg = (lv.order || lv.first) ? need : [...on].filter(n => !(lv.bomb || []).includes(n));
      for (const t of tg) for (let k = 0; k < 6; k++) { const b = bs.find(x => x.n === t), g = ghost(b.x, b.y, k); const a = Math.atan2(g.gy - cue.y, g.gx - cue.x); for (let da = -0.012; da <= 0.012; da += 0.002) angles.add(a + da); }
      let best = null;
      for (const a of angles) for (const pw of [0.3, 0.45, 0.6, 0.8]) for (const sy of [0, -0.4, 0.4]) {
        const sh = {angle: Math.round(a * 1e6) / 1e6, power: pw, sx: 0, sy}, S = sim(bs, sh);
        if (!check(lv, bs, S, need)) continue;
        const pots = S.ev.potted.filter(p => need.includes(p.n) || targetsOf({...lv, order: false, first: null}, on).includes(p.n)).length;
        if (!pots) continue;
        // Folgestoß-Bewertung: wie leicht ist der nächste Stoß
        const left = leftOf(lv, S.balls);
        const sc = pots * 100 - left * 10 + Math.random();
        if (!best || sc > best.sc) best = {sc, S, sh, left};
      }
      if (!best) return null;
      sol.push(shotOut(best.sh)); bs = cloneBalls(best.S.balls);
      if (best.left === 0) { const c = bs.find(b => b.n === 0); if (lv.zone && Math.hypot(c.x - lv.zone.x, c.y - lv.zone.y) > lv.zone.r) return null; return sol; }
    }
    return null;
  }
  // Einen Stoß über alle Winkel suchen
  function sweep(bs, ok, powers, spins, step) {
    for (const pw of powers) for (const [sx, sy] of spins) for (let a = 0; a < TAU; a += step) { const sh = {angle: a, power: pw, sx, sy}, S = sim(bs, sh); if (ok(S)) return {sh, S}; }
    return null;
  }
  // Zufällige Zielkugel mit Tasche und Weißer im gewünschten Schnittwinkel
  function shotSetup(cutDeg, dist, opts) {
    for (let tries = 0; tries < 400; tries++) {
      const k = opts.pockets[Math.floor(rnd() * opts.pockets.length)], ap = AIM_PTS[k];
      const ang = rnd() * TAU, dp = opts.dp[0] + rnd() * (opts.dp[1] - opts.dp[0]);
      const tx = ap.x + Math.cos(ang) * dp, ty = ap.y + Math.sin(ang) * dp;
      if (!inTable(tx, ty, 2) || nearPocket(tx, ty, 9)) continue;
      const g = ghost(tx, ty, k);
      if ((k === 1 || k === 4) && Math.abs(g.uy) < 0.55) continue;
      const cut = cutDeg * Math.PI / 180 * (rnd() < 0.5 ? -1 : 1), ca = Math.atan2(g.uy, g.ux) + cut;
      const cx = g.gx - Math.cos(ca) * dist, cy = g.gy - Math.sin(ca) * dist;
      if (!inTable(cx, cy, 3) || nearPocket(cx, cy, 12)) continue;
      return {k, tx, ty, cx, cy, g};
    }
    return null;
  }
  // Prüft das fertige Level genau so, wie es gespeichert wird (gerundete Werte)
  function validate(lv) {
    let bs = mk(lv.cue, lv.balls);
    for (const s of lv.sol) {
      const on = new Set(bs.filter(b => b.on && b.n > 0).map(b => b.n)), need = targetsOf(lv, on);
      const S = sim(bs, s);
      if (!check(lv, bs, S, need)) return false;
      bs = cloneBalls(S.balls);
      if (leftOf(lv, bs) === 0) {
        const c = bs.find(b => b.n === 0);
        if (lv.zone && (!c.on || Math.hypot(c.x - lv.zone.x, c.y - lv.zone.y) > lv.zone.r)) return false;
        return true;
      }
    }
    return false;
  }
  return {validate, setSeed, rnd, mk, inTable, nearPocket, free, ghost, pathClear, sim, potted, check, targetsOf, solveGreedy, sweep, shotSetup, shotOut, ballsOut, r2};
})();

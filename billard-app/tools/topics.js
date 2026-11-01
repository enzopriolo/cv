// Erzeugt die Herausforderungen eines Themas (läuft im Browser-Kontext)
window.makeTopic = function (t) {
  const g = GEN, out = [];
  g.setSeed(1000 + t * 7919);
  const nums = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
  const pick = () => nums[Math.floor(g.rnd() * nums.length)];
  let guard = 0;
  while (out.length < 15 && guard++ < 80000) {
    const i = out.length;
    let lv = null;
    if (t === 0) { // Zielen & Geisterkugel: gerade bis sehr dünne Schnitte, später ohne Hilfslinien
      const cut = Math.min(72, i * 5 + g.rnd() * 4), dist = 25 + i * 6;
      const pockets = cut > 45 ? [0, 2, 3, 5] : [0, 1, 2, 3, 4, 5];
      const s = g.shotSetup(cut, dist, {pockets, dp: [20, 50 + i * 4]}); if (!s) continue;
      const n = pick(), bs = g.mk([s.cx, s.cy], [[n, s.tx, s.ty]]);
      const a = Math.atan2(s.g.gy - s.cy, s.g.gx - s.cx); let sol = null;
      for (const pw of [0.4, 0.55, 0.7, 0.3, 0.85]) { const S = g.sim(bs, {angle: a, power: pw}); if (g.potted(S, n) && !S.ev.cuePotted) { sol = {angle: a, power: pw}; break; } }
      if (!sol) continue;
      const lines = i >= 13 ? 'aim' : i >= 10 ? 'guide' : undefined;
      const names = ['Gerade drauf', 'Leichter Schnitt', 'Halbe Kugel', 'Mittelschnitt', 'Ecke anvisieren', 'Weiter Weg', 'Viertelkugel', 'Spitzer Winkel', 'Feinarbeit', 'Hauchdünn', 'Nur Hilfslinie I', 'Nur Hilfslinie II', 'Nur Hilfslinie III', 'Nur Ziellinie I', 'Nur Ziellinie II'];
      lv = {name: names[i], desc: (lines === 'aim' ? 'Nur die Ziellinie bis zur Geisterkugel – den Schnitt schätzt du selbst ein. ' : lines === 'guide' ? 'Nur die einfache Hilfslinie. ' : '') + 'Versenke die ' + n + ' – Schnittwinkel etwa ' + Math.round(cut) + '°.', cue: [g.r2(s.cx), g.r2(s.cy)], balls: [[n, g.r2(s.tx), g.r2(s.ty)]], lines, shots: 2, par: 1, sol: [g.shotOut(sol)]};
      if (i >= 6 && i % 3 === 0) lv.pocket = {[n]: s.k}, lv.desc += ' Nur in die markierte Tasche.';
    } else if (t === 1) { // Kombinationen: zwei, später drei Kugeln
      const three = i >= 9, gap = 0.5 + i * 0.6, mis = i * 0.008;
      const k = [0, 1, 2, 3, 4, 5][Math.floor(g.rnd() * 6)], ap = AIM_PTS[k], ang = g.rnd() * TAU, dp = 15 + g.rnd() * 30;
      const cx0 = ap.x + Math.cos(ang) * dp, cy0 = ap.y + Math.sin(ang) * dp;
      if (!g.inTable(cx0, cy0, 3) || g.nearPocket(cx0, cy0, 9)) continue;
      const chain = [[cx0, cy0]]; let ok = true;
      for (let j = 0; j < (three ? 2 : 1); j++) {
        const [px, py] = chain[chain.length - 1], gg = j === 0 ? g.ghost(px, py, k) : null;
        // Richtung zur Tasche hin: neue Kugel kommt auf die abgewandte Seite
        let ux = gg ? gg.ux : chain[chain.length - 2][0] - chain[chain.length - 1][0], uy = gg ? gg.uy : chain[chain.length - 2][1] - chain[chain.length - 1][1]; const l = Math.hypot(ux, uy); ux /= l; uy /= l;
        const rot = (g.rnd() - 0.5) * 2 * mis, c = Math.cos(rot), s2 = Math.sin(rot), vx = ux * c - uy * s2, vy = ux * s2 + uy * c;
        const nx = px - vx * (2 * R + gap), ny = py - vy * (2 * R + gap);
        if (!g.inTable(nx, ny, 2)) { ok = false; break; }
        chain.push([nx, ny]);
      }
      if (!ok) continue;
      const last = chain[chain.length - 1], prev = chain[chain.length - 2];
      let ux = prev[0] - last[0], uy = prev[1] - last[1]; const l = Math.hypot(ux, uy); ux /= l; uy /= l;
      const cd = 30 + g.rnd() * 40 + i * 3, cutc = (g.rnd() - 0.5) * (0.3 + i * 0.04);
      const ca = Math.atan2(uy, ux) + cutc, cx = last[0] - Math.cos(ca) * cd, cy = last[1] - Math.sin(ca) * cd;
      if (!g.inTable(cx, cy, 3) || g.nearPocket(cx, cy, 12)) continue;
      const ns = [pick()]; while (ns.length < chain.length) { const n = pick(); if (!ns.includes(n)) ns.push(n); }
      const balls = chain.map((p, j) => [ns[j], p[0], p[1]]), target = ns[0], first = ns[ns.length - 1];
      const lvb = {targets: [target], first};
      const bs = g.mk([cx, cy], balls);
      const tb = bs.find(b => b.n === first);
      const a0 = Math.atan2(tb.y - cy, tb.x - cx); let found = null;
      for (let da = -0.25; da <= 0.25 && !found; da += 0.002) for (const pw of [0.5, 0.7, 0.9]) { const S = g.sim(bs, {angle: a0 + da, power: pw}); if (g.potted(S, target) && !S.ev.cuePotted && S.ev.first === first) { found = {angle: a0 + da, power: pw}; break; } }
      if (!found) continue;
      const names = ['Kette', 'Doppel', 'Anstupser', 'Durchreicher', 'Schräg weiter', 'Domino', 'Stellvertreter', 'Umweg', 'Präzisionskette', 'Dreierkette', 'Lange Leitung', 'Kettenreaktion', 'Dreifach', 'Meisterkette', 'Kombi-König'];
      lv = {name: names[i], desc: 'Versenke die ' + target + ' – triff aber zuerst die ' + first + (three ? ' (über ' + ns[1] + ')' : '') + '.', cue: [g.r2(cx), g.r2(cy)], balls: balls.map(b => [b[0], g.r2(b[1]), g.r2(b[2])]), ...lvb, shots: 2, par: 1, sol: [g.shotOut(found)]};
    } else if (t === 2) { // Banden: Kick-Shots und Bandenstöße
      const kick = i % 2 === 0, cx = 20 + g.rnd() * (W - 40), cy = 15 + g.rnd() * (H - 30);
      const n = pick(); const s = g.shotSetup(0, 20, {pockets: [0, 1, 2, 3, 4, 5], dp: [12, 40]}); if (!s) continue;
      if (Math.hypot(cx - s.tx, cy - s.ty) < 60) continue;
      const balls = [[n, s.tx, s.ty]], lvb = {};
      if (kick) {
        // Sperrkugel auf den direkten Weg
        const bx = (cx + s.tx) / 2 + (g.rnd() - 0.5) * 4, by = (cy + s.ty) / 2 + (g.rnd() - 0.5) * 4;
        if (!g.inTable(bx, by, 2)) continue;
        balls.push([8, bx, by]); lvb.kick = true; lvb.bomb = [8];
        if (i >= 8) { const bx2 = (cx * 0.25 + s.tx * 0.75), by2 = (cy * 0.25 + s.ty * 0.75) + (g.rnd() - 0.5) * 6; if (g.inTable(bx2, by2, 2) && Math.hypot(bx2 - s.tx, by2 - s.ty) > 8) { balls.push([pick() === n ? 15 : 14, bx2, by2]); lvb.bomb.push(balls[balls.length - 1][0]); } }
      } else lvb.bank = true;
      const lvt = {...lvb, balls};
      const bs = g.mk([cx, cy], balls);
      const res = g.sweep(bs, S => g.potted(S, n) && g.check(lvt, bs, S, [n]), [0.45, 0.65, 0.85], [[0, 0]], Math.PI / 720);
      if (!res) continue;
      const names = kick ? ['Erster Kick', 'Umleitung', 'Bandenumweg', 'Versteckspiel', 'Über Eck', 'Hindernislauf', 'Doppelte Deckung', 'Kick-Profi'] : ['Erste Bande', 'Spiegelbild', 'Rückpass', 'Querschläger', 'Eins-Bande', 'Langer Bogen', 'Bandenkönig'];
      lv = {name: names[Math.floor(i / 2)], desc: kick ? 'Die Weiße muss zuerst eine Bande treffen. Rot markierte Kugeln nicht berühren!' : 'Versenke die ' + n + ' – sie muss vorher eine Bande berühren.', cue: [g.r2(cx), g.r2(cy)], balls: balls.map(b => [b[0], g.r2(b[1]), g.r2(b[2])]), ...lvb, shots: 3, par: 1, sol: [g.shotOut(res.sh)]};
    } else if (t === 3) { // Effet: Stopp, Nachlauf, Rücklauf mit Zielkreis
      const type = i % 3, n = pick();
      const s = g.shotSetup(Math.min(25, i * 2), 35 + g.rnd() * 30 + i * 2, {pockets: [0, 2, 3, 5], dp: [25, 60]}); if (!s) continue;
      const bs = g.mk([s.cx, s.cy], [[n, s.tx, s.ty]]), a = Math.atan2(s.g.gy - s.cy, s.g.gx - s.cx);
      const sy = type === 0 ? -(0.2 + g.rnd() * 0.25) : type === 1 ? 0.45 + g.rnd() * 0.33 : -(0.5 + g.rnd() * 0.28); // Effet nie im Fehlstoß-Bereich (> 0,8)
      const pw = type === 0 ? 0.25 + g.rnd() * 0.2 : 0.3 + g.rnd() * 0.35;
      const S = g.sim(bs, {angle: a, power: pw, sy}); if (!g.potted(S, n) || S.ev.cuePotted) continue;
      const c = S.balls.find(b => b.n === 0), r = Math.max(5, 10 - i * 0.35);
      if (!g.inTable(c.x, c.y, 1)) continue;
      // Ohne Effet darf der Kreis nicht erreichbar sein
      let easy = false;
      for (const p2 of [0.15, 0.25, 0.35, 0.45, 0.55, 0.7, 0.85]) { const S2 = g.sim(bs, {angle: a, power: p2}); const c2 = S2.balls.find(b => b.n === 0); if (g.potted(S2, n) && c2.on && Math.hypot(c2.x - c.x, c2.y - c.y) <= r) { easy = true; break; } }
      if (easy && type !== 0) continue;
      const names = ['Stopp I', 'Nachlauf I', 'Rücklauf I', 'Stopp II', 'Nachlauf II', 'Rücklauf II', 'Stopp III', 'Nachlauf III', 'Rücklauf III', 'Stopp IV', 'Nachlauf IV', 'Rücklauf IV', 'Stopp-Meister', 'Nachlauf-Meister', 'Rücklauf-Meister'];
      const tip = type === 0 ? 'Stoppball: wenig Kraft, knapp unter der Mitte.' : type === 1 ? 'Nachläufer: Effet oben.' : 'Rückläufer: Effet weit unten.';
      lv = {name: names[i], desc: 'Versenke die ' + n + ' und bring die Weiße in den goldenen Kreis. ' + tip, cue: [g.r2(s.cx), g.r2(s.cy)], balls: [[n, g.r2(s.tx), g.r2(s.ty)]], zone: {x: g.r2(c.x), y: g.r2(c.y), r: g.r2(r)}, shots: 2, par: 1, sol: [g.shotOut({angle: a, power: pw, sy})]};
    } else if (t === 4) { // Seiteneffet: über die Bande in den Zielkreis
      const n = pick(), s = g.shotSetup(Math.min(30, 5 + i * 2), 30 + g.rnd() * 30, {pockets: [0, 2, 3, 5], dp: [25, 60]}); if (!s) continue;
      const bs = g.mk([s.cx, s.cy], [[n, s.tx, s.ty]]), a = Math.atan2(s.g.gy - s.cy, s.g.gx - s.cx);
      const sx = (g.rnd() < 0.5 ? -1 : 1) * (0.45 + g.rnd() * 0.25), sy = (g.rnd() - 0.3) * 0.5, pw = 0.55 + g.rnd() * 0.35;
      const S = g.sim(bs, {angle: a, power: pw, sx, sy}); if (!g.potted(S, n) || S.ev.cuePotted) continue;
      const c = S.balls.find(b => b.n === 0), r = Math.max(6, 11 - i * 0.3);
      if (!g.inTable(c.x, c.y, 1)) continue;
      let easy = false;
      for (const p2 of [0.4, 0.55, 0.7, 0.85, 1]) for (const sy2 of [-0.6, -0.3, 0, 0.3, 0.6]) { const S2 = g.sim(bs, {angle: a, power: p2, sy: sy2}); const c2 = S2.balls.find(b => b.n === 0); if (g.potted(S2, n) && c2.on && Math.hypot(c2.x - c.x, c2.y - c.y) <= r + 2) { easy = true; break; } }
      if (easy) continue;
      const names = ['Dreh mal', 'Links rum', 'Rechts rum', 'Bandenkurve', 'Schräglage', 'Seitenwechsel', 'Englisch', 'Kurvenlage', 'Drall', 'Schnitt mit Dreh', 'Zwei Banden', 'Spin-Kunst', 'Effet-Profi', 'Drehmeister', 'Kunststoß'];
      lv = {name: names[i], desc: 'Versenke die ' + n + ' und bring die Weiße mit Seiteneffet (' + (sx < 0 ? 'links' : 'rechts') + ') über die Bande in den Kreis.', cue: [g.r2(s.cx), g.r2(s.cy)], balls: [[n, g.r2(s.tx), g.r2(s.ty)]], zone: {x: g.r2(c.x), y: g.r2(c.y), r: g.r2(r)}, shots: 2, par: 1, sol: [g.shotOut({angle: a, power: pw, sx, sy})]};
    } else { // Stellungsspiel & Abräumen
      const cnt = Math.min(9, 3 + Math.floor(i / 2)), order = i % 2 === 1, pts = [];
      const cue = [30 + g.rnd() * 50, 20 + g.rnd() * (H - 40)];
      pts.push(cue);
      const balls = [];
      const pool = order ? [1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, cnt) : nums.slice().sort(() => g.rnd() - 0.5).slice(0, cnt);
      for (const n of pool) { let p = null; for (let k = 0; k < 200; k++) { const x = 12 + g.rnd() * (W - 24), y = 10 + g.rnd() * (H - 20); if (g.free(pts, x, y, 2 * R + 3) && !g.nearPocket(x, y, 8)) { p = [x, y]; break; } } if (!p) break; pts.push(p); balls.push([n, g.r2(p[0]), g.r2(p[1])]); }
      if (balls.length < cnt) continue;
      const lvb = {cue: [g.r2(cue[0]), g.r2(cue[1])], balls, order: order || undefined};
      const sol = g.solveGreedy(lvb, cnt + 3); if (!sol) continue;
      const names = ['Aufwärmen', 'Der Reihe nach', 'Kleines Feld', 'Zählen lernen', 'Vierer-Pack', 'Rechenaufgabe', 'Fünf gewinnt', 'Ordnung muss sein', 'Halbes Dutzend', 'Siebener-Lauf', 'Gemischte Tüte', 'Acht in Folge', 'Großer Tisch', 'Neuner-Lauf', 'Grand Final'];
      lv = {name: names[i], desc: (order ? 'Räume ' + cnt + ' Kugeln der Reihe nach ab (immer die niedrigste zuerst).' : 'Räume alle ' + cnt + ' Kugeln ab.') + ' Plane die Weiße für den nächsten Stoß!', ...lvb, shots: cnt + 4, par: Math.max(1, Math.min(cnt, sol.length + 1)), sol};
    }
    if (lv && g.validate(lv)) out.push(lv);
  }
  return out;
};

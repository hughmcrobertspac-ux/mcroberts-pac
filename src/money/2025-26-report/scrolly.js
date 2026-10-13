/* "Follow the money": a scroll-driven unit chart. One square = $100.
   Canvas stage + DOM labels; IntersectionObserver picks the scene; each narrative step names its scene with data-scene. */
(function () {
  const R = window.REPORT;
  const stage = document.getElementById("stage");
  if (!stage) return;
  const canvas = stage.querySelector("canvas");
  const labelsEl = stage.querySelector(".stage-labels");
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrowMQ = window.matchMedia("(max-width: 900px)");

  const STUDENTS = Math.round(R.accounts.gaming.grant.value / R.rates.gamingPerStudent); // about 1,035 (grant ÷ rate)
  const GRANT = Math.round(R.accounts.gaming.grant.value / 100);              // 207
  const depts = R.wishlist.departments.map(d => ({ name: d.name, n: Math.max(1, Math.round(d.requested / 100)), v: d.requested }));
  const REQ = depts.reduce((a, d) => a + d.n, 0);                            // 215
  const APPROVED = Math.round(R.wishlist.approved.value / 100);               // 194
  const DAG = Math.round(R.dag.paid.value / 100);                             // 20: the Dry After Grad bus, the cheque's last squares
  const PAID = Math.round(R.accounts.gaming.wishCheque.value / 100);          // 229: the 2025–26 wish-list cheque
  const split = k => R.accounts.gaming.wishCheque.split.find(p => p.key === k);
  const FAMILY = Math.round(R.accounts.operating.moneyIn.value / 100);        // 17: into the family fund, Sep 2025 – Aug 2026
  const money = window.PACViz.money;
  const SCH = R.scholarships;                                                // 2025–26: three $500 awards, from the family fund and a parent
  const SCHOLAR_GOAL = R.appeal.goals.find(g => g.label.startsWith("Grade 12")).target;
  const POOL = Math.max(REQ, APPROVED + DAG + 40, PAID, 260);

  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let C = {};
  const readColors = () => { C = { gaming: css("--gaming"), operating: css("--operating"), dag: css("--dag"), ink2: css("--text-muted") }; };

  const mk = () => ({ x: 0, y: 0, s: 0, a: 0, tx: 0, ty: 0, ts: 0, ta: 0, delay: 0, color: "gaming", hollow: false, dashed: false });
  const dots = Array.from({ length: STUDENTS }, mk);
  const tiles = Array.from({ length: POOL }, mk);
  let W = 0, H = 0, dpr = 1, step = null, raf = 0;

  function size() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(260, r.width); H = Math.max(260, r.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
  }
  const gridPos = (i, c, t, g, x0, y0) => [x0 + (i % c) * (t + g), y0 + Math.floor(i / c) * (t + g)];
  function fitBlock(n, maxW, maxH, gapRatio, capT) {
    let best = { t: 2, c: n };
    for (let c = 1; c <= n; c++) {
      const rows = Math.ceil(n / c);
      const t = Math.min(maxW / (c + (c - 1) * gapRatio), maxH / (rows + (rows - 1) * gapRatio), capT || 1e9);
      if (t > best.t + 0.01) best = { t, c };
    }
    best.g = best.t * gapRatio;
    best.w = best.c * best.t + (best.c - 1) * best.g;
    best.h = Math.ceil(n / best.c) * best.t + (Math.ceil(n / best.c) - 1) * best.g;
    return best;
  }
  function setLabels(list) {
    labelsEl.innerHTML = "";
    list.forEach(l => {
      const d = document.createElement("div");
      d.className = "sl " + (l.cls || "");
      d.style.left = l.x + "px"; d.style.top = l.y + "px";
      if (l.w) d.style.width = l.w + "px";
      d.innerHTML = l.html;
      labelsEl.appendChild(d);
    });
  }
  function hideAll() {
    [...dots, ...tiles].forEach(o => { o.ta = 0; o.ts = 0; o.tx = W / 2; o.ty = H / 2; o.delay = 0; o.hollow = false; o.dashed = false; });
  }
  // Start a scene from an empty stage: every square is hidden, then the first n grow in place, column by column.
  function redraw(n, c) {
    [...dots, ...tiles].forEach(o => { o.a = 0; o.s = 0; });
    for (let i = 0; i < n; i++) { const t = tiles[i]; t.x = t.tx; t.y = t.ty; t.delay = (i % c) * 0.5; }
  }

  function layout(key, prev) {
    readColors();
    const narrow = W < 560;
    const pad = narrow ? 16 : Math.min(40, W * 0.06);
    const top = pad + (narrow ? 44 : 34);
    const availW = W - pad * 2, availH = H - top - pad - 44;
    // Scene titles start at the block's left edge, or at the stage padding on a narrow stage so they stay on one line.
    const hx = x => narrow ? pad : x;
    // one unit size for every "$100" square, so sizes compare across steps
    const U = fitBlock(APPROVED + DAG + 30, availW, availH, 0.18, 26);
    const T = U.t, G = T * 0.18;
    const vy = h => narrow ? top : top + Math.max(0, (availH - h) / 2);        // vertical placement
    const block = (n, cols) => { const c = cols || U.c; const rows = Math.ceil(n / c); return { c, w: c * T + (c - 1) * G, h: rows * T + (rows - 1) * G }; };
    const L = [];
    hideAll();

    if (key === "students") {
      const b = fitBlock(STUDENTS, availW, availH, 0.6);
      const x0 = pad + (availW - b.w) / 2, y0 = vy(b.h);
      dots.forEach((d, i) => { const [x, y] = gridPos(i, b.c, b.t, b.g, x0, y0); Object.assign(d, { tx: x + b.t / 2, ty: y + b.t / 2, ts: b.t / 2, ta: 1 }); });
      L.push({ x: hx(x0), y: y0 - 30, w: W - pad - hx(x0), cls: "wr", html: narrow ? `About <b>${STUDENTS.toLocaleString("en-CA")}</b> students · one dot each` : `About <b>${STUDENTS.toLocaleString("en-CA")}</b> students counted for the grant · one dot each` });
    }
    if (key === "grant") {
      const b = block(GRANT, Math.min(U.c, Math.ceil(Math.sqrt(GRANT * 2.2))));
      const x0 = pad + (availW - b.w) / 2, y0 = vy(b.h);
      dots.forEach((d, i) => { const k = Math.floor(i / 5); const [x, y] = gridPos(k, b.c, T, G, x0, y0); Object.assign(d, { tx: x + T / 2, ty: y + T / 2, ts: 0, ta: 0, delay: (k % b.c) * 0.4 }); });
      tiles.slice(0, GRANT).forEach((t, i) => { const [x, y] = gridPos(i, b.c, T, G, x0, y0); Object.assign(t, { tx: x, ty: y, ts: T, ta: 1, color: "gaming", delay: (i % b.c) * 0.5 + 6 }); });
      L.push({ x: hx(x0), y: y0 - 30, w: W - pad - hx(x0), cls: "wr", html: `<b>${money(R.accounts.gaming.grant.value, 0)}</b> gaming grant · 1 square = $100` });
    }
    if (key === "asks") {
      // one cluster per school group, flowed into rows, centred vertically
      let t = Math.min(T, 22), placed, tries = 0, bottom = 0;
      do {
        placed = []; let x = pad, y = top, rowH = 0; const g = t * 0.18;
        for (const d of depts) {
          const c = Math.max(2, Math.ceil(Math.sqrt(d.n * 1.4)));
          const rows = Math.ceil(d.n / c), w = c * t + (c - 1) * g, h = rows * t + (rows - 1) * g;
          const cellW = Math.max(w, narrow ? Math.floor((availW - 24) / 3) : 118);
          if (x + cellW > W - pad && x > pad) { x = pad; y += rowH + (narrow ? 44 : 52); rowH = 0; }
          placed.push({ d, c, x, y, w, h, g });
          x += cellW + (narrow ? 12 : 22); rowH = Math.max(rowH, h);
        }
        bottom = y + rowH + 40;
        if (bottom <= H - pad || tries > 14) break;
        t *= 0.9; tries++;
      } while (true);
      const dy = narrow ? 0 : Math.max(0, (H - pad - bottom) / 2);
      let k = 0;
      placed.forEach(p => {
        for (let i = 0; i < p.d.n; i++, k++) {
          const [x, y] = gridPos(i, p.c, t, p.g, p.x, p.y + dy);
          Object.assign(tiles[k], { tx: x, ty: y, ts: t, ta: 1, color: "gaming", hollow: true, delay: i * 0.3 });
        }
        L.push({ x: p.x, y: p.y + dy + p.h + 6, w: narrow ? 100 : 150, cls: "small", html: `${p.d.name}<br><span>$${Math.round(p.d.v).toLocaleString("en-CA")}</span>` });
      });
      L.push({ x: pad, y: top + dy - 30, w: availW, cls: "wr", html: `<b>${money(R.wishlist.requested.value, 0)}</b> asked for by ${R.wishlist.groups} school groups` });
    }
    if (key === "approved" || key === "paid") {
      const total = key === "approved" ? APPROVED : PAID;
      const b = block(total);
      const x0 = pad + (availW - b.w) / 2, y0 = vy(b.h);
      for (let i = 0; i < total; i++) { const [x, y] = gridPos(i, U.c, T, G, x0, y0); Object.assign(tiles[i], { tx: x, ty: y, ts: T, ta: 1, color: "gaming" }); }
      if (key === "approved") {
        L.push({ x: hx(x0), y: y0 - 30, w: W - pad - hx(x0), cls: "wr", html: `<b>${money(R.wishlist.approved.value, 0)}</b> approved for the wish list` });
      } else {
        // The cheque in two colours: the wish list, then the Dry After Grad bus in its last squares.
        for (let i = PAID - DAG; i < PAID; i++) tiles[i].color = "dag";
        const paid = money(R.accounts.gaming.wishCheque.value, 0);
        L.push({ x: hx(x0), y: y0 - 30, w: W - pad - hx(x0), cls: "wr", html: narrow ? `<b>${paid}</b> paid in August 2026` : `<b>${paid}</b> paid to the school in August 2026` });
        // Only the colour key goes under the squares; the step card carries the rest, so the label fits a phone's short stage.
        L.push({ x: x0, y: y0 + b.h + 12, w: Math.min(W - pad - x0, 460), cls: "small wr", html: `<span class="k g"></span> <span>${money(split("wish").value, 0)}</span> for the wish list · <span class="k d"></span> <span>${money(split("dag").value, 0)}</span> for the Dry After Grad bus` });
      }
      // The cheque is drawn as a new picture rather than grown out of the approved block (and the approved
      // block is redrawn on the way back), so the move between the two scenes adds or removes no squares.
      if (key === "paid" || prev === "paid") redraw(total, U.c);
    }
    if (key === "family") {
      const b = block(FAMILY, 6);
      const x0 = pad + (availW - b.w) / 2, y0 = vy(b.h);
      for (let i = 0; i < FAMILY; i++) { const [x, y] = gridPos(i, 6, T, G, x0, y0); Object.assign(tiles[i], { tx: x, ty: y, ts: T, ta: 1, color: "operating", delay: i * 0.8 }); }
      L.push({ x: hx(x0), y: y0 - 30, w: W - pad - hx(x0), cls: "wr", html: `About <b>${money(FAMILY * 100, 0)}</b> into the family fund this year` });
    }
    if (key === "scholarSet") {
      // The 2025–26 awards as groups of five squares ($500 each), at the size of the 2026–27 goal groups so the two scenes compare.
      const groups = SCH.awards.value, per = Math.round(SCH.awards.each / 100);
      const t = Math.max(T, Math.min(40, (availW - 4 * 28) / (5 * 2.2)));
      const g = t * 0.18, gw = 2 * t + g, gh = 3 * t + 2 * g;
      const gap = Math.min(34, Math.max(12, (availW - 5 * gw) / 4));
      const spacing = gw + gap, totalW = groups * gw + (groups - 1) * gap;
      const x0 = pad + (availW - totalW) / 2, y0 = vy(gh + 40);
      let k = 0;
      for (let s = 0; s < groups; s++) {
        for (let i = 0; i < per; i++, k++) {
          const [x, y] = gridPos(i, 2, t, g, x0 + s * spacing, y0);
          Object.assign(tiles[k], { tx: x, ty: y, ts: t, ta: 1, color: "operating", delay: s * 3 + i * 0.4 });
        }
        L.push({ x: x0 + s * spacing, y: y0 + gh + 10, w: spacing, cls: "small", html: `No. ${s + 1}<br><span>${money(SCH.awards.each, 0)}</span>` });
      }
      L.push({ x: hx(x0), y: y0 - 30, w: W - pad - hx(x0), cls: "wr", html: narrow ? `<b>${money(SCH.total.value, 0)}</b> · ${groups} scholarships` : `<b>${money(SCH.total.value, 0)}</b> for ${groups} scholarships in June 2026` });
    }
    if (key === "scholarGoal") {
      const groups = 5;
      const t = Math.max(T, Math.min(40, (availW - (groups - 1) * 28) / (groups * 2.2)));   // bigger squares for the five goal groups
      const g = t * 0.18, gw = 2 * t + g, gh = 3 * t + 2 * g;
      const gap = Math.min(34, Math.max(12, (availW - groups * gw) / Math.max(1, groups - 1)));
      const spacing = gw + gap, totalW = groups * gw + (groups - 1) * gap;
      const x0 = pad + (availW - totalW) / 2, y0 = vy(gh + 40);
      let k = 0;
      for (let s = 0; s < groups; s++) {
        for (let i = 0; i < 5; i++, k++) {
          const [x, y] = gridPos(i, 2, t, g, x0 + s * spacing, y0);
          Object.assign(tiles[k], { tx: x, ty: y, ts: t, ta: 0.9, color: "operating", hollow: true, dashed: true, delay: s * 3 + i * 0.4 });
        }
        L.push({ x: x0 + s * spacing, y: y0 + gh + 10, w: spacing, cls: "small", html: `No. ${s + 1}<br><span class="w">To fund</span>` });
      }
      L.push({ x: hx(x0), y: y0 - 30, w: W - pad - hx(x0), cls: "wr", html: narrow ? `2026⁠–⁠27 goal <b>${money(SCHOLAR_GOAL, 0)}</b> · 5 scholarships` : `Proposed 2026⁠–⁠27 goal <b>${money(SCHOLAR_GOAL, 0)}</b> · five scholarships` });
    }
    setLabels(L);
    if (reduce) { [...dots, ...tiles].forEach(o => { o.x = o.tx; o.y = o.ty; o.s = o.ts; o.a = o.ta; o.delay = 0; }); draw(); }
    else start();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.ink2;
    for (const d of dots) {
      if (d.a < 0.01 || d.s < 0.2) continue;
      ctx.globalAlpha = d.a * 0.8;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.s, 0, Math.PI * 2); ctx.fill();
    }
    for (const t of tiles) {
      if (t.a < 0.01 || t.s < 0.5) continue;
      ctx.globalAlpha = t.a;
      const col = C[t.color] || C.gaming, r = Math.min(3, t.s * 0.18);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(t.x, t.y, t.s, t.s, r); else ctx.rect(t.x, t.y, t.s, t.s);
      if (t.hollow) { ctx.setLineDash(t.dashed ? [3, 3] : []); ctx.lineWidth = 1.25; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.fillStyle = col; ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  function tick() {
    let moving = false;
    for (const o of dots.concat(tiles)) {
      if (o.delay > 0) { o.delay -= 1; moving = true; continue; }
      for (const [c, t] of [["x", "tx"], ["y", "ty"], ["s", "ts"], ["a", "ta"]]) {
        const dv = o[t] - o[c];
        if (Math.abs(dv) > 0.05) { o[c] += dv * 0.14; moving = true; } else o[c] = o[t];
      }
    }
    draw();
    raf = moving ? requestAnimationFrame(tick) : 0;
  }
  function start() { if (!raf) raf = requestAnimationFrame(tick); }
  const snap = () => { [...dots, ...tiles].forEach(o => { o.x = o.tx; o.y = o.ty; o.s = o.ts; o.a = o.ta; o.delay = 0; }); draw(); };

  const stepsEls = [...document.querySelectorAll(".scrolly .step")];
  const bar = document.getElementById("scrollyProgress");
  const setStep = key => {
    if (key === step) return;
    const prev = step;
    step = key;
    let idx = 0;
    stepsEls.forEach((el, i) => { const on = el.dataset.scene === key; el.classList.toggle("on", on); if (on) idx = i; });
    if (bar) bar.style.transform = `scaleX(${(idx + 1) / stepsEls.length})`;
    layout(key, prev);
  };
  let io;
  const observe = () => {
    if (io) io.disconnect();
    io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) setStep(e.target.dataset.scene); }); },
      { rootMargin: narrowMQ.matches ? "-72% 0px -18% 0px" : "-45% 0px -45% 0px", threshold: 0 });
    stepsEls.forEach(s => io.observe(s));
  };
  observe();
  narrowMQ.addEventListener && narrowMQ.addEventListener("change", observe);

  size(); readColors(); setStep(stepsEls[0].dataset.scene); snap();
  let rt;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { size(); const s = step; step = null; setStep(s); snap(); }, 100); }).observe(stage);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener && mq.addEventListener("change", () => { readColors(); draw(); });
  new MutationObserver(() => { readColors(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();

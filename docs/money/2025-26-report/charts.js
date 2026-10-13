/* Small SVG chart kit for the PAC report. No dependencies.
   Colors come from CSS custom properties so both themes and print work. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const money = (v, dp) => {
    if (v == null || isNaN(v)) return "—";
    const d = dp == null ? (Math.abs(v) % 1 ? 2 : 0) : dp;
    return (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-CA", { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  const kmoney = v => v >= 1000 ? "$" + (v / 1000).toLocaleString("en-CA", { maximumFractionDigits: 1 }) + "k" : "$" + v;
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, cls, anchor) {
    const t = el("text", { x, y, class: cls || "", "text-anchor": anchor || "start" }, parent);
    t.textContent = str;
    return t;
  }
  /* Plain-text version of a tooltip's HTML, for aria-label. */
  function plain(html) {
    const d = document.createElement("div");
    d.innerHTML = html.replace(/<br>/g, ". ").replace(/<span/g, " <span");
    return d.textContent.replace(/\s+/g, " ").trim();
  }
  /* Visually hidden data table placed after an interactive chart, so the numbers are readable without the pointer. */
  function dataTable(host, caption, heads, rows) {
    const w = document.createElement("div");
    w.className = "sr-only";
    const t = document.createElement("table");
    t.createCaption().textContent = caption;
    const hr = t.createTHead().insertRow();
    heads.forEach(h => { const th = document.createElement("th"); th.scope = "col"; th.textContent = h; hr.appendChild(th); });
    const tb = t.createTBody();
    rows.forEach(r => { const tr = tb.insertRow(); r.forEach((c, i) => { const cell = document.createElement(i === 0 ? "th" : "td"); if (i === 0) cell.scope = "row"; cell.textContent = c; tr.appendChild(cell); }); });
    w.appendChild(t);
    host.appendChild(w);
  }
  function niceMax(v, step) { return Math.ceil(v / step) * step; }

  /* Tooltip shared by all charts on a page */
  let tip;
  function tooltip() {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className = "viz-tip";
    tip.setAttribute("aria-hidden", "true"); // the same text is the aria-label of each focusable target
    tip.hidden = true;
    document.body.appendChild(tip);
    return tip;
  }
  function showTip(evt, html) {
    const t = tooltip();
    t.innerHTML = html;
    t.hidden = false;
    const pad = 14, r = t.getBoundingClientRect();
    let x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + r.width > window.innerWidth - 8) x = evt.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = evt.clientY - r.height - pad;
    t.style.left = x + "px";
    t.style.top = y + "px";
  }
  function hideTip() { if (tip) tip.hidden = true; }
  const statusMeta = key => (window.REPORT.meta.statuses.find(s => s.key === key)) || {};
  const statusWord = s => statusMeta(s).description || "";
  /* Fill every [data-fmt] element from window.REPORT, so copy never repeats a figure. */
  function fillCopy(root) {
    const R = window.REPORT, G = R.accounts.gaming, W = R.wishlist, D = R.dag, O = R.accounts.operating, A = R.appeal;
    const headline = k => R.headline.find(h => h.key === k).value;
    const split = k => G.wishCheque.split.find(p => p.key === k);
    const scholarGoal = A.goals.find(g => g.label.startsWith("Grade 12")).target, staffGoal = A.goals.find(g => g.label.startsWith("Staff")).target;
    const T = {
      rate: money(R.rates.gamingPerStudent, 0), dagRate: money(R.rates.dagPerGrad, 0), scholarRate: money(R.rates.scholarship, 0),
      grant: money(G.grant.value, 0), grant2: money(G.grant.value, 2), requested: money(W.requested.value, 0), approved: money(W.approved.value, 0), approved2: money(W.approved.value, 2),
      dag: money(D.paid.value, 0), dag2: money(D.paid.value, 2),
      family: money(Math.round(O.moneyIn.value / 100) * 100, 0),
      paid: money(G.wishCheque.value, 0), wishChequeAmt: money(G.wishCheque.value, 2), gamingClosing: money(G.closing.value, 2),
      wishPart: money(split("wish").value, 0), wishPart2: money(split("wish").value, 2),
      scholarCount: ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][R.scholarships.awards.value] || String(R.scholarships.awards.value),
      scholarPaid: money(R.scholarships.fromFund.value, 0), scholarParent: money(R.scholarships.parentGift.value, 0), scholarTotal: money(R.scholarships.total.value, 0),
      scholarGoal: money(scholarGoal, 0), staffGoal: money(staffGoal, 0), scholarGap: money(scholarGoal - R.scholarships.total.value, 0),
      cheque: G.carriedCheque.number, chequeDate: G.carriedCheque.writtenLabel, chequeAmt: money(G.carriedCheque.value, 2)
    };
    root.querySelectorAll("[data-fmt]").forEach(n => { const v = T[n.dataset.fmt]; if (v == null) throw new Error("Unknown copy token " + n.dataset.fmt); n.textContent = v; });
  }
  const niceDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

  /* Month-end balance line for the gaming account */
  function balanceLine(host, opts) {
    const { data, width = host.clientWidth || 640, height = 280, annotate = true, interactive = true } = opts;
    host.innerHTML = "";
    const m = { t: 24, r: 16, b: 34, l: 54 };
    const W = Math.max(width, 300), H = height;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, class: "viz", role: interactive ? "group" : "img", "aria-label": opts.label || "Balance chart" });
    host.appendChild(svg);
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const yMax = niceMax(Math.max(...data.filter(d => d.v != null).map(d => d.v)) * 1.08, 5000);
    const x = i => m.l + (iw * (i + 0.5)) / data.length;
    const y = v => m.t + ih - (ih * v) / yMax;
    // grid
    const g = el("g", { class: "grid" }, svg);
    for (let v = 0; v <= yMax; v += 5000) {
      el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? "axis" : "gridline" }, g);
      text(g, m.l - 8, y(v) + 4, kmoney(v), "tick", "end");
    }
    // pending band
    const firstPending = data.findIndex((d, i) => d.v == null && data.slice(i).every(e => e.v == null));
    if (firstPending > 0) {
      const x0 = m.l + (iw * firstPending) / data.length;
      el("rect", { x: x0, y: m.t, width: W - m.r - x0, height: ih, class: "pending-band" }, svg);
      text(svg, (x0 + W - m.r) / 2, m.t + 16, (W - m.r - x0) > 90 ? "Pending" : "…", "pending-label", "middle");
    }
    // line (break on nulls), dashed bridge across one missing month
    let seg = [];
    const segs = [];
    data.forEach((d, i) => {
      if (d.v == null) { if (seg.length) segs.push(seg); seg = []; }
      else seg.push([x(i), y(d.v), d, i]);
    });
    if (seg.length) segs.push(seg);
    for (let s = 0; s < segs.length - 1; s++) {
      const a = segs[s][segs[s].length - 1], b = segs[s + 1][0];
      if (b[3] - a[3] === 2) el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: "bridge" }, svg);
    }
    segs.forEach(s => {
      if (s.length > 1) el("path", { d: "M" + s.map(p => `${p[0]},${p[1]}`).join(" L"), class: "line gaming" }, svg);
    });
    // x labels + markers
    data.forEach((d, i) => {
      const slot = iw / data.length;
      let lab = slot < 30 ? d.label.charAt(0) : d.label;
      if ((i === 0 || i === data.length - 1) && slot >= 44) lab = d.label + " ’" + d.m.slice(2, 4);
      text(svg, x(i), H - 12, lab, "tick" + (d.v == null ? " muted" : ""), "middle");
      if (d.v != null) {
        el("circle", { cx: x(i), cy: y(d.v), r: 4.5, class: "dot " + (d.status === "confirmed" ? "solid" : "ring") }, svg);
      }
    });
    if (annotate) {
      const badge = (i, n, dx, dy) => {
        const cx = x(i) + dx, cy = y(data[i].v) + dy;
        el("circle", { cx, cy, r: 9, class: "badge" }, svg);
        text(svg, cx, cy + 4, String(n), "badge-t", "middle");
      };
      data.forEach((d, i) => { if (d.badge) badge(i, d.badge, d.badge % 2 ? 16 : -16, d.badge % 2 ? 4 : -14); });
    }
    if (interactive) {
      data.forEach((d, i) => {
        const hit = el("rect", { x: m.l + (iw * i) / data.length, y: m.t, width: iw / data.length, height: ih, class: "hit", tabindex: 0 }, svg);
        const html = `<b>${d.label} ${d.m.slice(0, 4)}</b><br>${d.v == null ? "Pending" : money(d.v, 2)}<span class="tip-status">${d.v == null ? "" : statusWord(d.status)}</span>${d.note ? `<span class="tip-note">${d.note}</span>` : ""}`;
        hit.setAttribute("role", "img");
        hit.setAttribute("aria-label", plain(html));
        hit.addEventListener("mousemove", e => showTip(e, html));
        hit.addEventListener("mouseleave", hideTip);
        hit.addEventListener("focus", () => { const r = hit.getBoundingClientRect(); showTip({ clientX: r.left + r.width / 2, clientY: r.top + 40 }, html); });
        hit.addEventListener("blur", hideTip);
      });
      dataTable(host, opts.label || "Balance chart", ["Month", "Balance", "Status", "Note"], data.map(d => [`${d.label} ${d.m.slice(0, 4)}`, d.v == null ? "Pending" : money(d.v, 2), d.v == null ? "" : statusWord(d.status), d.note ? plain(d.note) : ""]));
    }
    return svg;
  }

  /* Horizontal bars (single series) */
  function barsH(host, opts) {
    const { rows, width = host.clientWidth || 600, rowH = 30, labelW = 150, cls = "gaming", onPick, interactive = true, valueFmt = v => money(v, 0) } = opts;
    host.innerHTML = "";
    const W = Math.max(width, 300), H = rows.length * rowH + 8;
    const lw = Math.min(labelW, W * 0.38);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, class: "viz", role: interactive ? "group" : "img", "aria-label": opts.label || "Bar chart" });
    host.appendChild(svg);
    const max = Math.max(...rows.map(r => r.v));
    const bw = W - lw - 78;
    rows.forEach((r, i) => {
      const y0 = i * rowH + 4, bh = rowH - 12;
      const g = el("g", { class: "bar-row" + (interactive ? " pickable" : ""), tabindex: interactive ? 0 : -1, role: interactive ? "button" : null, "aria-pressed": interactive ? "false" : null }, svg);
      text(g, lw - 10, y0 + bh / 2 + 5, r.label, "cat", "end");
      el("rect", { x: lw, y: y0, width: bw, height: bh, class: "track" }, g);
      const w = Math.max(6, (bw * r.v) / max), rr = Math.min(4, w / 2);
      el("path", { d: `M${lw},${y0} h${w - rr} a${rr},${rr} 0 0 1 ${rr},${rr} v${bh - 2 * rr} a${rr},${rr} 0 0 1 -${rr},${rr} h-${w - rr} Z`, class: "bar " + cls }, g);
      text(g, lw + w + 8, y0 + bh / 2 + 5, valueFmt(r.v), "val");
      if (interactive) {
        const html = `<b>${r.label}</b><br>${money(r.v, 2)} asked for${r.items ? `<span class="tip-note">${r.items.join(" · ")}</span>` : ""}`;
        g.setAttribute("aria-label", plain(html));
        g.addEventListener("mousemove", e => showTip(e, html));
        g.addEventListener("mouseleave", hideTip);
        const pick = () => { svg.querySelectorAll(".bar-row").forEach(n => { n.classList.remove("picked"); n.setAttribute("aria-pressed", "false"); }); g.classList.add("picked"); g.setAttribute("aria-pressed", "true"); onPick && onPick(r, i); };
        g.addEventListener("click", pick);
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      }
    });
    if (interactive) dataTable(host, opts.label || "Bar chart", ["Group", "Asked for"], rows.map(r => [r.label, money(r.v, 2)]));
    return svg;
  }

  /* Grant vs spent per year (two series, grouped) */
  function pairBars(host, opts) {
    const { rows, width = host.clientWidth || 640, height = 260, interactive = true } = opts;
    host.innerHTML = "";
    const m = { t: 16, r: 8, b: 36, l: 50 };
    const W = Math.max(width, 300), H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, class: "viz", role: "img", "aria-label": opts.label || "Grant and spending by year" });
    host.appendChild(svg);
    const yMax = niceMax(Math.max(...rows.flatMap(r => [r.grant, r.spent])) * 1.05, 10000);
    const y = v => m.t + ih - (ih * v) / yMax;
    for (let v = 0; v <= yMax; v += 10000) {
      el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? "axis" : "gridline" }, svg);
      text(svg, m.l - 8, y(v) + 4, kmoney(v), "tick", "end");
    }
    const gw = iw / rows.length, bw = Math.min(22, gw * 0.3);
    rows.forEach((r, i) => {
      const cx = m.l + gw * (i + 0.5);
      const g = el("g", { class: "pair" }, svg);
      [["grant", r.grant, cx - bw - 1], ["spent", r.spent, cx + 1]].forEach(([k, v, bx]) => {
        if (v > 0) {
          const h = y(0) - y(v);
          el("path", { d: `M${bx},${y(0)} v-${Math.max(h - 4, 0)} a4,4 0 0 1 4,-4 h${bw - 8} a4,4 0 0 1 4,4 v${Math.max(h - 4, 0)} Z`, class: "bar " + (k === "grant" ? "gaming" : "spent") }, g);
        } else {
          el("line", { x1: bx + 2, x2: bx + bw - 2, y1: y(0) - 1, y2: y(0) - 1, class: "zero " + k }, g);
        }
      });
      text(svg, cx, H - 14, gw < 70 ? (r.s || r.y) : r.y, "tick", "middle");
      if (interactive) {
        el("rect", { x: cx - gw / 2, y: m.t, width: gw, height: ih, class: "hit" }, g);
        const html = `<b>Grant year ${r.y}</b><br>Grant received ${money(r.grant, 0)}<br>Spent on students ${money(r.spent, 2)}${r.note ? `<span class="tip-note">${r.note}</span>` : ""}`;
        g.addEventListener("mousemove", e => showTip(e, html));
        g.addEventListener("mouseleave", hideTip);
      }
    });
    if (interactive) dataTable(host, opts.label || "Grant and spending by year", ["Grant year", "Grant received", "Spent on students", "Note"], rows.map(r => [r.y, money(r.grant, 0), money(r.spent, 2), r.note ? plain(r.note) : ""]));
    return svg;
  }

  /* One stacked bar with a 2px gap between parts */
  function stackBar(host, opts) {
    const { parts, width = host.clientWidth || 600, height = 28 } = opts;
    host.innerHTML = "";
    const W = Math.max(width, 280);
    const svg = el("svg", { viewBox: `0 0 ${W} ${height}`, width: "100%", height, class: "viz", role: "img", "aria-label": opts.label || "Stacked bar" });
    host.appendChild(svg);
    const total = parts.reduce((a, p) => a + p.value, 0), gap = 2;
    let x0 = 0;
    parts.forEach((p, i) => {
      const w = ((W - gap * (parts.length - 1)) * p.value) / total;
      const r = i === 0 ? "4,0,0,4" : i === parts.length - 1 ? "0,4,4,0" : "0,0,0,0";
      const [tl, tr, br, bl] = r.split(",").map(Number);
      el("path", { d: `M${x0 + tl},0 h${w - tl - tr} a${tr},${tr} 0 0 1 ${tr},${tr} v${height - tr - br} a${br},${br} 0 0 1 -${br},${br} h-${w - br - bl} a${bl},${bl} 0 0 1 -${bl},-${bl} v-${height - tl - bl} a${tl},${tl} 0 0 1 ${tl},-${tl} Z`, class: "bar " + p.cls }, svg);
      x0 += w + gap;
    });
    return svg;
  }

  /* Step line of reported balances (family fund) */
  function snapshotLine(host, opts) {
    const { data, width = host.clientWidth || 420, height = 170, interactive = true } = opts;
    host.innerHTML = "";
    const m = { t: 22, r: 18, b: 28, l: 46 };
    const W = Math.max(width, 260), H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, class: "viz", role: "img", "aria-label": opts.label || "Family fund balance" });
    host.appendChild(svg);
    const yMax = niceMax(Math.max(...data.map(d => d.v)) * 1.1, 500);
    const y = v => m.t + ih - (ih * v) / yMax;
    for (let v = 0; v < yMax; v += 1000) {
      el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? "axis" : "gridline" }, svg);
      text(svg, m.l - 8, y(v) + 4, kmoney(v), "tick", "end");
    }
    const x = i => m.l + (iw * i) / (data.length - 1);
    el("path", { d: "M" + data.map((d, i) => `${x(i)},${y(d.v)}`).join(" L"), class: "line operating" }, svg);
    data.forEach((d, i) => {
      el("circle", { cx: x(i), cy: y(d.v), r: 4.5, class: "dot operating " + (d.status === "confirmed" ? "solid" : "ring") }, svg);
      text(svg, x(i), H - 8, iw / (data.length - 1) < 26 ? d.label.charAt(0) : d.label, "tick", "middle");
      if (i === 0 || i === data.length - 1) text(svg, i === 0 ? x(i) - 4 : x(i), i === 0 ? y(d.v) - 14 : y(d.v) + 20, money(d.v, 0), "note strong", i === 0 ? "start" : "end");
      if (interactive) {
        const hit = el("rect", { x: x(i) - iw / (data.length - 1) / 2, y: m.t, width: iw / (data.length - 1), height: ih, class: "hit" }, svg);
        const html = `<b>${niceDate(d.date)}</b><br>${money(d.v, 2)}<span class="tip-status">${statusWord(d.status)}</span>${d.note ? `<span class="tip-note">${d.note}</span>` : ""}`;
        hit.addEventListener("mousemove", e => showTip(e, html));
        hit.addEventListener("mouseleave", hideTip);
      }
    });
    if (interactive) dataTable(host, opts.label || "Family fund balance", ["Date", "Balance", "Note"], data.map(d => [niceDate(d.date), money(d.v, 2), d.note || ""]));
    return svg;
  }

  window.PACViz = { fillCopy, statusMeta, money, kmoney, balanceLine, barsH, pairBars, stackBar, snapshotLine, statusWord, hideTip, niceDate };
})();

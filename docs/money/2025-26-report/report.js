/* The 2025–26 financial report page: fills index.html from data.js (window.REPORT) and draws the charts (charts.js).
   A file of its own, because the site's Content-Security-Policy allows no inline script. */
(function(){
  const R = window.REPORT, V = window.PACViz, $ = id => document.getElementById(id);
  const money = V.money, DRAFT = R.meta.mode === 'draft';
  const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const chip = (s, src) => DRAFT || s === 'pending' ? `<span class="st ${s}"${DRAFT && src ? ` title="${esc(src)}"` : ''}>${V.statusMeta(s).label}</span>` : '';
  const pend = label => `<span class="pend">${label||'Pending'}</span>`;
  // A person is named only after they agree; until then the role stands in (see the note at the top of data.js).
  const who = p => p.name ? `${p.name} (${p.role})` : `the ${p.role}`;
  const sign = (p, label) => p.name ? `<div><b>${p.name}</b><span>${label}${p.role}</span></div>` : `<div><b>${p.role}</b><span>${label.replace(/ · $/, '')}</span></div>`;

  V.fillCopy(document);

  // draft vs public
  const btn = $('reviewBtn');
  if (DRAFT) {
    const setReview = on => { document.documentElement.classList.toggle('review', on); btn.setAttribute('aria-pressed', on); try{localStorage.setItem('pac-review', on?'1':'0')}catch(e){} };
    let saved = false; try{ saved = localStorage.getItem('pac-review') === '1' }catch(e){}
    setReview(saved || location.hash === '#review');
    btn.addEventListener('click', () => setReview(btn.getAttribute('aria-pressed') !== 'true'));
    $('stripTitle').textContent = `${R.meta.edition}.`;
    $('pendCount').textContent = `${R.meta.coverage.short} Not audited.`;
    $('reviewItems').innerHTML = R.notes.map(p => `<li>${esc(p)}</li>`).join('');
  } else {
    $('top').remove(); $('reviewList').remove();
  }

  // page head
  $('heroEyebrow').textContent = R.meta.title;
  $('board').innerHTML = R.headline.map(h => `<div><span class="fig">${money(h.value, 0)}</span><span class="lab">${h.label}${chip(h.status,h.source)}</span><span class="sub">${h.note}</span></div>`).join('');
  $('coverage').innerHTML = `<span>${R.meta.basis}</span><span>${R.meta.coverage.long}</span>`;

  // letter signature
  const P = R.meta.preparedBy, Rv = R.meta.reviewer;
  $('signers').innerHTML = DRAFT
    ? sign(P, 'Prepared by · ') + sign(Rv, `Reviewed ${Rv.reviewed} · `)
    : sign(Rv, 'Prepared by · ') + sign(P, 'Prepared by · ');

  // timeline
  $('fixtures').innerHTML = R.timeline.map(t => `<div class="fx ${esc(t.kind)}"><div class="when">${esc(t.when)}</div><div class="dot"></div><div><div class="what">${esc(t.label)}</div><div class="det">${esc(t.detail)}</div></div></div>`).join('');

  // money map
  const A = R.accounts;
  const arrow = `<div class="arrow"><svg viewBox="0 0 40 14" aria-hidden="true"><path d="M0 7 H36 M30 1 L37 7 L30 13"/></svg></div>`;
  $('map').innerHTML = [['gaming','gaming-c'],['operating','operating-c']].map(([k,c]) => {
    const a = A[k];
    return `<div class="acct ${c}"><div class="from"><span class="lbl">Money in</span>${a.funds}</div>${arrow}<div class="who"><h3>${a.name}</h3><p>${a.rules}</p></div>${arrow}<div class="to"><span class="lbl">Pays for</span>${a.pays}</div></div>`;
  }).join('');

  // gaming
  const G = A.gaming;
  const drawGaming = () => V.balanceLine($('gamingChart'), { data: G.monthly, height: 300, label: 'Gaming account balance at the end of each month, August 2025 to August 2026' });
  $('commitAsOf').textContent = `${money(G.commitments.balance,2)} · ${G.commitments.asOf}`;
  const partCls = { carried: 'spent', wish: 'gaming', dag: 'dag', left: 'open' };
  const cparts = G.commitments.parts.map(p => ({...p, cls: partCls[p.key]}));
  const drawCommit = () => V.stackBar($('commitBar'), { parts: cparts, height: 30, label: 'Where the gaming money went in 2025–26: the 2024–25 wish list, the 2025–26 wish list, the Dry After Grad bus and what was left on August 31, 2026' });
  $('commitLegend').innerHTML = cparts.map(p => `<div class="${p.cls}-c"><b>${money(p.value,2)}</b><span>${p.label}</span>${chip(p.status)}</div>`).join('');
  $('commitNote').textContent = `${G.commitments.note} ${G.commitments.cashed}`;
  $('gamingStmt').innerHTML = `<caption class="vh">Gaming account, ${R.meta.period.replace('School year ','')}</caption>
    <tr><td>Balance on August 31, 2025<span class="d">Start of the school year ${chip(G.opening.status,G.opening.source)}</span></td><td>${money(G.opening.value,2)}</td></tr>
    <tr><td>The 2024–25 wish-list cheque was cashed<span class="d">Cheque ${G.carriedCheque.number}, written ${G.carriedCheque.writtenLabel}, cashed ${G.carriedCheque.clearedLabel} ${chip(G.carriedCheque.status,G.carriedCheque.source)}</span></td><td class="neg">${money(-G.carriedCheque.value,2)}</td></tr>
    <tr><td>BC Community Gaming Grant<span class="d">Arrived ${G.grant.dateLabel} ${chip(G.grant.status,G.grant.source)}</span></td><td>+${money(G.grant.value,2)}</td></tr>
    ${[G.interestSepJan, G.interestFebApr, G.interestMayAug].map(r => `<tr><td>Bank interest, ${r.label}<span class="d">${chip(r.status,r.source)}</span></td><td>+${money(r.value,2)}</td></tr>`).join('')}
    <tr><td>The 2025–26 wish-list cheque was cashed<span class="d">Cheque ${G.wishCheque.number}, written ${G.wishCheque.writtenLabel}, cashed ${G.wishCheque.clearedLabel} ${chip(G.wishCheque.status,G.wishCheque.source)}</span><span class="d">Paid ${G.wishCheque.split.map(p => `${money(p.value,2)} for ${p.label} ${chip(p.status,p.source)}`).join(' and ')}</span></td><td class="neg">${money(-G.wishCheque.value,2)}</td></tr>
    <tr class="sum"><td>Balance on August 31, 2026 ${chip(G.closing.status,G.closing.source)}</td><td>${money(G.closing.value,2)}</td></tr>`;

  // wish list
  const W = R.wishlist;
  const [wishPart, dagPart] = ['wish','dag'].map(k => G.wishCheque.split.find(p => p.key === k));
  $('wishTop').innerHTML = `
    <div class="kpi"><b>${W.requests}</b><span>requests from ${W.groups} school groups</span></div>
    <div class="kpi"><b>${money(W.requested.value,2)}</b><span>asked for in total</span>${chip(W.requested.status,W.requested.source)}</div>
    <div class="kpi"><b>${money(W.approved.value,2)}</b><span>approved on November 12, 2025 (the vote is still to be confirmed in the minutes)</span>${chip(W.approved.status,W.approved.source)}</div>
    <div class="kpi kpi-gaming"><b>${money(wishPart.value,2)}</b><span>paid for the wish list in August 2026, plus ${money(dagPart.value,2)} for the Dry After Grad bus</span>${chip(wishPart.status,wishPart.source)}</div>`;
  const rows = W.departments.map(d => ({ label: d.name, v: d.requested, items: d.items }));
  const showDept = (r, picked) => {
    $('deptPanel').innerHTML = `<p class="eyebrow">Requests</p><h3 class="mt10">${r.label}<span class="num">${money(r.v,2)}</span></h3><ul>${r.items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
    if (picked && matchMedia('(max-width:900px)').matches) $('deptPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const drawWish = () => V.barsH($('wishChart'), { rows, rowH: 32, labelW: 150, label: 'Wish list requests by school group', onPick: r => showDept(r, true) });
  showDept(rows[0]);
  $('wishNote').textContent = W.note;

  // family fund
  const O = A.operating;
  $('raisedCards').innerHTML = O.raised.map(f => `<div class="fr"><span class="when">${f.when}</span><h3>${f.name}</h3><span class="vol">${f.volume}</span>${chip(f.status)}<span class="amt">${money(f.value,2)}</span></div>`).join('');
  const itemTotal = O.raised.reduce((a,b)=>a+b.value,0);
  $('raisedTotal').innerHTML = `<span>Into the family fund ${O.raisedThrough}</span><b>${money(O.moneyIn.value,2)}</b>${chip(O.moneyIn.status,O.moneyIn.source)}<small>${money(itemTotal,2)} from the sales and donations above and ${money(O.otherIn.value,2)} ${O.otherIn.label}. ${O.salesNote}${chip(O.otherIn.status,O.otherIn.source)}</small>`;
  $('opHint').textContent = `${O.snapshotNote} The balance rose with each sale and fell when cheques were cashed, most of all for scholarships in June.`;
  const drawOp = () => V.snapshotLine($('opChart'), { data: O.snapshots, height: 190, label: 'Family fund balance at the end of each month, August 2025 to August 2026' });
  // A small statement, so the family fund adds up on the page: opening + money in − money out = closing.
  $('spendList').innerHTML = `<div><span>Balance on August 31, 2025<small>Start of the school year</small></span><span class="num">${money(O.opening.value,2)}${chip(O.opening.status,O.opening.source)}</span></div>` +
    `<div><span>Into the family fund<small>The sales, donations and deposits above</small></span><span class="num">+${money(O.moneyIn.value,2)}${chip(O.moneyIn.status,O.moneyIn.source)}</span></div>` +
    O.spent.map(s => `<div><span>${s.name}<small>${s.detail}</small></span><span class="num">${s.value==null?pend():money(-s.value,2)}${s.value==null?'':chip(s.status,s.source)}</span></div>`).join('') +
    `<div class="sum"><span>Balance on August 31, 2026<small>From the bank record</small></span><span class="num">${money(O.closing.value,2)}${chip(O.closing.status,O.closing.source)}</span></div>`;

  // dry after grad
  const D = R.dag;
  $('dagBand').innerHTML = `<div class="eq">${D.grads}<small>Graduates reported in February</small></div><div class="eq">${money(D.paid.value,0)}<small>Paid by the PAC, for the bus</small></div>
    <div><p>About ${money(R.rates.dagPerGrad,0)} for each graduate, for the celebration on ${D.eventDate}. ${D.note} ${chip(D.paid.status,D.paid.source)}</p></div>`;

  // history
  const H = R.history;
  $('histLede').textContent = `Since February 2019 the PAC has received ${money(H.totals.grant,0)} in gaming grants and spent ${money(H.totals.spent,0)} of gaming money on students. ${H.whyMore} Grants usually arrive in the fall, and wish-list cheques are usually cashed the following summer or fall.`;
  const drawHist = () => V.pairBars($('histChart'), { rows: H.years, height: 270, label: 'Gaming grant received and spent by grant year' });
  $('histNote').textContent = H.note;

  // checks
  $('controls').innerHTML = R.stewardship.controls.map(c => `<li>${c}</li>`).join('');
  $('meetings').innerHTML = `<span>${R.stewardship.meetings.length} PAC meetings in 2025–26</span>` + R.stewardship.meetings.map(d => `<span>${new Date(d+'T12:00:00').toLocaleDateString('en-CA',{month:'short',day:'numeric'})}</span>`).join('');
  $('nextYear').innerHTML = R.stewardship.nextYear.map(n => `<div><b>${n.title}</b><p>${n.body}</p></div>`).join('');

  // give
  const Ap = R.appeal;
  $('why').innerHTML = Ap.why.map(w => `<p>${w.lead ? `<strong>${w.lead}</strong> ` : ''}${w.text}</p>`).join('');
  $('goalsLabel').textContent = Ap.goalsLabel;
  $('goals').innerHTML = Ap.goals.map(g => `<div><span><strong>${g.label}</strong>${g.detail}</span><b>${money(g.target,0)}</b></div>`).join('');
  $('otherWays').innerHTML = Ap.otherWays.map(o => `<li>${o}</li>`).join('');
  const amts = $('amts');
  amts.innerHTML = Ap.impact.map((p,i) => `<button type="button" data-i="${i}" aria-pressed="${i===1}">${money(p.amount,0)}</button>`).join('');
  const setAmt = i => { amts.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.i==i)); const p = Ap.impact[i]; $('impact').innerHTML = `${money(p.amount,0)} is ${p.text.charAt(0).toLowerCase()+p.text.slice(1)}.<small>Every dollar goes to the family fund, which pays for what the grant cannot.</small>`; };
  amts.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setAmt(+b.dataset.i); });
  setAmt(1);
  const giveReady = Ap.howToGive.status !== 'pending';
  if (giveReady) {
    $('etr').textContent = Ap.howToGive.to;
    $('howText').innerHTML = `Send an ${Ap.howToGive.method} to the address above. In the message, write "${Ap.howToGive.message}".`;
  } else {
    // The address stays out of the page until the Treasurer confirms it takes donations.
    document.querySelector('.copyrow').remove();
    $('howText').innerHTML = `Online giving is coming soon. We will post the details here once the PAC Treasurer confirms them.<span class="pill-pend">To be confirmed</span>`;
  }
  if (giveReady) $('copyBtn').addEventListener('click', async () => {
    const b = $('copyBtn');
    try { await navigator.clipboard.writeText(Ap.howToGive.to); b.textContent = 'Copied'; }
    catch(e){ const r = document.createRange(); r.selectNodeContents($('etr')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected, press copy'; }
    setTimeout(()=> b.textContent = 'Copy address', 2200);
  });

  // about the figures
  $('foot').innerHTML = `<p><b>${R.meta.org}</b> · ${R.meta.title}</p><p>${R.meta.basis}. ${R.meta.coverage.long} Sources: the PAC's online banking for the gaming account and the family fund (all transactions, cheque images and e-Transfer records, read ${R.meta.coverage.bankRead}), treasurer reports in the 2025–26 meeting minutes, and the PAC's fundraiser and wish-list records.</p><p>${DRAFT ? `Prepared by ${who(P)} from the PAC's bank record and the 2025–26 treasurers' records, and reviewed by ${who(Rv)} on ${Rv.reviewed}. Not audited.` : `Prepared by ${who(Rv)} and ${who(P)}.`}</p>`;

  // charts
  const drawAll = () => { drawGaming(); drawCommit(); drawWish(); drawOp(); drawHist(); };
  drawAll();
  let rt, lastW = innerWidth;
  new ResizeObserver(() => { if (Math.abs(innerWidth - lastW) < 2) return; lastW = innerWidth; clearTimeout(rt); rt = setTimeout(drawAll, 120); }).observe(document.body);
  document.addEventListener('scroll', V.hideTip, { passive: true });
})();

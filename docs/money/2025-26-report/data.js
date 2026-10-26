/* McRoberts PAC — 2025–26 financial report data.
   Every figure carries a status and a source so the report can show what is
   confirmed and what still waits on documents.
   status: "confirmed" = matches the PAC's bank record (Coast Capital online banking, read Oct 9, 2026; labels live in meta.statuses)
           "reported"  = reported at a PAC meeting, in the PAC's records or by a treasurer; not a separate line on the bank record
           "derived"   = worked out from confirmed or reported figures
           "pending"   = not yet known; waiting on documents
   mode:   "draft" shows the review strip, the notes about this report and the source chips;
           "public" hides them in index.html (data.js still ships them).
   This file is public. People are named only after they agree (preparedBy and reviewer take an
   optional name), and review notes and questions for the treasurers stay in the private
   working record, never here. */
window.REPORT = (function () {
// Each fact is written once here; text and derived figures below refer to these.
const GRANT = 20700, WISH_APPROVED = 19428.36, WISH_PAID = 22929, DAG_SUPPORT = 2040,
      SCHOLAR_PAID = 1250, SCHOLAR_AWARDS = 3, SCHOLAR_PARENT = 250, BREAKFAST_GIFTS = 435, BREAKFAST_COST = 800,
      SAMOSA_IN = 266, SAMOSA_COST = 189, BUBBLE_IN = 330, BUBBLE_COST = 175,
      CHEQUE_2425 = 18453.12, GAMING_CLOSING = 2865.41, FAMILY_IN = 1732.74;
// After the year this report covers; not part of the period's figures.
const GRANT_NEXT = 20780;     // Bank record, gaming account: deposit on Oct 1, 2026
const GAMING_OCT9 = 23651.18; // Bank record, gaming account: balance on Oct 9, 2026
const DAG_SOURCE = "Promised at the Apr 8, 2026 meeting (treasurer report in the minutes); paid inside cheque 0099 to the school, whose memo names the Dry After Grad bus; confirmed by the Treasurer and the Co-Treasurer in October 2026";
const GRANT_SOURCE = "Bank record, gaming account: deposit on Oct 3, 2025; also on the PAC's gaming account summary report for the year ending Jan 31, 2026; the grant letter is kept on paper by the Treasurer";
// What three family-fund cheques paid for: reported by the Treasurer in October 2026 (the cheques themselves are on the bank record).
const PURPOSE_SOURCE = "what it paid for reported by the Treasurer in October 2026";
const WJ = "\u2060"; // word joiner: keeps "2026–27" on one line
const RATES = { gamingPerStudent: 20, dagPerGrad: 10, scholarship: 500 };
const round2 = n => Math.round(n * 100) / 100;
const word = n => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const AWARDS = word(SCHOLAR_AWARDS); // the 2025–26 award count as a word, for the copy below
const usd = (v, dp) => "$" + v.toLocaleString("en-CA", { minimumFractionDigits: dp == null ? (v % 1 ? 2 : 0) : dp, maximumFractionDigits: dp == null ? (v % 1 ? 2 : 0) : dp });
// Cheque 0099 paid two things: the Dry After Grad bus and, for the rest, the 2025–26 wish list.
const WISH_PART = round2(WISH_PAID - DAG_SUPPORT);
// The 2025–26 scholarships: the family fund's cheque 0188 to the school and a parent's donation that went to the school directly.
const SCHOLAR_TOTAL = round2(SCHOLAR_PAID + SCHOLAR_PARENT);
const SCHOLAR_SOURCE = `Worked out: cheque 0188 to the school from the family fund (${usd(SCHOLAR_PAID, 2)}, bank record, cashed Jun 10, 2026) and a parent's ${usd(SCHOLAR_PARENT, 2)} donation that the Treasurer reports went to the school directly; ${AWARDS} ${usd(RATES.scholarship)} awards, reported by the Treasurer in October 2026`;
const WISH_PART_SOURCE = `Worked out: cheque 0099 to the school (${usd(WISH_PAID, 2)}, bank record, gaming account, cashed Aug 22, 2026) less the ${usd(DAG_SUPPORT, 2)} for the Dry After Grad bus`;
const R = {
  rates: RATES,
  meta: {
    mode: "draft",
    title: "2025–26 Financial Report",
    org: "Hugh McRoberts Secondary Parent Advisory Council (PAC)",
    orgShort: "McRoberts PAC",
    period: "School year September 1, 2025 – August 31, 2026",
    coverage: {
      bankRead: "October 9, 2026",
      // short: one sentence for the draft banner; long: for the cover note and footer
      short: "Both PAC accounts, the gaming account and the family fund, are checked against the PAC's bank record for the whole year.",
      long: "Gaming account and family fund: every transaction from September 1, 2025 to August 31, 2026, from the PAC's online banking, read October 9, 2026. The Treasurer reports that no cheque was outstanding (written but not yet cashed) on August 31, 2026. The Dry After Grad committee keeps its own account, which is not part of this report."
    },
    // status key: label shown on chips, mark printed in the PDF, one-line description for tooltips and the PDF key
    statuses: [
      { key: "confirmed", label: "Bank record", mark: "", description: "Matches the PAC's bank record (online banking, read October 9, 2026)" },
      { key: "reported", label: "Reported", mark: "R", description: "Reported at a PAC meeting, in the PAC's records or by a treasurer; not a separate line on the bank record" },
      { key: "derived", label: "Worked out", mark: "W", description: "Worked out from other figures" },
      { key: "pending", label: "Pending", mark: "", description: "Waiting for documents" }
    ],
    basis: "Not audited · Money is counted when it entered or left the bank · Canadian dollars",
    preparedBy: { role: "2026–27 Co-Treasurer" },
    reviewer: { role: "Treasurer", reviewed: "October 18, 2026" },
    edition: "Reviewed by the Treasurer on October 18, 2026"
  },

  headline: [
    { key: "grant", value: GRANT, label: "BC Community Gaming Grant received", note: `${usd(RATES.gamingPerStudent)} for each student counted by the Province`, status: "confirmed",
      source: GRANT_SOURCE },
    { key: "wishlist", value: WISH_PART, label: "Paid to the school for the 2025–26 wish list", note: `Part of one ${usd(WISH_PAID)} cheque, cashed August 22, 2026`, status: "derived",
      source: WISH_PART_SOURCE },
    { key: "dag", value: DAG_SUPPORT, label: "Paid for the Dry After Grad bus", note: `About ${usd(RATES.dagPerGrad)} for each graduate, in the same cheque`, status: "reported",
      source: DAG_SOURCE },
    { key: "scholar", value: SCHOLAR_TOTAL, label: "Given in Grade 12 scholarships", note: `${cap(AWARDS)} ${usd(RATES.scholarship)} awards: ${usd(SCHOLAR_PAID)} from the family fund and ${usd(SCHOLAR_PARENT)} from a parent`, status: "derived",
      source: SCHOLAR_SOURCE }
  ],

  timeline: [
    { date: "2025-09-10", when: "Sep 10", label: "New executive elected", detail: "First meeting of the year", kind: "meeting" },
    { date: "2025-10-03", when: "Oct 3", label: "Gaming grant arrived", detail: `${usd(GRANT)} from the Province of BC`, kind: "money" },
    { date: "2025-10-15", when: "Oct 15–21", label: "Samosa pre-order sale", detail: `17 family orders · 129 pieces · ${usd(round2(SAMOSA_IN - SAMOSA_COST))} after costs`, kind: "fundraiser" },
    { date: "2025-11-12", when: "Nov 12", label: "Wish list approved", detail: `${usd(WISH_APPROVED)} for school groups' requests · vote to be confirmed`, kind: "decision" },
    { date: "2025-12-15", when: "December", label: "Purdys chocolate sale", detail: "$516.74, deposited February 12", kind: "fundraiser" },
    { date: "2026-02-11", when: "Feb 11", label: "Dry After Grad support", detail: `About ${usd(RATES.dagPerGrad)} per graduate agreed`, kind: "decision" },
    { date: "2026-02-20", when: "Feb 20–Mar 5", label: "Bubble tea sale", detail: `39 orders · 45 drinks · ${usd(round2(BUBBLE_IN - BUBBLE_COST))} after costs`, kind: "fundraiser" },
    { date: "2026-05-19", when: "May 19–28", label: "Staff breakfast donations", detail: `${usd(BREAKFAST_GIFTS)} from 15 families`, kind: "fundraiser" },
    { date: "2026-06-01", when: "Jun 1", label: "Scholarships", detail: `${cap(AWARDS)} awards, ${usd(SCHOLAR_TOTAL)} · ${usd(SCHOLAR_PAID)} from the family fund and ${usd(SCHOLAR_PARENT)} from a parent`, kind: "fundraiser" },
    { date: "2026-06-22", when: "Jun 22–23", label: "Grad dinner & Dry After Grad", detail: "210 graduates reported in February", kind: "event" },
    { date: "2026-06-24", when: "Jun 24", label: "Staff thank-you breakfast", detail: `Planned for 76 staff · cost ${usd(BREAKFAST_COST)}, paid back to a volunteer in July`, kind: "event" },
    { date: "2026-07-20", when: "Jul 20", label: "Wish list and bus paid", detail: `One ${usd(WISH_PAID)} cheque to the school: ${usd(WISH_PART)} wish list, ${usd(DAG_SUPPORT)} Dry After Grad bus (cashed Aug 22)`, kind: "money" }
  ],

  accounts: {
    gaming: {
      name: "Gaming account",
      funds: "The BC Community Gaming Grant: $20 for each student, plus bank interest",
      pays: "The wish list, Dry After Grad, clubs, teams, trips and events outside regular classes",
      rules: "Provincial rules: spend within 24 months, a yearly report to the Province, two signatures on every cheque",
      opening: { value: 22954.79, date: "2025-08-31", status: "confirmed", source: "Bank record, gaming account, Aug 31, 2025; also the PAC ledger and the Sep 10, 2025 treasurer report" },
      carriedCheque: { value: CHEQUE_2425, number: "0098", written: "2025-07-14", writtenLabel: "July 14, 2025", cleared: "2025-09-16", clearedLabel: "September 16, 2025", status: "confirmed", source: "Bank record, gaming account: cheque 0098 to the school for the 2024–25 wish list, cashed Sep 16, 2025" },
      grant: { value: GRANT, date: "2025-10-03", dateLabel: "October 3, 2025", status: "confirmed", source: GRANT_SOURCE },
      // Interest in three parts (the statement rows); derive() checks they add to the year's interest.
      interestSepJan: { value: 243.84, label: "September to January", status: "confirmed", source: "Bank record: interest paid Sep 2025 to Jan 2026" },
      interestFebApr: { value: 152.31, label: "February to April", status: "confirmed", source: "Bank record: interest paid Feb, Mar, Apr" },
      interestMayAug: { value: 196.59, label: "May to August", status: "confirmed", source: "Bank record: interest paid May to Aug 2026" },
      interest: { value: 592.74, status: "confirmed", source: "Bank record, gaming account: monthly interest, Sep 2025 to Aug 2026" },
      // The cheque total is the bank figure; split says what it paid for (derive() checks the parts add up to it).
      wishCheque: { value: WISH_PAID, number: "0099", written: "2026-07-20", writtenLabel: "July 20, 2026", cleared: "2026-08-22", clearedLabel: "August 22, 2026", status: "confirmed", source: "Bank record, gaming account: cheque 0099 to the school for the 2025–26 wish list and the Dry After Grad bus, written Jul 20, 2026, cashed Aug 22, 2026",
        split: [
          { key: "wish", label: "the 2025–26 wish list", value: WISH_PART, status: "derived", source: WISH_PART_SOURCE },
          { key: "dag", label: "the Dry After Grad bus", value: DAG_SUPPORT, status: "reported", source: DAG_SOURCE }
        ] },
      closing: { value: GAMING_CLOSING, date: "2026-08-31", status: "confirmed", source: "Bank record, gaming account, Aug 31, 2026" },
      monthly: [
        { m: "2025-08", label: "Aug", v: 22954.79, status: "confirmed" },
        { m: "2025-09", label: "Sep", badge: 1, v: 4534.56, status: "confirmed", note: `The 2024–25 wish-list cheque was cashed (−${usd(CHEQUE_2425)})` },
        { m: "2025-10", label: "Oct", badge: 2, v: 25289.02, status: "confirmed", note: `BC gaming grant +${usd(GRANT, 2)} (October 3)` },
        { m: "2025-11", label: "Nov", v: 25339.94, status: "confirmed" },
        { m: "2025-12", label: "Dec", v: 25392.67, status: "confirmed" },
        { m: "2026-01", label: "Jan", v: 25445.51, status: "confirmed" },
        { m: "2026-02", label: "Feb", v: 25493.33, status: "confirmed" },
        { m: "2026-03", label: "Mar", v: 25546.38, status: "confirmed" },
        { m: "2026-04", label: "Apr", v: 25597.82, status: "confirmed" },
        { m: "2026-05", label: "May", v: 25651.08, status: "confirmed" },
        { m: "2026-06", label: "Jun", v: 25702.73, status: "confirmed" },
        { m: "2026-07", label: "Jul", v: 25756.21, status: "confirmed" },
        { m: "2026-08", label: "Aug", badge: 3, v: GAMING_CLOSING, status: "confirmed", note: `The 2025–26 wish-list cheque was cashed (−${usd(WISH_PAID, 2)}), for the wish list and the Dry After Grad bus` }
      ],
      // Where the year's gaming money went: the money the account had (opening balance, grant, interest)
      // split into the two wish-list cheques (the August one in its two parts) and what was left on Aug 31, 2026.
      // derive() fills the values.
      commitments: {
        asOf: "Opening balance, grant and interest",
        balance: null,
        parts: [
          { key: "carried", label: "2024–25 wish list, paid in September", value: null, status: "confirmed" },
          { key: "wish", label: "2025–26 wish list, paid in August", value: null, status: "derived" },
          { key: "dag", label: "Dry After Grad bus, paid in August", value: null, status: "reported" },
          { key: "left", label: "Left on August 31, 2026", value: null, status: "confirmed" }
        ],
        note: "The school buys the items and the PAC pays the school back with one cheque near the end of the school year. The August cheque paid for the 2025–26 wish list and the Dry After Grad bus; the item-by-item list is kept on paper by the Treasurer.",
        cashed: `After the year this report covers, the 2026${WJ}–${WJ}27 grant of ${usd(GRANT_NEXT, 2)} arrived on October 1, 2026; the balance on October 9, 2026 was ${usd(GAMING_OCT9, 2)}.`
      }
    },
    operating: {
      name: "Family fund",
      funds: "Fundraisers and donations from McRoberts families",
      pays: "Scholarships, staff thank-yous and other things the grant cannot pay for",
      rules: "No provincial rules. How it is spent is shared at PAC meetings",
      // Month-end balances from the bank record.
      snapshotNote: "Every balance the treasurer reported at the 2025–26 meetings matches the bank record.",
      snapshots: [
        { date: "2025-08-31", label: "Aug", v: 1854.00, status: "confirmed" },
        { date: "2025-09-30", label: "Sep", v: 1854.00, status: "confirmed" },
        { date: "2025-10-31", label: "Oct", v: 2120.00, status: "confirmed", note: `Samosa pre-order +${usd(SAMOSA_IN, 2)}` },
        { date: "2025-11-30", label: "Nov", v: 2120.00, status: "confirmed" },
        { date: "2025-12-31", label: "Dec", v: 1931.00, status: "confirmed", note: `The samosa cost was paid −${usd(SAMOSA_COST, 2)}` },
        { date: "2026-01-31", label: "Jan", v: 1931.00, status: "confirmed" },
        { date: "2026-02-28", label: "Feb", v: 2687.74, status: "confirmed", note: "Purdys deposit +$516.74 · bubble tea orders" },
        { date: "2026-03-31", label: "Mar", v: 2897.74, status: "confirmed", note: "Bubble tea orders · a deposit of $120.00" },
        { date: "2026-04-30", label: "Apr", v: 2722.74, status: "confirmed", note: `Bubble tea cost, paid back to a volunteer −${usd(BUBBLE_COST, 2)}` },
        { date: "2026-05-31", label: "May", v: 3157.74, status: "confirmed", note: "Donations for the staff breakfast +$435.00" },
        { date: "2026-06-30", label: "Jun", v: 1922.74, status: "confirmed", note: "Scholarships −$1,250.00 · an e-Transfer +$15.00" },
        { date: "2026-07-31", label: "Jul", v: 1172.74, status: "confirmed", note: `Staff breakfast cost, paid back to a volunteer −${usd(BREAKFAST_COST, 2)} · a parent's donation +$50.00` },
        { date: "2026-08-31", label: "Aug", v: 1172.74, status: "confirmed" }
      ],
      opening: { value: 1854.00, date: "2025-08-31", status: "confirmed", source: "Bank record, family fund, Aug 31, 2025" },
      closing: { value: 1172.74, date: "2026-08-31", status: "confirmed", source: "Bank record, family fund, Aug 31, 2026" },
      // Money in, as the bank shows it: what came into the bank, before any costs.
      raised: [
        { name: "Samosa pre-order", when: "October 15–21, 2025", value: SAMOSA_IN, volume: `17 e-Transfers · ${usd(SAMOSA_COST, 2)} for the samosas · ${usd(round2(SAMOSA_IN - SAMOSA_COST), 2)} after costs`, status: "confirmed" },
        { name: "Purdys chocolates", when: "December 2025 sale", value: 516.74, volume: "Deposited February 12, 2026", status: "confirmed" },
        { name: "Bubble tea", when: "February 20 – March 5, 2026", value: BUBBLE_IN, volume: `39 e-Transfers · ${usd(BUBBLE_COST, 2)} for the drinks · ${usd(round2(BUBBLE_IN - BUBBLE_COST), 2)} after costs`, status: "confirmed" },
        { name: "Staff breakfast donations", when: "May 19–28, 2026", value: BREAKFAST_GIFTS, volume: `15 family donations toward the June 24 breakfast, which cost ${usd(BREAKFAST_COST, 2)}`, status: "confirmed" }
      ],
      otherIn: { value: 185.00, label: "from a parent's donation (July 14), a deposit (March 12) and an e\u2011Transfer (June 7), the last two with no description", status: "confirmed", source: "Bank record, family fund: deposits of $120.00 (Mar 12, 2026) and $50.00 (Jul 14, 2026) and an e-Transfer of $15.00 (Jun 7, 2026), with no description; the Treasurer reports the July 14 deposit was a parent's donation" },
      salesNote: "Sale amounts are what came into the bank, before costs; what each sale cost is under Money in and out.",
      moneyIn: { value: FAMILY_IN, status: "confirmed", source: "Bank record, family fund: every deposit from Sep 1, 2025 to Aug 31, 2026" },
      raisedThrough: "in 2025–26",
      spent: [
        { name: "Scholarships 2026", value: SCHOLAR_PAID, detail: `Cheque to the school, June 2026 · ${AWARDS} ${usd(RATES.scholarship)} awards, ${usd(SCHOLAR_TOTAL)} in all with a parent's ${usd(SCHOLAR_PARENT)} donation that went to the school directly`, status: "confirmed",
          source: "Bank record, family fund: cheque 0188, cashed Jun 10, 2026; the number of awards, and that a parent's donation went to the school directly, reported by the Treasurer in October 2026" },
        { name: "Staff thank-you breakfast", value: BREAKFAST_COST, detail: `June 24 · paid back to a volunteer in July · families gave ${usd(BREAKFAST_GIFTS)} and the family fund paid the other ${usd(round2(BREAKFAST_COST - BREAKFAST_GIFTS))}`, status: "confirmed",
          source: `Bank record, family fund: cheque 0189, cashed Jul 14, 2026; ${PURPOSE_SOURCE}` },
        { name: "Samosas for the October pre-order", value: SAMOSA_COST, detail: "Cheque cashed in December 2025 · the samosa cost", status: "confirmed",
          source: `Bank record, family fund: cheque 0186, cashed Dec 11, 2025; ${PURPOSE_SOURCE}` },
        { name: "Bubble tea drinks", value: BUBBLE_COST, detail: "Paid back to a volunteer, April 2026", status: "confirmed",
          source: `Bank record, family fund: cheque 0187, cashed Apr 15, 2026; ${PURPOSE_SOURCE}` }
      ]
    }
  },

  // Dry After Grad: what the PAC paid. A parent committee runs it and keeps its own bank account,
  // separate from the PAC's two accounts and not part of this report. The PAC's support came from the gaming account,
  // inside cheque 0099 to the school (accounts.gaming.wishCheque.split).
  dag: {
    grads: 210,
    paid: { value: DAG_SUPPORT, status: "reported", source: DAG_SOURCE },
    eventDate: `June 22${WJ}–${WJ}23, 2026`,
    note: "A parent committee runs Dry After Grad and keeps its own bank account. The PAC's support was paid to the school in the August cheque, for the grad-night bus."
  },

  // Grade 12 scholarships 2025–26 (headline "scholar"): the family fund's cheque 0188 and a parent's donation that went to the school directly.
  scholarships: {
    awards: { value: SCHOLAR_AWARDS, each: RATES.scholarship, status: "reported", source: "Reported by the Treasurer in October 2026; the May 13, 2026 minutes planned three $500 awards" },
    fromFund: { value: SCHOLAR_PAID, status: "confirmed", source: "Bank record, family fund: cheque 0188 to the school for Grade 12 scholarships, written Jun 1, 2026, cashed Jun 10, 2026" },
    parentGift: { value: SCHOLAR_PARENT, status: "reported", source: "Reported at the Apr 8, 2026 meeting; the Treasurer reports it went to the school directly, so it was never in either PAC account" },
    total: { value: SCHOLAR_TOTAL, status: "derived", source: SCHOLAR_SOURCE }
  },

  wishlist: {
    approved: { value: WISH_APPROVED, date: "2025-11-12", status: "reported", source: "Motion at the Nov 12, 2025 meeting; the minutes record the motion but not the vote" },
    requested: { value: 21428.36, status: "reported", source: "Wish list 2025–26 first-round requests as sent in (the sum of its rows); the item-by-item final list is kept on paper by the Treasurer" },
    requests: 16,
    groups: 10,
    note: "These are the requests as sent in. The item-by-item list of what was paid is kept on paper by the Treasurer.",
    departments: [
      { name: "Athletics & PE", requested: 6548.36, items: [`Dance instructors for about 600 Grade 8${WJ}–${WJ}10 students`, "Volleyball carts", "Senior volleyball uniforms", "Floor hockey goalie pads", "Guest speakers on healthy relationships"] },
      { name: "Grade 8", requested: 4000.00, items: ["Grade 8 activity days for 200+ students"] },
      { name: "Math contests", requested: 2000.00, items: ["Contest fees for 80+ students"] },
      { name: "Dry After Grad", requested: 2000.00, items: ["Bus between the grad venue and school"] },
      { name: "Music", requested: 1570.00, items: ["Portable power station for outdoor performances", "Pop-up tents (not funded in the first round)", "Laptop for music composition (not funded in the first round)"] },
      { name: "First Responders", requested: 1500.00, items: ["Emergency medical team equipment fee"] },
      { name: "Social Studies", requested: 1500.00, items: ["Grade 10 Victoria trip, keeping cost at $50 a student"] },
      { name: "Library", requested: 1160.00, items: ["A reading challenge (Reading Riot): books, prizes and a celebration lunch"] },
      { name: "Student Council", requested: 1000.00, items: ["Spring dance and year-end food trucks"] },
      { name: "Debate Club", requested: 150.00, items: ["Tournament registration"] }
    ]
  },

  history: {
    note: "Grant years run February to January. Each year matches the PAC's bank record. Spending counts cheques in the year they were cashed.",
    // Why spending since Feb 2019 is higher than the grants (bank record, Feb 2019 – Jan 2026: interest and two linked accounts closed into this one).
    whyMore: "Spending was higher than the grants because the account also earned interest and received money when older linked accounts were closed into it.",
    years: [
      { y: "to Jan 2020", s: "’20", grant: 18300, spent: 23291.99 },
      { y: "to Jan 2021", s: "’21", grant: 17860, spent: 19305.95 },
      { y: "to Jan 2022", s: "’22", grant: 0, spent: 3400, note: "The grant arrived after the year ended" },
      { y: "to Jan 2023", s: "’23", grant: 36420, spent: 33163.41, note: "Two grants arrived in this year" },
      { y: "to Jan 2024", s: "’24", grant: 19380, spent: 14086.53 },
      { y: "to Jan 2025", s: "’25", grant: 20600, spent: 29390.35 },
      { y: "to Jan 2026", s: "’26", grant: 20700, spent: 20637.66, note: "Paid the 2024–25 wish list and the June 2025 Dry After Grad cheque" }
    ],
    totals: { grant: 133260, spent: 143275.89 }
  },

  stewardship: {
    meetings: ["2025-09-10", "2025-10-08", "2025-11-12", "2026-01-14", "2026-02-11", "2026-04-08", "2026-05-13"],
    controls: [
      "Gaming money is kept in its own bank account, as the Province requires",
      "Two accounts at Coast Capital Savings: the gaming account and the family fund",
      "A treasurer's report at every PAC meeting"
    ],
    nextYear: [
      { title: "A budget in the fall", body: "A 2026–27 budget for the gaming account and the family fund, shared at a PAC meeting." },
      { title: "A monthly check", body: "Each account is checked against its bank statement every month." },
      { title: "A yearly report", body: "A report like this one after each school year." },
      { title: "New cheque signers", body: "The people who can sign cheques are updated for each new executive." }
    ]
  },

  appeal: {
    headline: "Help us fund 2026–27",
    why: [
      { text: "School budgets are tight this year, so extras like scholarships and staff thank-yous depend more on families." },
      { lead: "The gaming grant cannot pay for scholarships or for thanking our staff.", text: "Only family fundraising and donations can." },
      { text: `In 2025–26 families made ${AWARDS} Grade 12 scholarships possible. With your help, we can fund five ${usd(RATES.scholarship)} scholarships in 2026${WJ}–${WJ}27.` }
    ],
    goalsLabel: "Proposed goals for 2026–27 (to be confirmed at a PAC meeting)",
    goals: [
      { label: "Grade 12 scholarships", target: 2500, detail: "5 × $500" },
      { label: "Staff thank-yous", target: 1000, detail: "Thank-you events for staff during the year" }
    ],
    impact: [
      { amount: 50, text: "One tenth of a $500 scholarship" },
      { amount: 100, text: "One fifth of a $500 scholarship" },
      { amount: 250, text: "Half of one Grade 12 scholarship" },
      { amount: 500, text: "One full scholarship for a graduating student" }
    ],
    howToGive: {
      method: "Interac e-Transfer",
      to: "hughmcrobertspac@gmail.com",
      message: "PAC donation",
      status: "pending"
    },
    otherWays: [
      "Come to a PAC meeting. Everyone is welcome. The dates are on the school calendar.",
      "Volunteer for a fundraiser or the staff thank-you breakfast.",
      "Order from our next fundraiser."
    ]
  },

  // About this report: the notes of the summary the Treasurer reviewed on October 18, 2026.
  notes: [
    `Records on paper. The item-by-item 2025–26 wish list and the two grant letters (${usd(GRANT, 2)} and ${usd(GRANT_NEXT, 2)}) are kept as paper copies by the Treasurer, with the PAC's other records, for a Ministry audit.`,
    "Basis. The school year, September 1, 2025 to August 31, 2026; money counted when it entered or left the bank; not audited. The Treasurer reports that no cheque was outstanding on August 31, 2026."
  ]
};

// Figures worked out from the facts above: where the year's gaming money went, and a check that both accounts add up.
(function derive(R) {
  const G = R.accounts.gaming, c = G.commitments, O = R.accounts.operating;
  const part = k => c.parts.find(p => p.key === k), split = k => G.wishCheque.split.find(p => p.key === k);
  c.balance = round2(G.opening.value + G.grant.value + G.interest.value);
  part("carried").value = G.carriedCheque.value;
  part("wish").value = split("wish").value;
  part("dag").value = split("dag").value;
  part("left").value = G.closing.value;
  const gap = round2(c.balance - c.parts.reduce((a, p) => a + p.value, 0));
  const splitGap = round2(G.wishCheque.split.reduce((a, p) => a + p.value, 0) - G.wishCheque.value);
  const dagGap = round2(split("dag").value - R.dag.paid.value);
  const intGap = round2(G.interestSepJan.value + G.interestFebApr.value + G.interestMayAug.value - G.interest.value);
  const stmtGap = round2(G.opening.value - G.carriedCheque.value + G.grant.value + G.interestSepJan.value + G.interestFebApr.value + G.interestMayAug.value - G.wishCheque.value - G.closing.value);
  const inFam = round2(O.raised.reduce((a, r) => a + r.value, 0) + O.otherIn.value);
  const outFam = round2(O.spent.reduce((a, s) => a + (s.value || 0), 0));
  const famGap = round2(O.opening.value + O.moneyIn.value - outFam - O.closing.value);
  const S = R.scholarships, schGap = round2(S.fromFund.value + S.parentGift.value - S.awards.value * S.awards.each);
  if (gap || splitGap || dagGap || intGap || stmtGap || famGap || schGap || inFam !== O.moneyIn.value) console.error("data.js: the accounts do not add up", { gap, splitGap, dagGap, intGap, stmtGap, famGap, schGap, inFam });
})(R);

return R;
})();

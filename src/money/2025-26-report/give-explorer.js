/* "Fill the squares" explorer in the Give section. */
(function () {
  const R = window.REPORT;
  const fam = document.getElementById("famRange"), gift = document.getElementById("giftRange");
  const grid = document.getElementById("fillGrid"), out = document.getElementById("fillOut");
  if (fam && gift && grid) {
    const GOAL = R.appeal.goals.reduce((a, g) => a + g.target, 0);
    const N = GOAL / 100, SCH = R.appeal.goals[0].target / 100;
    grid.innerHTML = Array.from({ length: N }, (_, i) => `<i class="${i < SCH ? "s" : "a"}"></i>`).join("");
    const cells = [...grid.children];
    const upd = () => {
      const f = +fam.value, g = +gift.value, tot = f * g;
      document.getElementById("famVal").textContent = f;
      document.getElementById("giftVal").textContent = "$" + g;
      const filled = Math.min(N, Math.floor(tot / 100));
      cells.forEach((c, i) => c.classList.toggle("on", i < filled));
      const sch = Math.min(5, Math.floor(tot / 500));
      const pct = Math.min(100, Math.round((tot / GOAL) * 100));
      const line = tot >= GOAL ? "Every scholarship and the staff thank-yous, fully funded."
        : sch === 0 ? "That is a good start on the first scholarship."
        : `That covers ${sch} of 5 scholarships${tot > R.appeal.goals[0].target ? " and part of the staff thank-yous" : ""}.`;
      out.innerHTML = `<b>$${tot.toLocaleString("en-CA")}</b> · ${pct}% of the proposed $${GOAL.toLocaleString("en-CA")} goal<span>${line}</span>`;
    };
    fam.addEventListener("input", upd); gift.addEventListener("input", upd); upd();
  }
})();

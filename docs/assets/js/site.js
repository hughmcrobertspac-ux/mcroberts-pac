/* McRoberts PAC — small enhancements. The site works without this file. */
(() => {
  const root = document.documentElement;

  // Theme: Auto / Light / Dark (remembered on this device only)
  const saved = (() => { try { return localStorage.getItem("pac-theme") || "auto"; } catch (e) { return "auto"; } })();
  // The switch is hidden in the HTML and shown here, so visitors without JavaScript never see a dead control
  document.querySelectorAll(".theme-switch").forEach(el => { el.hidden = false; });
  document.querySelectorAll('.theme-switch input[name="theme"]').forEach(input => {
    input.checked = input.value === saved;
    input.addEventListener("change", () => {
      if (input.value === "auto") delete root.dataset.theme; else root.dataset.theme = input.value;
      try { localStorage.setItem("pac-theme", input.value); } catch (e) {}
    });
  });

  // Upcoming dates: build.py lists every future date with data-date and shows the first few.
  // Dates that have passed since the last build are removed here, using today's date in Vancouver.
  const today = (() => {
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(new Date()).map(x => [x.type, x.value]));
      return `${p.year}-${p.month}-${p.day}`;
    } catch (e) { return ""; }
  })();
  if (/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    document.querySelectorAll("[data-upcoming]").forEach(group => {
      const limit = Number(group.dataset.upcoming) || 1;
      let shown = 0;
      group.querySelectorAll(":scope > [data-date]").forEach(el => {
        if (el.dataset.date < today || shown >= limit) el.remove();
        else { el.hidden = false; shown += 1; }
      });
    });
  }

  // Popover fallback for browsers without the Popover API
  if (!HTMLElement.prototype.hasOwnProperty("popover")) {
    root.classList.add("no-popover");
    document.querySelectorAll("[popovertarget]").forEach(btn => {
      const target = document.getElementById(btn.getAttribute("popovertarget"));
      if (!target) return;
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("popovertargetaction") === "hide" ? false : !target.classList.contains("is-open");
        target.classList.toggle("is-open", open);
        document.querySelectorAll(`[popovertarget="${target.id}"]`).forEach(b => b.setAttribute("aria-expanded", String(open)));
        if (open) target.querySelector("a, button")?.focus();
      });
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") document.querySelectorAll("[popover].is-open").forEach(p => p.classList.remove("is-open"));
    });
  }
  const hide = el => { if (el.hidePopover && el.matches(":popover-open")) el.hidePopover(); else el.classList.remove("is-open"); };

  // Copy buttons (the result is also announced through the status region)
  const status = document.querySelector(".copy-status");
  document.querySelectorAll("[data-copy]").forEach(btn => {
    const label = btn.textContent;
    btn.addEventListener("click", async () => {
      let text;
      try { await navigator.clipboard.writeText(btn.dataset.copy); text = "Copied"; }
      catch (e) { text = "Select and copy"; }
      btn.textContent = text;
      if (status) status.textContent = text === "Copied" ? "Email address copied" : "Could not copy. Select the address and copy it.";
      setTimeout(() => { btn.textContent = label; if (status) status.textContent = ""; }, 2000);
    });
  });

  // "On this page" rail: highlight the section in view
  const rail = document.querySelector(".rail");
  if (rail && "IntersectionObserver" in window) {
    const links = [...rail.querySelectorAll('a[href^="#"]')];
    const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.remove("is-current"));
        const a = map.get(e.target.id);
        if (a) a.classList.add("is-current");
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  // Close the menu sheet after choosing a link, or when focus leaves it
  const sheet = document.getElementById("menu-pop");
  if (sheet) {
    sheet.addEventListener("click", e => { if (e.target.closest("a")) hide(sheet); });
    sheet.addEventListener("focusout", e => {
      const to = e.relatedTarget;
      if (to && !sheet.contains(to) && !to.matches('[popovertarget="menu-pop"]')) hide(sheet);
    });
  }

})();

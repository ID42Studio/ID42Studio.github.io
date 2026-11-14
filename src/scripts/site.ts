/**
 * Progressive enhancement only: navigation state, reveals, menu and the
 * hero trace animation. Everything degrades to a readable static page.
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------- header */

const header = document.getElementById("site-header");
const scrollProgress = document.querySelector<HTMLElement>("[data-scroll-progress]");

let ticking = false;
let maxScroll = 0;

/** Cache the scroll range so the scroll handler never reads layout. */
function measure() {
  maxScroll = document.documentElement.scrollHeight - window.innerHeight;
}

measure();
window.addEventListener("load", measure, { once: true });
window.addEventListener("resize", measure, { passive: true });
window.addEventListener("orientationchange", measure, { passive: true });

function paintScroll() {
  const y = window.scrollY;
  header?.classList.toggle("is-scrolled", y > 10);

  if (scrollProgress) {
    const pct = maxScroll > 0 ? Math.min(100, (y / maxScroll) * 100) : 0;
    scrollProgress.style.width = `${pct}%`;
  }

  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(paintScroll);
    }
  },
  { passive: true },
);

paintScroll();

/* --------------------------------------------------------------- reveals */

const revealables = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealables.forEach((el) => el.classList.add("is-visible"));
} else {
  const revealer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.1 },
  );

  revealables.forEach((el) => revealer.observe(el));
}

/* ------------------------------------------------------------ nav state */

const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"));

/** English slugs are zero-height aliases. The spy has to watch the section. */
function navTarget(link: HTMLAnchorElement): Element | null {
  const id = link.getAttribute("href");
  if (!id?.startsWith("#")) return null;
  const target = document.querySelector(id);
  if (!target) return null;
  if (target.classList.contains("anchor-alias")) return target.closest("section") ?? target;
  return target;
}

const observed = navLinks
  .map((link) => {
    const target = navTarget(link);
    return target ? { link, target } : null;
  })
  .filter((entry): entry is { link: HTMLAnchorElement; target: Element } => entry !== null);

if (observed.length && "IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observed.forEach(({ link, target }) => {
          link.classList.toggle("is-active", target === entry.target);
        });
      }
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
  );

  observed.forEach(({ target }) => spy.observe(target));
}

/* ------------------------------------------------------------------ menu */

const menuToggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const menu = document.querySelector<HTMLElement>("[data-menu]");
const pageRegions = [
  document.getElementById("main"),
  document.querySelector<HTMLElement>(".site-footer"),
].filter((el): el is HTMLElement => el !== null);

let lastFocused: HTMLElement | null = null;

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null);
}

function setMenu(open: boolean) {
  if (!menuToggle || !menu) return;

  const isOpen = menu.classList.contains("is-open");
  if (open === isOpen) return;

  menu.classList.toggle("is-open", open);
  menu.inert = !open;
  menuToggle.setAttribute("aria-expanded", String(open));
  pageRegions.forEach((region) => {
    region.inert = open;
  });
  document.documentElement.classList.toggle("menu-open", open);

  const label = open
    ? menuToggle.dataset.labelClose ?? "Close menu"
    : menuToggle.dataset.labelOpen ?? "Open menu";

  menuToggle.setAttribute("aria-label", label);

  if (open) {
    lastFocused = document.activeElement as HTMLElement | null;
    // The panel fades in from `visibility: hidden`, which makes it unfocusable
    // on the first frame — retry once the transition has committed.
    requestAnimationFrame(() => {
      const target = focusables(menu)[0];
      target?.focus();
      if (target && document.activeElement !== target) {
        window.setTimeout(() => target.focus(), 120);
      }
    });
  } else {
    lastFocused?.focus();
    lastFocused = null;
  }
}

menuToggle?.addEventListener("click", () => {
  setMenu(!(menu?.classList.contains("is-open") ?? false));
});

document.querySelectorAll("[data-menu-link]").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
    return;
  }

  if (event.key !== "Tab" || !menu?.classList.contains("is-open")) return;

  const items = focusables(menu);
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
});

window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

/* ---------------------------------------------------------- hero console */

const consoleEl = document.querySelector<HTMLElement>("[data-console]");

if (consoleEl) {
  const tabs = Array.from(consoleEl.querySelectorAll<HTMLButtonElement>("[data-scenario]"));
  const panels = Array.from(consoleEl.querySelectorAll<HTMLElement>("[data-panel]"));
  const runButton = consoleEl.querySelector<HTMLButtonElement>("[data-run]");
  const runLabel = consoleEl.querySelector<HTMLElement>("[data-run-label]");
  const progress = consoleEl.querySelector<HTMLElement>("[data-progress]");
  const live = consoleEl.querySelector<HTMLElement>("[data-console-live]");

  const STEP_MS = 900;
  let timer = 0;
  let activePanel = panels[0] ?? null;

  const stepsOf = (panel: HTMLElement | null) =>
    panel ? Array.from(panel.querySelectorAll<HTMLElement>("[data-step]")) : [];

  const setProgress = (panel: HTMLElement | null, done: number) => {
    const total = stepsOf(panel).length || 1;
    if (progress) progress.style.width = `${Math.min(100, (done / total) * 100)}%`;
  };

  const reset = (panel: HTMLElement | null, announce = true) => {
    window.clearInterval(timer);
    timer = 0;

    stepsOf(panel).forEach((step) => {
      step.classList.remove("is-active", "is-done");
      step.removeAttribute("aria-current");
    });

    const result = panel?.querySelector<HTMLElement>("[data-result]");
    if (result) result.hidden = true;

    if (runButton) runButton.disabled = false;
    if (runLabel) runLabel.textContent = runLabel.dataset.idle ?? runLabel.textContent ?? "";
    setProgress(panel, 0);

    if (announce && live) live.textContent = "";
  };

  const finish = (panel: HTMLElement | null) => {
    const steps = stepsOf(panel);
    steps.forEach((step) => {
      step.classList.remove("is-active");
      step.classList.add("is-done");
      step.removeAttribute("aria-current");
    });

    const result = panel?.querySelector<HTMLElement>("[data-result]");
    if (result) result.hidden = false;

    if (progress) progress.style.width = "100%";
    if (runButton) runButton.disabled = false;
    if (runLabel && runLabel.dataset.done) runLabel.textContent = runLabel.dataset.done;

    const outcome = result?.lastElementChild?.textContent?.trim();
    if (live && outcome) live.textContent = outcome;
  };

  const run = () => {
    if (!activePanel || timer !== 0) return;

    reset(activePanel, false);

    const steps = stepsOf(activePanel);
    if (!steps.length) return;

    if (reduceMotion) {
      finish(activePanel);
      return;
    }

    if (runButton) runButton.disabled = true;

    let index = 0;
    steps[0].classList.add("is-active");
    steps[0].setAttribute("aria-current", "step");
    setProgress(activePanel, 1);

    timer = window.setInterval(() => {
      if (index < steps.length - 1) {
        steps[index].classList.remove("is-active");
        steps[index].classList.add("is-done");
        steps[index].removeAttribute("aria-current");
        index += 1;
        steps[index].classList.add("is-active");
        steps[index].setAttribute("aria-current", "step");
        setProgress(activePanel, index + 1);
        if (live) live.textContent = steps[index].textContent?.trim() ?? "";
      } else {
        window.clearInterval(timer);
        timer = 0;
        finish(activePanel);
      }
    }, STEP_MS);
  };

  const select = (index: number) => {
    const panel = panels[index];
    if (!panel) return;

    activePanel = panel;

    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-pressed", String(isActive));
    });

    panels.forEach((item, i) => {
      item.hidden = i !== index;
    });

    reset(panel);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
  });

  runButton?.addEventListener("click", run);

  // Start in the finished state for reduced motion, otherwise run once shortly
  // after load so the panel demonstrates itself without waiting for a click.
  if (reduceMotion) {
    finish(activePanel);
  } else {
    window.setTimeout(run, 900);
  }
}

/* --------------------------------------------------------------- parallax */

const visual = document.querySelector<HTMLElement>("[data-hero-visual]");

if (visual && window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  const chips = Array.from(visual.querySelectorAll<HTMLElement>(".chip-float"));

  visual.addEventListener("pointermove", (event) => {
    const rect = visual.getBoundingClientRect();
    const dx = (event.clientX - rect.left) / rect.width - 0.5;
    const dy = (event.clientY - rect.top) / rect.height - 0.5;

    chips.forEach((chip, index) => {
      const depth = (index + 1) * 7;
      chip.style.setProperty("--mx", String(dx * depth));
      chip.style.setProperty("--my", String(dy * depth));
    });
  });

  visual.addEventListener("pointerleave", () => {
    chips.forEach((chip) => {
      chip.style.setProperty("--mx", "0");
      chip.style.setProperty("--my", "0");
    });
  });
}

/* ------------------------------------------------------------- locale switch */

/**
 * Switching language keeps the reader in the same section: the hash of the
 * current view is appended to the target locale path (`/en/#work`). Static
 * markup ships the plain path, so the link still works without JavaScript.
 */
for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-locale-link]")) {
  link.addEventListener("click", () => {
    const [path] = link.href.split("#");
    if (window.location.hash) link.href = `${path}${window.location.hash}`;
  });
}

export {};

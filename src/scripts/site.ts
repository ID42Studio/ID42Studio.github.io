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
const observed = navLinks
  .map((link) => {
    const id = link.getAttribute("href");
    const target = id && id.startsWith("#") ? document.querySelector(id) : null;
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

/* ------------------------------------------------------------ hero trace */

const trace = document.querySelector<HTMLElement>("[data-trace]");

if (trace) {
  const steps = Array.from(trace.querySelectorAll<HTMLElement>("[data-step]"));
  const bar = document.querySelector<HTMLElement>("[data-trace-progress]");
  let current = 0;

  const paint = () => {
    steps.forEach((step, index) => {
      step.classList.toggle("is-active", index === current);
      step.classList.toggle("is-done", index < current);
    });

    if (bar) {
      bar.style.width = `${((current + 1) / steps.length) * 100}%`;
    }
  };

  paint();

  if (!reduceMotion && steps.length > 1) {
    window.setInterval(() => {
      current = (current + 1) % steps.length;
      paint();
    }, 2200);
  }
}

/* --------------------------------------------------------------- parallax */

const visual = document.querySelector<HTMLElement>("[data-hero-visual]");

if (visual && window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  const chips = Array.from(visual.querySelectorAll<HTMLElement>(".chip-float"));
  const panel = visual.querySelector<HTMLElement>(".trace");

  visual.addEventListener("pointermove", (event) => {
    const rect = visual.getBoundingClientRect();
    const dx = (event.clientX - rect.left) / rect.width - 0.5;
    const dy = (event.clientY - rect.top) / rect.height - 0.5;

    chips.forEach((chip, index) => {
      const depth = (index + 1) * 7;
      chip.style.setProperty("--mx", String(dx * depth));
      chip.style.setProperty("--my", String(dy * depth));
    });

    panel?.style.setProperty("--ry", `${dx * 4}deg`);
    panel?.style.setProperty("--rx", `${-dy * 4}deg`);
  });

  visual.addEventListener("pointerleave", () => {
    chips.forEach((chip) => {
      chip.style.setProperty("--mx", "0");
      chip.style.setProperty("--my", "0");
    });
    panel?.style.setProperty("--ry", "0deg");
    panel?.style.setProperty("--rx", "0deg");
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

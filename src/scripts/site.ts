/**
 * Progressive enhancement only: navigation state, reveals, menu and the
 * hero trace animation. Everything degrades to a readable static page.
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------- header */

const header = document.getElementById("site-header");
const scrollProgress = document.querySelector<HTMLElement>("[data-scroll-progress]");

let ticking = false;

function paintScroll() {
  const y = window.scrollY;
  header?.classList.toggle("is-scrolled", y > 10);

  if (scrollProgress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
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

function setMenu(open: boolean) {
  if (!menuToggle || !menu) return;

  menu.classList.toggle("is-open", open);
  menu.inert = !open;
  menuToggle.setAttribute("aria-expanded", String(open));

  const label = open
    ? menuToggle.dataset.labelClose ?? "Close menu"
    : menuToggle.dataset.labelOpen ?? "Open menu";

  menuToggle.setAttribute("aria-label", label);
  document.documentElement.style.overflow = open ? "hidden" : "";
}

menuToggle?.addEventListener("click", () => {
  setMenu(!(menu?.classList.contains("is-open") ?? false));
});

document.querySelectorAll("[data-menu-link]").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
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
    }, 1800);
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

export {};

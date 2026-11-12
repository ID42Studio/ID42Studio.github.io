import { analyze, type Analysis } from "../lib/classify";
import type { Locale } from "../i18n";

/**
 * Local playground: the classifier runs in the browser on debounced input.
 * The server renders the first example so the section is complete without JS.
 * Client updates clone Astro-rendered <template> nodes so scoped styles keep
 * applying after every re-render.
 */

const root = document.querySelector<HTMLElement>("[data-pg]");

if (root) {
  const input = root.querySelector<HTMLTextAreaElement>("[data-pg-input]");
  const modelEl = root.querySelector<HTMLElement>("[data-pg-model]");
  const domainEl = root.querySelector<HTMLElement>("[data-pg-domain]");
  const confidenceEl = root.querySelector<HTMLElement>("[data-pg-confidence]");
  const meterEl = root.querySelector<HTMLElement>("[data-pg-meter]");
  const flowEl = root.querySelector<HTMLElement>("[data-pg-flow]");
  const outcomeEl = root.querySelector<HTMLElement>("[data-pg-outcome]");
  const signalsEl = root.querySelector<HTMLElement>("[data-pg-signals]");
  const nearEl = root.querySelector<HTMLElement>("[data-pg-near]");
  const runButton = root.querySelector<HTMLButtonElement>("[data-pg-run]");
  const runLabel = root.querySelector<HTMLElement>("[data-pg-run-label]");
  const outputEl = root.querySelector<HTMLElement>(".pg-output");

  const stepTemplate = root.querySelector<HTMLTemplateElement>("[data-pg-tpl-step]");
  const nearTemplate = root.querySelector<HTMLTemplateElement>("[data-pg-tpl-near]");
  const signalTemplate = root.querySelector<HTMLTemplateElement>("[data-pg-tpl-signal]");

  const locale = (root.dataset.locale as Locale) ?? "pt-BR";
  const models = JSON.parse(root.dataset.models ?? "{}") as Record<string, string>;
  const domains = JSON.parse(root.dataset.domains ?? "{}") as Record<string, string>;
  const noSignals = root.dataset.noSignals ?? "";
  const runText = root.dataset.run ?? "";
  const replayText = root.dataset.replay ?? "";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STEP_MS = 620;
  const DEBOUNCE_MS = 240;

  let typingTimer = 0;
  let runTimer = 0;
  let minOutputHeight = 0;

  function lockOutputHeight() {
    if (!outputEl) return;
    const height = outputEl.getBoundingClientRect().height;
    if (height > minOutputHeight) {
      minOutputHeight = height;
      outputEl.style.minHeight = `${Math.ceil(minOutputHeight)}px`;
    }
  }

  function stopRun() {
    if (runTimer) {
      window.clearInterval(runTimer);
      runTimer = 0;
    }
    flowEl?.querySelectorAll<HTMLElement>("[data-step]").forEach((step) => {
      step.classList.remove("is-active", "is-done");
      step.removeAttribute("aria-current");
    });
    if (runLabel) runLabel.textContent = runText;
  }

  function cloneTemplate(template: HTMLTemplateElement | null): HTMLElement | null {
    const node = template?.content.firstElementChild?.cloneNode(true);
    return node instanceof HTMLElement ? node : null;
  }

  function renderSignals(analysis: Analysis) {
    if (!signalsEl) return;
    signalsEl.replaceChildren();

    if (!analysis.signals.length) {
      const empty = cloneTemplate(signalTemplate);
      if (!empty) return;
      empty.classList.add("pg-signal--empty");
      empty.textContent = noSignals;
      signalsEl.append(empty);
      return;
    }

    for (const signal of analysis.signals) {
      const item = cloneTemplate(signalTemplate);
      if (!item) continue;
      item.textContent = signal;
      signalsEl.append(item);
    }
  }

  function renderNeighbours(analysis: Analysis) {
    if (!nearEl) return;
    nearEl.replaceChildren();

    for (const neighbour of analysis.neighbours) {
      const item = cloneTemplate(nearTemplate);
      if (!item) continue;

      const score = item.querySelector(".pg-near-score");
      const text = item.querySelector(".pg-near-text");
      if (score) score.textContent = `${Math.round(neighbour.score * 100)}%`;
      if (text) {
        text.textContent = neighbour.text;
        text.setAttribute("title", neighbour.text);
      }

      nearEl.append(item);
    }
  }

  function renderFlow(analysis: Analysis) {
    if (!flowEl) return;
    flowEl.replaceChildren();

    analysis.flow.forEach((step, index) => {
      const item = cloneTemplate(stepTemplate);
      if (!item) return;

      item.dataset.step = String(index);

      const mark = item.querySelector(".pg-step-mark");
      const label = item.querySelector(".pg-step-label");
      const detail = item.querySelector(".pg-step-detail");

      if (mark) mark.textContent = String(index + 1).padStart(2, "0");
      if (label) label.textContent = step.label;
      if (detail) detail.textContent = step.detail;

      flowEl.append(item);
    });
  }

  function render(analysis: Analysis) {
    lockOutputHeight();
    stopRun();

    if (modelEl) modelEl.textContent = models[analysis.model] ?? analysis.model;
    if (domainEl) domainEl.textContent = domains[analysis.domain] ?? analysis.domain;

    const confidence = Math.round(analysis.confidence * 100);
    if (confidenceEl) confidenceEl.textContent = `${confidence}%`;
    if (meterEl) meterEl.style.width = `${confidence}%`;
    if (outcomeEl) outcomeEl.textContent = analysis.result;

    renderFlow(analysis);
    renderSignals(analysis);
    renderNeighbours(analysis);

    // Re-measure after content settles so later shorter results don't collapse.
    requestAnimationFrame(lockOutputHeight);
  }

  function run() {
    stopRun();

    const steps = flowEl?.querySelectorAll<HTMLElement>("[data-step]") ?? [];
    if (!steps.length) return;

    if (reduceMotion) {
      steps.forEach((step) => step.classList.add("is-done"));
      if (runLabel) runLabel.textContent = replayText;
      return;
    }

    let index = 0;
    steps[0].classList.add("is-active");
    steps[0].setAttribute("aria-current", "step");

    runTimer = window.setInterval(() => {
      steps[index].classList.remove("is-active");
      steps[index].classList.add("is-done");
      steps[index].removeAttribute("aria-current");

      index += 1;

      if (index >= steps.length) {
        window.clearInterval(runTimer);
        runTimer = 0;
        if (runLabel) runLabel.textContent = replayText;
        return;
      }

      steps[index].classList.add("is-active");
      steps[index].setAttribute("aria-current", "step");
    }, STEP_MS);
  }

  function scheduleRender() {
    if (!input) return;
    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => {
      render(analyze(input.value, locale));
    }, DEBOUNCE_MS);
  }

  input?.addEventListener("input", scheduleRender);

  root.querySelectorAll<HTMLButtonElement>("[data-pg-example]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!input) return;
      window.clearTimeout(typingTimer);
      input.value = button.dataset.text ?? "";
      render(analyze(input.value, locale));
      input.focus();
    });
  });

  runButton?.addEventListener("click", run);

  // Establish a stable floor from the server-rendered first paint.
  lockOutputHeight();
}

export {};

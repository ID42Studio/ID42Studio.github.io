import { analyze, type Analysis } from "../lib/classify";
import type { Locale } from "../i18n";

/**
 * Local playground: the classifier runs in the browser, on every keystroke.
 * The server renders the first example, so the section is complete without JS;
 * this module only takes over once the visitor types.
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
  const runButton = root.querySelector<HTMLButtonElement>("[data-pg-run]");
  const runLabel = root.querySelector<HTMLElement>("[data-pg-run-label]");

  const locale = (root.dataset.locale as Locale) ?? "pt-BR";
  const models = JSON.parse(root.dataset.models ?? "{}") as Record<string, string>;
  const domains = JSON.parse(root.dataset.domains ?? "{}") as Record<string, string>;
  const noSignals = root.dataset.noSignals ?? "";
  const runText = root.dataset.run ?? "";
  const replayText = root.dataset.replay ?? "";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STEP_MS = 620;

  let typingTimer = 0;
  let runTimer = 0;

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

  function renderSignals(analysis: Analysis) {
    if (!signalsEl) return;
    signalsEl.textContent = "";

    if (!analysis.signals.length) {
      const empty = document.createElement("li");
      empty.className = "pg-signal pg-signal--empty";
      empty.textContent = noSignals;
      signalsEl.append(empty);
      return;
    }

    for (const signal of analysis.signals) {
      const item = document.createElement("li");
      item.className = "pg-signal";
      item.textContent = signal;
      signalsEl.append(item);
    }
  }

  function renderFlow(analysis: Analysis) {
    if (!flowEl) return;
    flowEl.textContent = "";

    analysis.flow.forEach((step, index) => {
      const item = document.createElement("li");
      item.className = "pg-step";
      item.dataset.step = String(index);

      const mark = document.createElement("span");
      mark.className = "pg-step-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = String(index + 1).padStart(2, "0");

      const label = document.createElement("span");
      label.className = "pg-step-label";
      label.textContent = step.label;

      const detail = document.createElement("span");
      detail.className = "pg-step-detail";
      detail.textContent = step.detail;

      item.append(mark, label, detail);
      flowEl.append(item);
    });
  }

  function render(analysis: Analysis) {
    stopRun();

    if (modelEl) modelEl.textContent = models[analysis.model] ?? analysis.model;
    if (domainEl) domainEl.textContent = domains[analysis.domain] ?? analysis.domain;

    const confidence = Math.round(analysis.confidence * 100);
    if (confidenceEl) confidenceEl.textContent = `${confidence}%`;
    if (meterEl) meterEl.style.width = `${confidence}%`;
    if (outcomeEl) outcomeEl.textContent = analysis.result;

    renderFlow(analysis);
    renderSignals(analysis);
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

  input?.addEventListener("input", () => {
    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => {
      render(analyze(input.value, locale));
    }, 160);
  });

  root.querySelectorAll<HTMLButtonElement>("[data-pg-example]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!input) return;
      input.value = button.dataset.text ?? "";
      render(analyze(input.value, locale));
      input.focus();
    });
  });

  runButton?.addEventListener("click", run);
}

export {};

export type Locale = "pt-BR" | "en";

export interface NavLink {
  label: string;
  href: string;
}

export interface TraceStep {
  label: string;
  detail: string;
}

/** One runnable flow in the hero console: a delivery model, its stages and its outcome. */
export interface ConsoleScenario {
  id: string;
  label: string;
  steps: TraceStep[];
  result: string;
}

export interface Challenge {
  n: string;
  title: string;
  text: string;
}

/** One engineering capability. `icon` names a glyph in `ui/Icon.astro`. */
export interface Capability {
  icon: string;
  title: string;
  text: string;
  tags: string[];
}

export interface ProcessStep {
  n: string;
  title: string;
  text: string;
}

export type ApplicationIcon = "sales" | "finance" | "support" | "enterprise";

/**
 * An operational domain with the outcome it can produce. These are possible
 * applications, never deployments that were not delivered.
 */
export interface UseCaseGroup {
  icon: ApplicationIcon;
  title: string;
  text: string;
  items: string[];
  deliverable: string;
}

/** Commercial delivery model: build it, run it, or sell the finished work. */
export interface DeliveryModel {
  key: string;
  title: string;
  text: string;
  items: string[];
  model: string;
}

/** One rung of the Software as a Work ladder. */
export interface SaawStage {
  label: string;
  text: string;
}

/**
 * A product the studio built and runs. Every field is factual by contract:
 * `problem` and `solution` describe the system, never results that were not
 * measured.
 */
export interface WorkItem {
  name: string;
  monogram: string;
  category: string;
  problem: string;
  solution: string;
  capabilities: string[];
  status: string;
  url: string;
  linkLabel: string;
  accent: "blue" | "cyan" | "violet";
}

export interface Principle {
  title: string;
  text: string;
}

export interface SiteContent {
  meta: {
    title: string;
    description: string;
    ogLocale: string;
  };
  nav: {
    links: NavLink[];
    cta: string;
  };
  hero: {
    eyebrow: string;
    titleLines: string[];
    accentLine: number;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    secondaryHref: string;
    /** Brand pillars, kept in English in both locales. */
    support: string;
    proofLabel: string;
    proof: string[];
    chips: string[];
    console: {
      title: string;
      status: string;
      scenarioLabel: string;
      run: string;
      replay: string;
      resultLabel: string;
      note: string;
      scenarios: ConsoleScenario[];
    };
  };
  marquee: {
    label: string;
    items: string[];
  };
  challenges: {
    index: string;
    eyebrow: string;
    title: string;
    text: string;
    items: Challenge[];
  };
  deliver: {
    index: string;
    eyebrow: string;
    title: string;
    text: string;
    models: DeliveryModel[];
    note: string;
  };
  capabilities: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Capability[];
  };
  saaw: {
    index: string;
    eyebrow: string;
    title: string;
    text: string;
    stages: SaawStage[];
    statement: string;
    note: string;
  };
  process: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    support: string;
    steps: ProcessStep[];
  };
  useCases: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    deliverableLabel: string;
    groups: UseCaseGroup[];
    note: string;
  };
  work: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    labels: {
      problem: string;
      solution: string;
      capabilities: string;
    };
    items: WorkItem[];
    note: string;
  };
  labs: {
    index: string;
    eyebrow: string;
    title: string;
    text: string;
    focusLabel: string;
    focus: string[];
    note: string;
  };
  about: {
    index: string;
    eyebrow: string;
    title: string;
    paragraphs: string[];
    principlesLabel: string;
    principles: Principle[];
    quote: string;
    expertiseLabel: string;
    expertise: string[];
    stats: { value: string; label: string }[];
  };
  cta: {
    title: string;
    text: string;
    button: string;
    secondary: string;
    note: string;
    emailSubject: string;
    emailBody: string;
  };
  footer: {
    tagline: string;
    navTitle: string;
    contactTitle: string;
    rights: string;
    madeIn: string;
    backToTop: string;
  };
  a11y: {
    skip: string;
    menuOpen: string;
    menuClose: string;
    language: string;
    mainNav: string;
    mobileNav: string;
    menu: string;
  };
}

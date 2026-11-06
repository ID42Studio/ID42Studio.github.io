export type Locale = "pt-BR" | "en";

export interface NavLink {
  label: string;
  href: string;
}

export interface TraceStep {
  label: string;
  detail: string;
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

export type ApplicationIcon =
  | "enterprise"
  | "intelligence"
  | "products"
  | "experience"
  | "knowledge"
  | "platforms";

/** A domain where the studio ships systems — a capability, not a client case. */
export interface ApplicationGroup {
  icon: ApplicationIcon;
  title: string;
  text: string;
  items: string[];
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
    /** Brand signature, kept in English in both locales. */
    support: string;
    proofLabel: string;
    proof: string[];
    chips: string[];
    trace: {
      title: string;
      status: string;
      steps: TraceStep[];
      footer: string;
      caption: string;
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
  capabilities: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Capability[];
  };
  process: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: ProcessStep[];
  };
  applications: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    groups: ApplicationGroup[];
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
  discovery: {
    index: string;
    eyebrow: string;
    title: string;
    text: string;
    deliverablesLabel: string;
    deliverables: string[];
    cta: string;
    note: string;
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
    decorativeTrace: string;
  };
}

export type Locale = "pt-BR" | "en";

export interface NavLink {
  label: string;
  href: string;
}

export interface TraceStep {
  label: string;
  detail: string;
}

export interface PainPoint {
  n: string;
  title: string;
  text: string;
}

export interface Solution {
  title: string;
  text: string;
  tags: string[];
}

export interface ProcessStep {
  n: string;
  title: string;
  text: string;
}

export interface UseCaseGroup {
  icon: "sales" | "support" | "ops" | "finance";
  title: string;
  items: string[];
}

export interface ProductCase {
  name: string;
  monogram: string;
  category: string;
  description: string;
  url: string;
  linkLabel: string;
  accent: "blue" | "cyan" | "violet";
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
    proofLabel: string;
    proof: string[];
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
  problem: {
    index: string;
    eyebrow: string;
    title: string;
    text: string;
    items: PainPoint[];
  };
  solutions: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Solution[];
  };
  process: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: ProcessStep[];
  };
  useCases: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    groups: UseCaseGroup[];
  };
  cases: {
    index: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    items: ProductCase[];
    note: string;
  };
  about: {
    index: string;
    eyebrow: string;
    title: string;
    paragraphs: string[];
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
  };
  a11y: {
    skip: string;
    menuOpen: string;
    menuClose: string;
    language: string;
    decorativeTrace: string;
  };
}

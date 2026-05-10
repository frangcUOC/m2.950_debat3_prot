import * as React from "react";

export type Lang = "ca" | "es" | "en";

type Dict = Record<string, string>;

const dicts: Record<Lang, Dict> = {
  ca: {
    "app.title": "TornAI · Gestor de Torns Intel·ligent",
    "app.subtitle": "Gestor de Torns",
    "nav.section": "Navegació",
    "nav.dashboard": "Dashboard",
    "nav.ingesta": "Ingesta de dades",
    "nav.professionals": "Professionals",
    "nav.quadrant": "Quadrant setmanal",
    "nav.simulador": "Simulador de baixa",
    "nav.reporting": "Reporting",
    "nav.incidencies": "Incidències",
    "nav.previsio": "Previsió de baixes",
    "nav.dades": "Dades i consentiments",
    "consent.pending": "Consentiment pendent",
    "user.appearance": "Aparença",
    "user.theme.light": "Mode clar",
    "user.theme.dark": "Mode fosc",
    "user.language": "Idioma",
    "user.profile": "Perfil (pròximament)",
    "user.logout": "Tanca la sessió",
    "user.logout.toast": "Sessió tancada",
    "user.logout.toast.desc": "S'ha tancat la sessió simulada correctament.",
    "premium.contact": "Contacta amb l'àrea comercial",
    "premium.contact.toast": "Hem rebut la teva sol·licitud. L'àrea comercial es posarà en contacte amb tu.",
  },
  es: {
    "app.title": "TornAI · Gestor de Turnos Inteligente",
    "app.subtitle": "Gestor de Turnos",
    "nav.section": "Navegación",
    "nav.dashboard": "Panel",
    "nav.ingesta": "Carga de datos",
    "nav.professionals": "Profesionales",
    "nav.quadrant": "Cuadrante semanal",
    "nav.simulador": "Simulador de baja",
    "nav.reporting": "Reporting",
    "nav.incidencies": "Incidencias",
    "nav.previsio": "Previsión de bajas",
    "nav.dades": "Datos y consentimientos",
    "consent.pending": "Consentimiento pendiente",
    "user.appearance": "Apariencia",
    "user.theme.light": "Modo claro",
    "user.theme.dark": "Modo oscuro",
    "user.language": "Idioma",
    "user.profile": "Perfil (próximamente)",
    "user.logout": "Cerrar sesión",
    "user.logout.toast": "Sesión cerrada",
    "user.logout.toast.desc": "Se ha cerrado la sesión simulada correctamente.",
    "premium.contact": "Contacta con el área comercial",
    "premium.contact.toast": "Hemos recibido tu solicitud. El área comercial se pondrá en contacto contigo.",
  },
  en: {
    "app.title": "TornAI · Smart Shift Manager",
    "app.subtitle": "Shift Manager",
    "nav.section": "Navigation",
    "nav.dashboard": "Dashboard",
    "nav.ingesta": "Data ingest",
    "nav.professionals": "Staff",
    "nav.quadrant": "Weekly schedule",
    "nav.simulador": "Absence simulator",
    "nav.reporting": "Reporting",
    "nav.incidencies": "Incidents",
    "nav.previsio": "Absence forecast",
    "nav.dades": "Data & consent",
    "consent.pending": "Consent pending",
    "user.appearance": "Appearance",
    "user.theme.light": "Light mode",
    "user.theme.dark": "Dark mode",
    "user.language": "Language",
    "user.profile": "Profile (coming soon)",
    "user.logout": "Log out",
    "user.logout.toast": "Signed out",
    "user.logout.toast.desc": "The simulated session has been closed.",
    "premium.contact": "Contact the sales team",
    "premium.contact.toast": "We received your request. The sales team will contact you shortly.",
  },
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nCtx = React.createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("ca");

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("tornai-lang") as Lang | null;
      if (stored && ["ca", "es", "en"].includes(stored)) setLangState(stored);
    } catch {}
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("tornai-lang", l); } catch {}
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ lang, setLang, t: (k) => dicts[lang][k] ?? dicts.ca[k] ?? k }),
    [lang, setLang]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export const LANG_LABELS: Record<Lang, string> = {
  ca: "Català",
  es: "Castellano",
  en: "English",
};

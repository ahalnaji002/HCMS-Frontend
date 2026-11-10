import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/presentation/i18n/en.json";
import ar from "@/presentation/i18n/ar.json";

// Arabic is the default for first-time visitors (the system serves Gaza);
// a language chosen with the toggle is remembered.
const SUPPORTED_LANGUAGES = ["ar", "en"];
const DEFAULT_LANGUAGE = "ar";

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem("hcms-language");
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

const savedLanguage = readSavedLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    ar: {
      translation: ar,
    },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

const updateDocumentLanguage = (language) => {
  const isArabic = language === "ar";

  document.documentElement.lang = language;
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
};

updateDocumentLanguage(savedLanguage);

i18n.on("languageChanged", (language) => {
  try {
    localStorage.setItem("hcms-language", language);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit.
  }
  updateDocumentLanguage(language);
});

export default i18n;

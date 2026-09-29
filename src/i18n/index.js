import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import ar from "./ar.json";

const savedLanguage = localStorage.getItem("hcms-language") || "en";

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
  localStorage.setItem("hcms-language", language);
  updateDocumentLanguage(language);
});

export default i18n;

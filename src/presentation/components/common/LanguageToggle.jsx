import { useTranslation } from "react-i18next";

function LanguageToggle() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.resolvedLanguage || i18n.language;
  const isArabic = currentLanguage.startsWith("ar");

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? "en" : "ar");
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-text-secondary transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label={
        isArabic
          ? t("accessibility.switchToEnglish")
          : t("accessibility.switchToArabic")
      }
    >
      {isArabic ? "EN" : "AR"}
    </button>
  );
}

export default LanguageToggle;

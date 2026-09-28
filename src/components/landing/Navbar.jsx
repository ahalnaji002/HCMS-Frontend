import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../common/LanguageToggle";
import Logo from "../common/Logo";
import ThemeToggle from "../common/ThemeToggle";
import { useTheme } from "../../context/ThemeContext";

function Navbar() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0" aria-label="HCMS Home">
          <Logo
            variant="logo"
            appearance={theme === "dark" ? "dark" : "light"}
            className="h-auto w-24 sm:h-11 sm:w-auto"
          />
        </Link>

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Main navigation"
        >
          <a
            href="#about"
            className="text-sm font-medium text-text-secondary transition hover:text-primary"
          >
            {t("nav.about")}
          </a>

          <a
            href="#features"
            className="text-sm font-medium text-text-secondary transition hover:text-primary"
          >
            {t("nav.features")}
          </a>

          <a
            href="#roles"
            className="text-sm font-medium text-text-secondary transition hover:text-primary"
          >
            {t("nav.whoWeServe")}
          </a>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageToggle />
          <ThemeToggle />

          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-background hover:text-primary sm:inline-flex sm:px-4"
          >
            {t("common.login")}
          </Link>

          <Link
            to="/register/patient"
            className="rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:px-5"
          >
            {t("common.getStarted")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

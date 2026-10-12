import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/presentation/components/common/LanguageToggle";
import Logo from "@/presentation/components/common/Logo";
import ThemeToggle from "@/presentation/components/common/ThemeToggle";
import { useTheme } from "@/presentation/context/ThemeContext";
import useActiveSection from "@/presentation/hooks/useActiveSection";
import RegistrationRolePicker from "@/presentation/components/landing/RegistrationRolePicker";
import landingSectionLinks from "@/presentation/components/landing/landingNavigation";

const trackedSectionIds = landingSectionLinks.map(({ id }) => id);

function Navbar() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const [activeSection, setActiveSection] =
    useActiveSection(trackedSectionIds);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const selectSection = (id) => {
    setActiveSection(id);
    setIsMenuOpen(false);
  };

  const returnToTop = (event) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    setIsMenuOpen(false);
    setActiveSection(null);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <a
          href="/"
          className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          aria-label={t("accessibility.home")}
          onClick={returnToTop}
        >
          <Logo
            variant="logo"
            appearance={theme === "dark" ? "dark" : "light"}
            className="h-auto w-24 sm:h-11 sm:w-auto"
            alt={t("accessibility.logoAlt")}
          />
        </a>

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label={t("accessibility.mainNavigation")}
        >
          {landingSectionLinks.map(({ id, translationKey }) => {
            const isActive = activeSection === id;

            return (
              <a
                key={id}
                href={`#${id}`}
                className={`rounded text-sm font-medium transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
                  isActive ? "text-primary" : "text-text-secondary"
                }`}
                aria-current={isActive ? "location" : undefined}
                onClick={() => selectSection(id)}
              >
                {t(translationKey)}
              </a>
            );
          })}

        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-background hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex sm:px-4"
          >
            {t("common.login")}
          </Link>

          <RegistrationRolePicker
            className="rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-5"
            onOpen={() => setIsMenuOpen(false)}
          />

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
            aria-label={
              isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")
            }
            aria-expanded={isMenuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg
              aria-hidden="true"
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {isMenuOpen ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="landing-mobile-menu"
        className={
          isMenuOpen
            ? "absolute inset-x-0 top-full border-y border-border bg-surface shadow-lg shadow-primary/5 lg:hidden"
            : "hidden"
        }
      >
        <nav
          className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-6"
          aria-label={t("nav.mobileNavigation")}
        >
          {landingSectionLinks.map(({ id, translationKey }) => {
            const isActive = activeSection === id;

            return (
              <a
                key={id}
                href={`#${id}`}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-background hover:text-primary ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary"
                }`}
                aria-current={isActive ? "location" : undefined}
                onClick={() => selectSection(id)}
              >
                {t(translationKey)}
              </a>
            );
          })}

          <Link
            to="/login"
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-background hover:text-primary sm:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            {t("common.login")}
          </Link>

          <div className="mt-2 flex items-center gap-2 border-t border-border pt-3 sm:hidden">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;

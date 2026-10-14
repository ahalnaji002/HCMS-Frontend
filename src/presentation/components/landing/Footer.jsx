import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "@/presentation/components/common/Logo";
import { useTheme } from "@/presentation/context/ThemeContext";
import RegistrationRolePicker from "@/presentation/components/landing/RegistrationRolePicker";
import landingSectionLinks from "@/presentation/components/landing/landingNavigation";

function Footer() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-12">
          <div className="max-w-md">
            <Logo
              variant="logo"
              appearance={theme === "dark" ? "dark" : "light"}
              className="h-11 w-auto"
              alt={t("accessibility.logoAlt")}
            />
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              {t("landing.footer.description")}
            </p>
          </div>

          <nav aria-label={t("landing.footer.navigationLabel")}>
            <h2 className="text-sm font-semibold text-text-primary">
              {t("landing.footer.navigationTitle")}
            </h2>
            <ul className="mt-4 space-y-3">
              {landingSectionLinks.map(({ id, translationKey }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="inline-flex rounded text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    {t(translationKey)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              {t("landing.footer.accountTitle")}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("common.login")}
              </Link>
              <RegistrationRolePicker className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 sm:mt-12">
          <p className="text-sm text-text-secondary">
            {t("landing.footer.copyright", {
              year: new Date().getFullYear(),
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

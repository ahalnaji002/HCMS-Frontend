import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/presentation/context/useAuth";
import LanguageToggle from "@/presentation/components/common/LanguageToggle";
import ThemeToggle from "@/presentation/components/common/ThemeToggle";
import Logo from "@/presentation/components/common/Logo";
import { useTheme } from "@/presentation/context/ThemeContext";
import roleNavigation from "@/presentation/layouts/roleNavigation";

function RoleLayout({ children, mainClassName, role }) {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const navigationItems = roleNavigation[role] ?? [];
  const firstAvailableItem = navigationItems.find((item) => item.available);
  const accountName = user?.full_name || t("roleHome.accountFallback");
  const accountRole = t(`roleHome.roles.${role.toLowerCase()}.label`);

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    function closeAccountMenu(event) {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && accountMenuRef.current?.contains(event.target)) return;

      setIsAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeAccountMenu);
    document.addEventListener("keydown", closeAccountMenu);
    return () => {
      document.removeEventListener("pointerdown", closeAccountMenu);
      document.removeEventListener("keydown", closeAccountMenu);
    };
  }, [isAccountMenuOpen]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            aria-label={t("accessibility.home")}
          >
            <Logo
              variant="logo"
              appearance={theme === "dark" ? "dark" : "light"}
              className="h-auto w-24 sm:h-11 sm:w-auto"
              alt={t("accessibility.logoAlt")}
            />
          </Link>
          <button
            type="button"
            aria-expanded={isNavigationOpen}
            aria-controls="role-navigation"
            onClick={() => setIsNavigationOpen((isOpen) => !isOpen)}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
          >
            {t(isNavigationOpen ? "roleNavigation.close" : "roleNavigation.open")}
          </button>
          <div className="flex w-full items-center justify-end gap-2 md:w-auto md:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu"
                aria-label={t("roleHome.accountMenuLabel", { name: accountName, role: accountRole })}
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2 text-start transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">
                  {accountName.trim().charAt(0).toLocaleUpperCase()}
                </span>
                <span className="grid min-w-0">
                  <span className="max-w-44 truncate text-sm font-semibold text-text-primary">{accountName}</span>
                  <span className="text-xs text-text-secondary">{accountRole}</span>
                </span>
                <svg aria-hidden="true" className={`size-4 text-text-secondary transition-transform ${isAccountMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {isAccountMenuOpen && (
                <div id="account-menu" className="absolute end-0 top-full z-50 mt-2 min-w-52 rounded-xl border border-border bg-surface p-2 shadow-xl">
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-semibold text-text-primary">{accountName}</p>
                    <p className="mt-1 text-xs text-text-secondary">{accountRole}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 w-full rounded-lg px-3 py-2 text-start text-sm font-semibold text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                  >
                    {t("roleHome.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="flex w-full flex-col md:min-h-[calc(100vh-72px)] md:flex-row">
        <aside className="w-full shrink-0 md:w-64 md:border-e md:border-border md:bg-surface">
          <nav
            id="role-navigation"
            aria-label={t("roleNavigation.label")}
            className={`${isNavigationOpen ? "block" : "hidden"} max-h-[calc(100vh-10rem)] overflow-y-auto px-5 py-4 sm:px-6 md:sticky md:top-0 md:block md:max-h-[calc(100vh-72px)] md:px-0 md:py-0`}
          >
            <ul className="space-y-1 rounded-xl border border-border bg-surface p-3 md:space-y-1 md:rounded-none md:border-0 md:bg-transparent md:px-3 md:py-5">
              {navigationItems.map((item) => {
                const label = t(item.label);
                const isCurrentHash = item.href?.startsWith("#") && location.hash === item.href;
                const isCurrentPath = item.href?.startsWith("/") && location.pathname === item.href;
                const isDefaultItem =
                  !location.hash && item === firstAvailableItem && isCurrentPath;
                const isActive = isCurrentHash || isDefaultItem;

                return (
                  <li key={item.label}>
                    {item.available ? (
                      <Link
                        to={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setIsNavigationOpen(false)}
                        className={`block rounded-lg px-3 py-2 text-start text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          isActive
                            ? "bg-primary text-white"
                            : "text-text-secondary hover:bg-background hover:text-text-primary"
                        }`}
                      >
                        {label}
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary/70"
                      >
                        <span>{label}</span>
                        <span className="shrink-0 rounded-full bg-background px-2 py-1 text-xs">
                          {t("roleNavigation.comingSoon")}
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <main className={`${mainClassName || ""} min-w-0 flex-1 px-5 pb-6 pt-4 sm:px-6 lg:px-8`}>{children}</main>
      </div>
    </div>
  );
}

export default RoleLayout;

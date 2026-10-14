import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Public signup deliberately excludes administrators. Each available role links
// directly to its public registration route.
const registrationRoles = [
  { key: "patient", route: "/register/patient" },
  { key: "doctor", route: "/register/doctor" },
  { key: "organization", route: "/register/ngo" },
];

function RoleIcon({ role }) {
  const paths = {
    patient: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    doctor: (
      <>
        <path d="M8 3v4a4 4 0 0 0 8 0V3M6 3h4M14 3h4M12 11v2a5 5 0 0 0 5 5h1" />
        <circle cx="19" cy="18" r="2" />
      </>
    ),
    organization: (
      <path d="M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[role]}
    </svg>
  );
}

function RegistrationRolePicker({ className = "", onOpen }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dialogAnimationOrigin, setDialogAnimationOrigin] = useState({
    x: 0,
    y: 0,
  });
  const triggerRef = useRef(null);
  const firstRoleRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    firstRoleRef.current?.focus();

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }

      if (event.key === "Tab") {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (!focusableElements?.length) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const closeDialog = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const openDialog = () => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();

    if (triggerRect) {
      setDialogAnimationOrigin({
        x: triggerRect.left + triggerRect.width / 2 - window.innerWidth / 2,
        y: triggerRect.top + triggerRect.height / 2 - window.innerHeight / 2,
      });
    }

    onOpen?.();
    setIsOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="registration-role-dialog"
        onClick={openDialog}
      >
        {t("common.getStarted")}
      </button>

      {isOpen &&
        // The portal keeps the fixed overlay independent of sticky/backdrop-filter
        // ancestors such as the Navbar, which would otherwise clip the dialog.
        createPortal(
          <div
            className="registration-role-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDialog();
              }
            }}
          >
            <div
              ref={dialogRef}
              id="registration-role-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="registration-role-title"
              aria-describedby="registration-role-description"
              className="registration-role-dialog w-full max-w-md rounded-3xl border border-border bg-surface p-5 shadow-2xl shadow-primary/10 sm:p-6"
              style={{
                "--registration-origin-x": `${dialogAnimationOrigin.x}px`,
                "--registration-origin-y": `${dialogAnimationOrigin.y}px`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="registration-role-title"
                    className="text-xl font-bold text-text-primary"
                  >
                    {t("landing.cta.rolePickerTitle")}
                  </h2>
                  <p
                    id="registration-role-description"
                    className="mt-2 text-sm leading-6 text-text-secondary"
                  >
                    {t("landing.cta.rolePickerDescription")}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={t("landing.cta.closeRolePicker")}
                  onClick={closeDialog}
                >
                  <svg
                    aria-hidden="true"
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {registrationRoles.map(({ key, route }, index) => {
                  const content = (
                    <>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <RoleIcon role={key} />
                      </span>
                      <span className="min-w-0 flex-1 text-start font-semibold text-text-primary">
                        {t(`landing.cta.roles.${key}`)}
                      </span>
                      {!route && (
                        <span className="ms-auto rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {t("landing.cta.comingSoon")}
                        </span>
                      )}
                    </>
                  );

                  return route ? (
                    <Link
                      key={key}
                      ref={index === 0 ? firstRoleRef : undefined}
                      to={route}
                      className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-background px-4 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={key}
                      type="button"
                      disabled
                      className="flex min-h-14 w-full cursor-not-allowed items-center gap-3 rounded-2xl border border-border bg-background px-4 text-start opacity-70"
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default RegistrationRolePicker;

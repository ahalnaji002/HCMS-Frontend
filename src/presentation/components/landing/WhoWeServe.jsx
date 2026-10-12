import { useTranslation } from "react-i18next";

const roles = [
  {
    key: "patients",
    icon: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 21a7 7 0 0 1 14 0M12 3v2M7.5 4.5 9 6M16.5 4.5 15 6" />
      </>
    ),
    capabilities: ["medicalInformation", "treatmentTracking", "doctorCommunication", "assistanceAlerts"],
  },
  {
    key: "doctors",
    icon: (
      <>
        <path d="M8 3v4a4 4 0 0 0 8 0V3M6 3h4M14 3h4M12 11v2a5 5 0 0 0 5 5h1" />
        <circle cx="19" cy="18" r="2" />
      </>
    ),
    capabilities: ["assignedPatients", "carePlanning", "medicationsAppointments", "patientCommunication"],
  },
  {
    key: "organizations",
    icon: (
      <>
        <path d="M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2" />
      </>
    ),
    capabilities: ["assistanceRequests", "resourceCoordination", "careContinuity"],
  },
  {
    key: "administrators",
    icon: (
      <>
        <path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    capabilities: ["userManagement", "systemOversight", "alertsOperations"],
  },
];

function RoleIcon({ children }) {
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}

function WhoWeServe() {
  const { t } = useTranslation();

  return (
    <section
      id="who-we-serve"
      aria-labelledby="who-we-serve-heading"
      className="scroll-mt-20 bg-surface py-14 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t("landing.whoWeServe.eyebrow")}
          </p>
          <h2
            id="who-we-serve-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            {t("landing.whoWeServe.heading")}
          </h2>
          <p className="mt-5 text-base leading-8 text-text-secondary sm:text-lg">
            {t("landing.whoWeServe.description")}
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:mt-16 xl:grid-cols-4">
          {roles.map(({ key, icon, capabilities }) => (
            <article
              key={key}
              className="rounded-2xl border border-border bg-background p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/50"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RoleIcon>{icon}</RoleIcon>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-text-primary">
                {t(`landing.whoWeServe.roles.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {t(`landing.whoWeServe.roles.${key}.description`)}
              </p>
              <ul className="mt-5 space-y-3 border-t border-border pt-5">
                {capabilities.map((capability) => (
                  <li
                    key={capability}
                    className="flex items-start gap-2 text-sm leading-5 text-text-secondary"
                  >
                    <span className="text-primary">
                      <CheckIcon />
                    </span>
                    <span>
                      {t(
                        `landing.whoWeServe.roles.${key}.capabilities.${capability}`,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhoWeServe;

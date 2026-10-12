import { useTranslation } from "react-i18next";

const features = [
  {
    key: "medicalRecords",
    icon: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  },
  {
    key: "treatmentFollowUp",
    icon: (
      <>
        <path d="M12 3v18M3 12h18" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
  {
    key: "doctorPatientCoordination",
    icon: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M2.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6M14 15c3.5 0 5.5 1.5 6 4" />
      </>
    ),
  },
  {
    key: "assistanceResources",
    icon: (
      <>
        <path d="M4 10h16v10H4zM7 10V7a5 5 0 0 1 10 0v3" />
        <path d="M12 13v4M10 15h4" />
      </>
    ),
  },
  {
    key: "emergencyAlerts",
    icon: (
      <>
        <path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
  },
  {
    key: "secureCommunication",
    icon: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 10h8M8 14h5" />
      </>
    ),
  },
];

function FeatureIcon({ children }) {
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

function Features() {
  const { t } = useTranslation();

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 bg-background py-14 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t("landing.features.eyebrow")}
          </p>
          <h2
            id="features-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
          >
            {t("landing.features.heading")}
          </h2>
          <p className="mt-5 text-base leading-8 text-text-secondary sm:text-lg">
            {t("landing.features.introduction")}
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {features.map(({ key, icon }) => (
            <article
              key={key}
              className="rounded-2xl border border-border bg-surface p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/50"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FeatureIcon>{icon}</FeatureIcon>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-text-primary">
                {t(`landing.features.items.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {t(`landing.features.items.${key}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;

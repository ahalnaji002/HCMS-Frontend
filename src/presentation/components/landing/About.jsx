import { useTranslation } from "react-i18next";

const valueKeys = ["connectedCare", "coordinatedResources", "continuityOfCare"];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function About() {
  const { t } = useTranslation();

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-20 border-t border-border bg-surface py-14 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              {t("landing.about.eyebrow")}
            </p>
            <h2
              id="about-heading"
              className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
            >
              {t("landing.about.heading")}
            </h2>
            <p className="mt-6 text-base leading-8 text-text-secondary sm:text-lg">
              {t("landing.about.description")}
            </p>
          </div>

          <div className="space-y-4">
            {valueKeys.map((key) => (
              <article
                key={key}
                className="flex gap-4 rounded-2xl border border-border bg-background p-5 sm:p-6"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CheckIcon />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {t(`landing.about.values.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {t(`landing.about.values.${key}.description`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;

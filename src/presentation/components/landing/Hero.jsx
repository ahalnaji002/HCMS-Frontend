import { useTranslation } from "react-i18next";
import hcmsMarkWhite from "@/assets/brand/hcms-mark-white.svg";
import RegistrationRolePicker from "@/presentation/components/landing/RegistrationRolePicker";

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      >
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-5 py-10 sm:gap-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-start text-xs font-semibold leading-5 text-primary shadow-sm sm:mb-6 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {t("landing.badge")}
          </div>

          <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            {t("landing.heroTitle")}
            <span className="block text-primary">
              {t("landing.heroHighlight")}
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-8 text-text-secondary sm:mt-6 sm:text-lg">
            {t("landing.heroDescription")}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <RegistrationRolePicker className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />

            <a
              href="#about"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-text-primary transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("common.learnMore")}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-5 sm:mt-10 sm:pt-6">
            <div>
              <p className="font-semibold text-text-primary">
                {t("landing.patients")}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {t("landing.patientDescription")}
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary">
                {t("landing.doctors")}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {t("landing.doctorDescription")}
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary">
                {t("landing.organizations")}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {t("landing.organizationDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div
            className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-5 shadow-2xl shadow-primary/10 sm:p-7">
            <div className="mb-7 flex min-h-9 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {t("landing.connectedCare")}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {t("landing.connectedCareDescription")}
                </p>
              </div>

              <div
                className="relative h-8 w-full shrink-0 sm:w-56"
                aria-hidden="true"
              >
                {[
                  ["patients", "medicalRecordUpdated"],
                  ["admin", "emergencyAlert"],
                  ["organizations", "resourceAllocated"],
                  ["doctors", "treatmentFollowUpUpdated"],
                ].map(([role, event]) => (
                  <div
                    key={role}
                    className={`connected-care-event connected-care-event-${role} absolute inset-0 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 text-start text-[11px] font-medium whitespace-nowrap text-text-secondary`}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-primary shadow-sm shadow-primary/50" />
                    <span>{t(`landing.liveEvents.${event}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto flex aspect-square max-w-sm items-center justify-center">
              <div
                className="absolute h-[72%] w-[72%] rounded-full border border-dashed border-primary/30"
                aria-hidden="true"
              />

              <div
                className="connected-care-orbit-signal pointer-events-none absolute h-[72%] w-[72%] rounded-full"
                aria-hidden="true"
              >
                <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
              </div>

              <div
                className="absolute h-[48%] w-[48%] rounded-full bg-primary/10"
                aria-hidden="true"
              />

              <div className="connected-care-center relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary p-4 shadow-xl shadow-primary/20">
                <img
                  src={hcmsMarkWhite}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-contain"
                />
              </div>

              <div
                className="connected-care-role connected-care-role-patients absolute left-1/2 top-2 -translate-x-1/2 rounded-2xl border border-border bg-surface px-5 py-3 text-center shadow-lg"
                role="group"
                tabIndex="0"
              >
                <p className="text-xs font-bold text-text-primary">
                  {t("landing.patients")}
                </p>
                <p className="mt-1 text-[10px] text-text-secondary">
                  {t("landing.care")}
                </p>
              </div>

              <div
                className="connected-care-role connected-care-role-organizations absolute bottom-2 left-1/2 -translate-x-1/2 rounded-2xl border border-border bg-surface px-5 py-3 text-center shadow-lg"
                role="group"
                tabIndex="0"
              >
                <p className="text-xs font-bold text-text-primary">
                  {t("landing.organizations")}
                </p>
                <p className="mt-1 text-[10px] text-text-secondary">
                  {t("landing.resources")}
                </p>
              </div>

              <div
                className="connected-care-role connected-care-role-doctors absolute left-0 top-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface px-5 py-3 text-center shadow-lg"
                role="group"
                tabIndex="0"
              >
                <p className="text-xs font-bold text-text-primary">
                  {t("landing.doctors")}
                </p>
                <p className="mt-1 text-[10px] text-text-secondary">
                  {t("landing.treatment")}
                </p>
              </div>

              <div
                className="connected-care-role connected-care-role-admin absolute right-0 top-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface px-5 py-3 text-center shadow-lg"
                role="group"
                tabIndex="0"
              >
                <p className="text-xs font-bold text-text-primary">
                  {t("landing.admin")}
                </p>
                <p className="mt-1 text-[10px] text-text-secondary">
                  {t("landing.adminDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

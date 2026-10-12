import { useTranslation } from "react-i18next";
import RegistrationRolePicker from "@/presentation/components/landing/RegistrationRolePicker";

function CTA() {
  const { t } = useTranslation();

  return (
    <section className="bg-background px-5 py-14 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl rounded-3xl border border-border bg-surface px-5 py-10 text-center shadow-lg shadow-primary/5 sm:px-10 sm:py-14">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {t("landing.cta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
          {t("landing.cta.description")}
        </p>
        <div className="mt-7 flex justify-center">
          <RegistrationRolePicker className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
        </div>
      </div>
    </section>
  );
}

export default CTA;

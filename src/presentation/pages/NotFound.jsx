import { useTranslation } from "react-i18next";
import { ButtonLink } from "@/presentation/components/ui";

function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="max-w-md text-center">
        <p className="text-5xl font-bold text-primary" aria-hidden="true">404</p>
        <h1 className="mt-4 text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-3 text-text-secondary">{t("notFound.description")}</p>
        <ButtonLink to="/" variant="primary" className="mt-6">
          {t("notFound.home")}
        </ButtonLink>
      </div>
    </main>
  );
}

export default NotFound;

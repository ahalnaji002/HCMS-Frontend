import { Component } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/presentation/components/ui/Button";
import { isChunkLoadError, reloadOnceForNewVersion } from "@/presentation/utils/chunkReload";

function AppErrorFallback() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-2xl font-bold">{t("appError.title")}</h1>
        <p className="mt-3 text-text-secondary">{t("appError.description")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={() => window.location.reload()}>
            {t("appError.reload")}
          </Button>
          {/* A full page load, so the app starts again from a clean state. */}
          <a href="/" className="inline-flex items-center px-4 py-2 font-medium text-primary underline-offset-4 hover:underline">
            {t("appError.home")}
          </a>
        </div>
      </div>
    </main>
  );
}

// Catches render errors anywhere below it, so a failure shows a message with
// a way out instead of a blank page. `resetKey` (the current path) clears the
// error when the user navigates elsewhere.
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      reloadOnceForNewVersion();
    }
  }

  render() {
    return this.state.error ? <AppErrorFallback /> : this.props.children;
  }
}

export default AppErrorBoundary;

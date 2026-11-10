import { useEffect, useRef, useState } from "react";
import {
  formatCoordinates, geolocationErrorKey, getCurrentCoordinates, isGeolocationSupported, mapUrl, parseCoordinates,
} from "@/presentation/utils/geolocation";

// Emergency alert form in a native modal dialog. It is opened from the floating
// emergency button (always visible) or from the "My recent alerts" section.
function PatientEmergencyDialog({ t, open, onClose, form, setForm, error, notice, isSubmitting, onSubmit }) {
  const dialogRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const coordinates = parseCoordinates(form.location);

  async function fillCurrentLocation() {
    setLocating(true);
    setLocationError("");
    try {
      const position = await getCurrentCoordinates();
      const point = formatCoordinates(position, t("patientWorkspace.meters"));
      // Keep any landmark the patient already typed after the coordinates.
      setForm((current) => {
        const typed = current.location.trim();
        const landmark = parseCoordinates(typed) ? "" : typed;
        return { ...current, location: (landmark ? `${point} - ${landmark}` : point).slice(0, 255) };
      });
    } catch (geoError) {
      setLocationError(t(geolocationErrorKey(geoError)));
    } finally {
      setLocating(false);
    }
  }
  const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 font-normal";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="emergency-dialog-title"
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl border border-danger/40 bg-surface p-0 text-text-primary shadow-2xl backdrop:bg-black/60"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="emergency-dialog-title" className="text-xl font-bold text-danger">{t("patientWorkspace.emergencyDialogTitle")}</h2>
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold">{t("patientWorkspace.close")}</button>
        </div>
        {notice ? (
          <div className="mt-6">
            <p role="status" className="rounded-xl bg-primary/10 p-4 text-sm leading-6 text-primary">{notice}</p>
            <button type="button" onClick={onClose} className="mt-6 min-h-11 w-full rounded-xl bg-primary px-6 py-3 font-semibold text-white">{t("patientWorkspace.close")}</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 grid gap-4">
            <p className="text-sm leading-6 text-text-secondary">{t("patientWorkspace.emergencyDialogHint")}</p>
            {error && <p role="alert" className="rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
            <label className="space-y-2 text-sm font-semibold">{t("patientWorkspace.alertPhone")}
              <input required maxLength={30} inputMode="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} className={inputClass} />
            </label>
            <div className="space-y-2">
              <label className="block space-y-2 text-sm font-semibold">{t("patientWorkspace.alertLocation")}
                <input maxLength={255} value={form.location} onChange={update("location")} placeholder={t("patientWorkspace.locationPlaceholder")} className={inputClass} />
              </label>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {isGeolocationSupported() && (
                  <button type="button" onClick={fillCurrentLocation} disabled={locating} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary px-3 py-2 font-semibold text-primary disabled:opacity-60">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    {locating ? t("patientWorkspace.locating") : t("patientWorkspace.useMyLocation")}
                  </button>
                )}
                {coordinates && (
                  <a href={mapUrl(coordinates)} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-4">{t("patientWorkspace.viewOnMap")}</a>
                )}
              </div>
              {locationError && <p role="alert" className="text-sm text-danger">{locationError}</p>}
            </div>
            <label className="space-y-2 text-sm font-semibold">{t("patientWorkspace.alertDescription")}
              <textarea rows={3} maxLength={10000} value={form.description} onChange={update("description")} className={inputClass} />
            </label>
            <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-xl bg-danger px-6 py-3 text-base font-bold text-white disabled:opacity-60">
              {isSubmitting ? t("patientWorkspace.saving") : t("patientWorkspace.sendAlert")}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

export function PatientEmergencyButton({ t, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("patientWorkspace.emergencyDialogTitle")}
      className="fixed bottom-5 end-5 z-40 flex min-h-14 items-center gap-2 rounded-full bg-danger px-6 py-3 text-base font-bold text-white shadow-xl ring-4 ring-danger/25 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-danger"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
      {t("patientWorkspace.emergencyButton")}
    </button>
  );
}

export default PatientEmergencyDialog;

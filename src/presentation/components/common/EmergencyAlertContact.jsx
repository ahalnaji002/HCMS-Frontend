import { mapUrl, parseCoordinates } from "@/presentation/utils/geolocation";

// Phone opens a call on mobile; GPS coordinates from the patient's
// emergency form open on a map. Shared by the Admin and Doctor alert pages.
function EmergencyAlertContact({ t, phone, location }) {
  const coordinates = parseCoordinates(location);
  return (
    <div className="space-y-1">
      <p className="font-bold">
        <a href={`tel:${phone}`} dir="ltr" className="underline-offset-4 hover:underline">{phone}</a>
        {" · "}
        <span>{location || "—"}</span>
      </p>
      {coordinates && (
        <a href={mapUrl(coordinates)} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-primary underline underline-offset-4">
          {t("patientWorkspace.viewOnMap")}
        </a>
      )}
    </div>
  );
}

export default EmergencyAlertContact;

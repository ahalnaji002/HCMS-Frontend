import { mapUrl, parseCoordinates } from "@/presentation/utils/geolocation";

// Phone opens a call on mobile; GPS coordinates from the emergency form open on
// a map. Empty locations are left out instead of printing a dash.
// Shared by the Admin and Doctor alert pages.
function EmergencyAlertContact({ t, phone, location }) {
  const coordinates = parseCoordinates(location);
  return (
    <div className="min-w-0 space-y-1">
      <a href={`tel:${phone}`} dir="ltr" className="inline-block font-bold underline-offset-4 hover:underline">{phone}</a>
      {/* dir="auto": GPS text reads left-to-right, typed Arabic places right-to-left;
          match-parent keeps the line aligned with the rest of the card. */}
      {location && <p dir="auto" className="break-words text-sm text-text-primary [text-align:match-parent]">{location}</p>}
      {coordinates && (
        <a href={mapUrl(coordinates)} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-primary underline underline-offset-4">
          {t("patientWorkspace.viewOnMap")}
        </a>
      )}
    </div>
  );
}

export default EmergencyAlertContact;

// Browser geolocation helpers for the emergency alert form.
// Requires a secure context (HTTPS or localhost).

export function isGeolocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator && window.isSecureContext !== false;
}

export function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

// "31.41771, 34.35232 (±15 m)" — plain text so it fits the existing location field.
export function formatCoordinates({ latitude, longitude, accuracy }, metersLabel = "m") {
  const point = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  return Number.isFinite(accuracy) ? `${point} (±${Math.round(accuracy)} ${metersLabel})` : point;
}

export function mapUrl({ latitude, longitude }) {
  return `https://www.google.com/maps?q=${latitude.toFixed(5)},${longitude.toFixed(5)}`;
}

// Reads coordinates back from a location string so they can be linked on a map.
export function parseCoordinates(text) {
  const match = typeof text === "string" && text.match(/(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

// Maps GeolocationPositionError codes to translation keys.
export function geolocationErrorKey(error) {
  if (error?.code === 1) return "patientWorkspace.locationDenied";
  if (error?.code === 3) return "patientWorkspace.locationTimeout";
  return "patientWorkspace.locationUnavailable";
}

/** Interpreta "38.7223, -9.1393" ou "38.7223 -9.1393". */
export function parseCoordinateInput(input: string): { latitude: number; longitude: number } | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const latitude = Number.parseFloat(match[1]);
  const longitude = Number.parseFloat(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export function isCoordinateInput(input: string): boolean {
  return parseCoordinateInput(input) !== null;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

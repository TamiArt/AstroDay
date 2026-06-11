import * as Astronomy from 'astronomy-engine';

export function calculateSunAzimuth(date: Date, latitude: number, longitude: number): number {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Для расчёта азимута солнца нужны корректные координаты');
  }

  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const equatorial = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
  const horizon = Astronomy.Horizon(date, observer, equatorial.ra, equatorial.dec, 'normal');

  if (horizon.azimuth === undefined || horizon.azimuth === null) {
    throw new Error('Не удалось рассчитать азимут солнца для выбранной даты и координат');
  }

  return ((horizon.azimuth % 360) + 360) % 360;
}

export function normalizeAzimuth(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return Number(normalized.toFixed(2));
}

export function getAngleDelta(a: number, b: number): number {
  const diff = normalizeAzimuth(a) - normalizeAzimuth(b);
  const normalized = ((diff + 180) % 360) - 180;
  return Number(normalized.toFixed(2));
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { GlassCard } from './common/GlassCard';
import { calculateSunAzimuth, getAngleDelta, normalizeAzimuth } from '../utils/homeUtils';
import { loadHomeCalibration, saveHomeCalibration, HomeCalibrationData } from '../utils/storage';

interface ExtendedDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

function formatAngle(value: number): string {
  return `${value.toFixed(1)}°`;
}

export function HomeCalibration() {
  const [northOffset, setNorthOffset] = useState<number>(0);
  const [sunAzimuth, setSunAzimuth] = useState<number | null>(null);
  const [deviceAzimuth, setDeviceAzimuth] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Нажмите «Расчитать север» и направьте телефон на солнце.');
  const [loading, setLoading] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const sunAzimuthRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadHomeCalibration();
    if (saved) {
      setNorthOffset(saved.northOffset);
      setWarning(saved.warning || null);
      setMessage(`Сохранено смещение ${formatAngle(saved.northOffset)} от магнитного севера.`);
    }
  }, []);

  useEffect(() => {
    sunAzimuthRef.current = sunAzimuth;
  }, [sunAzimuth]);

  const handleDeviceOrientation = useCallback((event: Event) => {
    const deviceEvent = event as ExtendedDeviceOrientationEvent;
    const compassHeading = deviceEvent.webkitCompassHeading ?? deviceEvent.alpha;
    if (typeof compassHeading !== 'number') {
      return;
    }

    const az = normalizeAzimuth(compassHeading);
    setDeviceAzimuth(az);

    const currentSunAzimuth = sunAzimuthRef.current;
    if (currentSunAzimuth !== null) {
      const delta = getAngleDelta(currentSunAzimuth, az);
      if (Math.abs(delta) > 10) {
        setWarning('Компас врёт, используем солнечный метод. Введите корректировку вручную.');
        setUseManual(true);
      } else {
        setNorthOffset(delta);
        setMessage(`Сохраняем смещение ${formatAngle(delta)}.`);
        saveHomeCalibration({
          northOffset: delta,
          calibratedAt: new Date().toISOString(),
          source: 'sun',
        });
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  const calculateNorth = async () => {
    setLoading(true);
    setWarning(null);
    setMessage('Запрашиваем координаты и вычисляем азимут...');

    if (!navigator.geolocation) {
      setMessage('Geolocation API недоступен в этом браузере. Введите смещение вручную.');
      setUseManual(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const now = new Date();
          const sunAz = calculateSunAzimuth(now, latitude, longitude);
          setSunAzimuth(sunAz);
          setMessage(`Солнечный азимут: ${formatAngle(sunAz)}. Теперь наведите телефон на солнце.`);
          
          // Request device orientation permission for iOS 13+
          if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
            try {
              const permission = await (DeviceOrientationEvent as any).requestPermission();
              if (permission === 'granted') {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
              }
            } catch (err) {
              console.warn('Device orientation permission denied or not supported');
            }
          } else {
            // Non-iOS devices - listener already attached in useEffect cleanup
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        } catch (error) {
          console.error(error);
          setMessage('Не удалось рассчитать север. Введите смещение вручную.');
          setUseManual(true);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error', error);
        setMessage('Не удалось получить геопозицию. Введите смещение вручную.');
        setUseManual(true);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveManualOffset = () => {
    const saved: HomeCalibrationData = {
      northOffset,
      calibratedAt: new Date().toISOString(),
      source: 'manual',
      warning: warning || undefined,
    };
    saveHomeCalibration(saved);
    setMessage(`Сохранено смещение ${formatAngle(northOffset)} вручную.`);
  };

  return (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Калибровка севера</h2>
          <p className="opacity-70">Определите север один раз, чтобы сетка Багуа и Васту правильно повернулась на плане.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl p-4 bg-secondary border border-border">
            <p className="text-sm opacity-70">Солнечный азимут</p>
            <p className="mt-2 text-lg font-semibold">{sunAzimuth !== null ? `${formatAngle(sunAzimuth)}` : '—'}</p>
          </div>
          <div className="rounded-2xl p-4 bg-secondary border border-border">
            <p className="text-sm opacity-70">Компас устройства</p>
            <p className="mt-2 text-lg font-semibold">{deviceAzimuth !== null ? `${formatAngle(deviceAzimuth)}` : '—'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm opacity-70">{message}</p>
          {warning && <div className="rounded-xl bg-yellow-500/10 p-3 text-sm text-yellow-900">{warning}</div>}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={calculateNorth}
            disabled={loading}
            className="rounded-xl bg-primary px-4 py-3 text-white hover:opacity-90 transition-opacity"
          >
            {loading ? 'Считаем...' : 'Рассчитать север'}
          </button>
          <button
            onClick={() => setUseManual(true)}
            className="rounded-xl border border-border px-4 py-3 hover:bg-secondary transition-colors"
          >
            Ручная настройка
          </button>
        </div>

        {useManual && (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="rounded-2xl p-4 bg-secondary border border-border">
              <div className="mb-2 text-sm opacity-70">Смещение от магнитного севера</div>
              <input
                type="number"
                step="0.1"
                min="-180"
                max="180"
                value={northOffset}
                onChange={(event) => setNorthOffset(Number(event.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none"
              />
              <p className="mt-2 text-xs opacity-60">Положительное значение поворачивает сетку по часовой стрелке.</p>
            </label>
            <button
              onClick={saveManualOffset}
              className="self-end rounded-xl bg-primary px-4 py-3 text-white hover:opacity-90 transition-opacity"
            >
              Сохранить смещение
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

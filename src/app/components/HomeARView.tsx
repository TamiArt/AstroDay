import { useEffect, useRef, useState } from 'react';
import { GlassCard } from './common/GlassCard';
import { generateBaguaGrid } from '../utils/homeZoneCalculations';

interface HomeARViewProps {
  northOffset: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

export function HomeARView({ northOffset, canvasWidth = 800, canvasHeight = 600 }: HomeARViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [opacity, setOpacity] = useState(0.3);

  const startCamera = async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        startARRender();
      }
    } catch (error) {
      if (error instanceof DOMException) {
        setPermissionError(`Ошибка доступа к камере: ${error.message}`);
      } else {
        setPermissionError('Не удалось включить камеру. Проверьте разрешения браузера.');
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const startARRender = () => {
    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video || !cameraActive) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Рисуем видео
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Рисуем сетку Багуа поверх видео
      if (showGrid) {
        drawBaguaOverlay(ctx, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
  };

  const drawBaguaOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const grid = generateBaguaGrid(width, height, northOffset);

    ctx.save();
    ctx.globalAlpha = opacity;

    const cellWidth = width / 3;
    const cellHeight = height / 3;

    // Рисуем линии сетки
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
    ctx.lineWidth = 3;

    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(width, i * cellHeight);
      ctx.stroke();
    }

    // Рисуем названия зон с фоном
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';

    grid.forEach((cell) => {
      const x = cell.x + cell.width / 2;
      const y = cell.y + cell.height / 2;

      // Рисуем полубрачный фон для текста
      const textWidth = ctx.measureText(cell.label).width;
      ctx.fillRect(x - textWidth / 2 - 8, y - 12, textWidth + 16, 24);

      // Рисуем текст
      ctx.fillStyle = 'rgba(100, 200, 255, 1)';
      ctx.fillText(cell.label, x, y);
    });

    // Рисуем указатель севера (стрелка в центре сверху)
    const centerX = width / 2;
    const topY = 40;

    ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
    ctx.lineWidth = 4;
    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';

    // Стрелка
    ctx.beginPath();
    ctx.moveTo(centerX, topY - 30);
    ctx.lineTo(centerX - 10, topY);
    ctx.lineTo(centerX, topY - 10);
    ctx.lineTo(centerX + 10, topY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Текст "Север"
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'rgba(255, 100, 100, 1)';
    ctx.fillText('Север', centerX, topY + 25);

    ctx.restore();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">AR Вид дома (камера)</h2>
          <p className="opacity-70">Наведите камеру на комнату, чтобы увидеть сетку Багуа и зоны Васту в реальном времени.</p>
        </div>

        {permissionError && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700">
            {permissionError}
          </div>
        )}

        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-white hover:opacity-90 transition-opacity"
          >
            Включить камеру
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={stopCamera}
              className="w-full rounded-2xl bg-red-600/80 px-4 py-3 text-white hover:opacity-90 transition-opacity"
            >
              Выключить камеру
            </button>

            <div className="rounded-2xl overflow-hidden border border-border bg-background">
              <div ref={containerRef} className="relative w-full aspect-video bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover hidden"
                />
                <canvas
                  ref={canvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Прозрачность сетки: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`w-full rounded-2xl px-4 py-3 transition-colors ${
                showGrid ? 'bg-primary/20 text-primary' : 'bg-secondary text-white'
              }`}
            >
              {showGrid ? '✓ Сетка видна' : 'Показать сетку'}
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-border p-4 bg-secondary">
          <p className="text-sm font-semibold mb-2">Совет:</p>
          <p className="text-sm opacity-80">
            Направьте камеру на комнату, отрегулируйте прозрачность, чтобы видеть объекты и сетку одновременно.
            Красная стрелка указывает на север. Используйте это для правильного позиционирования мебели и элементов.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

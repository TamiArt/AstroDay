import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { GlassCard } from './common/GlassCard';
import { loadHomeCalibration, loadHomeFloorPlan, saveHomeFloorPlan, HomeFloorPlanData, HomeRoomRect, VastuMarkerType } from '../utils/storage';
import { generateBaguaGrid, assignBaguaZone, getVastuZoneAtPoint } from '../utils/homeZoneCalculations';

const MARKERS: Array<{ type: VastuMarkerType; label: string; code: string; group: string }> = [{type:'entrance',label:'Вход',code:'ВХ',group:'inflow'},{type:'window',label:'Окно / балкон',code:'ОК',group:'inflow'},{type:'water',label:'Вода / протечка',code:'В',group:'outflow'},{type:'bathroom',label:'Санузел',code:'СУ',group:'outflow'},{type:'obstruction',label:'Тяжёлое препятствие',code:'ПР',group:'blockage'},{type:'clutter',label:'Захламление',code:'ХЛ',group:'blockage'},{type:'kitchen',label:'Кухня / плита',code:'К',group:'function'},{type:'workspace',label:'Рабочее место',code:'Р',group:'function'}];
const SECTORS: Record<string,string> = {northwest:'Северо-запад',north:'Север',northeast:'Северо-восток',west:'Запад',center:'Центр',east:'Восток',southwest:'Юго-запад',south:'Юг',southeast:'Юго-восток'};

interface FloorPlanEditorProps {
  onRoomSelect: (room: HomeRoomRect | null) => void;
}

export function FloorPlanEditor({ onRoomSelect }: FloorPlanEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [planData, setPlanData] = useState<HomeFloorPlanData>(() => loadHomeFloorPlan() ?? {
    imageDataUrl: '',
    rooms: [],
    northOffset: loadHomeCalibration()?.northOffset ?? 0,
  });
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<{ x:number; y:number; width:number; height:number } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x:number; y:number } | null>(null);
  const [northOffset] = useState<number>(loadHomeCalibration()?.northOffset ?? 0);
  const [showGrid, setShowGrid] = useState(true);
  const [markerMode, setMarkerMode] = useState<VastuMarkerType | null>(null);
  const [notice, setNotice] = useState('');
  const bearing = planData.northBearingDegrees ?? 0;
  const markers = planData.markers ?? [];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      drawPlan();
    }, 50);
    return () => window.clearTimeout(timeout);
  }, [planData, draft, northOffset, showGrid, selectedRoomId]);

  const savePlan = (next: HomeFloorPlanData) => {
    saveHomeFloorPlan(next);
    setPlanData(next);
  };

  const drawPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (planData.imageDataUrl) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, width, height);
        if (showGrid) drawVastuGrid(ctx, width, height);
        drawRooms(ctx);
        drawMarkers(ctx, width, height);
      };
      image.src = planData.imageDataUrl;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(0, 0, width, height);
      if (showGrid) drawVastuGrid(ctx, width, height);
      drawRooms(ctx);
      drawMarkers(ctx, width, height);
    }
  };

  const drawVastuGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save(); ctx.translate(width / 2, height / 2); ctx.rotate(bearing * Math.PI / 180);
    ctx.strokeStyle = 'rgba(14,116,144,0.8)'; ctx.lineWidth = 3; ctx.setLineDash([12,8]);
    for (let i=-1;i<=1;i+=2) { ctx.beginPath(); ctx.moveTo(i*width/6,-height); ctx.lineTo(i*width/6,height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-width,i*height/6); ctx.lineTo(width,i*height/6); ctx.stroke(); }
    ctx.setLineDash([]); const labels=[['СЗ','СЕВЕР','СВ'],['ЗАПАД','ЦЕНТР','ВОСТОК'],['ЮЗ','ЮГ','ЮВ']]; ctx.fillStyle='rgba(8,47,73,0.92)'; ctx.font='bold 24px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    labels.forEach((row,r)=>row.forEach((label,col)=>ctx.fillText(label,(col-1)*width/3,(r-1)*height/3))); ctx.restore();
  };
  const drawMarkers = (ctx: CanvasRenderingContext2D, width: number, height: number) => { markers.forEach((marker)=>{ const option=MARKERS.find((item)=>item.type===marker.type); const x=marker.x*width; const y=marker.y*height; ctx.beginPath(); ctx.fillStyle=option?.group==='inflow'?'#15803d':option?.group==='outflow'?'#1d4ed8':option?.group==='blockage'?'#b91c1c':'#7e22ce'; ctx.arc(x,y,20,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.stroke(); ctx.fillStyle='#fff'; ctx.font='bold 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(option?.code??'?',x,y); }); };

  const drawRooms = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(59,130,246,0.85)';
    ctx.fillStyle = 'rgba(59,130,246,0.12)';

    planData?.rooms.forEach((room) => {
      const isSelected = selectedRoomId === room.id;

      if (isSelected) {
        ctx.strokeStyle = 'rgba(6,182,212,0.95)';
        ctx.fillStyle = 'rgba(6,182,212,0.2)';
      }

      ctx.fillRect(room.x, room.y, room.width, room.height);
      ctx.strokeRect(room.x, room.y, room.width, room.height);

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(room.name, room.x + 8, room.y + 16);

      ctx.fillStyle = 'rgba(100,200,255,0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${room.baguaZone} · ${room.vastuZone}`, room.x + 8, room.y + 28);

      ctx.fillStyle = 'rgba(59,130,246,0.12)';
      ctx.strokeStyle = 'rgba(59,130,246,0.85)';
    });

    if (draft) {
      ctx.fillStyle = 'rgba(16,185,129,0.18)';
      ctx.fillRect(draft.x, draft.y, draft.width, draft.height);
      ctx.strokeStyle = 'rgba(16,185,129,0.85)';
      ctx.strokeRect(draft.x, draft.y, draft.width, draft.height);
    }
  };

  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth * 2;
    canvas.height = container.clientHeight * 2;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    drawPlan();
  };

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = reader.result as string;
      const next: HomeFloorPlanData = {
        imageDataUrl,
        rooms: planData?.rooms ?? [],
        northOffset,
      };
      savePlan(next);
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    setStartPoint({ x, y });
    setDrawing(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !startPoint || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    setDraft({
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y),
    });
  };

  const handlePointerUp = () => {
    if (!drawing || !draft || !canvasRef.current) {
      setDrawing(false);
      setDraft(null);
      return;
    }

    const name = window.prompt('Название комнаты или зоны', 'Комната');
    if (!name) {
      setDrawing(false);
      setDraft(null);
      return;
    }

    const tempRoom: HomeRoomRect = {
      id: `temp-${Date.now()}`,
      name,
      x: draft.x,
      y: draft.y,
      width: draft.width,
      height: draft.height,
      baguaZone: 'center',
      vastuZone: 'center',
    };

    const canvas = canvasRef.current;
    const baguaGrid = generateBaguaGrid(canvas.width, canvas.height, northOffset);
    const baguaZone = assignBaguaZone(tempRoom, baguaGrid);
    const vastuZone = getVastuZone(tempRoom, canvas.width, canvas.height);

    const newRoom: HomeRoomRect = {
      id: `${Date.now()}-${name.replace(/\s+/g, '-')}`,
      name,
      x: draft.x,
      y: draft.y,
      width: draft.width,
      height: draft.height,
      baguaZone,
      vastuZone,
    };

    const next: HomeFloorPlanData = {
      ...planData,
      rooms: [...planData.rooms, newRoom],
    };
    savePlan(next);
    setSelectedRoomId(newRoom.id);
    onRoomSelect(newRoom);
    setDrawing(false);
    setDraft(null);
  };

  const handleRoomClick = (room: HomeRoomRect) => {
    setSelectedRoomId(room.id);
    onRoomSelect(room);
  };

  return (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">План квартиры</h2>
          <p className="opacity-70">Загрузите план, ориентированный севером вверх, и обведите комнаты. Сектора рассчитываются по этой ориентации; автоматического поворота изображения пока нет.</p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-border bg-background">
          <div className="p-4 flex flex-col gap-3">
            <label className="block text-sm font-medium">Загрузить чертеж</label>
            <input type="file" accept="image/*" onChange={handleFile} className="w-full" />
            <p className="text-xs opacity-60">Файл хранится локально в браузере.</p>
            <button
              onClick={() => setShowGrid((visible) => !visible)}
              className={`rounded-2xl px-3 py-2 text-sm transition-colors ${showGrid ? 'bg-primary/20 text-primary' : 'bg-secondary text-white'}`}
            >
              {showGrid ? '✓ Сетка видна' : 'Показать сетку'}
            </button>
          </div>
          <div ref={containerRef} className="relative h-[360px] bg-[#0f172a]/10">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          </div>
        </div>

        {planData.rooms.length ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Комнаты на плане</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {planData.rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleRoomClick(room)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${selectedRoomId === room.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary'}`}
                >
                  <p className="font-semibold">{room.name}</p>
                  <p className="text-xs opacity-70">{room.baguaZone} / {room.vastuZone}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm opacity-70">
            Нарисуйте комнату на плане, чтобы получить анализ зоны.
          </div>
        )}
      </div>
    </GlassCard>
  );
}

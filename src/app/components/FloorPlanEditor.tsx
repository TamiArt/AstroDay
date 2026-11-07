import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { GlassCard } from './common/GlassCard';
import { loadHomeCalibration, loadHomeFloorPlan, saveHomeFloorPlan, HomeFloorPlanData, HomeRoomRect, VastuMarkerType } from '../utils/storage';
import { generateBaguaGrid, assignBaguaZone, getVastuZoneAtPoint } from '../utils/homeZoneCalculations';
import { VASTU_DIRECTIONS } from '../utils/vastuGuide';

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
    if (!file.type.startsWith('image/')) { setNotice('Выберите изображение плана квартиры.'); return; }
    if (file.size > 2 * 1024 * 1024) { setNotice('Файл больше 2 МБ. Уменьшите изображение перед загрузкой, чтобы не переполнить локальное хранилище.'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = reader.result as string;
      const next: HomeFloorPlanData = { ...planData, imageDataUrl };
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
    if (markerMode) {
      const option = MARKERS.find((item) => item.type === markerMode);
      const marker = { id: 'marker-' + Date.now(), type: markerMode, x: x / canvas.width, y: y / canvas.height, label: option?.label ?? 'Метка' };
      savePlan({ ...planData, markers: [...markers, marker] }); setMarkerMode(null); setNotice('Добавлена отметка: ' + marker.label); return;
    }
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
    const vastuZone = getVastuZoneAtPoint(draft.x + draft.width / 2, draft.y + draft.height / 2, canvas.width, canvas.height, bearing);

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

  const updateBearing = (value: number) => {
    const nextBearing = ((value % 360) + 360) % 360;
    const canvas = canvasRef.current;
    const rooms = canvas ? planData.rooms.map((room) => ({ ...room, vastuZone: getVastuZoneAtPoint(room.x + room.width / 2, room.y + room.height / 2, canvas.width, canvas.height, nextBearing) })) : planData.rooms;
    savePlan({ ...planData, northBearingDegrees: nextBearing, rooms });
  };
  const markerAnalysis = markers.map((marker) => { const canvas = canvasRef.current; const zone = canvas ? getVastuZoneAtPoint(marker.x * canvas.width, marker.y * canvas.height, canvas.width, canvas.height, bearing) : 'center'; return { ...marker, zone, option: MARKERS.find((item) => item.type === marker.type) }; });
  const grouped = (group: string) => markerAnalysis.filter((item) => item.option?.group === group);
  const moneySectors = ['northwest', 'north', 'northeast', 'west', 'center', 'east', 'southwest', 'south', 'southeast'];

  const handleRoomClick = (room: HomeRoomRect) => {
    setSelectedRoomId(room.id);
    onRoomSelect(room);
  };

  return (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">План квартиры</h2>
          <p className="opacity-70">Наложите компасную сетку Васту, настройте север и отметьте входы, окна, воду, санузлы и препятствия. Сетка поворачивается относительно плана.</p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-border bg-background">
          <div className="p-4 flex flex-col gap-3">
            <label className="block text-sm font-medium">Загрузить чертеж</label>
            <input type="file" accept="image/*" onChange={handleFile} className="w-full" />
            <label className="block text-sm">Север относительно верхнего края: <strong>{bearing.toFixed(0)}°</strong><input type="range" min="0" max="359" value={bearing} onChange={(event) => updateBearing(Number(event.target.value))} className="w-full mt-2" /><span className="text-xs opacity-60">0° — сверху; 90° — справа; 180° — снизу; 270° — слева.</span></label>
            <p className="text-xs opacity-60">Файл хранится локально в браузере.</p>
            <button
              onClick={() => setShowGrid((visible) => !visible)}
              className={`rounded-2xl px-3 py-2 text-sm transition-colors ${showGrid ? 'bg-primary/20 text-primary' : 'bg-secondary text-white'}`}
            >
              {showGrid ? '✓ Сетка Васту видна' : 'Показать сетку Васту'}
            </button>
          </div>
          <div ref={containerRef} className="relative h-[360px] bg-[#0f172a]/10">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-semibold">Точки притока, оттока и препятствия</h3><p className="text-xs opacity-70">Выберите тип отметки, затем нажмите место на плане. Зелёный — входы/окна, синий — вода/санузлы, красный — препятствия, фиолетовый — кухня/рабочее место.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{MARKERS.map((item) => <button key={item.type} type="button" aria-pressed={markerMode===item.type} onClick={()=>setMarkerMode(markerMode===item.type?null:item.type)} className={'rounded-xl border p-2 text-xs text-left '+(markerMode===item.type?'border-primary bg-primary/10':'border-border bg-secondary')}>{item.label}</button>)}</div>
          {markerMode && <p className="text-sm text-primary font-semibold">Нажмите на план, чтобы поставить метку «{MARKERS.find((item)=>item.type===markerMode)?.label}».</p>}{notice && <p role="status" className="text-xs opacity-70">{notice}</p>}
          {markerAnalysis.map((item)=><div key={item.id} className="flex justify-between gap-2 text-sm bg-secondary rounded-lg p-2"><span>{item.option?.label}: <strong>{SECTORS[item.zone]}</strong></span><button type="button" className="underline text-xs" onClick={()=>savePlan({...planData,markers:markers.filter((marker)=>marker.id!==item.id)})}>Удалить</button></div>)}
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h3 className="text-lg font-semibold">Денежная карта дома по Васту</h3>
          <p className="text-xs opacity-70">Сопоставление реальных помещений и отмеченных объектов с традиционными секторами. Это карта для осмотра и планирования, а не измерение потока денег.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {moneySectors.map((sector) => {
              const zone = VASTU_DIRECTIONS.find((item) => item.id === sector);
              const rooms = planData.rooms.filter((room) => room.vastuZone === sector);
              const points = markerAnalysis.filter((marker) => marker.zone === sector);
              return <div key={sector} className="rounded-xl bg-background/80 p-3">
                <p className="font-semibold">{SECTORS[sector]}</p>
                <p className="text-xs opacity-70 mt-1">{zone?.focus}</p>
                <p className="text-sm mt-2">Комнаты: {rooms.length ? rooms.map((room) => room.name).join(', ') : 'не размечены'}</p>
                <p className="text-sm">Метки: {points.length ? points.map((item) => item.option?.label).join(', ') : 'нет'}</p>
                <p className="text-xs mt-2"><strong>Практический шаг:</strong> {zone?.firstStep}</p>
              </div>;
            })}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">{[{title:'Точки притока',items:grouped('inflow'),note:'Входы и окна — доступ, движение и дневной свет в традиционной трактовке.'},{title:'Точки возможного оттока',items:grouped('outflow'),note:'Проверьте санузлы, сливы и отсутствие протечек.'},{title:'Что может перекрывать пространство',items:grouped('blockage'),note:'Захламление и препятствия — бытовые помехи, а не доказанные блоки энергии.'},{title:'Функциональные зоны',items:grouped('function'),note:'Сопоставьте расположение кухни и рабочего места с сектором.'}].map((group)=><div key={group.title} className="rounded-2xl border border-border p-4"><h3 className="font-semibold">{group.title}</h3><p className="text-xs opacity-65 mt-1">{group.note}</p>{group.items.length?group.items.map((item)=><p key={item.id} className="text-sm mt-2">{item.option?.label}: {SECTORS[item.zone]}</p>):<p className="text-sm opacity-55 mt-2">Пока не отмечены.</p>}</div>)}</div>
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

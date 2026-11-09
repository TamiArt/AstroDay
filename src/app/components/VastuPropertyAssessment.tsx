import { useMemo, useState, type ReactNode } from 'react';
import { GlassCard } from './common/GlassCard';
import {
  analyzeVastuProperty,
  calculateEntrancePada,
  createEmptyVastuPropertyAssessment,
  formatPropertyMoney,
  PROPERTY_CONDITION_ITEMS,
  VASTU_SECTORS,
  type CompassDirection,
  type VastuPropertyAssessment as VastuPropertyAssessmentData,
  type VastuPropertyType,
  type VastuRoomUse,
} from '../utils/vastuPropertyAnalysis';
import { loadVastuPropertyAssessment, saveVastuPropertyAssessment } from '../utils/storage';

const DIRECTIONS: Array<{ id: CompassDirection; label: string }> = [
  { id: 'north', label: 'Север' }, { id: 'northeast', label: 'Северо-восток' },
  { id: 'east', label: 'Восток' }, { id: 'southeast', label: 'Юго-восток' },
  { id: 'south', label: 'Юг' }, { id: 'southwest', label: 'Юго-запад' },
  { id: 'west', label: 'Запад' }, { id: 'northwest', label: 'Северо-запад' },
];

const SECTOR_LABELS: Record<string, string> = {
  northwest: 'Северо-запад', north: 'Север', northeast: 'Северо-восток',
  west: 'Запад', center: 'Центр / Брахмастан', east: 'Восток',
  southwest: 'Юго-запад', south: 'Юг', southeast: 'Юго-восток',
};

const ROOM_OPTIONS: Array<{ value: VastuRoomUse; label: string }> = [
  { value: 'prayer', label: 'Молитвенная / медитация' }, { value: 'kitchen', label: 'Кухня' },
  { value: 'master-bedroom', label: 'Главная спальня' }, { value: 'bedroom', label: 'Спальня' },
  { value: 'guest-bedroom', label: 'Гостевая спальня' }, { value: 'living', label: 'Гостиная' },
  { value: 'dining', label: 'Столовая' }, { value: 'study', label: 'Учёба / кабинет' },
  { value: 'office', label: 'Рабочий кабинет' }, { value: 'bathroom', label: 'Ванная' },
  { value: 'toilet', label: 'Туалет / санузел' }, { value: 'stairs', label: 'Лестница' },
  { value: 'storage', label: 'Хранение / кладовая' }, { value: 'laundry', label: 'Постирочная' },
  { value: 'water', label: 'Водная зона / резервуар' }, { value: 'balcony', label: 'Балкон / терраса' },
  { value: 'open', label: 'Открытая зона / проход' }, { value: 'other', label: 'Другое' },
];

const PROPERTY_TYPES: Array<{ value: VastuPropertyType; label: string }> = [
  { value: 'apartment', label: 'Квартира' }, { value: 'house', label: 'Частный дом' },
  { value: 'land', label: 'Земельный участок' }, { value: 'office', label: 'Офис' },
  { value: 'retail', label: 'Торговое помещение' }, { value: 'other', label: 'Другое' },
];

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'INR', 'RUB', 'AUD', 'AED'];

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs opacity-60">{hint}</span>}
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm';
const selectClass = inputClass;

function NumberField({ label, value, onChange, suffix, min = 0, max, hint }: {
  label: string; value: number; onChange: (value: number) => void; suffix?: string; min?: number; max?: number; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          className={inputClass}
          type="number"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={(event) => onChange(Math.max(min, Math.min(max ?? Number.MAX_SAFE_INTEGER, Number(event.target.value) || 0)))}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60">{suffix}</span>}
      </div>
    </Field>
  );
}

export function VastuPropertyAssessment() {
  const [assessment, setAssessment] = useState<VastuPropertyAssessmentData>(() => loadVastuPropertyAssessment());
  const [saved, setSaved] = useState(true);
  const analysis = useMemo(() => analyzeVastuProperty(assessment), [assessment]);

  const update = <K extends keyof VastuPropertyAssessmentData>(key: K, value: VastuPropertyAssessmentData[K]) => {
    setAssessment((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const toggleDirection = (key: 'roadSides' | 'waterSides', direction: CompassDirection) => {
    const current = assessment[key];
    update(key, current.includes(direction) ? current.filter((item) => item !== direction) : [...current, direction]);
  };

  const save = () => {
    saveVastuPropertyAssessment(assessment);
    setSaved(true);
  };

  const reset = () => {
    const empty = createEmptyVastuPropertyAssessment();
    setAssessment(empty);
    saveVastuPropertyAssessment(empty);
    setSaved(true);
  };

  const money = (value: number) => formatPropertyMoney(value, assessment.currency);

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold">Паспорт объекта</p>
              <h2 className="text-2xl font-semibold mt-1">Анализ Васту и недвижимости</h2>
              <p className="text-sm opacity-70 mt-2 max-w-3xl">
                Заполните сведения об объекте. Отчёт разделяет традиционное соответствие Васту, технические проверки и финансовую модель — эти оценки не смешиваются.
              </p>
            </div>
            <span className={saved ? 'text-xs text-emerald-700' : 'text-xs text-amber-700'}>{saved ? 'Сохранено в браузере' : 'Есть несохранённые изменения'}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Название объекта">
              <input className={inputClass} value={assessment.propertyName} maxLength={120} placeholder="Например, квартира для покупки" onChange={(event) => update('propertyName', event.target.value)} />
            </Field>
            <Field label="Тип объекта">
              <select className={selectClass} value={assessment.propertyType} onChange={(event) => update('propertyType', event.target.value as VastuPropertyType)}>
                {PROPERTY_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Сохранить оценку</button>
            <button type="button" onClick={reset} className="rounded-xl border border-border px-4 py-2.5 text-sm">Сбросить данные объекта</button>
          </div>
          <p className="text-xs opacity-60">Данные сохраняются локально в этом браузере и включаются в JSON-экспорт AstroDay. Они не отправляются на сервер.</p>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">1. Ориентация и участок</h3>
            <p className="text-sm opacity-70 mt-1">Север нужно определить по компасу/геодезическому плану, а не по верхней стороне фотографии. Учитывайте магнитное склонение и возможные помехи компаса.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Куда обращён главный фасад / вход">
              <select className={selectClass} value={assessment.facingDirection} onChange={(event) => update('facingDirection', event.target.value as VastuPropertyAssessmentData['facingDirection'])}>
                <option value="">Не определено</option>
                {DIRECTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="На какой стороне расположен главный вход">
              <select className={selectClass} value={assessment.entranceWall} onChange={(event) => update('entranceWall', event.target.value as VastuPropertyAssessmentData['entranceWall'])}>
                <option value="">Не определено</option>
                {(['north', 'east', 'south', 'west'] as const).map((side) => <option key={side} value={side}>{SECTOR_LABELS[side]}</option>)}
              </select>
            </Field>
            <NumberField label="Положение двери вдоль выбранной стены" value={assessment.entrancePosition} min={0} max={100} suffix="%" onChange={(value) => update('entrancePosition', value)} hint="0% — один край стены, 100% — противоположный. Укажите положение относительно плана." />
            <Field label="Форма участка / контура">
              <select className={selectClass} value={assessment.plotShape} onChange={(event) => update('plotShape', event.target.value as VastuPropertyAssessmentData['plotShape'])}>
                <option value="unknown">Неизвестно</option><option value="square">Квадрат</option><option value="rectangle">Прямоугольник</option><option value="irregular">Неправильная</option><option value="triangular">Треугольная</option><option value="narrow">Узкая / вытянутая</option>
              </select>
            </Field>
            <Field label="Общее направление уклона участка">
              <select className={selectClass} value={assessment.plotSlope} onChange={(event) => update('plotSlope', event.target.value as VastuPropertyAssessmentData['plotSlope'])}>
                <option value="unknown">Неизвестно</option><option value="flat">Почти ровный</option>
                {DIRECTIONS.map((item) => <option key={item.id} value={item.id}>В сторону: {item.label.toLowerCase()}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(['roadSides', 'waterSides'] as const).map((key) => (
              <fieldset key={key} className="rounded-2xl border border-border p-4">
                <legend className="px-1 text-sm font-semibold">{key === 'roadSides' ? 'Стороны с дорогой / подъездом' : 'Стороны с водоёмом / водным объектом'}</legend>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DIRECTIONS.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={assessment[key].includes(item.id)} onChange={() => toggleDirection(key, item.id)} />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="rounded-xl bg-secondary p-3 text-sm">
            {assessment.entranceWall
              ? <>Вход: стена «{SECTOR_LABELS[assessment.entranceWall]}», сегмент {calculateEntrancePada(assessment.entrancePosition) ?? '—'} из 8 по выбранной стороне.</>
              : 'Положение входа пока не определено. Без него нельзя вычислить даже условный сегмент (пада).'}
            <p className="text-xs opacity-65 mt-1">Номер сегмента — геометрическая позиция, не оценка благоприятности. Интерпретация 32 пад зависит от конкретной традиции и точной ориентации.</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {analysis.siteFindings.map((finding) => (
              <div key={finding.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold">{finding.level === 'review' ? 'Уточнить: ' : ''}{finding.title}</p>
                <p className="text-sm opacity-75 mt-1">{finding.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">2. План помещений: сетка 3 × 3</h3>
            <p className="text-sm opacity-70 mt-1">Выберите основную функцию каждого сектора. Если сектор пересекает несколько комнат, укажите преобладающее назначение; точную геометрию можно дополнительно отметить в редакторе плана.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VASTU_SECTORS.map((sector) => (
              <div key={sector} className={`min-w-0 rounded-xl border p-2 sm:p-3 ${sector === 'center' ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/60'}`}>
                <p className="text-xs font-semibold mb-2">{SECTOR_LABELS[sector]}</p>
                <select
                  aria-label={`Назначение сектора: ${SECTOR_LABELS[sector]}`}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-1.5 py-2 text-xs"
                  value={assessment.rooms[sector]}
                  onChange={(event) => update('rooms', { ...assessment.rooms, [sector]: event.target.value as VastuRoomUse | '' })}
                >
                  <option value="">Не заполнено</option>
                  {ROOM_OPTIONS.map((room) => <option key={room.value} value={room.value}>{room.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Заполнено секторов</p><p className="text-xl font-semibold">{analysis.assessedSectors} / 9</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Совпадение со справочной схемой</p><p className="text-xl font-semibold">{analysis.traditionalAlignmentScore === null ? '—' : `${analysis.traditionalAlignmentScore}%`}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Положение входа</p><p className="text-xl font-semibold">{analysis.entrancePada ? `Пада ${analysis.entrancePada}/8` : 'Не указано'}</p></div>
          </div>
          <div className="space-y-2">
            {analysis.findings.map((finding) => (
              <div key={finding.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold">{finding.level === 'review' ? 'Проверить: ' : 'Совпадение: '}{finding.title}</p>
                <p className="text-sm opacity-75 mt-1">{finding.explanation}</p>
                <p className="text-xs opacity-60 mt-1">{finding.tradition}</p>
              </div>
            ))}
            {!analysis.findings.length && <p className="text-sm opacity-65">Заполните хотя бы один сектор, чтобы получить разбор.</p>}
          </div>
          <p className="text-xs opacity-60">Процент показывает только долю заполненных секторов, совпавших с этой справочной таблицей. Он не является рейтингом недвижимости, вероятностью успеха или научным измерением «энергии».</p>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">3. Техническая и юридическая проверка</h3>
            <p className="text-sm opacity-70 mt-1">Отметьте только то, что действительно проверено. «Неизвестно» не означает, что дефектов нет. Высокоприоритетные замечания нельзя компенсировать хорошим соответствием Васту.</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {PROPERTY_CONDITION_ITEMS.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <span className={item.priority === 'high' ? 'text-xs text-red-700' : item.priority === 'medium' ? 'text-xs text-amber-700' : 'text-xs opacity-60'}>
                    {item.priority === 'high' ? 'Высокий приоритет' : item.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                </div>
                <select
                  className={selectClass}
                  aria-label={`Статус: ${item.label}`}
                  value={assessment.condition[item.id] ?? 'unknown'}
                  onChange={(event) => update('condition', { ...assessment.condition, [item.id]: event.target.value as VastuPropertyAssessmentData['condition'][string] })}
                >
                  <option value="unknown">Не проверено</option><option value="ok">Проверено — замечаний нет</option><option value="attention">Есть замечание / нужна проверка</option>
                </select>
                {assessment.condition[item.id] === 'attention' && <p className="text-xs opacity-75">{item.recommendation}</p>}
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-secondary p-4">
            <p className="font-semibold">Замечаний высокого приоритета: {analysis.highPriorityCount}</p>
            <p className="text-sm opacity-70 mt-1">Это количество отмеченных вами пунктов, а не автоматическая техническая экспертиза. До сделки используйте местных лицензированных специалистов и юриста.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">4. Финансовая модель объекта</h3>
            <p className="text-sm opacity-70 mt-1">Введите собственные оценки. Расчёт не прогнозирует рыночную цену, арендный спрос, налоги или стоимость кредита.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Валюта">
              <select className={selectClass} value={assessment.currency} onChange={(event) => update('currency', event.target.value)}>
                {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </Field>
            <NumberField label="Цена покупки / текущая стоимость" value={assessment.purchasePrice} onChange={(value) => update('purchasePrice', value)} />
            <NumberField label="Сделка и оформление" value={assessment.closingCosts} onChange={(value) => update('closingCosts', value)} />
            <NumberField label="Первоначальный ремонт / оснащение" value={assessment.renovationCost} onChange={(value) => update('renovationCost', value)} />
            <NumberField label="Ожидаемая аренда в месяц" value={assessment.monthlyRent} onChange={(value) => update('monthlyRent', value)} />
            <NumberField label="Вакантность" value={assessment.vacancyRatePercent} onChange={(value) => update('vacancyRatePercent', value)} suffix="%" max={100} />
            <NumberField label="Операционные расходы в месяц" value={assessment.monthlyOperatingCosts} onChange={(value) => update('monthlyOperatingCosts', value)} />
            <NumberField label="Налог на недвижимость в год" value={assessment.annualPropertyTax} onChange={(value) => update('annualPropertyTax', value)} />
            <NumberField label="Платёж по ипотеке в месяц" value={assessment.monthlyMortgagePayment} onChange={(value) => update('monthlyMortgagePayment', value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Общие затраты на вход</p><p className="font-semibold mt-1">{money(analysis.investment.totalAcquisitionCost)}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Аренда с учётом вакантности / год</p><p className="font-semibold mt-1">{money(analysis.investment.effectiveAnnualRent)}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Чистый операционный доход / год</p><p className="font-semibold mt-1">{money(analysis.investment.annualNetOperatingIncome)}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Валовая доходность</p><p className="font-semibold mt-1">{analysis.investment.grossYieldPercent === null ? '—' : `${analysis.investment.grossYieldPercent.toFixed(2)}%`}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Чистая доходность</p><p className="font-semibold mt-1">{analysis.investment.netYieldPercent === null ? '—' : `${analysis.investment.netYieldPercent.toFixed(2)}%`}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-65">Денежный поток после ипотеки / мес.</p><p className={`font-semibold mt-1 ${analysis.investment.monthlyCashFlowAfterFinancing < 0 ? 'text-red-700' : ''}`}>{money(analysis.investment.monthlyCashFlowAfterFinancing)}</p></div>
          </div>
          <div className="rounded-xl border border-border p-3 text-sm space-y-1">
            <p><strong>Точка безубыточности по загрузке:</strong> {analysis.investment.breakEvenOccupancyPercent === null ? 'недостаточно данных' : `${analysis.investment.breakEvenOccupancyPercent.toFixed(1)}% занятости`} для покрытия операционных расходов и налога, без ипотеки.</p>
            <p className="text-xs opacity-65">Чистая доходность здесь рассчитана до финансирования и до налога на доход/прирост капитала, страхования, крупных резервов и возможных расходов на управление, если они не включены в операционные расходы. Это упрощённая предварительная модель, не инвестиционная рекомендация.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">5. Выводы и заметки по объекту</h3>
          <Field label="Что важно проверить, уточнить или согласовать">
            <textarea className={inputClass} rows={4} maxLength={4000} value={assessment.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Состояние документов, вопросы продавцу, смета ремонта, отличия плана от фактической планировки..." />
          </Field>
          <div className="rounded-xl bg-secondary p-4 text-sm space-y-2">
            <p className="font-semibold">Как читать итоговый анализ</p>
            <ul className="list-disc pl-5 space-y-1 opacity-80">
              <li>Васту — культурно-традиционная схема размещения функций и направлений, а не объективная оценка цены или качества.</li>
              <li>Технические и юридические пункты требуют подтверждения документами и осмотрами.</li>
              <li>Доходность зависит от ваших предположений; проверьте их по сопоставимым объектам и местным правилам.</li>
              <li>Не проводите дорогую перепланировку только ради увеличения условного процента соответствия Васту.</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

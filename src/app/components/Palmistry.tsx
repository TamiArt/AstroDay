import { useEffect, useState, type ChangeEvent } from 'react';
import { GlassCard } from './common/GlassCard';

type HandSide = 'left' | 'right';
type LineId = 'heart' | 'head' | 'life' | 'fate';
type LineChoice = 'curved' | 'straight' | 'forked' | 'sloping' | 'joined' | 'separate' | 'deep' | 'wide' | 'broken' | 'faint' | 'strong' | 'absent' | 'multiple' | 'unclear';

const LINES: Array<{ id: LineId; title: string; description: string; options: Array<{ value: LineChoice; label: string; reading: string }> }> = [
  { id: 'heart', title: 'Линия сердца', description: 'Верхняя поперечная линия под основаниями пальцев. В традиционной хиромантии её связывают с эмоциональным выражением и близостью.', options: [
    { value: 'curved', label: 'Изогнутая', reading: 'Традиционная трактовка: открытое выражение чувств и эмоциональная вовлечённость.' },
    { value: 'straight', label: 'Почти прямая', reading: 'Традиционная трактовка: сдержанный стиль проявления чувств и ценность ясных договорённостей.' },
    { value: 'forked', label: 'Есть развилка', reading: 'Традиционная трактовка: способность учитывать разные точки зрения в близких отношениях.' },
    { value: 'faint', label: 'Слабо выражена', reading: 'В старых трактовках связывается с осторожностью в эмоциональном самораскрытии.' },
    { value: 'unclear', label: 'Не могу определить', reading: 'Нужна более чёткая фотография ладони при ровном освещении.' },
  ]},
  { id: 'head', title: 'Линия головы', description: 'Средняя поперечная линия ладони. Символически связывается с мышлением, обучением и принятием решений.', options: [
    { value: 'straight', label: 'Преимущественно прямая', reading: 'Традиционная трактовка: практичность, последовательность и ориентация на факты.' },
    { value: 'sloping', label: 'Наклонена вниз к ребру ладони', reading: 'Традиционная трактовка: образное мышление, интуитивный и творческий подход.' },
    { value: 'joined', label: 'В начале соединена с линией жизни', reading: 'Традиционная трактовка: осторожность и потребность в опоре перед самостоятельным решением.' },
    { value: 'separate', label: 'В начале отделена от линии жизни', reading: 'Традиционная трактовка: независимость и готовность действовать самостоятельно.' },
    { value: 'unclear', label: 'Не могу определить', reading: 'Нужна более чёткая фотография ладони при ровном освещении.' },
  ]},
  { id: 'life', title: 'Линия жизни', description: 'Дуга, огибающая основание большого пальца. Она не определяет продолжительность жизни и не является медицинским показателем.', options: [
    { value: 'deep', label: 'Глубокая и чёткая', reading: 'Традиционная трактовка: устойчивость и хороший запас жизненной активности как символический образ.' },
    { value: 'wide', label: 'Широкая дуга', reading: 'Традиционная трактовка: открытость новому опыту и стремление к разнообразию.' },
    { value: 'faint', label: 'Тонкая или неглубокая', reading: 'Традиционные школы трактуют её по-разному; по этому признаку нельзя судить о здоровье или силах.' },
    { value: 'broken', label: 'Есть разрывы или ответвления', reading: 'В символических трактовках это связывают с переменами и сменой жизненных этапов, но не с конкретными событиями.' },
    { value: 'unclear', label: 'Не могу определить', reading: 'Нужна более чёткая фотография ладони при ровном освещении.' },
  ]},
  { id: 'fate', title: 'Линия судьбы', description: 'Вертикальная линия, которая может идти от основания ладони к среднему пальцу. Она есть не у всех.', options: [
    { value: 'strong', label: 'Чёткая и непрерывная', reading: 'Традиционная трактовка: последовательность в выборе целей и профессионального направления.' },
    { value: 'faint', label: 'Тонкая или прерывистая', reading: 'Традиционная трактовка: гибкость маршрута и несколько этапов профессионального поиска.' },
    { value: 'absent', label: 'Не просматривается', reading: 'Отсутствие линии судьбы нормально и не означает отсутствие предназначения или успеха.' },
    { value: 'multiple', label: 'Несколько вертикальных линий', reading: 'Традиционная трактовка: разнообразие интересов и параллельные роли или занятия.' },
    { value: 'unclear', label: 'Не могу определить', reading: 'Нужна более чёткая фотография ладони при ровном освещении.' },
  ]},
];

function PhotoInput({ side, photo, onChange }: { side: HandSide; photo: string; onChange: (value: string) => void }) {
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) {
      window.alert('Фото должно быть не больше 8 МБ.');
      return;
    }
    onChange(URL.createObjectURL(file));
  };
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <label className="block text-sm font-semibold">{side === 'left' ? 'Левая ладонь' : 'Правая ладонь'}</label>
      <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="w-full text-sm" />
      {photo ? <img src={photo} alt={side === 'left' ? 'Фотография левой ладони' : 'Фотография правой ладони'} className="max-h-72 w-full object-contain rounded-xl bg-secondary" /> : <p className="text-xs opacity-60">Фото не загружено. Снимите ладонь целиком, пальцы расслаблены, камера строго сверху.</p>}
      {photo && <button type="button" onClick={() => onChange('')} className="text-xs underline">Удалить фото</button>}
    </div>
  );
}

export function Palmistry() {
  const [dominantHand, setDominantHand] = useState<HandSide>('right');
  const [leftPhoto, setLeftPhoto] = useState('');
  const [rightPhoto, setRightPhoto] = useState('');
  const [observations, setObservations] = useState<Record<HandSide, Partial<Record<LineId, LineChoice>>>>({ left: {}, right: {} });
  const updateObservation = (side: HandSide, line: LineId, value: LineChoice) => {
    setObservations((current) => ({ ...current, [side]: { ...current[side], [line]: value } }));
  };
  const leading = dominantHand;
  const nonLeading: HandSide = dominantHand === 'right' ? 'left' : 'right';
  const renderHandAnalysis = (side: HandSide) => (
    <GlassCard key={side}>
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">{side === leading ? 'Ведущая рука' : 'Неведущая рука'}</p>
          <h3 className="text-xl font-semibold">{side === 'left' ? 'Левая ладонь' : 'Правая ладонь'}</h3>
          <p className="text-sm opacity-70 mt-1">{side === leading ? 'В современной популярной традиции её рассматривают как символ текущего проявления навыков, решений и привычек.' : 'Её часто трактуют как символ врождённых склонностей и раннего потенциала.'}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {LINES.map((line) => {
            const selected = observations[side][line.id];
            const choice = line.options.find((option) => option.value === selected);
            return (
              <div key={line.id} className="rounded-2xl bg-secondary p-4 space-y-2">
                <h4 className="font-semibold">{line.title}</h4>
                <p className="text-xs opacity-70">{line.description}</p>
                <select value={selected ?? ''} onChange={(event) => updateObservation(side, line.id, event.target.value as LineChoice)} className="w-full rounded-xl border border-border bg-background p-2 text-sm">
                  <option value="">Выберите наблюдение</option>
                  {line.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {choice && <p className="text-sm">{choice.reading}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">Отдельный раздел</p>
          <h2 className="text-2xl font-semibold">Хиромантия: анализ обеих рук</h2>
          <p className="text-sm opacity-75">Сравните ведущую и неведущую ладони, загрузите фотографии и отметьте видимые особенности четырёх основных линий. Интерпретации основаны на традиционных символических трактовках хиромантии.</p>
          <p className="text-xs rounded-xl border border-border bg-secondary p-3">Важно: хиромантия не является научным методом оценки личности или предсказания будущего. По линиям нельзя определять срок жизни, диагнозы, беременность, финансовый успех или судьбу отношений. Приложение не распознаёт линии автоматически: сейчас фото служит визуальной опорой, а наблюдения выбирает пользователь.</p>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="space-y-3">
          <h3 className="font-semibold">Какая рука у вас ведущая?</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDominantHand('right')} aria-pressed={dominantHand === 'right'} className={'rounded-xl border px-4 py-2 ' + (dominantHand === 'right' ? 'border-primary bg-primary/10' : 'border-border')}>Правая</button>
            <button type="button" onClick={() => setDominantHand('left')} aria-pressed={dominantHand === 'left'} className={'rounded-xl border px-4 py-2 ' + (dominantHand === 'left' ? 'border-primary bg-primary/10' : 'border-border')}>Левая</button>
          </div>
          <p className="text-xs opacity-65">Ведущая — рука, которой вы обычно пишете и выполняете точные действия. Если вы амбидекстр, выберите руку, которой чаще пользуетесь.</p>
        </div>
      </GlassCard>
      <div className="grid gap-4 md:grid-cols-2">
        <PhotoInput side="left" photo={leftPhoto} onChange={setLeftPhoto} />
        <PhotoInput side="right" photo={rightPhoto} onChange={setRightPhoto} />
      </div>
      {renderHandAnalysis(leading)}
      {renderHandAnalysis(nonLeading)}
      <GlassCard>
        <h3 className="font-semibold">Как сравнивать две руки</h3>
        <ul className="list-disc pl-5 space-y-2 mt-3 text-sm opacity-80">
          <li>Ведущую руку рассматривайте как образ текущего поведения и приобретённого опыта.</li>
          <li>Неведущую — как символический образ исходных склонностей в традиционной трактовке.</li>
          <li>Сравнивайте не «хорошие» и «плохие» линии, а различия и изменения рисунка.</li>
          <li>Отсутствие отдельной линии или её слабая выраженность — обычный вариант строения ладони.</li>
        </ul>
      </GlassCard>
    </div>
  );
}

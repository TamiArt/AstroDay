import { NAKSHATRAS, getNakshatra, getNakshatraPada, getSign } from './astrology';

export type Gana = 'Deva' | 'Manushya' | 'Rakshasa';
export type Yoni = 'Horse' | 'Elephant' | 'Sheep' | 'Serpent' | 'Dog' | 'Cat' | 'Rat' | 'Cow' | 'Buffalo' | 'Tiger' | 'Deer' | 'Monkey' | 'Mongoose' | 'Lion';
export type Nadi = 'Adi' | 'Madhya' | 'Antya';
export type VashyaGroup = 'Dwipada' | 'Chatushpada' | 'Jalachara' | 'Vanachara' | 'Keeta';

export interface CompatibilityPerson {
  name: string;
  moonLongitude: number;
}

export interface AshtaKootaOptions {
  varnaRoleA?: 'bride' | 'groom';
}

export interface KutaResult {
  id: 'varna' | 'vashya' | 'tara' | 'yoni' | 'grahaMaitri' | 'gana' | 'bhakoot' | 'nadi';
  name: string;
  score: number;
  maxScore: number;
  summary: string;
  details: string[];
  status: 'supportive' | 'mixed' | 'challenging';
}

export interface AshtaKootaResult {
  totalScore: number;
  maxScore: 36;
  percentage: number;
  classification: 'excellent' | 'good' | 'moderate' | 'low';
  kutas: KutaResult[];
  personA: { name: string; sign: string; nakshatra: string; pada: number; nakshatraIndex: number };
  personB: { name: string; sign: string; nakshatra: string; pada: number; nakshatraIndex: number };
  notes: string[];
}

const SIGNS = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const PLANET_FRIENDS: Record<string, string[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus']
};
const PLANET_ENEMIES: Record<string, string[]> = {
  Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars']
};

const GANA: Gana[] = [
  'Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa',
  'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa',
  'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'
];
const YONI: Yoni[] = [
  'Horse','Elephant','Sheep','Serpent','Serpent','Dog','Cat','Sheep','Cat',
  'Rat','Rat','Cow','Buffalo','Tiger','Buffalo','Tiger','Deer','Deer',
  'Dog','Monkey','Mongoose','Monkey','Lion','Horse','Lion','Cow','Elephant'
];
const NADI: Nadi[] = ['Adi','Madhya','Antya','Antya','Madhya','Adi','Adi','Madhya','Antya','Antya','Madhya','Adi','Adi','Madhya','Antya','Antya','Madhya','Adi','Adi','Madhya','Antya','Antya','Madhya','Adi','Adi','Madhya','Antya'];

const YONI_ENEMIES: Array<[Yoni, Yoni]> = [
  ['Horse','Buffalo'], ['Elephant','Lion'], ['Sheep','Monkey'], ['Serpent','Mongoose'],
  ['Dog','Deer'], ['Cat','Rat'], ['Cow','Tiger']
];
const YONI_FRIENDS: Array<[Yoni, Yoni]> = [
  ['Horse','Elephant'], ['Sheep','Cow'], ['Serpent','Cat'], ['Dog','Horse'],
  ['Deer','Cow'], ['Monkey','Rat'], ['Lion','Tiger'], ['Buffalo','Cow']
];

function pairHas(pair: [Yoni, Yoni], a: Yoni, b: Yoni): boolean {
  return (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a);
}
function planetRelation(a: string, b: string): 'friend' | 'enemy' | 'neutral' {
  if (a === b) return 'friend';
  const aFriend = PLANET_FRIENDS[a]?.includes(b) ?? false;
  const bFriend = PLANET_FRIENDS[b]?.includes(a) ?? false;
  const aEnemy = PLANET_ENEMIES[a]?.includes(b) ?? false;
  const bEnemy = PLANET_ENEMIES[b]?.includes(a) ?? false;
  if (aFriend && bFriend) return 'friend';
  if (aEnemy && bEnemy) return 'enemy';
  return 'neutral';
}
function kuta(id: KutaResult['id'], name: string, score: number, maxScore: number, summary: string, details: string[]): KutaResult {
  const normalized = score / maxScore;
  return { id, name, score, maxScore, summary, details, status: normalized >= 0.75 ? 'supportive' : normalized >= 0.4 ? 'mixed' : 'challenging' };
}
function validatePerson(person: CompatibilityPerson, label: string): void {
  if (!person.name.trim()) throw new Error(`${label}: укажите имя партнёра`);
  if (!Number.isFinite(person.moonLongitude) || person.moonLongitude < 0 || person.moonLongitude >= 360) {
    throw new Error(`${label}: долгота Луны должна быть в диапазоне 0°–360°`);
  }
}
function getVashya(sign: number): VashyaGroup {
  // Whole-sign convention; Sagittarius/Capricorn are assigned to their dominant traditional group.
  const groups: VashyaGroup[] = ['Chatushpada','Chatushpada','Dwipada','Jalachara','Vanachara','Dwipada','Dwipada','Keeta','Dwipada','Chatushpada','Dwipada','Jalachara'];
  return groups[sign];
}
function getVashyaScore(a: VashyaGroup, b: VashyaGroup): number {
  if (a === b) return 2;
  const pairs: Array<[VashyaGroup, VashyaGroup]> = [
    ['Dwipada','Chatushpada'], ['Dwipada','Jalachara'], ['Chatushpada','Jalachara'],
    ['Vanachara','Dwipada'], ['Keeta','Jalachara']
  ];
  return pairs.some(([x,y]) => (x === a && y === b) || (x === b && y === a)) ? 1 : 0;
}

export function calculateAshtaKoota(personA: CompatibilityPerson, personB: CompatibilityPerson, options: AshtaKootaOptions = {}): AshtaKootaResult {
  validatePerson(personA, 'Партнёр A');
  validatePerson(personB, 'Партнёр B');

  const aNak = getNakshatra(personA.moonLongitude);
  const bNak = getNakshatra(personB.moonLongitude);
  const aPada = getNakshatraPada(personA.moonLongitude);
  const bPada = getNakshatraPada(personB.moonLongitude);
  const aSign = getSign(personA.moonLongitude);
  const bSign = getSign(personB.moonLongitude);
  const aLord = SIGN_LORDS[aSign];
  const bLord = SIGN_LORDS[bSign];

  // Varna: directional traditional rule, with A treated as the first (bride) chart and B as the second (groom) chart.
  const varnaRank = [1,2,3,0,1,2,3,0,1,2,3,0]; // fire=Kshatriya, earth=Vaishya, air=Shudra, water=Brahmin
  const varnaRoleA = options.varnaRoleA ?? 'bride';
  const brideRank = varnaRoleA === 'bride' ? varnaRank[aSign] : varnaRank[bSign];\n  const groomRank = varnaRoleA === 'groom' ? varnaRank[aSign] : varnaRank[bSign];\n  const varnaScore = groomRank <= brideRank ? 1 : 0;
  const varnaNames = ['Brahmin','Kshatriya','Vaishya','Shudra'];
  const varna = kuta('varna','Варна',varnaScore,1,'Сопоставление традиционных варн по знакам Луны.',[
    `Партнёр A: ${varnaNames[varnaRank[aSign]]}; партнёр B: ${varnaNames[varnaRank[bSign]]}.`,
    'Правило направленное: роль A задана как ' + (varnaRoleA === 'bride' ? 'невеста' : 'жених') + ', роль B — как ' + (varnaRoleA === 'bride' ? 'жених' : 'невеста') + '; при смене ролей балл может измениться.'
  ]);

  const vashyaA = getVashya(aSign), vashyaB = getVashya(bSign);
  const vashyaScore = getVashyaScore(vashyaA, vashyaB);
  const vashya = kuta('vashya','Вашьи',vashyaScore,2,'Традиционные категории взаимного влияния по знакам Луны.',[
    `Партнёр A: ${vashyaA}; партнёр B: ${vashyaB}.`,
    'Используется фиксированная таблица категорий по целым знакам; некоторые школы уточняют её по градусам внутри знака.'
  ]);

  const taraForward = (bNak - aNak + 27) % 27;
  const taraBackward = (aNak - bNak + 27) % 27;
  const taraGood = (distance: number) => [1,3,5,7,8].includes(distance % 9);
  const taraScore = (Number(taraGood(taraForward)) + Number(taraGood(taraBackward))) * 1.5;
  const tara = kuta('tara','Тара',taraScore,3,'Сопоставление звёздной совместимости по расстоянию между накшатрами.',[
    `A → B: счёт ${taraForward + 1}; ${taraGood(taraForward) ? 'благоприятная' : 'напряжённая'} тара.`,
    `B → A: счёт ${taraBackward + 1}; ${taraGood(taraBackward) ? 'благоприятная' : 'напряжённая'} тара.`,
    'Баллы начисляются отдельно в каждом направлении: по 1,5 за благоприятную тара.'
  ]);

  const yoniA = YONI[aNak], yoniB = YONI[bNak];
  const yoniScore = yoniA === yoniB ? 4
    : YONI_ENEMIES.some(pair => pairHas(pair, yoniA, yoniB)) ? 0
      : YONI_FRIENDS.some(pair => pairHas(pair, yoniA, yoniB)) ? 3 : 2;
  const yoni = kuta('yoni','Йони',yoniScore,4,'Символическая телесная и темпераментная совместимость по животным-символам накшатр.',[
    `Партнёр A: ${yoniA}; партнёр B: ${yoniB}.`,
    yoniA === yoniB ? 'Обе накшатры относятся к одной йони.' : YONI_ENEMIES.some(pair => pairHas(pair, yoniA, yoniB)) ? 'В традиционной таблице эта пара йони считается враждебной.' : YONI_FRIENDS.some(pair => pairHas(pair, yoniA, yoniB)) ? 'В используемой таблице эта пара йони считается дружественной.' : 'В используемой таблице пара не отмечена как враждебная или особо дружественная.'
  ]);

  const relation = planetRelation(aLord,bLord);
  const grahaScore = relation === 'friend' ? 5 : relation === 'enemy' ? 0 : 3;
  const graha = kuta('grahaMaitri','Граха-майтри',grahaScore,5,'Естественные отношения управителей лунных знаков.',[
    `Управитель знака A: ${aLord}; управитель знака B: ${bLord}.`,
    `Взаимное отношение планет: ${relation}.`,
    'Оценка учитывает взаимную дружбу/вражду; односторонние отношения сведены к нейтральному уровню.'
  ]);

  const ganaA = GANA[aNak], ganaB = GANA[bNak];
  const ganaScore = ganaA === ganaB ? 6
    : (ganaA === 'Deva' && ganaB === 'Manushya') || (ganaA === 'Manushya' && ganaB === 'Deva') ? 5
      : (ganaA === 'Manushya' && ganaB === 'Rakshasa') || (ganaA === 'Rakshasa' && ganaB === 'Manushya') ? 1 : 0;
  const gana = kuta('gana','Гана',ganaScore,6,'Сопоставление темпераментов по трём ганам.',[
    `Партнёр A: ${ganaA}; партнёр B: ${ganaB}.`,
    'Используется симметричная шкала: одинаковая гана — 6; Дэва/Манушья — 5; Манушья/Ракшаса — 1; Дэва/Ракшаса — 0.'
  ]);

  const signDistance = (bSign - aSign + 12) % 12 + 1;
  const reverseDistance = (aSign - bSign + 12) % 12 + 1;
  const bhakootSupportive = [1,3,4,7,10,11].includes(signDistance) && [1,3,4,7,10,11].includes(reverseDistance);
  const bhakootScore = bhakootSupportive ? 7 : 0;
  const bhakoot = kuta('bhakoot','Бхакут',bhakootScore,7,'Лунные знаки и взаимное положение домов от Луны.',[
    `От A к B: ${signDistance}-й знак; от B к A: ${reverseDistance}-й знак.`,
    bhakootSupportive ? 'Пара не попадает в стандартные неблагоприятные отношения 2/12, 5/9 или 6/8.' : 'Обнаружено традиционно неблагоприятное соотношение 2/12, 5/9 или 6/8.',
    'Некоторые школы применяют отмену Бхакут-доши по отношениям управителей или совпадению знаков; базовый балл здесь не корректируется без отдельного подтверждения правила школы.'
  ]);

  const nadiA = NADI[aNak], nadiB = NADI[bNak];
  const nadiScore = nadiA === nadiB ? 0 : 8;
  const nadi = kuta('nadi', 'Нади', nadiScore, 8, 'Сопоставление трёх нади по порядку накшатр.',[
    `Партнёр A: ${nadiA}; партнёр B: ${nadiB}.`,
    nadiA === nadiB ? 'Одинаковая нади: в традиционной системе это считается Нади-дошей.' : 'Разные нади: стандартная Нади-доша по этому правилу не выявлена.',
    'Это традиционная символическая оценка, не медицинский вывод о здоровье, генетике или фертильности.'
  ]);

  const kutas = [varna,vashya,tara,yoni,graha,gana,bhakoot,nadi];
  const totalScore = kutas.reduce((sum,item) => sum + item.score,0);
  const notes = [
    'Ашта-Кута — традиционная система Джйотиш, а не научно валидированный способ предсказать качество отношений или исход брака.',
    'В разных региональных и текстовых школах таблицы Вашьи, Йони, Ганы и правила отмены дош/баллов различаются. Здесь зафиксирован единый документированный вариант; результаты следует читать вместе с деталями каждой куты.',
    'Балл не заменяет взаимное согласие, общение, ценности, безопасность и реальные обстоятельства пары.'
  ];
  return {
    totalScore, maxScore:36, percentage:Math.round(totalScore / 36 * 100),
    classification: totalScore >= 30 ? 'excellent' : totalScore >= 24 ? 'good' : totalScore >= 18 ? 'moderate' : 'low',
    kutas,
    personA: { name:personA.name, sign:SIGNS[aSign], nakshatra:NAKSHATRAS[aNak].name, pada:aPada, nakshatraIndex:aNak },
    personB: { name:personB.name, sign:SIGNS[bSign], nakshatra:NAKSHATRAS[bNak].name, pada:bPada, nakshatraIndex:bNak },
    notes
  };
}

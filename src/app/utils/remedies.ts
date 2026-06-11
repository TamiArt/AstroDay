/**
 * Upayas (Remedies) Library
 * Simple actions for harmonization based on Vedic principles
 */

export interface Upaya {
  id: string;
  planet: string;
  title: string;
  action: string;
  why: string;
  effect: string;
  duration: number; // in minutes
  frequency: string;
  category: 'home' | 'outdoor' | 'online' | 'social';
}

export const UPAYAS: Upaya[] = [
  // Sun (Surya) remedies
  {
    id: 'sun-1',
    planet: 'Sun',
    title: 'Приветствие Солнцу',
    action: 'Встретьте рассвет или найдите 5 минут на балконе/у окна. Закройте глаза, подставьте лицо солнечному свету и поблагодарите за новый день.',
    why: 'Солнце — источник жизненной силы и ясности в джйотиш. Соединение с его энергией усиливает уверенность.',
    effect: 'Помогает при слабом Солнце в карте, повышает энергию и мотивацию.',
    duration: 5,
    frequency: 'Ежедневно утром',
    category: 'outdoor'
  },
  {
    id: 'sun-2',
    planet: 'Sun',
    title: 'Носите медь',
    action: 'Наденьте медное украшение (браслет, кольцо) или держите медную монету в кармане.',
    why: 'Медь — металл Солнца, усиливает его благотворное влияние.',
    effect: 'Укрепляет лидерские качества и жизненную силу.',
    duration: 1,
    frequency: 'Постоянно',
    category: 'home'
  },

  // Moon (Chandra) remedies
  {
    id: 'moon-1',
    planet: 'Moon',
    title: 'Вода перед сном',
    action: 'Выпейте стакан тёплой воды за 30 минут до сна. Можно добавить каплю розовой воды.',
    why: 'Луна управляет водной стихией и эмоциями. Вода перед сном успокаивает ум.',
    effect: 'Снижает тревожность, улучшает сон, гармонизирует эмоции.',
    duration: 2,
    frequency: 'Ежедневно вечером',
    category: 'home'
  },
  {
    id: 'moon-2',
    planet: 'Moon',
    title: 'Наблюдение за Луной',
    action: 'Вечером найдите 3 минуты, чтобы посмотреть на Луну. Если она не видна — представьте её.',
    why: 'Луна — планета ума и эмоций. Созерцание Луны успокаивает внутренний диалог.',
    effect: 'Помогает при беспокойстве и эмоциональной нестабильности.',
    duration: 3,
    frequency: '2-3 раза в неделю',
    category: 'outdoor'
  },

  // Mars (Mangal) remedies
  {
    id: 'mars-1',
    planet: 'Mars',
    title: 'Физическая активность',
    action: '10 приседаний или 5-минутная прогулка быстрым шагом.',
    why: 'Марс — планета действия и энергии. Физическая активность канализирует его силу.',
    effect: 'Снижает гнев и раздражительность, направляет энергию в конструктивное русло.',
    duration: 5,
    frequency: 'Когда чувствуете напряжение',
    category: 'home'
  },
  {
    id: 'mars-2',
    planet: 'Mars',
    title: 'Красный цвет во вторник',
    action: 'Наденьте что-то красное во вторник (шарф, носки, аксессуар).',
    why: 'Вторник — день Марса, красный — его цвет. Это усиливает позитивные качества планеты.',
    effect: 'Повышает решительность и смелость.',
    duration: 1,
    frequency: 'По вторникам',
    category: 'home'
  },

  // Mercury (Budha) remedies
  {
    id: 'mercury-1',
    planet: 'Mercury',
    title: 'Запишите 3 мысли',
    action: 'Возьмите листок и запишите 3 мысли, которые крутятся в голове. Необязательно анализировать — просто зафиксируйте.',
    why: 'Меркурий управляет умом и коммуникацией. Записывание мыслей освобождает ментальное пространство.',
    effect: 'Помогает при рассеянности и ментальном хаосе.',
    duration: 3,
    frequency: 'Когда чувствуете перегрузку',
    category: 'home'
  },
  {
    id: 'mercury-2',
    planet: 'Mercury',
    title: 'Зелёные продукты в среду',
    action: 'В среду добавьте в рацион что-то зелёное: огурец, зелень, яблоко.',
    why: 'Среда — день Меркурия, зелёный — его цвет. Это гармонизирует ум.',
    effect: 'Улучшает концентрацию и ясность мышления.',
    duration: 5,
    frequency: 'По средам',
    category: 'home'
  },

  // Jupiter (Guru) remedies
  {
    id: 'jupiter-1',
    planet: 'Jupiter',
    title: 'Благотворительность',
    action: 'Сделайте что-то доброе для кого-то: помогите коллеге, уступите место, покормите птиц.',
    why: 'Юпитер — планета щедрости и расширения. Служение усиливает его благословения.',
    effect: 'Привлекает удачу и позитивные возможности.',
    duration: 5,
    frequency: '1-2 раза в неделю',
    category: 'social'
  },
  {
    id: 'jupiter-2',
    planet: 'Jupiter',
    title: 'Жёлтое в четверг',
    action: 'Носите что-то жёлтое в четверг или добавьте жёлтый акцент в пространство (цветок, платок).',
    why: 'Четверг — день Юпитера, жёлтый — его цвет.',
    effect: 'Усиливает мудрость, оптимизм и процветание.',
    duration: 1,
    frequency: 'По четвергам',
    category: 'home'
  },

  // Venus (Shukra) remedies
  {
    id: 'venus-1',
    planet: 'Venus',
    title: 'Красота вокруг',
    action: 'Добавьте красивый элемент в своё пространство: цветок, свечу, картинку. Или уделите 5 минут уходу за собой.',
    why: 'Венера — планета красоты и гармонии. Внимание к эстетике усиливает её влияние.',
    effect: 'Улучшает отношения, повышает самооценку.',
    duration: 5,
    frequency: '2-3 раза в неделю',
    category: 'home'
  },
  {
    id: 'venus-2',
    planet: 'Venus',
    title: 'Музыка или творчество',
    action: 'Послушайте любимую музыку 5-10 минут или сделайте что-то творческое (рисунок, танец, пение).',
    why: 'Венера управляет искусством и удовольствием.',
    effect: 'Гармонизирует эмоции, повышает креативность.',
    duration: 10,
    frequency: 'Когда нужна вдохновение',
    category: 'home'
  },

  // Saturn (Shani) remedies
  {
    id: 'saturn-1',
    planet: 'Saturn',
    title: 'Завершите одно дело',
    action: 'Выберите одну маленькую задачу, которую откладываете, и доведите до конца.',
    why: 'Сатурн — планета дисциплины и ответственности. Завершение дел умиротворяет его.',
    effect: 'Снижает чувство вины и прокрастинацию.',
    duration: 15,
    frequency: 'Когда чувствуете застой',
    category: 'home'
  },
  {
    id: 'saturn-2',
    planet: 'Saturn',
    title: 'Благодарность старшим',
    action: 'Позвоните родителю, учителю или наставнику. Или мысленно поблагодарите их.',
    why: 'Сатурн управляет старшими и традициями. Уважение к опыту гармонизирует его.',
    effect: 'Помогает при сложных периодах Сатурна, укрепляет внутреннюю опору.',
    duration: 5,
    frequency: '1 раз в неделю',
    category: 'social'
  }
];

export function getUpayasForPlanet(planet: string): Upaya[] {
  return UPAYAS.filter(u => u.planet === planet);
}

export function getUpayasByDuration(maxMinutes: number): Upaya[] {
  return UPAYAS.filter(u => u.duration <= maxMinutes);
}

export function getUpayasByCategory(category: Upaya['category']): Upaya[] {
  return UPAYAS.filter(u => u.category === category);
}

export function getUpayaForDay(date: Date, preferredPlanet?: string): Upaya {
  const candidates = preferredPlanet
    ? UPAYAS.filter(upaya => upaya.planet === preferredPlanet)
    : UPAYAS;
  const pool = candidates.length > 0 ? candidates : UPAYAS;
  const seed = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${preferredPlanet || 'all'}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  return pool[Math.abs(hash) % pool.length];
}

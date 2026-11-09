export const VASTU_SECTORS = [
  'northwest', 'north', 'northeast',
  'west', 'center', 'east',
  'southwest', 'south', 'southeast',
] as const;

export type VastuSector = typeof VASTU_SECTORS[number];
export type CompassDirection = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';
export type VastuPropertyType = 'apartment' | 'house' | 'land' | 'office' | 'retail' | 'other';
export type VastuPlotShape = 'square' | 'rectangle' | 'irregular' | 'triangular' | 'narrow' | 'unknown';
export type VastuSlope = CompassDirection | 'flat' | 'unknown';
export type VastuRoomUse =
  | 'prayer' | 'kitchen' | 'master-bedroom' | 'bedroom' | 'guest-bedroom'
  | 'living' | 'dining' | 'study' | 'office' | 'bathroom' | 'toilet'
  | 'stairs' | 'storage' | 'laundry' | 'water' | 'balcony' | 'open' | 'other';

export interface VastuPropertyAssessment {
  schemaVersion: 1;
  propertyName: string;
  propertyType: VastuPropertyType;
  facingDirection: CompassDirection | '';
  entranceWall: 'north' | 'east' | 'south' | 'west' | '';
  entrancePosition: number;
  plotShape: VastuPlotShape;
  plotSlope: VastuSlope;
  roadSides: CompassDirection[];
  waterSides: CompassDirection[];
  rooms: Record<VastuSector, VastuRoomUse | ''>;
  condition: Record<string, 'ok' | 'attention' | 'unknown'>;
  currency: string;
  purchasePrice: number;
  closingCosts: number;
  renovationCost: number;
  monthlyRent: number;
  vacancyRatePercent: number;
  monthlyOperatingCosts: number;
  annualPropertyTax: number;
  monthlyMortgagePayment: number;
  notes: string;
}

export interface VastuFinding {
  id: string;
  sector: VastuSector;
  room: VastuRoomUse;
  level: 'note' | 'review';
  title: string;
  explanation: string;
  tradition: string;
}

export interface PropertyConditionFinding {
  id: string;
  label: string;
  status: 'ok' | 'attention' | 'unknown';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface VastuSiteFinding {\n  id: string;\n  level: 'note' | 'review';\n  title: string;\n  explanation: string;\n}\n\nexport interface PropertyInvestmentAnalysis {
  totalAcquisitionCost: number;
  effectiveAnnualRent: number;
  annualOperatingCosts: number;
  annualNetOperatingIncome: number;
  grossYieldPercent: number | null;
  netYieldPercent: number | null;
  monthlyCashFlowBeforeFinancing: number;
  monthlyCashFlowAfterFinancing: number;
  breakEvenOccupancyPercent: number | null;
  isComplete: boolean;
}

export interface VastuPropertyAnalysis {
  traditionalAlignmentScore: number | null;
  assessedSectors: number;
  findings: VastuFinding[];
  entrancePada: number | null;
  conditionFindings: PropertyConditionFinding[];
  highPriorityCount: number;
  investment: PropertyInvestmentAnalysis;
}

export const PROPERTY_CONDITION_ITEMS = [
  { id: 'structure', label: 'Несущие конструкции и трещины', priority: 'high' as const, recommendation: 'Закажите осмотр квалифицированного строительного специалиста; проверьте трещины, деформации, фундамент и несущие элементы.' },
  { id: 'moisture', label: 'Протечки, сырость и плесень', priority: 'high' as const, recommendation: 'Проверьте следы протечек, запах сырости, вентиляцию и возможную плесень; выясните источник влаги до косметического ремонта.' },
  { id: 'electrical', label: 'Электрика и заземление', priority: 'high' as const, recommendation: 'Попросите квалифицированного электрика проверить щит, проводку, защитные устройства и соответствие местным нормам.' },
  { id: 'fire', label: 'Пожарная безопасность и выходы', priority: 'high' as const, recommendation: 'Проверьте исправность датчиков дыма/CO, свободные пути эвакуации, двери и доступ к пожарному оборудованию.' },
  { id: 'plumbing', label: 'Водоснабжение, канализация и дренаж', priority: 'medium' as const, recommendation: 'Проверьте давление воды, сантехнику, канализацию, следы обратного подпора и отвод дождевой воды.' },
  { id: 'ventilation', label: 'Вентиляция и качество воздуха', priority: 'medium' as const, recommendation: 'Проверьте вытяжку, приток воздуха и работу вентиляции в кухне и санузлах.' },
  { id: 'daylight', label: 'Естественный свет и перегрев', priority: 'medium' as const, recommendation: 'Оцените дневной свет в разное время, затенение, блики и перегрев помещений.' },
  { id: 'noise', label: 'Шум и внешнее окружение', priority: 'medium' as const, recommendation: 'Посетите объект в разное время суток; оцените транспортный, соседский и инженерный шум.' },
  { id: 'accessibility', label: 'Доступность и удобство перемещения', priority: 'low' as const, recommendation: 'Проверьте лестницы, пороги, лифт, ширину проходов и соответствие потребностям жильцов.' },
  { id: 'legal', label: 'Право собственности и обременения', priority: 'high' as const, recommendation: 'Проверьте титул/право собственности, залоги, сервитуты, судебные споры и полномочия продавца через профильного юриста.' },
  { id: 'permits', label: 'Разрешения и согласованность перепланировки', priority: 'high' as const, recommendation: 'Сверьте фактическую планировку с документами, разрешениями, зонированием и местными строительными требованиями.' },
  { id: 'insurance', label: 'Страхование и история убытков', priority: 'medium' as const, recommendation: 'Запросите доступную историю страховых случаев, ограничения покрытия и стоимость страхования.' },
] as const;

const EXPECTED_ROOMS: Record<VastuSector, VastuRoomUse[]> = {
  northwest: ['guest-bedroom', 'bedroom', 'laundry', 'bathroom', 'toilet', 'living'],
  north: ['living', 'study', 'office', 'prayer', 'water', 'open'],
  northeast: ['prayer', 'study', 'water', 'open', 'living'],
  west: ['dining', 'bedroom', 'storage', 'living'],
  center: ['open', 'living', 'dining'],
  east: ['living', 'study', 'prayer', 'balcony', 'open'],
  southwest: ['master-bedroom', 'storage', 'bedroom'],
  south: ['stairs', 'storage', 'bedroom', 'bathroom'],
  southeast: ['kitchen', 'laundry', 'dining'],
};

export function createEmptyVastuPropertyAssessment(): VastuPropertyAssessment {
  const rooms = Object.fromEntries(VASTU_SECTORS.map((sector) => [sector, ''])) as VastuPropertyAssessment['rooms'];
  const condition = Object.fromEntries(PROPERTY_CONDITION_ITEMS.map((item) => [item.id, 'unknown'])) as VastuPropertyAssessment['condition'];
  return {
    schemaVersion: 1, propertyName: '', propertyType: 'apartment', facingDirection: '', entranceWall: '',
    entrancePosition: 50, plotShape: 'unknown', plotSlope: 'unknown', roadSides: [], waterSides: [],
    rooms, condition, currency: 'USD', purchasePrice: 0, closingCosts: 0, renovationCost: 0,
    monthlyRent: 0, vacancyRatePercent: 5, monthlyOperatingCosts: 0, annualPropertyTax: 0,
    monthlyMortgagePayment: 0, notes: '',
  };
}

export function calculateEntrancePada(positionPercent: number): number | null {
  if (!Number.isFinite(positionPercent) || positionPercent < 0 || positionPercent > 100) return null;
  return Math.min(8, Math.floor(positionPercent / 12.5) + 1);
}

export function calculatePropertyInvestment(data: Pick<VastuPropertyAssessment,
  'purchasePrice' | 'closingCosts' | 'renovationCost' | 'monthlyRent' | 'vacancyRatePercent'
  | 'monthlyOperatingCosts' | 'annualPropertyTax' | 'monthlyMortgagePayment'
>): PropertyInvestmentAnalysis {
  const totalAcquisitionCost = Math.max(0, data.purchasePrice) + Math.max(0, data.closingCosts) + Math.max(0, data.renovationCost);
  const occupancy = 1 - Math.min(100, Math.max(0, data.vacancyRatePercent)) / 100;
  const effectiveAnnualRent = Math.max(0, data.monthlyRent) * 12 * occupancy;
  const annualOperatingCosts = Math.max(0, data.monthlyOperatingCosts) * 12 + Math.max(0, data.annualPropertyTax);
  const annualNetOperatingIncome = effectiveAnnualRent - annualOperatingCosts;
  const monthlyCashFlowBeforeFinancing = annualNetOperatingIncome / 12;
  const monthlyCashFlowAfterFinancing = monthlyCashFlowBeforeFinancing - Math.max(0, data.monthlyMortgagePayment);
  const isComplete = data.purchasePrice > 0 && data.monthlyRent > 0;
  return {
    totalAcquisitionCost, effectiveAnnualRent, annualOperatingCosts, annualNetOperatingIncome,
    grossYieldPercent: totalAcquisitionCost > 0 && data.monthlyRent > 0 ? data.monthlyRent * 12 / totalAcquisitionCost * 100 : null,
    netYieldPercent: totalAcquisitionCost > 0 && isComplete ? annualNetOperatingIncome / totalAcquisitionCost * 100 : null,
    monthlyCashFlowBeforeFinancing, monthlyCashFlowAfterFinancing,
    breakEvenOccupancyPercent: data.monthlyRent > 0
      ? Math.min(100, annualOperatingCosts / (data.monthlyRent * 12) * 100)
      : null,
    isComplete,
  };
}

export function analyzeVastuProperty(data: VastuPropertyAssessment): VastuPropertyAnalysis {
  const findings: VastuFinding[] = [];
  let aligned = 0;
  let assessedSectors = 0;
  for (const sector of VASTU_SECTORS) {
    const room = data.rooms[sector];
    if (!room) continue;
    assessedSectors++;
    const allowed = EXPECTED_ROOMS[sector];
    if (allowed.includes(room)) {
      aligned++;
      findings.push({
        id: `room-${sector}`, sector, room, level: 'note',
        title: `${sector}: функция помещения соответствует одному из распространённых традиционных вариантов`,
        explanation: 'Это совпадение с выбранной справочной схемой, а не оценка качества объекта или прогноз результата.',
        tradition: 'Традиционные рекомендации разных школ могут допускать иные назначения.',
      });
    } else {
      findings.push({
        id: `room-${sector}`, sector, room, level: 'review',
        title: `Проверьте назначение помещения в секторе ${sector}`,
        explanation: 'Назначение отличается от распространённых рекомендаций выбранной справочной схемы. Само по себе это не доказывает проблему и не требует перестройки.',
        tradition: 'Сопоставление носит ориентировочный характер; школы Васту расходятся в деталях.',
      });
    }
  }

  const directionLabel = (direction: CompassDirection) => ({
    north: 'север', northeast: 'северо-восток', east: 'восток', southeast: 'юго-восток',
    south: 'юг', southwest: 'юго-запад', west: 'запад', northwest: 'северо-запад',
  })[direction];
  const siteFindings: VastuSiteFinding[] = [];
  if (data.facingDirection) {
    siteFindings.push({ id: 'facing', level: 'note', title: 'Ориентация фасада указана', explanation: `Главный фасад обращён на ${directionLabel(data.facingDirection)}. Это фиксирует исходное направление для дальнейшей традиционной интерпретации; само по себе направление не определяет качество или стоимость объекта.` });
  } else {
    siteFindings.push({ id: 'facing-missing', level: 'review', title: 'Нужно подтвердить ориентацию фасада', explanation: 'Сверьте направление с геодезическим или архитектурным планом либо компасом вдали от металла и электроники.' });
  }
  if (data.plotShape === 'unknown') {
    siteFindings.push({ id: 'shape-missing', level: 'review', title: 'Форма участка не подтверждена', explanation: 'Сверьте границы и фактическую геометрию с кадастровым/геодезическим планом.' });
  } else if (['irregular', 'triangular', 'narrow'].includes(data.plotShape)) {
    siteFindings.push({ id: 'shape', level: 'review', title: 'Нестандартная геометрия участка', explanation: 'Проверьте площадь фактического использования, отступы от границ, подъезд, дренаж и ограничения зонирования. Васту-школы по-разному трактуют неправильные формы.' });
  } else {
    siteFindings.push({ id: 'shape', level: 'note', title: 'Форма участка отмечена как регулярная', explanation: 'Квадратная или прямоугольная форма зафиксирована по вашему вводу; геометрию всё равно следует сверить с планом.' });
  }
  if (data.plotSlope === 'unknown') {
    siteFindings.push({ id: 'slope-missing', level: 'review', title: 'Уклон участка не проверен', explanation: 'Закажите оценку рельефа и направления стока воды; это важно для дренажа и риска подтопления.' });
  } else if (data.plotSlope === 'flat') {
    siteFindings.push({ id: 'slope', level: 'note', title: 'Участок отмечен как почти ровный', explanation: 'Подтвердите уклон нивелированием и убедитесь, что вода отводится от фундамента.' });
  } else {
    siteFindings.push({ id: 'slope', level: 'review', title: `Уклон в сторону: ${directionLabel(data.plotSlope)}`, explanation: 'Традиционные школы Васту учитывают направление уклона, но единой универсальной оценки здесь не применяется. Для сделки проверьте инженерный дренаж, подпорные конструкции, эрозию и риск подтопления.' });
  }
  if (data.roadSides.length) {
    siteFindings.push({ id: 'roads', level: 'note', title: 'Отмечены дороги или подъезды', explanation: `Стороны: ${data.roadSides.map(directionLabel).join(', ')}. Проверьте безопасный въезд/выезд, шум, пыль, освещение и приватность в часы пик.` });
  }
  if (data.waterSides.length) {
    siteFindings.push({ id: 'water', level: 'review', title: 'Рядом отмечен водный объект', explanation: `Стороны: ${data.waterSides.map(directionLabel).join(', ')}. Уточните зоны затопления, береговые ограничения, влажность, эрозию, страховку и требования местных органов.` });
  }

  const conditionFindings = PROPERTY_CONDITION_ITEMS.map((item) => ({
    id: item.id, label: item.label,
    status: data.condition[item.id] ?? 'unknown',
    priority: item.priority,
    recommendation: item.recommendation,
  }));
  const highPriorityCount = conditionFindings.filter((item) => item.priority === 'high' && item.status === 'attention').length;
  return {
    traditionalAlignmentScore: assessedSectors ? Math.round(aligned / assessedSectors * 100) : null,
    assessedSectors,
    findings,
    entrancePada: calculateEntrancePada(data.entrancePosition),
    conditionFindings,
    highPriorityCount,
    investment: calculatePropertyInvestment(data),
  };
}

export function formatPropertyMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString('ru-RU')} ${currency}`;
  }
}

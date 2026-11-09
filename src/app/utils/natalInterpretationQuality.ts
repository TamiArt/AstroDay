import type { NatalChart } from './astrology';
import { analyzeHouseLords } from './natalHouseLordAnalysis';
import { describePlanetInHouse } from './natalHouseInterpretation';
import { analyzeLifeTopics, analyzePersonalizedHouses } from './personalizedHouseAnalysis';
import { getPlanetHouse } from './natalStrengthAnalysis';

export type InterpretationIssueSeverity = 'error' | 'warning';
export type InterpretationIssueCode =
  | 'empty-narrative'
  | 'missing-evidence'
  | 'unsupported-certainty'
  | 'medical-determinism'
  | 'fertility-determinism'
  | 'financial-guarantee'
  | 'invalid-house'
  | 'invalid-primary-house'
  | 'duplicate-evidence'
  | 'missing-balance-context';

export interface InterpretationQualityIssue {
  code: InterpretationIssueCode;
  severity: InterpretationIssueSeverity;
  message: string;
}

export interface InterpretationQualityInput {
  id: string;
  title: string;
  narrative: string;
  evidence?: string[];
  houses?: number[];
  primaryHouses?: number[];
  supportingFactors?: string[];
  attentionPoints?: string[];
  requiresEvidence?: boolean;
}

export interface InterpretationQualityResult {
  id: string;
  title: string;
  score: number;
  publishable: boolean;
  issues: InterpretationQualityIssue[];
}

export interface InterpretationQualityReport {
  checked: number;
  publishable: number;
  blocked: number;
  warningCount: number;
  averageScore: number;
  results: InterpretationQualityResult[];
}

const CERTAINTY_PATTERNS: RegExp[] = [
  /\bгарантиру(?:ет|ют|ется|ется)\b/iu,
  /\bгарантированн(?:о|ый|ая|ое)\b/iu,
  /\bнеизбежн(?:о|ый|ая|ое)\b/iu,
  /\bточно произойд[её]т\b/iu,
  /\bобязательно произойд[её]т\b/iu,
  /\bпредопредел[её]н(?:о|а|ы)?\b/iu,
  /\bобреч[её]н(?:а|о|ы)?\b/iu,
  /\bвсегда будет\b/iu,
];

function isNegated(text: string, index: number): boolean {
  const prefix = text.slice(Math.max(0, index - 28), index);
  return /(?:не|нельзя|не следует|не означает|не может)\s*$/iu.test(prefix);
}

function containsUnqualifiedPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => {
    const match = pattern.exec(text);
    return Boolean(match && !isNegated(text, match.index));
  });
}

function uniqueNonEmpty(values: string[] | undefined): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

/**
 * Deterministic quality gate for symbolic chart interpretations.
 * It checks evidence, scope, internal structure and prohibited deterministic
 * claims; it does not judge or certify the truth of an astrological tradition.
 */
export function validateInterpretationQuality(
  input: InterpretationQualityInput,
): InterpretationQualityResult {
  const issues: InterpretationQualityIssue[] = [];
  const narrative = input.narrative.trim();
  const evidence = uniqueNonEmpty(input.evidence);
  const add = (code: InterpretationIssueCode, severity: InterpretationIssueSeverity, message: string) => {
    issues.push({ code, severity, message });
  };

  if (!narrative) {
    add('empty-narrative', 'error', 'Текст интерпретации отсутствует.');
  }

  if (input.requiresEvidence !== false && narrative.length >= 80 && evidence.length === 0) {
    add('missing-evidence', 'error', 'Развёрнутый вывод не содержит проверяемых оснований из карты.');
  }

  const certaintyText = narrative;
  for (const pattern of CERTAINTY_PATTERNS) {
    const match = pattern.exec(certaintyText);
    if (match && !isNegated(certaintyText, match.index)) {
      add('unsupported-certainty', 'error', 'Обнаружено категоричное обещание или предсказание события.');
      break;
    }
  }

  const medicalPatterns = [
    /(?:карта|гороскоп|положение|аспект)[^.!?]{0,70}(?:диагностирует|определяет диагноз|предсказывает заболевание)/iu,
    /(?:астрологическ\w*|натальн\w*)[^.!?]{0,50}(?:лечит|назначает лечение|заменяет врача)/iu,
  ];
  if (containsUnqualifiedPattern(narrative, medicalPatterns)) {
    add('medical-determinism', 'error', 'Астрологический показатель представлен как медицинская диагностика или лечение.');
  }

  const fertilityPatterns = [
    /(?:карта|гороскоп|положение|аспект)[^.!?]{0,70}(?:гарантирует|предсказывает|определяет)[^.!?]{0,35}(?:беременност|зачати|рождени)/iu,
    /(?:беременност|зачати)[^.!?]{0,35}(?:гарантирован|неизбежн|точно произойд)/iu,
  ];
  if (containsUnqualifiedPattern(narrative, fertilityPatterns)) {
    add('fertility-determinism', 'error', 'Запрещённое обещание или предсказание беременности/зачатия.');
  }

  const financialPatterns = [
    /(?:карта|гороскоп|положение|аспект)[^.!?]{0,70}(?:гарантирует|обеспечит|обязательно принес[её]т)[^.!?]{0,35}(?:доход|богатств|прибыл|деньг)/iu,
    /(?:точно|неизбежно|гарантированно)[^.!?]{0,35}(?:разбогате|получите доход|станете богат)/iu,
  ];
  if (containsUnqualifiedPattern(narrative, financialPatterns)) {
    add('financial-guarantee', 'error', 'Финансовый результат представлен как гарантированный.');
  }

  const houses = input.houses ?? [];
  if (houses.some((house) => !Number.isInteger(house) || house < 1 || house > 12)) {
    add('invalid-house', 'error', 'В списке домов есть значение вне диапазона 1–12.');
  }
  const primaryHouses = input.primaryHouses ?? [];
  if (primaryHouses.some((house) => !houses.includes(house))) {
    add('invalid-primary-house', 'error', 'Основной дом не входит в список домов данной темы.');
  }

  if (evidence.length !== (input.evidence ?? []).length) {
    add('duplicate-evidence', 'warning', 'Список оснований содержит пустые или повторяющиеся элементы.');
  }

  const support = uniqueNonEmpty(input.supportingFactors);
  const attention = uniqueNonEmpty(input.attentionPoints);
  if (support.length === 0 && attention.length === 0 && input.supportingFactors !== undefined && input.attentionPoints !== undefined) {
    add('missing-balance-context', 'warning', 'Не указаны ни поддерживающие факторы, ни факторы, требующие внимания; нейтральность следует обозначить явно.');
  }

  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;
  return {
    id: input.id,
    title: input.title,
    score: Math.max(0, 100 - errors * 30 - warnings * 10),
    publishable: errors === 0,
    issues,
  };
}

/** Audits all generated interpretation families for a natal chart. */
export function auditNatalChartInterpretations(
  chart: NatalChart,
  currentDate: Date = new Date(),
): InterpretationQualityReport {
  const inputs: InterpretationQualityInput[] = [];

  for (const insight of analyzePersonalizedHouses(chart)) {
    inputs.push({
      id: `house:${insight.house}`,
      title: `Дом ${insight.house}`,
      narrative: insight.interpretation,
      evidence: insight.evidence,
      houses: [insight.house, insight.lordHouse ?? insight.house, ...insight.occupants.map((item) => item.house)],
    });
  }

  for (const topic of analyzeLifeTopics(chart, currentDate)) {
    inputs.push({
      id: `topic:${topic.id}`,
      title: topic.title,
      narrative: [topic.interpretation, topic.synthesis, topic.timingNote].join(' '),
      evidence: topic.evidence,
      houses: topic.houses,
      primaryHouses: topic.primaryHouses,
      supportingFactors: topic.supportingFactors,
      attentionPoints: topic.attentionPoints,
    });
  }

  for (const insight of analyzeHouseLords(chart)) {
    inputs.push({
      id: `house-lord:${insight.house}`,
      title: `Управитель дома ${insight.house}`,
      narrative: [insight.interpretation, insight.overallSynthesis].join(' '),
      evidence: insight.evidence,
      houses: [insight.house, ...(insight.lordHouse ? [insight.lordHouse] : []), ...insight.ruledHouses],
      supportingFactors: insight.supportingFactors,
      attentionPoints: insight.attentionFactors,
    });
  }

  for (const [planetKey, planet] of Object.entries(chart.planets)) {
    const house = getPlanetHouse(chart, planetKey);
    if (!house) continue;
    for (let targetHouse = 1; targetHouse <= 12; targetHouse += 1) {
      const narrative = describePlanetInHouse(chart, planetKey, targetHouse);
      if (!narrative) continue;
      inputs.push({
        id: `placement:${planetKey}:${targetHouse}`,
        title: `${planet.name} в ${targetHouse}-м доме`,
        narrative,
        evidence: [
          `${planet.name}: знак ${planet.signName}, фактическое положение в ${house}-м доме`,
          `Интерпретируемая сфера: ${targetHouse}-й дом`,
        ],
        houses: [house, targetHouse],
      });
    }
  }

  const results = inputs.map(validateInterpretationQuality);
  const blocked = results.filter((result) => !result.publishable).length;
  const warningCount = results.reduce(
    (total, result) => total + result.issues.filter((issue) => issue.severity === 'warning').length,
    0,
  );
  const averageScore = results.length
    ? Math.round(results.reduce((total, result) => total + result.score, 0) / results.length)
    : 100;

  return {
    checked: results.length,
    publishable: results.length - blocked,
    blocked,
    warningCount,
    averageScore,
    results,
  };
}

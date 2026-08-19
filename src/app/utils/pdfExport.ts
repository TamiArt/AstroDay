/**
 * PDF Export functionality using jsPDF.
 * The report data is prepared by DailyReportViewModel so the PDF layer stays presentation-only.
 */

import { jsPDF } from 'jspdf';
import type { Aspect, NatalChart } from './astrology';
import { formatDateKey } from './dateUtils';
import { buildDailyReportViewModel } from './dailyReportViewModel';
import type { PanchangData } from './panchang';

function ensureSpace(doc: jsPDF, y: number, required = 12): number {
  if (y + required <= 280) return y;
  doc.addPage();
  return 20;
}

function writeWrappedText(doc: jsPDF, text: string, x: number, y: number, width = 165, lineHeight = 6): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  let currentY = y;

  for (const line of lines) {
    currentY = ensureSpace(doc, currentY, lineHeight);
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

export function exportDailyReportToPDF(
  userName: string,
  date: Date,
  natalChart: NatalChart,
  currentChart: NatalChart,
  aspects: Aspect[],
  panchang: PanchangData,
): void {
  const report = buildDailyReportViewModel(userName, date, natalChart, currentChart, aspects, panchang);
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(20);
  doc.text('Ведический астрологический прогноз', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Для: ${report.userName}`, 20, y);
  y += 7;
  y = writeWrappedText(doc, `Дата: ${report.dateLabel}`, 20, y);
  y += 6;

  doc.setFontSize(16);
  doc.text('Натальная основа', 20, y);
  y += 9;
  doc.setFontSize(11);
  doc.text(`Асцендент: ${report.natal.ascendant}`, 25, y);
  y += 6;
  doc.text(`Луна: ${report.natal.moonSign}`, 25, y);
  y += 6;
  doc.text(`Накшатра Луны: ${report.natal.moonNakshatra}`, 25, y);
  y += 12;

  y = ensureSpace(doc, y, 35);
  doc.setFontSize(16);
  doc.text('Панчанг', 20, y);
  y += 9;
  doc.setFontSize(11);
  y = writeWrappedText(doc, `Титхи: ${report.panchang.tithi} — ${report.panchang.tithiMeaning}`, 25, y);
  y += 2;
  y = writeWrappedText(doc, `Йога: ${report.panchang.yoga} — ${report.panchang.yogaMeaning}`, 25, y);
  y += 2;
  y = writeWrappedText(doc, `Карана: ${report.panchang.karana} — ${report.panchang.karanaQuality}`, 25, y);
  y += 2;
  y = writeWrappedText(doc, `Вара: ${report.panchang.vara} — ${report.panchang.varaQuality}`, 25, y);
  y += 8;

  y = ensureSpace(doc, y, 20);
  doc.setFontSize(16);
  doc.text('Транзиты планет', 20, y);
  y += 9;
  doc.setFontSize(11);
  for (const transit of report.transits) {
    y = ensureSpace(doc, y, 7);
    doc.text(`${transit.planet}: ${transit.sign} ${transit.degree.toFixed(2)}°`, 25, y);
    y += 7;
  }

  if (report.keyAspects.length > 0) {
    y += 6;
    y = ensureSpace(doc, y, 20);
    doc.setFontSize(16);
    doc.text('Ключевые аспекты', 20, y);
    y += 9;
    doc.setFontSize(11);

    for (const aspect of report.keyAspects) {
      y = writeWrappedText(doc, `${aspect.description} (сила: ${aspect.strength.toFixed(1)})`, 25, y);
      y += 1;
    }
  }

  y += 8;
  y = ensureSpace(doc, y, 25);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const disclaimer = 'Джйотиш показывает тенденции, но не определяет вашу жизнь. Вы сохраняете свободу воли. Прогноз — это рекомендация, не приговор. Для важных решений консультируйтесь со специалистами.';
  writeWrappedText(doc, disclaimer, 20, y, 170, 5);

  doc.save(`vedic-forecast-${formatDateKey(date)}.pdf`);
}

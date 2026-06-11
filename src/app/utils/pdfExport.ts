/**
 * PDF Export functionality using jsPDF
 */

import { jsPDF } from 'jspdf';
import { NatalChart, Aspect } from './astrology';
import { PanchangData } from './panchang';
import { formatDateKey } from './dateUtils';

export function exportDailyReportToPDF(
  userName: string,
  date: Date,
  _natalChart: NatalChart,
  currentChart: NatalChart,
  aspects: Aspect[],
  panchang: PanchangData
): void {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Ведический астрологический прогноз', 20, y);
  y += 10;

  // Date and name
  doc.setFontSize(12);
  doc.text(`Для: ${userName}`, 20, y);
  y += 7;
  doc.text(`Дата: ${date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`, 20, y);
  y += 15;

  // Panchang
  doc.setFontSize(16);
  doc.text('Панчанг', 20, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Титхи: ${panchang.tithi.name}`, 25, y);
  y += 6;
  doc.text(`  ${panchang.tithi.meaning}`, 25, y);
  y += 8;

  doc.text(`Йога: ${panchang.yoga.name}`, 25, y);
  y += 6;
  doc.text(`  ${panchang.yoga.meaning}`, 25, y);
  y += 8;

  doc.text(`Карана: ${panchang.karana.name}`, 25, y);
  y += 6;
  doc.text(`  ${panchang.karana.quality}`, 25, y);
  y += 8;

  doc.text(`Вара: ${panchang.vara.name} (${panchang.vara.planet})`, 25, y);
  y += 6;
  doc.text(`  ${panchang.vara.quality}`, 25, y);
  y += 15;

  // Planetary positions
  doc.setFontSize(16);
  doc.text('Транзиты планет', 20, y);
  y += 10;

  doc.setFontSize(11);
  Object.entries(currentChart.planets).forEach(([name, planet]) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${name}: ${planet.signName} ${planet.degree.toFixed(2)}°`, 25, y);
    y += 7;
  });

  y += 8;

  // Aspects
  if (aspects.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(16);
    doc.text('Ключевые аспекты', 20, y);
    y += 10;

    doc.setFontSize(11);
    aspects.slice(0, 5).forEach((aspect) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${aspect.description} (сила: ${aspect.strength.toFixed(1)})`, 25, y);
      y += 7;
    });
  }

  y += 10;

  // Disclaimer
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const disclaimer = 'Джйотиш показывает тенденции, но не определяет вашу жизнь. Вы сохраняете свободу воли. ' +
    'Прогноз — это рекомендация, не приговор. Для важных решений консультируйтесь со специалистами.';

  const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
  doc.text(splitDisclaimer, 20, y);

  // Save
  const filename = `vedic-forecast-${formatDateKey(date)}.pdf`;
  doc.save(filename);
}

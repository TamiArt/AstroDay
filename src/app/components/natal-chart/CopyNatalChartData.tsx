import { useState } from 'react';
import { Check, Copy, AlertCircle } from 'lucide-react';
import type { NatalChart } from '../../utils/astrology';
import { copyTextToClipboard } from '../../utils/clipboard';
import { serializeNatalChart } from '../../utils/natalChartExport';
import type { UserProfile } from '../../utils/storage';

interface CopyNatalChartDataProps {
  profile: UserProfile;
  natalChart: NatalChart;
}

export function CopyNatalChartData({ profile, natalChart }: CopyNatalChartDataProps) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [textForManualCopy, setTextForManualCopy] = useState('');

  const handleCopy = async () => {
    const text = serializeNatalChart(profile, natalChart);
    setTextForManualCopy(text);
    setStatus('copying');
    setErrorMessage('');

    try {
      await copyTextToClipboard(text);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось скопировать данные.');
    }
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <button
        type="button"
        onClick={handleCopy}
        disabled={status === 'copying'}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60"
        aria-label="Копировать данные натальной карты"
      >
        {status === 'success' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {status === 'copying' ? 'Копирование…' : status === 'success' ? 'Данные скопированы' : 'Копировать данные'}
      </button>

      <p className="max-w-sm text-xs leading-relaxed text-gray-600 sm:text-right">
        Скопируются дата, время и место рождения, координаты, часовой пояс и положения карты.
        При вставке во внешний сервис вы самостоятельно передаёте ему эти данные.
      </p>

      {status === 'success' && (
        <p role="status" aria-live="polite" className="text-sm font-medium text-green-700">
          Данные натальной карты скопированы в буфер обмена.
        </p>
      )}

      {status === 'error' && (
        <div role="alert" className="w-full max-w-sm space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </p>
          <label className="block text-xs font-medium" htmlFor="natal-chart-copy-fallback">
            Текст сохранён здесь — выделите его и скопируйте вручную:
          </label>
          <textarea
            id="natal-chart-copy-fallback"
            readOnly
            value={textForManualCopy}
            onFocus={(event) => event.currentTarget.select()}
            rows={5}
            className="w-full rounded-lg border border-amber-300 bg-white p-2 font-mono text-xs text-gray-800"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-amber-400 px-3 py-2 text-xs font-semibold hover:bg-amber-100"
          >
            Повторить копирование
          </button>
        </div>
      )}
    </div>
  );
}

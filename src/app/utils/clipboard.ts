export interface ClipboardWriter {
  writeText: (text: string) => Promise<void>;
}

export type ClipboardFallback = (text: string) => boolean;

function getBrowserClipboard(): ClipboardWriter | undefined {
  try {
    return typeof navigator !== 'undefined' && navigator.clipboard
      ? navigator.clipboard
      : undefined;
  } catch {
    return undefined;
  }
}

function copyWithDocument(text: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';

  try {
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

/**
 * Uses the modern Clipboard API first and a temporary textarea fallback when
 * the API is unavailable or rejects the write. Throws unless copying succeeds.
 * Dependencies are injectable so both paths can be tested without a browser.
 */
export async function copyTextToClipboard(
  text: string,
  clipboard: ClipboardWriter | undefined = getBrowserClipboard(),
  fallback: ClipboardFallback = copyWithDocument,
): Promise<void> {
  if (!text) throw new Error('Нет данных для копирования.');

  if (clipboard) {
    try {
      await clipboard.writeText(text);
      return;
    } catch {
      // Permission and secure-context failures may still allow the legacy path.
    }
  }

  try {
    if (fallback(text)) return;
  } catch {
    // Report one consistent, actionable error to the UI.
  }

  throw new Error('Браузер не разрешил скопировать данные. Выделите и скопируйте текст вручную либо повторите попытку в защищённом контексте (HTTPS).');
}

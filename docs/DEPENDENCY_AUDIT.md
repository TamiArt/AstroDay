# Аудит зависимостей AstroDay

**Дата проверки:** 2026-11-09  
**Ветка:** `docs/stage-11-documentation-sync`  
**Финальный commit:** `1372a75e407496e38939b5abc9b5dcace9404591`

## Результат

Свежая проверка выполнена в GitHub Actions на Node.js 22 / npm 10.9.9 после `npm ci`.

| Проверка | До исправления | После исправления |
|---|---:|---:|
| `npm audit` — все зависимости | 10 уязвимых package entries: 2 low, 1 moderate, 5 high, 2 critical | **0** |
| `npm audit --omit=dev` — production-граф | 1 critical (DOMPurify) | **0** |
| `npm run verify` | — | **успешно**: strict TypeScript, полный unit suite, production build |

Исходная production-уязвимость находилась в необязательной зависимости `dompurify` пакета `jspdf`. Остальные найденные пакеты относились к инструментам разработки/сборки. Dev-зависимости не входят в production bundle только на основании своего статуса npm, но могут быть актуальны для локальной разработки и CI.

## Обновлённые пакеты

| Пакет | Путь / роль | Было | Стало |
|---|---|---:|---:|
| `@babel/core` | dev, Babel toolchain | 7.29.0 | 7.29.13 |
| `baseline-browser-mapping` | dev, через Browserslist | 2.10.31 | 2.11.35 |
| `browserslist` | dev, через Babel toolchain | 4.28.2 | 4.29.5 |
| `dompurify` | optional production dependency через `jspdf` | 3.4.5 | 3.4.17 |
| `esbuild` | dev, Vite и вложенная версия для tsx | 0.25.12 / 0.28.0 | 0.25.12 / 0.28.2 |
| `nanoid` | dev, через PostCSS | 3.3.12 | 3.3.20 |
| `postcss` | dev, через Vite | 8.5.15 | 8.5.32 |
| `source-map-js` | dev, через PostCSS и Tailwind | 1.2.1 | 1.2.2 |
| `tar` | dev, через `@tailwindcss/oxide` | 7.5.15 | 7.5.22 |
| `vite` | прямой dev dependency | 6.3.5 | 6.4.6 |

`npm audit fix` без `--force` обновил транзитивные пакеты, для которых исправления укладывались в существующие диапазоны. Он оставил Vite 6.3.5, поскольку исправленная 6.4.6 выходила за закреплённую версию. Поэтому Vite обновлён отдельно до 6.4.6 — без смены major-версии; peer ranges установленных плагинов допускают Vite 6.

## Advisory и dependency paths

- **DOMPurify (critical, production path):** `jspdf → dompurify` (optional). Исправлено переходом с 3.4.5 на 3.4.17. В исходном аудите обнаружено несколько advisory по обходам санитизации/DOM XSS; итоговый production audit не сообщает уязвимостей.
- **Vite (high, dev path):** прямой `vite` в проекте; исходная версия 6.3.5. Исправлено обновлением до 6.4.6.
- **PostCSS / nanoid / source-map-js (high, dev paths):** `vite → postcss → nanoid`, `vite → postcss → source-map-js`; `@tailwindcss/vite → @tailwindcss/node → source-map-js`. Исправлены обновлениями lock-файла.
- **tar (critical, dev path):** `@tailwindcss/vite → @tailwindcss/oxide → tar`. Исправлено до 7.5.22.
- **Browserslist / baseline-browser-mapping (high/moderate, dev paths):** через `@babel/core → @babel/helper-compilation-targets → browserslist → baseline-browser-mapping`. Исправлено обновлением транзитивных версий.
- **@babel/core (low, dev path):** через `@vitejs/plugin-react` и Babel helpers. Исправлено до 7.29.13.
- **esbuild (low, dev path):** основная версия через Vite и вложенная версия через tsx. Вложенная версия обновлена с 0.28.0 до 0.28.2; основная 0.25.12 не попадала в затронутый диапазон advisory.

Полный перечень advisory может меняться в npm registry. Для актуального состояния следует запускать команды ниже, а не считать эту таблицу бессрочным сертификатом безопасности.

## Воспроизводимая проверка

```bash
npm ci
npm audit
npm audit --omit=dev
npm run verify
```

Ветка содержит workflow `.github/workflows/dependency-audit.yml`: он запускает оба аудита при изменении manifest/lock-файла, выполняет совместимые обновления в CI, запускает полный verify, сохраняет отчёты и фиксирует проверенные изменения в той же ветке. `npm audit fix --force` не используется.

## Ограничения

- Нулевой результат npm audit означает отсутствие известных npm advisory для разрешённого lock-файла на момент проверки; он не доказывает отсутствие неизвестных уязвимостей или дефектов самого приложения.
- Полный аудит кода, runtime threat modeling, browser E2E и проверка всех внешних сервисов в этот этап не входят.
- Транзитивные версии фиксируются в `package-lock.json`; при обновлении manifest/lock следует повторять обе audit-команды и `npm run verify`.

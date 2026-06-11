# AstroDay

AstroDay - персональное веб-приложение по джйотишу. Оно строит натальную карту, рассчитывает панчанг, транзиты, планетарные часы, сферы дня, календарь прогнозов и персональные рекомендации с объяснением причин.

Главная идея проекта: пользователь вводит свои данные рождения и текущее место, а приложение локально рассчитывает рекомендации на день и момент времени. Формулировки должны быть персональными: не просто "хороший/плохой день", а почему именно этот совет появился: Даша, дом, планета, аспект, Луна, панчанг, планетарный час, точность данных.

## Быстрый Старт

Требования: Node.js 18+ и npm.

```bash
npm install
npm run dev
```

Vite покажет локальный адрес, обычно `http://localhost:5173/`. Если порт занят, будет выбран следующий свободный.

Проверка перед деплоем:

```bash
npm run verify
```

`verify` выполняет production build и TypeScript-проверку.

## Команды

```bash
npm run dev        # локальный dev-сервер
npm run build      # production build в dist/
npm run typecheck  # TypeScript без emit
npm run verify     # build + typecheck
```

## Что Делает Приложение

- Создаёт профиль пользователя: имя, дата рождения, время рождения, место рождения, координаты, timezone, погрешность времени.
- Ищет место рождения и текущее место через OpenStreetMap Nominatim.
- Определяет IANA timezone по координатам через локальные правила и помечает точность timezone.
- Строит сидерическую натальную карту: планеты, Лагна, дома Whole Sign, накшатры, пады, Раху и Кету.
- Рассчитывает текущую карту и транзиты для текущего места пользователя.
- Рассчитывает панчанг: титхи, накшатра, йога, карана, вара.
- Рассчитывает планетарный час по фактическому восходу/закату, а при невозможности честно включает fallback.
- Рассчитывает Вимшоттари Дашу и текущую Антардашу.
- Рассчитывает натальные и транзитные аспекты с силой аспекта.
- Рассчитывает дробные карты и быстрые показатели D12/D20/D24 для персональных подсказок.
- Генерирует персональные рекомендации, чего избегать, лучшие сферы дня, микро-упайю и объяснение причин.
- Показывает календарь прогнозов с кэшем IndexedDB.
- Показывает дневной отчёт, блок "Сейчас", панчанг, натальную карту, упайи, настройки и экспорт.
- Хранит профиль и обратную связь локально в браузере.

## Пользовательский Сценарий

1. Пользователь вводит имя.
2. Указывает дату рождения.
3. Указывает время рождения и погрешность, если время примерное.
4. Вводит место рождения: город, регион, страна.
5. Выбирает результат геокодирования, если найдено несколько мест.
6. Проверяет координаты и timezone.
7. Попадает в Dashboard.
8. При необходимости задаёт текущее местоположение в настройках.
9. Пользуется вкладками: обзор дня, сегодня, панчанг, натальная карта, упайи, календарь, сейчас, настройки.

Для точности лучше вводить место конкретно: `Москва, Россия`, `Владивосток, Приморский край, Россия`, `London, UK`. Для зарубежных мест часто лучше работает английское название.

## Основные Разделы Интерфейса

**Обзор Дня**  
`DayOverview.tsx` показывает 8 сфер жизни: карьеру, отношения, здоровье, финансы, обучение, творчество, духовность, семью. Данные приходят из `calculateDailyAreas`. Баллы строятся из Даши, транзитов, домов, аспектов и панчанга. В карточках показывается не только оценка, но и причина.

**Сегодня**  
`DailyReport.tsx` собирает краткий отчёт: энергия дня, главная рекомендация, чего избегать, ключевой аспект, благоприятные окна времени, текущее местоположение. Раздел разбит на `DayHeadline`, `TopRecommendations`, `AspectsToday`, `FavorableWindows`, `LocationContext`.

**Панчанг**  
`PanchangWidget.tsx` показывает пять элементов ведического календаря: титхи, накшатру, йогу, карану и вару. Для каждого элемента выводится практический смысл.

**Натальная Карта**  
`NatalChartDetailed.tsx` объединяет вкладки:

- `NatalOverviewTab.tsx` - круг карты и базовый обзор;
- `NatalAnalysisTab.tsx` - анализ Асцендента, Солнца, Луны и положений планет;
- `AspectsTableEnhanced.tsx` - натальные аспекты и интерпретации;
- `NatalHousesTab.tsx` - описание домов;
- `NatalDashaTab.tsx` - текущая Даша и объяснение системы;
- `DivisionalChartsTab.tsx` - дробные карты.

**Упайи**  
`RemediesLibrary.tsx` показывает практики гармонизации планет: название, планета, категория, длительность, действие, цель, частота, контекст.

**Календарь**  
`ForecastCalendar.tsx` показывает месячную сетку с понедельника. Для каждого дня используется `DayForecast`: энергия, Луна, титхи, йога, планетарный час, рекомендация, чего избегать, причины, лучшие сферы, микро-упайя, предупреждения и благоприятные часы. День открывается через `DayForecastModal.tsx`.

**Сейчас**  
`CurrentMoment.tsx` показывает текущий планетарный час, таймер до смены часа, персональную рекомендацию, чего избегать, микро-упайю, причины и текущую накшатру Луны. Данные обновляются каждую минуту.

**Настройки**  
`LocationSettings.tsx` управляет текущим местоположением, координатами и ручным IANA timezone. В настройках также доступны экспорт PDF, экспорт JSON, импорт профиля JSON и удаление профиля.

**Состояния И Общие Компоненты**  
`LoadingSpinner.tsx`, `ErrorDisplay.tsx`, `ErrorBoundary.tsx`, `GlassCard.tsx`, `PlanetBadge.tsx`, `LocationBadge.tsx`, `LocationFallbackWarning.tsx` обеспечивают загрузку, ошибки, карточки, планеты и предупреждения о месте.

## Поток Данных

1. `App.tsx` загружает профиль из `storage.ts`.
2. Если профиля нет, открывается `Onboarding.tsx`.
3. `Onboarding.tsx` вызывает `useGeocoding`, получает координаты и timezone, сохраняет `UserProfile`.
4. `Dashboard.tsx` запускает `useAstroCalculations`.
5. `useAstroCalculations` рассчитывает натальную карту, текущую карту, транзитные аспекты, панчанг, планетарный час и благоприятные окна.
6. `Dashboard.tsx` и дочерние вкладки передают эти данные в UI.
7. `personalRecommendations.ts` рассчитывает факторы рекомендации, а `recommendationComposer.ts` собирает из них текст с учётом точности данных.
8. `forecastCalculations.ts` строит прогнозы календаря на локальный полдень выбранного дня.
9. `indexedDB.ts` кеширует прогнозы, а `storage.ts` хранит профиль и ежедневную обратную связь.

## Расчёты

**Сидерический Зодиак И Айанамша**  
`getAyanamsha(date)` использует приближение Lahiri от эпохи J2000. `tropicalToSidereal(tropicalLon, date)` вычитает айанамшу из тропической долготы и нормализует градусы в диапазон 0-360.

**Планеты**  
`calculatePlanetPosition(bodyName, date)` рассчитывает тропическую долготу через `astronomy-engine`, переводит её в сидерическую, определяет знак, градус в знаке, накшатру, паду и быстрые показатели D12/D20/D24. Солнце обрабатывается отдельным методом `SunPosition`. Раху и Кету считаются в `calculateNatalChart` вручную через средний лунный узел; Кету ставится в оппозицию к Раху.

**Асцендент**  
`calculateAscendant(date, latitude, longitude)` рассчитывает Лагну через местное звёздное время, географическую долготу, широту, наклон эклиптики и поиск восточной точки пересечения эклиптики с горизонтом. Это точнее, чем простое приближение по времени суток.

**Дома**  
Используется Whole Sign. Знак Асцендента становится 1-м домом, следующие знаки становятся домами 2-12. `getPlanetHouse(planetSign, houses)` определяет дом планеты по знаку. `getLifeAreaHouses()` связывает сферы жизни с домами:

- карьера: 6, 10, 11;
- отношения: 5, 7, 12;
- здоровье: 1, 6, 8;
- финансы: 2, 6, 10, 11;
- обучение: 4, 5, 9;
- творчество: 3, 5, 9;
- духовность: 8, 9, 12;
- семья: 2, 4, 7.

**Вимшоттари Даша**  
`calculateDasha(birthDate, moonNakshatra, currentDate, moonSiderealLon)` определяет текущую Махадашу. Стартовая Даша берётся по накшатре Луны, стартовый баланс учитывает положение Луны внутри накшатры. Последовательность: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 лет. `getCurrentAntardasha` выбирает текущий под-период внутри Махадаши.

**Панчанг**  
`calculatePanchang(date, context)` рассчитывает:

- титхи: угловая разница Луны и Солнца, шаг 12 градусов;
- накшатру: положение Луны, 27 частей по 13.333333 градуса;
- йогу: сумма долгот Луны и Солнца, 27 частей;
- карану: половина титхи, шаг 6 градусов;
- вару: день недели в целевой timezone.

`getImportantDates(startDate, days, context)` ищет Пурниму, Амавасью и Экадаши в диапазоне дней.

**Планетарные Часы**  
`calculatePlanetaryHour(date, latitude, longitude, timezone)` ищет фактический восход, закат и следующий восход через `Astronomy.SearchRiseSet`. День и ночь делятся на 12 неравных часов. Планеты идут в халдейском порядке: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon. Если восход/закат не найден для экстремальной широты, используется fallback 06:00/18:00 и UI показывает предупреждение.

`calculatePlanetaryHoursForDay` строит все 24 часа дня. `calculateFavorableTimeWindows` выбирает ближайшие мягкие/хорошие/идеальные окна по Юпитеру, Венере, Меркурию и Луне.

**Аспекты**  
`calculateNatalAspects(chart)` считает аспекты между планетами натальной карты. `calculateTransitAspects(natalChart, transitChart)` считает аспекты транзитных планет к натальным. Поддержаны:

- соединение 0 градусов;
- секстиль 60 градусов;
- квадрат 90 градусов;
- трин 120 градусов;
- оппозиция 180 градусов.

Каждый аспект получает `context`: `natal` или `transit`, `orb`, `strength` от 0 до 100 и описание. `aspectInterpretations.ts` содержит детальные трактовки и fallback для редких сочетаний планет.

**Варги**  
`calculateDivisionalChart` строит дробную карту. Специальные правила реализованы для D2, D3, D7, D9, D10, D12, D20, D24. Остальные дробные карты считаются generic и не должны использоваться как сильное основание прогноза.

`calculateAdditionalVargas(planetLongitude)` сохраняет быстрые показатели:

- D12 - семья, родители, здоровье рода, кармическая линия;
- D20 - духовная сила, воля, лидерство, внутренняя дисциплина;
- D24 - обучение, духовные практики, внутренние качества.

Эти показатели добавляются в `PlanetPosition.vargas` для каждой планеты и используются как мягкие дополнительные подсказки в рекомендациях.

**Энергия Дня**  
`calculateEnergyLevel(date, moonLongitude, tithiIndex)` даёт базовый детерминированный уровень энергии 0-100. `calculatePersonalEnergyLevel` добавляет персональные факторы: Лагна, натальная Луна, текущая Луна, Даша, сила аспекта и погрешность времени. `getEnergyInfo`, `getEnergyColor`, `getEnergyLabel` дают подпись, цвет и текстовый уровень.

**Сферы Жизни**  
`calculateDailyAreas(panchang, natalChart, currentChart, aspects, dasha)` анализирует 8 сфер. Весовая логика:

- Даша задаёт долгий фон периода;
- транзиты через дома дают ежедневные триггеры;
- аспекты к управителям домов уточняют поддержку или напряжение;
- панчанг добавляет атмосферу дня.

Рекомендации формируются с причиной: Махадаша, транзитные планеты, дома, аспекты, титхи, йога или управители домов.

**Персональные Рекомендации**  
`generatePersonalRecommendations(context)` - единая точка рекомендаций. На вход получает профиль, дату, натальную карту, текущую карту, аспекты, панчанг и планетарный час. Расчётные факторы передаются в `recommendationComposer.ts`, чтобы текст собирался из конкретных причин: дом, планета, аспект, Даша, панчанг, энергия и точность исходных данных. На выходе:

- `mainRecommendation` - главная рекомендация;
- `avoidRecommendation` - чего избегать;
- `bestAreas` - лучшие сферы дня;
- `microUpaya` - короткая практика;
- `reasoning` - объяснение причин;
- `precision` - уровень точности данных;
- `energyLevel` - персональная энергия;
- `dashaPlanet` и `antardashaPlanet`.

Логика учитывает: планету Махадаши, Антардашу, планетарный час, дома этих планет в натальной карте, транзит Луны по домам, сильнейший аспект, панчанг, D12/D20/D24 и погрешность времени.

**Календарь Прогнозов**  
`calculateDayForecast(date, profile)` строит прогноз на локальный полдень выбранной даты. Это нужно, чтобы карточка дня не зависела от timezone браузера. `getForecastProfileKey(profile)` создаёт ключ кэша из профиля, координат, timezone, текущего места, погрешности времени и версии расчёта. `precalculateForecasts` считает диапазон дней, `getOrCalculateForecast` берёт прогноз из IndexedDB или пересчитывает.

Текущая версия расчёта календаря: `personalized-v4`.

## Геокодирование И Timezone

`geocoding.ts` использует OpenStreetMap Nominatim:

```text
https://nominatim.openstreetmap.org/search?q=...&format=json&limit=5&addressdetails=1
```

Во внешний сервис отправляется только строка поиска места. Имя, дата рождения и карта не отправляются.

`timezones.ts` использует локальную таблицу регионов:

- если координаты попали в регион, точность `matched-region`;
- если регион не найден, timezone оценивается по долготе и точность `estimated-longitude`;
- если пользователь задаёт вручную, используется `manual`.

Исторические offset/DST применяются через `Intl` для найденной IANA-зоны. В проекте нет полноценной polygon-базы timezone, поэтому границы зон, спорные территории, океаны и очень старые даты требуют ручной проверки.

## Точность Данных

Приложение снижает уверенность интерпретаций, если:

- время рождения указано с погрешностью;
- timezone рождения рассчитан приблизительно;
- timezone текущего места рассчитан приблизительно;
- планетарный час рассчитан через fallback;
- трактовка зависит от Лагны, домов или варг при неточном времени.

`getDataPrecision(profile)` возвращает уровень `high`, `medium` или `low` и список заметок. Если точность ниже высокой, рекомендации формулируются мягче.

## Хранение, Кэш И Приватность

`storage.ts` хранит профиль и обратную связь в `localStorage`. Профиль кодируется простым XOR+base64. Это защита от случайного просмотра, но не полноценная криптографическая защита.

Хранится:

- имя;
- дата рождения;
- время рождения;
- место рождения;
- координаты;
- timezone;
- погрешность времени;
- точность timezone;
- текущее местоположение;
- ежедневная обратная связь по настроению.

`indexedDB.ts` хранит прогнозы календаря в базе `AstrologyForecastDB`, store `forecasts`. Прогнозы кешируются по дате, ключу профиля и версии расчёта. Эти данные также используются для истории энергии в `EnergyTracker.tsx`. Старые прогнозы очищаются, если timestamp старше 60 дней.

Серверной базы нет. Расчёты выполняются в браузере.

## Экспорт

В настройках доступны:

- экспорт дневного отчёта в PDF через `pdfExport.ts`;
- экспорт профиля в JSON;
- импорт профиля из JSON с проверкой обязательных полей и координат;
- удаление профиля и локальных данных.

Импорт восстанавливает профиль пользователя. Обратная связь по настроению из экспортированного файла пока не восстанавливается.

## Справочник По Модулям И Функциям

**Компоненты**

- `App.tsx` - загружает профиль и переключает Onboarding/Dashboard.
- `Onboarding.tsx` - первый запуск, ввод данных рождения, геокодирование, выбор timezone.
- `Dashboard.tsx` - главный экран, навигация, ленивый рендер вкладок, предрасчёт календаря.
- `DayOverview.tsx` - сферы жизни и причины баллов.
- `DailyReport.tsx` - дневной отчёт.
- `PanchangWidget.tsx` - отображение панчанга.
- `NatalChartDetailed.tsx` - контейнер вкладок натальной карты.
- `NatalChartWheel.tsx` - круг натальной карты.
- `PlanetsPositionTable.tsx` - таблица планет.
- `AspectsTableEnhanced.tsx` - таблица натальных аспектов с трактовками.
- `AspectsDetailModal.tsx` - модальное окно подробных аспектов.
- `RemediesLibrary.tsx` - библиотека упай.
- `ForecastCalendar.tsx` - календарь прогнозов.
- `DayForecastModal.tsx` - подробности дня календаря.
- `CurrentMoment.tsx` - текущий момент и планетарный час.
- `EnergyTracker.tsx` - трекер энергии/настроения.
- `LocationSettings.tsx` - текущее местоположение.
- `LocationBadge.tsx` - индикатор места.
- `LocationFallbackWarning.tsx` - предупреждение, если текущее место не задано.
- `ImportantDates.tsx` - компонент важных дат на основе панчанга.
- `DivisionalChartWheel.tsx` - круг дробной карты.
- `common/*` - карточки, загрузка, ошибки, бейдж планеты.
- `common/TermTooltip.tsx` - короткие подсказки для астрологических терминов.

**Хуки**

- `useAstroCalculations(profile)` - центральный хук расчётов: натальная карта, текущая карта, аспекты, панчанг, планетарный час, благоприятные окна, загрузка, ошибки, retry.
- `useGeocoding(birthDate?)` - поиск места, состояния загрузки, ошибки, выбор результата и timezone.

**Утилиты Расчётов**

- `astrology.ts` - айанамша, сидерический перевод, планеты, Лагна, дома, Даша, натальная карта, базовые типы.
- `panchang.ts` - титхи, накшатра, йога, карана, вара, важные даты.
- `planetaryHours.ts` - планетарный час, 24 часа дня, благоприятные окна.
- `aspectCalculations.ts` - натальные и транзитные аспекты.
- `aspectInterpretations.ts` - подробные и fallback-интерпретации аспектов.
- `divisionalCharts.ts` - дробные карты и D12/D20/D24.
- `dailyAreasAnalysis.ts` - 8 сфер жизни.
- `energyUtils.ts` - энергия дня и персональная энергия.
- `personalRecommendations.ts` - главная логика рекомендаций.
- `recommendationComposer.ts` - сборка персонального текста из факторов и уровня точности.
- `forecastCalculations.ts` - прогнозы календаря и ключ кэша.
- `remedies.ts` - библиотека упай и подбор практики.

**Утилиты Данных И UI**

- `storage.ts` - профиль, обратная связь, экспорт данных, удаление данных.
- `indexedDB.ts` - кэш прогнозов.
- `geocoding.ts` - поиск места и reverse geocode.
- `timezones.ts` - timezone по координатам, offset, локальная дата в timezone.
- `dateUtils.ts` - ключ даты, формат времени, день недели в timezone.
- `planetUtils.ts` - иконка, русское имя, цвет и данные планеты.
- `planetInterpretations.ts` - интерпретации планет в знаках и домах.
- `natalChartDescriptions.ts` - описания Асцендента, Солнца и Луны.
- `housesDescriptions.ts` - подробные описания домов.
- `dashaDescriptions.ts` - объяснение Даши и описания планетных периодов.
- `pdfExport.ts` - генерация PDF-отчёта.
- `astrologyTerms.ts` - короткие объяснения терминов для tooltip.
- `visualScales.ts` - цветовая и смысловая шкала аспектов и энергии.

## Экспортируемые Функции Логики

Этот раздел перечисляет публичные функции модулей. Внутренние helper-функции не перечислены отдельно, если они не экспортируются наружу.

**`astrology.ts`**

- `getAyanamsha(date)` - рассчитывает приближённую Lahiri ayanamsha.
- `tropicalToSidereal(tropicalLon, date)` - переводит тропическую долготу в сидерическую.
- `getSign(longitude)` - возвращает индекс знака 0-11.
- `getNakshatra(longitude)` - возвращает индекс накшатры 0-26.
- `calculatePlanetPosition(bodyName, date)` - рассчитывает положение планеты.
- `calculateAscendant(date, latitude, longitude)` - рассчитывает Лагну.
- `getPlanetHouse(planetSign, houses)` - определяет дом планеты по Whole Sign.
- `getLifeAreaHouses()` - возвращает соответствия сфер жизни и домов.
- `calculateDasha(birthDate, moonNakshatra, currentDate, moonSiderealLon)` - рассчитывает текущую Махадашу.
- `getCurrentAntardasha(dasha, currentDate)` - выбирает текущую Антардашу.
- `calculateNatalChart(birthDate, latitude, longitude)` - строит натальную или текущую карту.

**`panchang.ts`**

- `calculatePanchang(date, context)` - рассчитывает титхи, накшатру, йогу, карану и вару.
- `getImportantDates(startDate, days, context)` - ищет Пурниму, Амавасью и Экадаши.

**`planetaryHours.ts`**

- `calculatePlanetaryHour(date, latitude, longitude, timezone)` - определяет текущий планетарный час.
- `calculatePlanetaryHoursForDay(date, latitude, longitude, timezone)` - строит все 24 планетарных часа.
- `calculateFavorableTimeWindows(date, latitude, longitude, timezone)` - выбирает благоприятные окна времени.
- `getPlanetaryHour(date, latitude?, longitude?, timezone?)` - быстрый API для получения планеты часа.

**`aspectCalculations.ts`**

- `calculateNatalAspects(chart)` - рассчитывает аспекты между натальными планетами.
- `calculateTransitAspects(natalChart, transitChart)` - рассчитывает транзитные аспекты к натальным планетам.

**`aspectInterpretations.ts`**

- `getDetailedAspectInterpretation(planet1, planet2, aspectType)` - возвращает интерпретацию аспекта или fallback для редкой пары.

**`divisionalCharts.ts`**

- `calculateDivisionalChart(natalLongitudes, ascendantLon, division, name, sanskritName, area)` - строит одну дробную карту.
- `calculateAdditionalVargas(planetLongitude)` - возвращает D12/D20/D24 для планеты.
- `calculateAllDivisionalCharts(planets, ascendantLon)` - строит набор дробных карт для натальной карты.

**`dailyAreasAnalysis.ts`**

- `calculateDailyAreas(panchang, natalChart, currentChart, aspects, dasha)` - рассчитывает 8 сфер жизни и рекомендации по ним.

**`energyUtils.ts`**

- `calculateEnergyLevel(date, moonLongitude, tithiIndex)` - рассчитывает базовую энергию.
- `calculatePersonalEnergyLevel(date, moonLongitude, tithiIndex, factors)` - рассчитывает персональную энергию.
- `getEnergyInfo(level)` - возвращает описание уровня энергии.
- `getEnergyColor(level)` - возвращает цвет уровня энергии.
- `getEnergyLabel(level)` - возвращает короткую подпись уровня энергии.

**`personalRecommendations.ts`**

- `getDataPrecision(profile)` - оценивает точность исходных данных.
- `getCurrentDashaForChart(natalChart, date)` - получает текущую Дашу и Антардашу для карты.
- `generatePersonalRecommendations(context)` - собирает главную рекомендацию, избегание, сферы, упайю и причины.

**`recommendationComposer.ts`**

- `composePersonalRecommendationText(input)` - собирает текст рекомендации из факторов: планеты часа, Даши, домов, Луны, панчанга, аспектов, варг, энергии и точности данных.

**`forecastCalculations.ts`**

- `getForecastProfileKey(profile)` - создаёт ключ кэша календаря.
- `calculateDayForecast(date, profile)` - рассчитывает прогноз одного дня.
- `precalculateForecasts(profile, daysBack, daysForward, onProgress)` - предвычисляет диапазон прогнозов.
- `getOrCalculateForecast(date, profile)` - берёт прогноз из кэша или пересчитывает.

**`geocoding.ts`**

- `geocodePlace(query)` - ищет координаты места через Nominatim.
- `getTimezoneFromCoordinates(latitude, longitude)` - возвращает timezone по координатам.
- `getTimezoneInfoFromCoordinates(latitude, longitude)` - возвращает timezone и точность определения.
- `getHistoricalTimezone(latitude, longitude, date?)` - совместимый API для timezone с учётом даты.
- `reverseGeocode(latitude, longitude)` - получает название места по координатам.
- `getTimezoneInfo(timezone, date?)` - возвращает человекочитаемый offset/timezone.

**`timezones.ts`**

- `findTimezoneByCoordinates(latitude, longitude)` - ищет IANA timezone.
- `findTimezoneInfoByCoordinates(latitude, longitude)` - возвращает timezone и точность.
- `getTimezoneDisplayName(timezone, date?)` - форматирует timezone для UI.
- `getTimezoneOffset(timezone, date)` - рассчитывает offset timezone в минутах.
- `createDateInTimezone(dateString, timeString, timezone)` - создаёт `Date` из локальной даты и времени в IANA timezone.

**`storage.ts`**

- `saveUserProfile(profile)` - сохраняет профиль.
- `loadUserProfile()` - загружает профиль.
- `saveDailyFeedback(feedback)` - сохраняет настроение/заметку дня.
- `loadAllFeedback()` - загружает всю обратную связь.
- `deleteAllData()` - удаляет профиль и обратную связь.
- `exportData()` - экспортирует профиль и feedback в JSON-строку.
- `validateUserProfile(value)` - проверяет структуру импортируемого профиля.
- `importUserProfile(json)` - читает JSON и возвращает валидный профиль.

**`indexedDB.ts`**

- `initDB()` - открывает IndexedDB.
- `saveForecast(forecast)` - сохраняет прогноз.
- `getForecast(date)` - получает прогноз по дате.
- `getForecastsInRange(startDate, endDate)` - получает прогнозы диапазона.
- `cleanupOldForecasts()` - удаляет старые прогнозы.
- `isOnline()` - возвращает статус `navigator.onLine`.

**`remedies.ts`**

- `getUpayasForPlanet(planet)` - возвращает упайи для планеты.
- `getUpayasByDuration(maxMinutes)` - фильтрует практики по длительности.
- `getUpayasByCategory(category)` - фильтрует практики по категории.
- `getUpayaForDay(date, preferredPlanet?)` - выбирает микро-упайю для дня.

**`planetUtils.ts`**

- `getPlanetIcon(planet)` - возвращает символ планеты.
- `getPlanetName(planet)` - возвращает русское название планеты.
- `getPlanetColor(planet)` - возвращает цвет планеты.
- `getPlanetInfo(planet)` - возвращает все данные планеты.

**`planetInterpretations.ts`**

- `getPlanetInterpretation(planet, signName, house)` - возвращает трактовку планеты в знаке и доме.

**`natalChartDescriptions.ts`**

- `getAscendantDescription(signName)` - описание Асцендента.
- `getSunDescription(signName, house)` - описание Солнца.
- `getMoonDescription(signName, house)` - описание Луны.

**`dateUtils.ts`**

- `formatDateKey(date, timezone?)` - возвращает ключ даты `YYYY-MM-DD`.
- `formatTime(date, timezone?)` - форматирует время.
- `getWeekdayIndex(date, timezone?)` - возвращает день недели в timezone.

**`pdfExport.ts`**

- `exportDailyReportToPDF(userName, date, natalChart, currentChart, aspects, panchang)` - создаёт PDF дневного отчёта.

**`visualScales.ts`**

- `getAspectVisual(type)` - возвращает цвет, знак и смысл аспекта.
- `getEnergyVisual(level)` - возвращает подпись, цвет и объяснение уровня энергии.

**Хуки**

- `useAstroCalculations(profile)` - центральная реактивная точка расчётов для Dashboard.
- `useGeocoding(birthDate?)` - поиск места и timezone для Onboarding/Settings.

## Структура Проекта

```text
src/
  app/
    App.tsx
    components/
      common/
      daily-report/
      natal-chart/
      Dashboard.tsx
      Onboarding.tsx
      ForecastCalendar.tsx
      CurrentMoment.tsx
      ...
    hooks/
      useAstroCalculations.ts
      useGeocoding.ts
    utils/
      astrology.ts
      aspectCalculations.ts
      aspectInterpretations.ts
      dailyAreasAnalysis.ts
      divisionalCharts.ts
      energyUtils.ts
      forecastCalculations.ts
      geocoding.ts
      indexedDB.ts
      panchang.ts
      personalRecommendations.ts
      recommendationComposer.ts
      planetaryHours.ts
      storage.ts
      timezones.ts
      ...
  styles/
    index.css
    theme.css
```

Ключевой принцип поддержки: расчёты и бизнес-логику держать в `utils`/`hooks`, UI держать в компонентах, крупные экраны дробить на логические под-компоненты. В одном файле не должно быть больше 700 строк.

## Технологии

- React 18.3
- TypeScript 5.9
- Vite 6
- Tailwind CSS 4
- lucide-react
- recharts
- astronomy-engine
- jsPDF
- IndexedDB и localStorage
- OpenStreetMap Nominatim для геокодирования

Новые зависимости не добавляются без необходимости. Расчёты и хранение максимально локальные.

## Деплой

Приложение статическое. Подходят GitHub Pages, Cloudflare Pages, Netlify и Vercel.

Типовые настройки:

```text
Build command: npm run build
Output directory: dist
Node.js: 18+
```

Cloudflare Pages, Netlify и Vercel обычно удобнее GitHub Pages, потому что автоматически понимают Vite и публикуют папку `dist`.

## Тестовые И Ручные Проверки

Перед крупными изменениями запускать:

```bash
npm run typecheck
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npm run verify
```

Критично проверять вручную:

- первый запуск и все шаги онбординга;
- поиск места, множественные результаты, пустой запрос, несуществующее место;
- координаты в диапазоне широта -90..90, долгота -180..180;
- дату рождения в прошлом, високосный год, 00:00 и 23:59;
- натальную карту, Асцендент, дома, панчанг, аспекты, Дашу;
- календарь с кэшем, пересчёт при смене профиля/локации;
- работу с примерным временем рождения;
- отображение пониженной точности;
- блок "Сейчас" и fallback планетарных часов;
- ErrorBoundary и retry при ошибках;
- экспорт PDF/JSON и удаление профиля.

Контрольные города:

- Москва: 55.7558, 37.6173, `Europe/Moscow`;
- Санкт-Петербург: 59.9343, 30.3351;
- Владивосток: 43.1332, 131.9113, `Asia/Vladivostok`;
- Нью-Йорк: 40.7128, -74.0060;
- Лондон: 51.5074, -0.1278.

## Известные Ограничения

- Timezone определяется облегчённо, не polygon-базой.
- Lahiri ayanamsha реализована приближённо от J2000.
- Варги generic не являются основанием для сильных прогнозов.
- PDF с кириллицей может зависеть от поддержки шрифта в браузере/jsPDF.
- Nominatim не исправляет опечатки.
- Импорт JSON восстанавливает профиль, но пока не восстанавливает историю настроения.
- Поле `relatives` в профиле предусмотрено типами, но отдельной функции карт близких в UI пока нет.
- Нет PWA/offline service worker.
- Нет синастрии, голосового интерфейса, push-уведомлений.
- Нет дополнительных систем силы планет: Shadbala, Ashtakavarga, Yoga Karaka, Vargottama.

## Правила Развития Проекта

- Не добавлять зависимости без явной пользы.
- Не использовать `Math.random()` для пользовательских прогнозов.
- Не давать уверенные формулировки при неточном времени или timezone.
- Рекомендации должны объяснять причину: планета, дом, аспект, Даша, панчанг, планетарный час или точность данных.
- Тяжёлые разделы рендерить лениво, как сейчас делает `Dashboard.tsx`.
- После крупных изменений запускать `npm run verify`.
- Документацию держать в `README.md` и `PROJECT_STATUS.md`.

## Дисклеймер

Приложение не заменяет врача, психолога, юриста, финансового консультанта или личное решение пользователя. Прогнозы показывают тенденции и помогают выбрать ритм дня. Чем точнее дата, время, место рождения и timezone, тем надёжнее трактовки домов, Лагны, Даши и варг.

## Атрибуции

- shadcn/ui компоненты использовались в исходном Figma Make контексте под MIT License.
- Unsplash фотографии использовались в исходном Figma Make контексте под лицензией Unsplash.
- OpenStreetMap/Nominatim используется для геокодирования мест.
- `astronomy-engine` используется для астрономических расчётов.
# AstroDay
# AstroDay

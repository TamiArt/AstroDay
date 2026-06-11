import { useState } from 'react';
import { Search, Clock, Home, MapPin, Users, Sparkles } from 'lucide-react';
import { UPAYAS, Upaya } from '../utils/remedies';

export function RemediesLibrary() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Upaya['category'] | 'all'>('all');
  const [selectedDuration, setSelectedDuration] = useState<number | 'all'>('all');
  const [selectedPlanet, setSelectedPlanet] = useState<string | 'all'>('all');

  const planets = Array.from(new Set(UPAYAS.map(u => u.planet)));

  let filtered = UPAYAS;

  if (search) {
    filtered = filtered.filter(u =>
      u.title.toLowerCase().includes(search.toLowerCase()) ||
      u.action.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (selectedCategory !== 'all') {
    filtered = filtered.filter(u => u.category === selectedCategory);
  }

  if (selectedDuration !== 'all') {
    filtered = filtered.filter(u => u.duration <= selectedDuration);
  }

  if (selectedPlanet !== 'all') {
    filtered = filtered.filter(u => u.planet === selectedPlanet);
  }

  const categoryIcons = {
    home: Home,
    outdoor: MapPin,
    online: Sparkles,
    social: Users
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-3xl p-8"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
        }}
      >
        <h2 className="mb-2">Библиотека упай</h2>
        <p className="opacity-70">
          Упайи — простые практики для гармонизации планетных влияний. Выберите то, что подходит вам сейчас.
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)'
        }}
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск упай..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-input-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-2 opacity-70">Где выполнить:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/70'
                }`}
              >
                Все
              </button>
              {(['home', 'outdoor', 'online', 'social'] as const).map((cat) => {
                const Icon = categoryIcons[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat === 'home' && 'Дома'}
                    {cat === 'outdoor' && 'На улице'}
                    {cat === 'online' && 'Онлайн'}
                    {cat === 'social' && 'С людьми'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block mb-2 opacity-70">Время:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDuration('all')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedDuration === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/70'
                }`}
              >
                Любое
              </button>
              {[1, 5, 10, 15].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setSelectedDuration(dur)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    selectedDuration === dur
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/70'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  до {dur} мин
                </button>
              ))}
            </div>
          </div>

          {/* Planet */}
          <div>
            <label className="block mb-2 opacity-70">Планета:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPlanet('all')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedPlanet === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/70'
                }`}
              >
                Все
              </button>
              {planets.map((planet) => (
                <button
                  key={planet}
                  onClick={() => setSelectedPlanet(planet)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedPlanet === planet
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/70'
                  }`}
                >
                  {planet === 'Sun' && '☀️ Солнце'}
                  {planet === 'Moon' && '🌙 Луна'}
                  {planet === 'Mars' && '🔴 Марс'}
                  {planet === 'Mercury' && '☿️ Меркурий'}
                  {planet === 'Jupiter' && '♃ Юпитер'}
                  {planet === 'Venus' && '♀️ Венера'}
                  {planet === 'Saturn' && '♄ Сатурн'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {filtered.length === 0 && (
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <p className="opacity-70">Упайи не найдены. Попробуйте изменить фильтры.</p>
          </div>
        )}

        {filtered.map((upaya) => {
          const Icon = categoryIcons[upaya.category];
          return (
            <div
              key={upaya.id}
              className="rounded-2xl p-6 border border-border hover:border-primary/50 transition-all"
              style={{ background: 'var(--glass-bg)' }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3>{upaya.title}</h3>
                <div className="flex gap-2 flex-shrink-0">
                  <div
                    className="px-3 py-1 rounded-full flex items-center gap-1"
                    style={{ background: 'var(--secondary)' }}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="opacity-70">{upaya.duration} мин</span>
                  </div>
                  <div
                    className="p-2 rounded-full"
                    style={{ background: 'var(--secondary)' }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 opacity-60">Что делать:</p>
                  <p className="leading-relaxed">{upaya.action}</p>
                </div>

                <div>
                  <p className="mb-1 opacity-60">Откуда это:</p>
                  <p className="leading-relaxed opacity-80">{upaya.why}</p>
                </div>

                <div>
                  <p className="mb-1 opacity-60">Зачем:</p>
                  <p className="leading-relaxed opacity-80">{upaya.effect}</p>
                </div>

                <div>
                  <p className="mb-1 opacity-60">Как часто:</p>
                  <p className="leading-relaxed opacity-80">{upaya.frequency}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

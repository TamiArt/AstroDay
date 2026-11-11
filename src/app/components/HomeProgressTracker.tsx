import { useEffect, useState } from 'react';
import { GlassCard } from './common/GlassCard';
import { HomeProgressItem, loadHomeProgress, saveHomeProgress } from '../utils/storage';

const DEFAULT_TASKS: HomeProgressItem[] = [
  { id: 'vastu-entry', label: 'Освободить вход и проверить освещение', done: false },
  { id: 'vastu-north', label: 'Навести порядок в северном секторе и документах', done: false },
  { id: 'vastu-northeast', label: 'Освободить северо-восток от тяжёлого хранения', done: false },
  { id: 'vastu-southeast', label: 'Проверить безопасность кухни и вентиляцию', done: false },
  { id: 'vastu-southwest', label: 'Организовать спокойное место для отдыха', done: false },
  { id: 'vastu-center', label: 'Освободить центральные проходы', done: false },
];

export function HomeProgressTracker() {
  const [tasks, setTasks] = useState<HomeProgressItem[]>([]);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    const loaded = loadHomeProgress();
    setTasks(loaded.length ? loaded : DEFAULT_TASKS);
  }, []);

  const toggleTask = (id: string) => {
    const next = tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task);
    try {
      saveHomeProgress(next);
      setTasks(next);
      setStorageError('');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Не удалось сохранить прогресс.');
    }
  };

  const completed = tasks.filter((task) => task.done).length;

  return (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Прогресс по дому</h2>
          <p className="opacity-70">Отмечайте задачи, чтобы видеть, как продвигается гармонизация.</p>
        </div>

        {storageError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{storageError}</p>}
        <div className="space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${task.done ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-border'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{task.label}</span>
                <span className="text-sm opacity-70">{task.done ? 'Выполнено' : 'Ожидает'}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border p-4 bg-background">
          <p className="text-sm opacity-70">Пройдено задач</p>
          <p className="mt-2 font-semibold">{completed} из {tasks.length}</p>
        </div>
      </div>
    </GlassCard>
  );
}

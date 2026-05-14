import type { DailyLog, DailyLogInput, Habit, HabitInput } from './types';

const STORAGE_KEYS = {
  habits: 'habitra:habits',
  logs: 'habitra:daily-logs',
};

type SortKey<T> = keyof T & string;
type SortValue<T> = SortKey<T> | `-${SortKey<T>}`;
type EntityInput<T extends { id: string }> = Omit<T, 'id' | 'created_date' | 'updated_date'>;
type EntityDefaults<T extends { id: string }> = Partial<EntityInput<T>>;
type EntityQuery<T> = Partial<T>;

type EntityStore<T extends { id: string }> = {
  list: (sort?: SortValue<T>, limit?: number) => Promise<T[]>;
  filter: (query: EntityQuery<T>, sort?: SortValue<T>, limit?: number) => Promise<T[]>;
  create: (data: any) => Promise<T>;
  update: (id: string, data: Partial<EntityInput<T>>) => Promise<T>;
  bulkUpdate: (updates: { id: string, data: Partial<EntityInput<T>> }[]) => Promise<T[]>;
  delete: (id: string) => Promise<{ id: string }>;
};

const newId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const readCollection = <T>(key: string): T[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.error(`Error reading collection ${key}:`, error);
    return [];
  }
};

const writeCollection = <T>(key: string, items: T[]) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error writing collection ${key}:`, error);
  }
};

const sortItems = <T extends Record<string, unknown>>(items: T[], sort?: SortValue<T>) => {
  if (!sort) return items;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const aValue = a[field] ?? '';
    const bValue = b[field] ?? '';
    if (aValue < bValue) return desc ? 1 : -1;
    if (aValue > bValue) return desc ? -1 : 1;
    return 0;
  });
};

const matchesFilter = <T extends Record<string, unknown>>(item: T, query: EntityQuery<T>) => (
  Object.entries(query || {}).every(([key, value]) => item[key] === value)
);

const createEntityStore = <T extends { id: string } & Record<string, unknown>>(
  storageKey: string,
  defaults: EntityDefaults<T> = {}
): EntityStore<T> => ({
  async list(sort, limit) {
    const items = sortItems(readCollection<T>(storageKey), sort);
    return typeof limit === 'number' ? items.slice(0, limit) : items;
  },

  async filter(query, sort, limit) {
    const items = sortItems(
      readCollection<T>(storageKey).filter((item) => matchesFilter(item, query)),
      sort
    );
    return typeof limit === 'number' ? items.slice(0, limit) : items;
  },

  async create(data) {
    const now = new Date().toISOString();
    const items = readCollection<T>(storageKey);
    const item = {
      ...defaults,
      ...data,
      id: newId(),
      created_date: now,
      updated_date: now,
    } as unknown as T;
    
    writeCollection(storageKey, [...items, item]);
    return item;
  },

  async update(id, data) {
    const items = readCollection<T>(storageKey);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Item not found: ${id}`);
    
    const next = {
      ...items[index],
      ...data,
      id,
      updated_date: new Date().toISOString(),
    } as T;
    
    items[index] = next;
    writeCollection(storageKey, items);
    return next;
  },

  async bulkUpdate(updates) {
    const items = readCollection<T>(storageKey);
    const results: T[] = [];
    const now = new Date().toISOString();

    updates.forEach(({ id, data }) => {
      const index = items.findIndex((item) => item.id === id);
      if (index !== -1) {
        const next = {
          ...items[index],
          ...data,
          id,
          updated_date: now,
        } as T;
        items[index] = next;
        results.push(next);
      }
    });

    writeCollection(storageKey, items);
    return results;
  },

  async delete(id) {
    const items = readCollection<T>(storageKey).filter((item) => item.id !== id);
    writeCollection(storageKey, items);
    return { id };
  },
});

export const LocalDataStore = {
  Habit: createEntityStore<Habit>(STORAGE_KEYS.habits, {
    description: '',
    icon: '*',
    category: 'other',
    color: '#7C5CFC',
    frequency: 'daily',
    timeOfDay: 'anytime',
    target_value: 1,
    unit: 'times',
    current_streak: 0,
    best_streak: 0,
    is_active: true,
    sort_order: 0,
  }),
  DailyLog: createEntityStore<DailyLog>(STORAGE_KEYS.logs, {
    current_value: 0,
    target_value: 1,
    is_completed: false,
    completed_at: null,
    notes: '',
  }),
  async deleteLogsForHabit(habitId: string) {
    const items = readCollection<DailyLog>(STORAGE_KEYS.logs).filter(
      (log) => log.habit_id !== habitId
    );
    writeCollection(STORAGE_KEYS.logs, items);
  },
};

export type { DailyLog, DailyLogInput, Habit, HabitInput };

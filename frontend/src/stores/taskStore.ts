import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { masterDataService } from '@/services/master-data';
import { unwrap } from '@/services/api-client';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: string;
  parentId?: string;
  subtasks: string[];
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  completedBy?: string;
  order: number;
}

interface TaskState {
  entities: Record<string, Task>;
  ids: string[];
  tasks: Task[];
  loading: boolean;

  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getProjectTasks: (projectId: string) => Task[];
  getTaskById: (id: string) => Task | undefined;
  getSubtasks: (parentId: string) => Task[];
  reorderTasks: (projectId: string, orderedIds: string[]) => void;
  fetchTasks: () => Promise<void>;
}

function deriveTasks(entities: Record<string, Task>, ids: string[]): Task[] {
  const arr: Task[] = new Array(ids.length);
  for (let i = 0; i < ids.length; i++) {
    arr[i] = entities[ids[i]];
  }
  return arr;
}

function normalizeTasks(tasks: Task[]) {
  const entities: Record<string, Task> = {};
  const ids: string[] = new Array(tasks.length);
  for (let i = 0; i < tasks.length; i++) {
    entities[tasks[i].id] = tasks[i];
    ids[i] = tasks[i].id;
  }
  return { entities, ids };
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      entities: {},
      ids: [],
      tasks: [],
      loading: false,

      fetchTasks: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('tasks');
          const tasks = unwrap<Task[]>(res);
          if (tasks && Array.isArray(tasks)) {
            const { entities, ids } = normalizeTasks(tasks);
            set({ entities, ids, tasks: deriveTasks(entities, ids), loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },

      addTask: async (task) => {
        try {
          const res = await masterDataService.create('tasks', task as unknown as Record<string, unknown>);
          const created = (res.data?.data || res.data) as any;
          if (created?.id) {
            task = { ...task, id: created.id };
          }
        } catch (err) {
          console.error('[taskStore] addTask API failed:', err);
        }
        set((s) => {
          const entities = { ...s.entities, [task.id]: task };
          const ids = [...s.ids, task.id];

          if (task.parentId && s.entities[task.parentId]) {
            entities[task.parentId] = {
              ...s.entities[task.parentId],
              subtasks: [...s.entities[task.parentId].subtasks, task.id],
            };
          }

          return { entities, ids, tasks: deriveTasks(entities, ids) };
        });
      },

      updateTask: async (id, data) => {
        try {
          await masterDataService.update('tasks', id, data as unknown as Record<string, unknown>);
        } catch (err) {
          console.error('[taskStore] updateTask API failed:', err);
        }
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const entities = { ...s.entities, [id]: { ...existing, ...data } };
          return { entities, tasks: deriveTasks(entities, s.ids) };
        });
      },

      deleteTask: async (id) => {
        try {
          await masterDataService.delete('tasks', id);
        } catch (err) {
          console.error('[taskStore] deleteTask API failed:', err);
        }
        const task = get().entities[id];
        if (!task) return;

        set((s) => {
          const entities = { ...s.entities };
          const ids = s.ids.filter((i) => i !== id);
          delete entities[id];

          if (task.parentId && entities[task.parentId]) {
            entities[task.parentId] = {
              ...entities[task.parentId],
              subtasks: entities[task.parentId].subtasks.filter((stId) => stId !== id),
            };
          }

          task.subtasks.forEach((stId) => {
            delete entities[stId];
          });

          return {
            entities,
            ids: ids.filter((i) => !task.subtasks.includes(i)),
            tasks: deriveTasks(entities, ids.filter((i) => !task.subtasks.includes(i))),
          };
        });
      },

      getProjectTasks: (projectId) => {
        return Object.values(get().entities).filter(
          (t) => t.projectId === projectId && !t.parentId,
        );
      },

      getTaskById: (id) => get().entities[id],

      getSubtasks: (parentId) => {
        const parent = get().entities[parentId];
        if (!parent) return [];
        return parent.subtasks
          .map((stId) => get().entities[stId])
          .filter(Boolean)
          .sort((a, b) => a.order - b.order);
      },

      reorderTasks: async (projectId, orderedIds) => {
        try {
          for (let idx = 0; idx < orderedIds.length; idx++) {
            await masterDataService.update('tasks', orderedIds[idx], { order: idx } as any);
          }
        } catch (err) {
          console.error('[taskStore] reorderTasks API failed:', err);
        }
        set((s) => {
          const entities = { ...s.entities };
          orderedIds.forEach((id, idx) => {
            if (entities[id] && entities[id].projectId === projectId) {
              entities[id] = { ...entities[id], order: idx };
            }
          });
          return { entities, tasks: deriveTasks(entities, s.ids) };
        });
      },
    }),
    {
      name: 'kinetic-tasks',
      version: 1,
      partialize: (state) => ({
        entities: state.entities,
        ids: state.ids,
      }),
    },
  ),
);

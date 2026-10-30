import { isPending, type Task } from "./types";

export interface Snapshot {
  tasks: Task[];
  queryError: string | null;
  loading: boolean;
}
/** One polling loop per mounted user. Dispose aborts I/O and invalidates late replies. */
export function createTracker(
  load: (signal: AbortSignal) => Promise<Task[]>,
  publish: (state: Snapshot) => void,
  interval = 1500,
) {
  let state: Snapshot = { tasks: [], queryError: null, loading: true };
  let disposed = false;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  const emit = () => {
    if (!disposed) publish({ ...state, tasks: [...state.tasks] });
  };
  const refresh = async () => {
    if (disposed) return;
    const current = ++generation;
    clearTimeout(timer);
    controller?.abort();
    controller = new AbortController();
    try {
      const tasks = await load(controller.signal);
      if (disposed || current !== generation) return;
      state = { tasks, queryError: null, loading: false };
      emit();
      if (tasks.some(isPending))
        timer = setTimeout(() => void refresh(), interval);
    } catch (error) {
      if (disposed || current !== generation) return;
      // A transport error never overwrites persisted business status.
      state = {
        ...state,
        loading: false,
        queryError: error instanceof Error ? error.message : "查询暂时不可用",
      };
      emit();
      // Pause until an explicit retry, avoiding a failing request loop.
    }
  };
  const upsert = (task: Task) => {
    if (disposed) return;
    state = {
      ...state,
      tasks: [task, ...state.tasks.filter((t) => t.id !== task.id)],
    };
    emit();
    void refresh();
  };
  return {
    refresh,
    upsert,
    dispose() {
      disposed = true;
      generation++;
      clearTimeout(timer);
      controller?.abort();
    },
  };
}

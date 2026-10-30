"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { request } from "../lib/api";
import { createTracker, type Snapshot } from "../lib/tracker";
import type { Task } from "../lib/types";

type User = { id: string; name: string; token: string };
type StudioContext = Snapshot & {
  user: User | null;
  users: User[];
  switchUser: (id: string) => void;
  addUser: () => void;
  retry: () => void;
  accepted: (task: Task) => void;
};
const Context = createContext<StudioContext | null>(null);
function newUser(name: string): User {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return {
    id: crypto.randomUUID(),
    name,
    token: Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""),
  };
}
export function StudioProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<Snapshot>({
    tasks: [],
    queryError: null,
    loading: true,
  });
  const tracker = useRef<ReturnType<typeof createTracker> | null>(null);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem("frame-users") || "[]",
      );
      const list = Array.isArray(stored)
        ? stored.filter(
            (u): u is User =>
              !!u &&
              typeof u.id === "string" &&
              typeof u.name === "string" &&
              /^[a-f0-9]{64}$/.test(u.token),
          )
        : [];
      const ready = list.length ? list : [newUser("我的工作室")];
      setUsers(ready);
      setUser(
        ready.find((u) => u.id === localStorage.getItem("frame-current")) ||
          ready[0],
      );
    } catch {
      const first = newUser("我的工作室");
      setUsers([first]);
      setUser(first);
    }
  }, []);
  useEffect(() => {
    if (!user) return;
    localStorage.setItem("frame-users", JSON.stringify(users));
    localStorage.setItem("frame-current", user.id);
    setState({ tasks: [], queryError: null, loading: true });
    const current = createTracker(
      (signal) => request<Task[]>("/tasks", user.token, { signal }),
      setState,
    );
    tracker.current = current;
    void current.refresh();
    return () => {
      current.dispose();
      tracker.current = null;
    };
  }, [user, users]);
  const switchUser = useCallback(
    (id: string) => {
      tracker.current?.dispose();
      setState({ tasks: [], queryError: null, loading: true });
      setUser(users.find((u) => u.id === id) || null);
    },
    [users],
  );
  const addUser = () => {
    tracker.current?.dispose();
    const created = newUser(`演示用户 ${users.length + 1}`);
    setState({ tasks: [], queryError: null, loading: true });
    setUsers([...users, created]);
    setUser(created);
  };
  return (
    <Context.Provider
      value={{
        ...state,
        user,
        users,
        switchUser,
        addUser,
        retry: () => void tracker.current?.refresh(),
        accepted: (task) => tracker.current?.upsert(task),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStudio() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing StudioProvider");
  return context;
}

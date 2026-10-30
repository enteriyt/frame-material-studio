import { afterEach, describe, it, expect, vi } from "vitest";
import { createTracker, type Snapshot } from "./tracker";
import type { Task } from "./types";
const task = (id: string, status: Task["status"] = "RUNNING"): Task => ({
  id,
  templateId: "portrait",
  templateTitle: id,
  status,
  stage: "GENERATE",
  createdAt: "2026-01-01T00:00:00",
  updatedAt: "2026-01-01T00:00:00",
});
afterEach(() => vi.useRealTimers());
describe("task tracking", () => {
  it("keeps independent states and stops scheduling once all tasks are terminal", async () => {
    vi.useFakeTimers();
    const load = vi
      .fn()
      .mockResolvedValueOnce([task("a"), task("b", "FAILED")])
      .mockResolvedValueOnce([task("a", "SUCCEEDED"), task("b", "FAILED")]);
    let state: Snapshot | undefined;
    const tracker = createTracker(
      load,
      (s) => {
        state = s;
      },
      100,
    );
    await tracker.refresh();
    expect(state?.tasks[0].status).toBe("RUNNING");
    expect(state?.tasks[1].status).toBe("FAILED");
    await vi.advanceTimersByTimeAsync(100);
    expect(state?.tasks[0].status).toBe("SUCCEEDED");
    expect(state?.tasks[1].status).toBe("FAILED");
    await vi.advanceTimersByTimeAsync(1000);
    expect(load).toHaveBeenCalledTimes(2);
    tracker.dispose();
  });
  it("preserves task status on query errors and recovers on explicit retry", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce([task("a")])
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([task("a", "SUCCEEDED")]);
    let state: Snapshot | undefined;
    const tracker = createTracker(load, (s) => {
      state = s;
    });
    await tracker.refresh();
    await tracker.refresh();
    expect(state?.queryError).toBe("offline");
    expect(state?.tasks[0].status).toBe("RUNNING");
    await tracker.refresh();
    expect(state?.queryError).toBeNull();
    expect(state?.tasks[0].status).toBe("SUCCEEDED");
    tracker.dispose();
  });
  it("ignores late replies from a disposed user and aborts requests", async () => {
    let resolve!: (tasks: Task[]) => void;
    let signal: AbortSignal | undefined;
    const publish = vi.fn();
    const tracker = createTracker((s) => {
      signal = s;
      return new Promise((r) => {
        resolve = r;
      });
    }, publish);
    const pending = tracker.refresh();
    tracker.dispose();
    resolve([task("old")]);
    await pending;
    expect(signal?.aborted).toBe(true);
    expect(publish).not.toHaveBeenCalled();
  });
  it("a newer refresh wins even if an old server response arrives later", async () => {
    const resolvers: ((tasks: Task[]) => void)[] = [];
    let state: Snapshot | undefined;
    const tracker = createTracker(
      () => new Promise((r) => resolvers.push(r)),
      (s) => {
        state = s;
      },
    );
    const old = tracker.refresh();
    const current = tracker.refresh();
    resolvers[1]([task("new", "SUCCEEDED")]);
    await current;
    resolvers[0]([task("old")]);
    await old;
    expect(state?.tasks.map((t) => t.id)).toEqual(["new"]);
    tracker.dispose();
  });
  it("accepts multiple jobs without overwriting unrelated jobs", async () => {
    let state: Snapshot | undefined;
    const tracker = createTracker(
      () => new Promise(() => {}),
      (s) => {
        state = s;
      },
    );
    tracker.upsert(task("a"));
    tracker.upsert(task("b"));
    expect(state?.tasks.map((t) => t.id)).toEqual(["b", "a"]);
    tracker.dispose();
  });
});
